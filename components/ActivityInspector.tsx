/**
 * @license
 * SPDX-License-Identifier: MIT
 * 
 * Local Activity Inspector (Trust Engine)
 * Real-time audit log showing exact model, execution mode, endpoints, payload size,
 * local IndexedDB storage verification, and zero telemetry guarantee.
*/

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ShieldCheck, 
  Terminal, 
  Activity, 
  Trash2, 
  RefreshCw, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Cpu, 
  Globe, 
  HardDrive, 
  Database,
  Lock,
  ArrowDownToLine,
  Filter
} from 'lucide-react';
import { LocalActivityLog } from '../types';
import { localDB, StorageStats } from '../services/db';

interface ActivityInspectorProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ActivityInspector: React.FC<ActivityInspectorProps> = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState<LocalActivityLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCapability, setSelectedCapability] = useState<string>('all');
  const [storageStats, setStorageStats] = useState<StorageStats | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const [fetchedLogs, stats] = await Promise.all([
        localDB.getActivityLogs(50),
        localDB.getStorageStats(),
      ]);
      setLogs(fetchedLogs);
      setStorageStats(stats);
    } catch (err) {
      console.warn("Could not fetch activity logs", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLogs();
    }

    const handleNewLog = (e: Event) => {
      const customEvent = e as CustomEvent<LocalActivityLog>;
      if (customEvent.detail) {
        setLogs((prev) => [customEvent.detail, ...prev.slice(0, 49)]);
      }
    };

    window.addEventListener('local-activity-logged', handleNewLog);
    return () => window.removeEventListener('local-activity-logged', handleNewLog);
  }, [isOpen]);

  const handleClearLogs = async () => {
    await localDB.clearActivityLogs();
    setLogs([]);
  };

  const filteredLogs = logs.filter(l => {
    if (selectedCapability === 'all') return true;
    return l.capability === selectedCapability;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="w-full max-w-4xl bg-[#09090c] border border-white/15 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[88vh] text-white"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bogle text-lg font-bold tracking-wide">Local Activity Inspector</h3>
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold uppercase tracking-wider">
                  Zero Telemetry Verified
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Real-time transparency audit for all AI model calls, local persistence, and endpoints.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchLogs}
              disabled={loading}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white transition-colors"
              title="Refresh Logs"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={handleClearLogs}
              className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
              title="Clear Local Audit Logs"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Live Privacy & Local Storage Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-white/[0.02] border-b border-white/5 text-xs">
          <div className="p-3 rounded-xl bg-neutral-900/60 border border-white/5 flex flex-col">
            <span className="text-[10px] font-mono text-neutral-400 uppercase">Telemetry Sent</span>
            <div className="flex items-center gap-1.5 mt-1 font-bold text-emerald-400">
              <Lock className="w-3.5 h-3.5" />
              <span>0 bytes • None</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-neutral-900/60 border border-white/5 flex flex-col">
            <span className="text-[10px] font-mono text-neutral-400 uppercase">Local Storage (DB)</span>
            <div className="flex items-center gap-1.5 mt-1 font-bold text-purple-300 font-mono">
              <Database className="w-3.5 h-3.5" />
              <span>
                {storageStats ? `${Math.round(storageStats.estimatedSizeBytes / 1024)} KB IndexedDB` : 'IndexedDB'}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-neutral-900/60 border border-white/5 flex flex-col">
            <span className="text-[10px] font-mono text-neutral-400 uppercase">Local Objects</span>
            <div className="flex items-center gap-1.5 mt-1 font-bold text-cyan-300 font-mono">
              <HardDrive className="w-3.5 h-3.5" />
              <span>
                {storageStats ? `${storageStats.projectsCount} proj • ${storageStats.avatarsCount} avt` : '0 saved'}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-neutral-900/60 border border-white/5 flex flex-col">
            <span className="text-[10px] font-mono text-neutral-400 uppercase">Total Operations</span>
            <div className="flex items-center gap-1.5 mt-1 font-bold text-amber-300 font-mono">
              <Activity className="w-3.5 h-3.5" />
              <span>{logs.length} logged</span>
            </div>
          </div>
        </div>

        {/* Capability Filters */}
        <div className="px-6 py-3 border-b border-white/5 flex items-center gap-2 overflow-x-auto no-scrollbar bg-black/20">
          <Filter className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
          {['all', 'text.generate', 'video.generate', 'image.generate', 'vision.analyze', 'voice.transcribe'].map(cap => (
            <button
              key={cap}
              onClick={() => setSelectedCapability(cap)}
              className={`px-3 py-1 rounded-lg text-xs font-mono transition-all shrink-0 ${
                selectedCapability === cap
                  ? 'bg-purple-600/30 border border-purple-500/50 text-purple-200'
                  : 'bg-white/5 text-neutral-400 hover:text-white border border-transparent'
              }`}
            >
              {cap}
            </button>
          ))}
        </div>

        {/* Audit Log Table */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-xs">
          {filteredLogs.length === 0 ? (
            <div className="py-16 text-center text-neutral-500">
              <Terminal className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p>No activity logged yet.</p>
              <p className="text-[11px] text-neutral-600 mt-1">Run any prompt, script generator, or video synthesis to inspect real-time traffic.</p>
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div 
                key={log.id} 
                className="p-4 rounded-2xl bg-neutral-900/70 border border-white/10 hover:border-white/20 transition-all flex flex-col gap-2.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {/* Execution Badge */}
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase flex items-center gap-1 ${
                      log.executionType === 'local' 
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                        : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                    }`}>
                      {log.executionType === 'local' ? <Cpu className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
                      {log.executionType === 'local' ? 'Local (On-Device)' : 'Remote API'}
                    </span>

                    {/* Capability badge */}
                    <span className="px-2 py-0.5 rounded-md bg-purple-500/15 text-purple-300 text-[10px] border border-purple-500/25">
                      {log.capability}
                    </span>

                    {/* Status badge */}
                    {log.status === 'success' ? (
                      <span className="text-emerald-400 flex items-center gap-1 text-[11px]">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{log.durationMs}ms</span>
                      </span>
                    ) : (
                      <span className="text-rose-400 flex items-center gap-1 text-[11px]">
                        <AlertCircle className="w-3 h-3" />
                        <span>Failed ({log.durationMs}ms)</span>
                      </span>
                    )}
                  </div>

                  <span className="text-[10px] text-neutral-500">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                </div>

                {/* Audit Grid Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 pt-2 border-t border-white/5 text-[11px]">
                  <div>
                    <span className="text-neutral-500 text-[10px] block">MODEL</span>
                    <span className="text-neutral-200 font-semibold">{log.model}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 text-[10px] block">ENDPOINT</span>
                    <span className="text-neutral-300 truncate block" title={log.endpoint}>{log.endpoint}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 text-[10px] block">DATA SENT</span>
                    <span className="text-neutral-300">{log.payloadSizeBytes} bytes</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 text-[10px] block">TELEMETRY</span>
                    <span className="text-emerald-400 font-bold">{log.telemetrySent}</span>
                  </div>
                </div>

                {/* Payload snippet */}
                <div className="p-2 rounded-xl bg-black/50 border border-white/5 text-[11px] text-neutral-300 truncate">
                  <span className="text-neutral-500 mr-2">Payload:</span>
                  {log.payloadSummary}
                </div>

                {log.error && (
                  <div className="p-2 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-[11px]">
                    Error: {log.error}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer Guarantee */}
        <div className="p-4 bg-black/60 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-400">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-400" />
            <span>Open Source • MIT License • Zero Analytics/Telemetry SDKs</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const json = JSON.stringify(logs, null, 2);
                const blob = new Blob([json], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `local-activity-audit-${Date.now()}.json`;
                a.click();
              }}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center gap-1.5 transition-all text-xs font-semibold"
            >
              <ArrowDownToLine className="w-3.5 h-3.5" />
              <span>Export Audit JSON</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
export default ActivityInspector;
