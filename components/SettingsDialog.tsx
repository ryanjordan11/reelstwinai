/**
 * @license
 * SPDX-License-Identifier: MIT
 * 
 * Studio Settings & Local Provider Control Center
 * Manage Ollama localhost inference, Google AI Studio keys, gateways,
 * capability routing, zero telemetry verification, and .creatorstudio backups.
*/

import React, { useRef, useState, useEffect } from 'react';
import { 
  X, 
  Upload, 
  User, 
  Save, 
  Briefcase, 
  Palette, 
  Mic, 
  ExternalLink, 
  Eye, 
  EyeOff, 
  AlertTriangle, 
  CheckCircle2, 
  Zap, 
  Cpu, 
  Activity, 
  ChevronDown, 
  ChevronUp,
  HardDrive,
  Database,
  Lock,
  Download,
  FolderArchive,
  Trash2,
  Server
} from 'lucide-react';
import { ApiProviderType, UserSettings } from '../types';
import { testApiConnection } from '../services/geminiService';
import { localDB, StorageStats } from '../services/db';
import { importProjectBundle } from '../services/projectBundle';

interface SettingsDialogProps {
  currentSettings: UserSettings | null;
  onSave: (settings: UserSettings) => void;
  onClose: () => void;
}

const TONES = ['Humorous', 'Educational', 'Inspirational', 'Sarcastic', 'Professional', 'High Energy'];
const STYLES = ['Cinematic', 'Minimalist', 'Neon/Cyberpunk', 'Vintage/Retro', 'Corporate', 'Vlog Style'];

interface ProviderOption {
  id: ApiProviderType;
  name: string;
  badge: string;
  isLocal: boolean;
  defaultBaseUrl: string;
  keyPlaceholder: string;
  keyLink: string;
  keyLinkLabel: string;
  description: string;
  suggestedTextModels: string[];
}

const PROVIDERS: ProviderOption[] = [
  {
    id: 'ollama',
    name: 'Ollama Localhost',
    badge: '100% On-Device & Zero Network',
    isLocal: true,
    defaultBaseUrl: 'http://localhost:11434',
    keyPlaceholder: 'No API key needed (Runs on your machine)',
    keyLink: 'https://ollama.com',
    keyLinkLabel: 'Download Ollama',
    description: 'Run open-weight models (Llama 3.2, Qwen 2.5, Mistral, DeepSeek-R1) 100% locally with zero latency or telemetry.',
    suggestedTextModels: ['llama3.2:latest', 'qwen2.5:7b', 'mistral:latest', 'deepseek-r1:8b']
  },
  {
    id: 'google',
    name: 'Google AI Studio',
    badge: 'Veo 3.1 & Gemini Native',
    isLocal: false,
    defaultBaseUrl: '',
    keyPlaceholder: 'AIzaSy...',
    keyLink: 'https://aistudio.google.com/app/apikey',
    keyLinkLabel: 'Get Google AI Studio Key',
    description: 'Direct access to Google Gemini 2.5/3 models and Veo short-form cinematic video generator.',
    suggestedTextModels: ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-3-flash-preview']
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    badge: '200+ Unified Models',
    isLocal: false,
    defaultBaseUrl: 'https://openrouter.ai/api/v1',
    keyPlaceholder: 'sk-or-v1-...',
    keyLink: 'https://openrouter.ai/keys',
    keyLinkLabel: 'Get OpenRouter API Key',
    description: 'Unified gateway for Claude 3.5, GPT-4o, DeepSeek, and open-source models.',
    suggestedTextModels: ['google/gemini-2.5-flash', 'openai/gpt-4o-mini', 'anthropic/claude-3.5-sonnet', 'deepseek/deepseek-chat']
  },
  {
    id: 'openai_compatible',
    name: 'OpenAI Compatible (vLLM / LM Studio)',
    badge: 'Local Proxy / Self-Hosted',
    isLocal: true,
    defaultBaseUrl: 'http://localhost:1234/v1',
    keyPlaceholder: 'Optional bearer token',
    keyLink: 'https://lmstudio.ai',
    keyLinkLabel: 'LM Studio Docs',
    description: 'Connect LM Studio, vLLM, Text Generation WebUI, or custom OpenAI-compatible server.',
    suggestedTextModels: ['local-model', 'gpt-4o-mini', 'llama-3.2-3b']
  },
  {
    id: 'aihubmix',
    name: 'AIHubMix',
    badge: 'Global AI Gateway',
    isLocal: false,
    defaultBaseUrl: 'https://aihubmix.com/v1',
    keyPlaceholder: 'sk-...',
    keyLink: 'https://aihubmix.com/?aff=45EL',
    keyLinkLabel: 'Get AIHubMix Key (Affiliate Link)',
    description: 'High-speed proxy gateway for Gemini, Claude, OpenAI, and Midjourney.',
    suggestedTextModels: ['gemini-2.5-flash', 'gpt-4o-mini', 'claude-3-5-sonnet-20241022']
  },
  {
    id: 'replicate',
    name: 'Replicate',
    badge: 'Open Video & Visual AI',
    isLocal: false,
    defaultBaseUrl: 'https://api.replicate.com/v1',
    keyPlaceholder: 'r8_...',
    keyLink: 'https://replicate.com/account/api-tokens',
    keyLinkLabel: 'Get Replicate Token',
    description: 'Run open weights video and image models (LTX-Video, Kling, FLUX.1).',
    suggestedTextModels: ['minimax/video-01', 'black-forest-labs/flux-schnell']
  },
  {
    id: 'custom',
    name: 'Custom Endpoint',
    badge: 'Bring Your Own URL',
    isLocal: false,
    defaultBaseUrl: 'https://my-custom-proxy.com/v1',
    keyPlaceholder: 'Bearer key or token',
    keyLink: '',
    keyLinkLabel: '',
    description: 'Connect any custom reverse proxy, Cloudflare AI Gateway, or private server.',
    suggestedTextModels: ['gpt-4o-mini', 'gemini-2.5-flash', 'deepseek-chat']
  }
];

const SettingsDialog: React.FC<SettingsDialogProps> = ({ currentSettings, onSave, onClose }) => {
  const [activeTab, setActiveTab] = useState<'providers' | 'storage' | 'identity' | 'style'>('providers');
  const [displayName, setDisplayName] = useState(currentSettings?.displayName || '');
  const [avatarBase64, setAvatarBase64] = useState<string | null>(currentSettings?.avatarBase64 || null);
  
  // Brand Fields
  const [niche, setNiche] = useState(currentSettings?.niche || '');
  const [tone, setTone] = useState(currentSettings?.tone || 'High Energy');
  const [visualStyle, setVisualStyle] = useState(currentSettings?.visualStyle || 'Cinematic');
  
  // API Configuration
  const [apiProvider, setApiProvider] = useState<ApiProviderType>(currentSettings?.apiProvider || 'google');
  const [apiKey, setApiKey] = useState(currentSettings?.apiKey || '');
  const [apiGatewayUrl, setApiGatewayUrl] = useState(currentSettings?.apiGatewayUrl || '');
  const [ollamaUrl, setOllamaUrl] = useState(currentSettings?.ollamaUrl || 'http://localhost:11434');
  const [ollamaModel, setOllamaModel] = useState(currentSettings?.ollamaModel || 'llama3.2:latest');
  const [customTextModel, setCustomTextModel] = useState(currentSettings?.customTextModel || '');
  const [customImageModel, setCustomImageModel] = useState(currentSettings?.customImageModel || '');
  const [replicateApiKey, setReplicateApiKey] = useState(currentSettings?.replicateApiKey || '');
  const [elevenLabsApiKey, setElevenLabsApiKey] = useState(currentSettings?.elevenLabsApiKey || '');
  const [elevenLabsVoiceId, setElevenLabsVoiceId] = useState(currentSettings?.elevenLabsVoiceId || '');
  const [showApiKey, setShowApiKey] = useState(false);
  const [showAdvancedModels, setShowAdvancedModels] = useState(false);

  // Storage Stats
  const [storageStats, setStorageStats] = useState<StorageStats | null>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // Connection Test Status
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; latencyMs?: number } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const bundleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localDB.getStorageStats().then(setStorageStats).catch(console.warn);
  }, []);

  const handleProviderSelect = (provider: ProviderOption) => {
    setApiProvider(provider.id);
    if (provider.id === 'ollama') {
      setOllamaUrl(provider.defaultBaseUrl);
    } else if (provider.defaultBaseUrl) {
      setApiGatewayUrl(provider.defaultBaseUrl);
    } else {
      setApiGatewayUrl('');
    }
    setTestResult(null);
  };

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    setTestResult(null);
    try {
      const res = await testApiConnection({
        provider: apiProvider,
        apiKey: apiKey.trim(),
        baseUrl: apiGatewayUrl.trim() || undefined,
        ollamaUrl: ollamaUrl.trim() || undefined,
        ollamaModel: ollamaModel.trim() || undefined,
        customTextModel: customTextModel.trim() || undefined,
      });
      setTestResult(res);
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Connection test failed.',
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setAvatarBase64(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBundleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setImportStatus('Unpacking .creatorstudio archive...');
      const res = await importProjectBundle(file);
      setImportStatus(`Successfully imported "${res.project.title}" (${res.postsImported} clips, ${res.avatarsImported} avatars)!`);
      const updatedStats = await localDB.getStorageStats();
      setStorageStats(updatedStats);
    } catch (err: any) {
      setImportStatus(`Import error: ${err.message}`);
    }
  };

  const handleWipeData = async () => {
    if (window.confirm("Are you sure you want to wipe all local projects, avatars, and IndexedDB data? This cannot be undone.")) {
      await localDB.wipeAllLocalData();
      const updated = await localDB.getStorageStats();
      setStorageStats(updated);
      alert("Local data successfully cleared.");
    }
  };

  const handleSave = () => {
    onSave({
      displayName: displayName || 'Creator',
      avatarBase64,
      niche: niche || 'General',
      tone,
      visualStyle,
      apiProvider,
      apiKey: apiKey.trim(),
      apiGatewayUrl: apiGatewayUrl.trim(),
      ollamaUrl: ollamaUrl.trim(),
      ollamaModel: ollamaModel.trim(),
      customTextModel: customTextModel.trim(),
      customImageModel: customImageModel.trim(),
      replicateApiKey: replicateApiKey.trim(),
      elevenLabsApiKey: elevenLabsApiKey.trim(),
      elevenLabsVoiceId: elevenLabsVoiceId.trim(),
      zeroTelemetryVerified: true,
    });
    onClose();
  };

  const currentProviderConfig = PROVIDERS.find(p => p.id === apiProvider) || PROVIDERS[0];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#111] border border-white/10 w-full max-w-4xl rounded-3xl p-0 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh] text-white">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bogle text-white tracking-wide">Studio Configuration</h2>
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold uppercase">
                  Local-First Engine
                </span>
              </div>
              <p className="text-xs text-white/50 mt-0.5">Your keys • Your models • Your media • Your machine</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
            <X className="w-5 h-5 text-white/70" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 py-2.5 border-b border-white/5 bg-black/30">
          <button
            onClick={() => setActiveTab('providers')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'providers' ? 'bg-white text-black font-bold' : 'text-neutral-400 hover:text-white bg-white/5'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>AI Providers & Localhost</span>
          </button>

          <button
            onClick={() => setActiveTab('storage')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'storage' ? 'bg-white text-black font-bold' : 'text-neutral-400 hover:text-white bg-white/5'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>Local DB & Backup</span>
          </button>

          <button
            onClick={() => setActiveTab('identity')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'identity' ? 'bg-white text-black font-bold' : 'text-neutral-400 hover:text-white bg-white/5'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Persona</span>
          </button>

          <button
            onClick={() => setActiveTab('style')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'style' ? 'bg-white text-black font-bold' : 'text-neutral-400 hover:text-white bg-white/5'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Style & Voice</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="overflow-y-auto p-6 space-y-6 no-scrollbar flex-1">
          
          {activeTab === 'providers' && (
            <div className="space-y-6">
              {/* Provider Selection Grid */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-amber-400 mb-3 flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5" /> Select Active Inference Provider
                </label>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {PROVIDERS.map((provider) => {
                    const isSelected = apiProvider === provider.id;
                    return (
                      <button
                        key={provider.id}
                        type="button"
                        onClick={() => handleProviderSelect(provider)}
                        className={`text-left p-3.5 rounded-2xl border transition-all relative ${
                          isSelected 
                            ? 'bg-purple-600/15 border-purple-500/60 shadow-[0_0_15px_rgba(168,85,247,0.15)] ring-1 ring-purple-400/40' 
                            : 'bg-white/[0.02] border-white/10 hover:bg-white/[0.05] hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-1.5">
                          <span className={`text-xs font-bold ${isSelected ? 'text-purple-300' : 'text-white'}`}>
                            {provider.name}
                          </span>
                          {isSelected && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                          )}
                        </div>
                        <div className="text-[10px] text-gray-400 line-clamp-1 mb-1 font-mono">
                          {provider.badge}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Provider Configuration Box */}
              <div className="p-5 rounded-2xl bg-black/50 border border-white/10 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-gray-400 pb-3 border-b border-white/5">
                  <span>{currentProviderConfig.description}</span>
                  {currentProviderConfig.keyLink && (
                    <a 
                      href={currentProviderConfig.keyLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-purple-400 hover:text-purple-300 underline underline-offset-2 shrink-0"
                    >
                      {currentProviderConfig.keyLinkLabel} <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                {/* Ollama specific controls */}
                {apiProvider === 'ollama' ? (
                  <div className="space-y-4">
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>100% Local Inference Active: Prompt requests are sent directly to your local Ollama port with zero external network transmission.</span>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                        Ollama Base URL (Localhost)
                      </label>
                      <input
                        type="text"
                        value={ollamaUrl}
                        onChange={(e) => setOllamaUrl(e.target.value)}
                        placeholder="http://localhost:11434"
                        className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-white font-mono text-xs focus:border-purple-400/50 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                        Installed Ollama Model Name
                      </label>
                      <input
                        type="text"
                        value={ollamaModel}
                        onChange={(e) => setOllamaModel(e.target.value)}
                        placeholder="e.g. llama3.2:latest, qwen2.5:7b, mistral:latest"
                        className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-white font-mono text-xs focus:border-purple-400/50 outline-none"
                      />
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        <span className="text-[10px] text-gray-500 self-center mr-1">Quick Select:</span>
                        {['llama3.2:latest', 'qwen2.5:7b', 'mistral:latest', 'deepseek-r1:8b'].map((m) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => setOllamaModel(m)}
                            className="text-[10px] px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-white/70 border border-white/10 font-mono transition-colors"
                          >
                            {m}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* API Key Input */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-300 mb-1.5 flex items-center justify-between">
                        <span>API Key / Secret Token</span>
                        <span className="text-[10px] text-gray-500 font-normal">Stored locally in your browser</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showApiKey ? "text" : "password"}
                          value={apiKey}
                          onChange={(e) => setApiKey(e.target.value)}
                          placeholder={`Enter ${currentProviderConfig.name} Key (e.g. ${currentProviderConfig.keyPlaceholder})`}
                          className="w-full bg-black/60 border border-white/10 rounded-xl pl-4 pr-12 py-2.5 text-white focus:outline-none focus:border-purple-400/50 transition-colors font-mono text-xs"
                        />
                        <button 
                          type="button"
                          onClick={() => setShowApiKey(!showApiKey)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors"
                        >
                          {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* API Gateway / Base URL */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-300 mb-1.5 flex items-center justify-between">
                        <span>Base URL / Gateway Endpoint (Optional Proxy)</span>
                        <span className="text-[10px] text-gray-500 font-normal">
                          {apiProvider === 'google' ? 'Optional proxy' : 'Endpoint prefix'}
                        </span>
                      </label>
                      <input
                        type="text"
                        value={apiGatewayUrl}
                        onChange={(e) => setApiGatewayUrl(e.target.value)}
                        placeholder={currentProviderConfig.defaultBaseUrl || "Leave blank for direct Google AI API or enter proxy URL"}
                        className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-purple-400/50 transition-colors font-mono text-xs"
                      />
                    </div>
                  </>
                )}

                {/* Advanced Model Mapping Toggle */}
                <div>
                  <button
                    type="button"
                    onClick={() => setShowAdvancedModels(!showAdvancedModels)}
                    className="flex items-center gap-1.5 text-xs text-white/60 hover:text-white transition-colors font-medium py-1"
                  >
                    <Cpu className="w-3.5 h-3.5 text-purple-400" />
                    <span>Custom Model Names & Replicate Token (Optional)</span>
                    {showAdvancedModels ? <ChevronUp className="w-3.5 h-3.5 ml-1" /> : <ChevronDown className="w-3.5 h-3.5 ml-1" />}
                  </button>

                  {showAdvancedModels && (
                    <div className="mt-3 space-y-3 p-3.5 bg-white/[0.02] border border-white/5 rounded-xl">
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-300 mb-1">
                          Text & Script Model ID
                        </label>
                        <input
                          type="text"
                          value={customTextModel}
                          onChange={(e) => setCustomTextModel(e.target.value)}
                          placeholder="e.g. gemini-2.5-flash, gpt-4o-mini"
                          className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-white text-xs font-mono focus:border-purple-400/50 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-gray-300 mb-1">
                          Cover / Thumbnail Image Model ID
                        </label>
                        <input
                          type="text"
                          value={customImageModel}
                          onChange={(e) => setCustomImageModel(e.target.value)}
                          placeholder="e.g. gemini-2.5-flash-image, dall-e-3"
                          className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-white text-xs font-mono focus:border-purple-400/50 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-gray-300 mb-1">
                          Replicate API Token (Optional)
                        </label>
                        <input
                          type="password"
                          value={replicateApiKey}
                          onChange={(e) => setReplicateApiKey(e.target.value)}
                          placeholder="r8_..."
                          className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-white text-xs font-mono focus:border-purple-400/50 outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Connection Test Button */}
                <div className="pt-2 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={isTestingConnection}
                    className="px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-900/30"
                  >
                    <Activity className={`w-3.5 h-3.5 ${isTestingConnection ? 'animate-spin' : ''}`} />
                    {isTestingConnection ? 'Testing Connection...' : 'Test Provider Connection'}
                  </button>

                  <div className="flex-1">
                    {testResult && (
                      <div className={`p-2.5 rounded-xl text-xs border ${
                        testResult.success 
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
                          : 'bg-red-500/10 border-red-500/30 text-red-300'
                      }`}>
                        <div className="flex items-center gap-1.5 font-semibold">
                          {testResult.success ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <AlertTriangle className="w-3.5 h-3.5 text-red-400" />}
                          <span>{testResult.success ? 'Connected' : 'Failed'}</span>
                        </div>
                        <p className="mt-0.5 text-[11px] opacity-90">{testResult.message}</p>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}

          {activeTab === 'storage' && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-neutral-900/60 border border-white/10 flex items-start gap-3">
                <Database className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                <div className="text-xs text-neutral-300">
                  <strong className="text-white block mb-1">Local-First Persistence Engine:</strong>
                  All created avatars, storyboard timelines, viral scripts, and media files are stored locally in your browser's IndexedDB. No external account or database synchronization required.
                </div>
              </div>

              {/* Storage Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-black/40 border border-white/5">
                  <span className="text-[10px] text-neutral-400 block font-mono uppercase">Projects</span>
                  <span className="text-lg font-bold text-white mt-1 block">{storageStats?.projectsCount || 0}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-black/40 border border-white/5">
                  <span className="text-[10px] text-neutral-400 block font-mono uppercase">Avatars</span>
                  <span className="text-lg font-bold text-purple-400 mt-1 block">{storageStats?.avatarsCount || 0}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-black/40 border border-white/5">
                  <span className="text-[10px] text-neutral-400 block font-mono uppercase">Video Clips</span>
                  <span className="text-lg font-bold text-indigo-400 mt-1 block">{storageStats?.postsCount || 0}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-black/40 border border-white/5">
                  <span className="text-[10px] text-neutral-400 block font-mono uppercase">Estimated Size</span>
                  <span className="text-lg font-bold text-emerald-400 mt-1 block">
                    {storageStats ? `${Math.round(storageStats.estimatedSizeBytes / 1024)} KB` : '0 KB'}
                  </span>
                </div>
              </div>

              {/* Portable Project Format Import & Export */}
              <div className="p-5 rounded-2xl bg-black/40 border border-white/10 space-y-4">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <FolderArchive className="w-4 h-4 text-purple-400" />
                  <span>Portable Project Archive (.creatorstudio)</span>
                </div>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Export your entire project with scenes, avatar digital twins, and generation parameters into an open ZIP container that can be opened on any computer running Reels Creator.
                </p>

                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    onClick={() => bundleInputRef.current?.click()}
                    className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-2 transition-all"
                  >
                    <Download className="w-3.5 h-3.5 text-purple-300" />
                    <span>Import .creatorstudio Archive</span>
                  </button>
                  <input
                    type="file"
                    ref={bundleInputRef}
                    accept=".creatorstudio,.zip"
                    className="hidden"
                    onChange={handleBundleImport}
                  />

                  <button
                    onClick={handleWipeData}
                    className="px-4 py-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2 transition-all ml-auto"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                    <span>Clear Local Database</span>
                  </button>
                </div>

                {importStatus && (
                  <div className="p-2.5 rounded-xl bg-purple-950/40 border border-purple-500/30 text-purple-200 text-xs">
                    {importStatus}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'identity' && (
            <section className="space-y-4">
              <div className="flex items-start gap-6">
                <div className="flex flex-col items-center gap-3">
                  <div 
                    className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden cursor-pointer group relative"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {avatarBase64 ? (
                      <img src={avatarBase64} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-8 h-8 text-white/30" />
                    )}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <Upload className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                </div>
                
                <div className="flex-1 space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm text-gray-400">Display Name</label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="e.g. Ryan Jordan"
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/30 transition-colors text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-gray-400">Your Niche</label>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                      <input
                        type="text"
                        value={niche}
                        onChange={(e) => setNiche(e.target.value)}
                        placeholder="e.g. Fitness, AI Tech, Viral Comedy, Cooking"
                        className="w-full bg-black/50 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-white/30 transition-colors text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {activeTab === 'style' && (
            <section className="space-y-6">
              <div>
                <label className="block text-sm text-gray-400 mb-3">Preferred Tone</label>
                <div className="flex flex-wrap gap-2">
                  {TONES.map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTone(t)}
                      className={`px-4 py-2 rounded-full text-sm transition-all border ${
                        tone === t 
                          ? 'bg-white text-black border-white font-medium' 
                          : 'bg-white/5 text-white/60 border-transparent hover:bg-white/10'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-3">Video Aesthetic & Style</label>
                <div className="flex flex-wrap gap-2">
                  {STYLES.map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setVisualStyle(s)}
                      className={`px-4 py-2 rounded-full text-sm transition-all border ${
                        visualStyle === s
                          ? 'bg-purple-600 text-white border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.4)] font-medium' 
                          : 'bg-white/5 text-white/60 border-transparent hover:bg-white/10'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* ElevenLabs Config */}
              <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                    <Mic className="w-3.5 h-3.5" /> AI Voice Narration (ElevenLabs / Web Speech)
                  </label>
                  <span className="text-[10px] text-white/40">Optional</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-[11px] text-gray-400 block mb-1">ElevenLabs API Key</label>
                    <input
                      type="password"
                      value={elevenLabsApiKey}
                      onChange={(e) => setElevenLabsApiKey(e.target.value)}
                      placeholder="xi-..."
                      className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-white text-xs font-mono focus:border-purple-400/50 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-gray-400 block mb-1">Voice ID (Optional)</label>
                    <input
                      type="text"
                      value={elevenLabsVoiceId}
                      onChange={(e) => setElevenLabsVoiceId(e.target.value)}
                      placeholder="21m00Tcm4TlvDq8ikWAM"
                      className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-white text-xs font-mono focus:border-purple-400/50 outline-none"
                    />
                  </div>
                </div>
              </div>
            </section>
          )}

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/5 bg-white/5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-emerald-400">
            <Lock className="w-3.5 h-3.5" />
            <span>Zero Telemetry Verified</span>
          </div>

          <button
            onClick={handleSave}
            className="px-8 py-3.5 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-colors flex items-center gap-2 shadow-lg text-sm"
          >
            <Save className="w-4 h-4" />
            Save Studio Settings
          </button>
        </div>

      </div>
    </div>
  );
};

export default SettingsDialog;
