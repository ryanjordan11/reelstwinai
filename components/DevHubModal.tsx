/**
 * @license
 * SPDX-License-Identifier: MIT
 * 
 * Developer & Open-Source Architecture Hub
 * Comprehensive guide to self-hosting, Docker, provider plugins,
 * capability layers, zero telemetry guarantees, and MIT licensing.
*/

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Code2, 
  Terminal, 
  Copy, 
  Check, 
  Cpu, 
  HardDrive, 
  ShieldCheck, 
  X, 
  Box, 
  Layers, 
  FileCode2, 
  BookOpen 
} from 'lucide-react';

interface DevHubModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DevHubModal: React.FC<DevHubModalProps> = ({ isOpen, onClose }) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'quickstart' | 'architecture' | 'capabilities' | 'docker' | 'license'>('quickstart');

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="w-full max-w-4xl bg-[#09090c] border border-white/15 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] text-white"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bogle text-lg font-bold">Open-Source Developer Hub</h3>
                <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 text-[10px] font-mono font-bold uppercase">
                  MIT License
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Voice-native • Local-first • Self-hostable • Bring any model
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 px-6 py-3 border-b border-white/10 bg-black/20 overflow-x-auto no-scrollbar">
          {[
            { id: 'quickstart', label: '1-Command Setup', icon: Terminal },
            { id: 'architecture', label: 'Architecture & Trust', icon: Layers },
            { id: 'capabilities', label: 'Capability Layer API', icon: FileCode2 },
            { id: 'docker', label: 'Docker / Self-Host', icon: Box },
            { id: 'license', label: 'MIT License', icon: BookOpen },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-white text-black font-bold shadow-md'
                    : 'bg-white/5 text-neutral-400 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm text-neutral-300">
          {activeTab === 'quickstart' && (
            <div className="space-y-4">
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                <Terminal className="w-4 h-4 text-purple-400" />
                <span>Clone and Run Locally (Under 60 Seconds)</span>
              </h4>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Run 100% locally with Vite development server. Connects instantly to your local Ollama instance (<code className="text-purple-300">http://localhost:11434</code>) or Google Gemini API.
              </p>

              <div className="relative p-4 rounded-2xl bg-black/80 border border-white/10 font-mono text-xs text-neutral-200">
                <button
                  onClick={() => copyToClipboard('git clone https://github.com/reels-creator/reels-creator.git\ncd reels-creator\nnpm install\nnpm run dev', 'git-clone')}
                  className="absolute top-3 right-3 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-neutral-300 transition-colors"
                >
                  {copiedId === 'git-clone' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <pre className="overflow-x-auto text-emerald-400">
{`# 1. Clone the repository
git clone https://github.com/reels-creator/reels-creator.git

# 2. Navigate to directory
cd reels-creator

# 3. Install dependencies
npm install

# 4. Start local development server
npm run dev`}
                </pre>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                <div className="p-4 rounded-2xl bg-neutral-900/60 border border-white/10">
                  <div className="flex items-center gap-2 text-white font-bold mb-2">
                    <Cpu className="w-4 h-4 text-emerald-400" />
                    <span>Local Ollama Setup</span>
                  </div>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Run local LLMs with zero cloud dependencies:
                  </p>
                  <code className="block mt-2 p-2 rounded-lg bg-black/50 text-[11px] font-mono text-emerald-300">
                    ollama run llama3.2
                  </code>
                </div>

                <div className="p-4 rounded-2xl bg-neutral-900/60 border border-white/10">
                  <div className="flex items-center gap-2 text-white font-bold mb-2">
                    <HardDrive className="w-4 h-4 text-cyan-400" />
                    <span>IndexedDB Persistence</span>
                  </div>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    All reels, avatars, and storyboard timelines stay stored safely in client-side IndexedDB.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'architecture' && (
            <div className="space-y-4">
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-400" />
                <span>Zero-Telemetry & Local-First Architectural Blueprint</span>
              </h4>

              <div className="p-4 rounded-2xl bg-black/60 border border-white/10 font-mono text-xs leading-relaxed text-purple-200">
                <pre className="overflow-x-auto">
{`[ USER INTERFACE / STUDIO CANVAS / TIMELINE ]
                    │
                    ▼
[ CAPABILITY LAYER INTERFACE ]
 ├─ text.generate    ──► [ Local Ollama ] OR [ Google Gemini ] OR [ OpenRouter ]
 ├─ video.generate   ──► [ Google Veo 3.1 ] OR [ Replicate ] OR [ Local Gateway ]
 ├─ image.generate   ──► [ Gemini Flash Image ] OR [ OpenAI / DALL-E ]
 ├─ voice.synthesize ──► [ Web Speech API (Offline) ] OR [ ElevenLabs ]
 └─ vision.analyze   ──► [ Gemini Pro Vision ] OR [ Local Qwen2.5-VL ]
                    │
                    ▼
[ LOCAL PERSISTENCE & TRUST ENGINE ]
 ├─ IndexedDB (Projects, Avatars, Scripts, Blobs)
 ├─ Portable (.creatorstudio) ZIP Bundler
 └─ Local Activity Inspector (Zero Telemetry Verification)`}
                </pre>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs text-neutral-300 leading-relaxed">
                  <strong className="text-emerald-300 block mb-1">Zero Telemetry Promise:</strong>
                  This codebase contains 0 Google Analytics, 0 Mixpanel, 0 Sentry, 0 tracking pixels, and 0 hidden background pings. All generation logs are written strictly to your device’s IndexedDB.
                </div>
              </div>
            </div>
          )}

          {activeTab === 'capabilities' && (
            <div className="space-y-4">
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                <FileCode2 className="w-4 h-4 text-cyan-400" />
                <span>Capability Provider Plugin Specification</span>
              </h4>
              <p className="text-xs text-neutral-400">
                You can easily add new providers or local model gateways by registering them in the Capability Registry:
              </p>

              <div className="relative p-4 rounded-2xl bg-black/80 border border-white/10 font-mono text-xs text-neutral-200">
                <button
                  onClick={() => copyToClipboard(`import { registerProvider } from './services/providerRegistry';

registerProvider({
  id: 'my_local_vllm',
  name: 'Custom vLLM Server',
  baseUrl: 'http://localhost:8000/v1',
  isLocal: true,
  supportedCapabilities: ['text.generate', 'vision.analyze'],
});`, 'plugin-spec')}
                  className="absolute top-3 right-3 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-neutral-300 transition-colors"
                >
                  {copiedId === 'plugin-spec' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <pre className="overflow-x-auto text-cyan-300">
{`// Example: Registering a custom local inference backend
import { registerProvider } from './services/providerRegistry';

registerProvider({
  id: 'my_local_vllm',
  name: 'Custom vLLM Server',
  baseUrl: 'http://localhost:8000/v1',
  isLocal: true,
  supportedCapabilities: ['text.generate', 'vision.analyze'],
});`}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'docker' && (
            <div className="space-y-4">
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                <Box className="w-4 h-4 text-indigo-400" />
                <span>Self-Host via Docker (1 Command)</span>
              </h4>
              <p className="text-xs text-neutral-400">
                Deploy on your homelab, private VPS, or local workstation inside an isolated container:
              </p>

              <div className="relative p-4 rounded-2xl bg-black/80 border border-white/10 font-mono text-xs text-neutral-200">
                <button
                  onClick={() => copyToClipboard('docker run -d --name reels-creator -p 3000:3000 ghcr.io/ryanjordan/reels-creator:latest', 'docker-cmd')}
                  className="absolute top-3 right-3 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-neutral-300 transition-colors"
                >
                  {copiedId === 'docker-cmd' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <pre className="overflow-x-auto text-indigo-300">
{`docker run -d \\
  --name reels-creator \\
  -p 3000:3000 \\
  ghcr.io/ryanjordan/reels-creator:latest`}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'license' && (
            <div className="space-y-4">
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-amber-400" />
                <span>MIT License (Commercial & Personal Freedom)</span>
              </h4>

              <div className="p-4 rounded-2xl bg-black/60 border border-white/10 font-mono text-xs text-neutral-300 leading-relaxed max-h-60 overflow-y-auto">
{`MIT License

Copyright (c) 2026 Ryan Jordan. Inspired by Seth Anderson.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.`}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
export default DevHubModal;
