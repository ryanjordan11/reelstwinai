
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useRef, useState } from 'react';
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
  ChevronUp 
} from 'lucide-react';
import { ApiProviderType, UserSettings } from '../types';
import { testApiConnection } from '../services/geminiService';

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
  defaultBaseUrl: string;
  keyPlaceholder: string;
  keyLink: string;
  keyLinkLabel: string;
  description: string;
  suggestedTextModels: string[];
}

const PROVIDERS: ProviderOption[] = [
  {
    id: 'google',
    name: 'Google AI Studio',
    badge: 'Veo & Gemini Native',
    defaultBaseUrl: '',
    keyPlaceholder: 'AIzaSy...',
    keyLink: 'https://aistudio.google.com/app/apikey',
    keyLinkLabel: 'Get Google AI Studio Key',
    description: 'Direct access to Google Gemini models and Google Veo video generation engine.',
    suggestedTextModels: ['gemini-flash-lite-latest', 'gemini-2.5-flash', 'gemini-3-flash-preview']
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    badge: '200+ Unified Models',
    defaultBaseUrl: 'https://openrouter.ai/api/v1',
    keyPlaceholder: 'sk-or-v1-...',
    keyLink: 'https://openrouter.ai/keys',
    keyLinkLabel: 'Get OpenRouter API Key',
    description: 'Unified gateway for Claude 3.5, GPT-4o, Gemini 2.5, DeepSeek, and Llama 3.',
    suggestedTextModels: ['google/gemini-2.5-flash', 'openai/gpt-4o-mini', 'anthropic/claude-3.5-sonnet', 'deepseek/deepseek-chat']
  },
  {
    id: 'aihubmix',
    name: 'AIHubMix',
    badge: 'Global AI Proxy',
    defaultBaseUrl: 'https://aihubmix.com/v1',
    keyPlaceholder: 'sk-...',
    keyLink: 'https://aihubmix.com',
    keyLinkLabel: 'Get AIHubMix API Key',
    description: 'High-speed proxy gateway for Gemini, OpenAI, Claude, Midjourney & top video models.',
    suggestedTextModels: ['gemini-2.5-flash', 'gpt-4o-mini', 'claude-3-5-sonnet-20241022']
  },
  {
    id: 'replicate',
    name: 'Replicate',
    badge: 'Open Video & Visual AI',
    defaultBaseUrl: 'https://api.replicate.com/v1',
    keyPlaceholder: 'r8_...',
    keyLink: 'https://replicate.com/account/api-tokens',
    keyLinkLabel: 'Get Replicate API Token',
    description: 'Run top video models (Minimax Video, Luma Dream Machine, Kling, FLUX).',
    suggestedTextModels: ['minimax/video-01', 'kling-ai/kling-v1', 'black-forest-labs/flux-schnell']
  },
  {
    id: 'vercel',
    name: 'Vercel AI Gateway',
    badge: 'Edge Caching & Routing',
    defaultBaseUrl: 'https://gateway.ai.vercel.com/v1',
    keyPlaceholder: 'Vercel API Gateway Token or key',
    keyLink: 'https://vercel.com/docs/ai/ai-gateway',
    keyLinkLabel: 'Vercel AI Gateway Docs',
    description: 'Route requests through Vercel AI Gateway with edge caching and multi-provider fallback.',
    suggestedTextModels: ['google/gemini-2.5-flash', 'openai/gpt-4o-mini']
  },
  {
    id: 'custom',
    name: 'Custom Endpoint',
    badge: 'OpenAI Compatible',
    defaultBaseUrl: 'https://your-custom-gateway.com/v1',
    keyPlaceholder: 'Bearer key or token',
    keyLink: '',
    keyLinkLabel: '',
    description: 'Connect any custom reverse proxy, Cloudflare AI Gateway, LiteLLM, or self-hosted API.',
    suggestedTextModels: ['gpt-4o-mini', 'gemini-2.5-flash', 'deepseek-chat']
  }
];

const SettingsDialog: React.FC<SettingsDialogProps> = ({ currentSettings, onSave, onClose }) => {
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
  const [customTextModel, setCustomTextModel] = useState(currentSettings?.customTextModel || '');
  const [customImageModel, setCustomImageModel] = useState(currentSettings?.customImageModel || '');
  const [replicateApiKey, setReplicateApiKey] = useState(currentSettings?.replicateApiKey || '');
  const [elevenLabsApiKey, setElevenLabsApiKey] = useState(currentSettings?.elevenLabsApiKey || '');
  const [elevenLabsVoiceId, setElevenLabsVoiceId] = useState(currentSettings?.elevenLabsVoiceId || '');
  const [showApiKey, setShowApiKey] = useState(false);
  const [showAdvancedModels, setShowAdvancedModels] = useState(false);

  // Connection Test Status
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; latencyMs?: number } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleProviderSelect = (provider: ProviderOption) => {
    setApiProvider(provider.id);
    if (provider.defaultBaseUrl) {
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
      customTextModel: customTextModel.trim(),
      customImageModel: customImageModel.trim(),
      replicateApiKey: replicateApiKey.trim(),
      elevenLabsApiKey: elevenLabsApiKey.trim(),
      elevenLabsVoiceId: elevenLabsVoiceId.trim(),
    });
    onClose();
  };

  const currentProviderConfig = PROVIDERS.find(p => p.id === apiProvider) || PROVIDERS[0];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#111] border border-white/10 w-full max-w-3xl rounded-3xl p-0 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/5">
          <div>
            <h2 className="text-2xl font-bogle text-white tracking-wide">Studio Settings & API Gateways</h2>
            <p className="text-xs text-white/50 mt-0.5">Configure your AI providers, custom gateways, and creator persona</p>
          </div>
          <button onClick={onClose} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
            <X className="w-5 h-5 text-white/70" />
          </button>
        </div>

        <div className="overflow-y-auto p-6 space-y-8 no-scrollbar">
          
          {/* Section: API Provider & Gateway Configuration */}
          <section className="bg-gradient-to-b from-neutral-900 to-black border border-white/10 rounded-2xl p-6">
             <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-amber-400 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-400" /> AI Provider & API Gateway
                </h3>
                <span className="text-[11px] px-2.5 py-1 bg-amber-400/10 text-amber-300 border border-amber-400/20 rounded-full font-medium">
                  Active: {currentProviderConfig.name}
                </span>
             </div>

             <p className="text-xs text-gray-300 mb-4 leading-relaxed">
               Choose your preferred API service. You can connect directly to <strong>Google AI Studio</strong>, or route through <strong>OpenRouter</strong>, <strong>AIHubMix</strong>, <strong>Vercel AI Gateway</strong>, or any custom endpoint.
             </p>

             {/* Provider Selection Grid */}
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 mb-6">
                {PROVIDERS.map((provider) => {
                  const isSelected = apiProvider === provider.id;
                  return (
                    <button
                      key={provider.id}
                      type="button"
                      onClick={() => handleProviderSelect(provider)}
                      className={`text-left p-3.5 rounded-xl border transition-all relative ${
                        isSelected 
                          ? 'bg-amber-400/10 border-amber-400/60 shadow-[0_0_15px_rgba(251,191,36,0.15)] ring-1 ring-amber-400/30' 
                          : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.06] hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-1.5">
                        <span className={`text-xs font-bold ${isSelected ? 'text-amber-300' : 'text-white'}`}>
                          {provider.name}
                        </span>
                        {isSelected && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        )}
                      </div>
                      <div className="text-[10px] text-gray-400 line-clamp-1 mb-1 font-mono">
                        {provider.badge}
                      </div>
                    </button>
                  );
                })}
             </div>

             {/* Active Provider Details & Inputs */}
             <div className="space-y-4 bg-black/40 border border-white/5 rounded-xl p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-gray-400 pb-2 border-b border-white/5">
                  <span className="text-gray-300">{currentProviderConfig.description}</span>
                  {currentProviderConfig.keyLink && (
                    <a 
                      href={currentProviderConfig.keyLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-amber-400 hover:text-amber-300 underline underline-offset-2 shrink-0"
                    >
                      {currentProviderConfig.keyLinkLabel} <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                {/* API Key Input */}
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5 flex items-center justify-between">
                    <span>API Key / Token</span>
                    <span className="text-[10px] text-gray-500 font-normal">Stored locally in your browser</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showApiKey ? "text" : "password"}
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder={`Enter ${currentProviderConfig.name} Key (e.g. ${currentProviderConfig.keyPlaceholder})`}
                      className="w-full bg-black/60 border border-white/10 rounded-xl pl-4 pr-12 py-2.5 text-white focus:outline-none focus:border-amber-400/50 transition-colors font-mono text-xs"
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

                {/* API Gateway / Base URL Input */}
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5 flex items-center justify-between">
                    <span>Base URL / Gateway Endpoint</span>
                    <span className="text-[10px] text-gray-500 font-normal">
                      {apiProvider === 'google' ? 'Optional proxy' : 'Endpoint prefix'}
                    </span>
                  </label>
                  <input
                    type="text"
                    value={apiGatewayUrl}
                    onChange={(e) => setApiGatewayUrl(e.target.value)}
                    placeholder={currentProviderConfig.defaultBaseUrl || "Leave blank for direct Google AI API or enter proxy URL"}
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-amber-400/50 transition-colors font-mono text-xs"
                  />
                  <p className="text-[11px] text-gray-500 mt-1">
                    {apiProvider === 'openrouter' && "Default OpenRouter API: https://openrouter.ai/api/v1"}
                    {apiProvider === 'aihubmix' && "Default AIHubMix API: https://aihubmix.com/v1"}
                    {apiProvider === 'vercel' && "Default Vercel AI Gateway: https://gateway.ai.vercel.com/v1"}
                    {apiProvider === 'google' && "Leave blank to connect directly to Google AI Studio servers."}
                    {apiProvider === 'custom' && "Supports any OpenAI-compatible API base URL (e.g., https://api.openai.com/v1)."}
                  </p>
                </div>

                {/* Advanced Model Mapping Toggle */}
                <div>
                  <button
                    type="button"
                    onClick={() => setShowAdvancedModels(!showAdvancedModels)}
                    className="flex items-center gap-1.5 text-xs text-white/60 hover:text-white transition-colors font-medium py-1"
                  >
                    <Cpu className="w-3.5 h-3.5 text-amber-400" />
                    <span>Custom Model Names (Optional)</span>
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
                          placeholder={`e.g. ${currentProviderConfig.suggestedTextModels[0] || 'gemini-2.5-flash'}`}
                          className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-white text-xs font-mono focus:border-amber-400/50 outline-none"
                        />
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          <span className="text-[10px] text-gray-500 self-center mr-1">Quick Select:</span>
                          {currentProviderConfig.suggestedTextModels.map((m) => (
                            <button
                              key={m}
                              type="button"
                              onClick={() => setCustomTextModel(m)}
                              className="text-[10px] px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-white/70 border border-white/10 font-mono transition-colors"
                            >
                              {m}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-gray-300 mb-1">
                          Cover / Thumbnail Image Model ID
                        </label>
                        <input
                          type="text"
                          value={customImageModel}
                          onChange={(e) => setCustomImageModel(e.target.value)}
                          placeholder="e.g. gemini-2.5-flash-image, dall-e-3, or flux-1-schnell"
                          className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-white text-xs font-mono focus:border-amber-400/50 outline-none"
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
                          className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-white text-xs font-mono focus:border-amber-400/50 outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Connection Test Button & Feedback */}
                <div className="pt-2 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={isTestingConnection || (!apiKey && apiProvider !== 'custom')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      isTestingConnection 
                        ? 'bg-amber-400/20 text-amber-300 cursor-wait' 
                        : !apiKey && apiProvider !== 'custom'
                        ? 'bg-white/5 text-white/30 cursor-not-allowed'
                        : 'bg-amber-400 text-black hover:bg-amber-300 shadow-md shadow-amber-400/10'
                    }`}
                  >
                    <Activity className={`w-3.5 h-3.5 ${isTestingConnection ? 'animate-spin' : ''}`} />
                    {isTestingConnection ? 'Testing Connection...' : 'Test Connection'}
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
                          <span>{testResult.success ? 'Connected Successfully' : 'Connection Failed'}</span>
                        </div>
                        <p className="mt-0.5 text-[11px] opacity-90">{testResult.message}</p>
                      </div>
                    )}
                  </div>
                </div>

             </div>
          </section>

          <div className="h-px bg-white/5 w-full"></div>

          {/* Section: Identity */}
          <section>
            <h3 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-4 flex items-center gap-2">
                <User className="w-4 h-4" /> Creator Profile
            </h3>
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
                            placeholder="e.g. Seth Anderson"
                            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/30 transition-colors"
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
                                className="w-full bg-black/50 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-white/30 transition-colors"
                            />
                         </div>
                    </div>
                </div>
            </div>
          </section>

          <div className="h-px bg-white/5 w-full"></div>

          {/* Section: Tone & Style */}
          <section>
             <h3 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-4 flex items-center gap-2">
                <Mic className="w-4 h-4" /> Brand Voice & Style
            </h3>
            <div className="mb-6">
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

            {/* ElevenLabs & Voice Synthesis Configuration */}
            <div className="mb-6 bg-white/[0.02] border border-white/10 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                        <Mic className="w-3.5 h-3.5" /> AI Voice Narration & TTS (ElevenLabs / Web Speech)
                    </label>
                    <span className="text-[10px] text-white/40">Optional</span>
                </div>
                <p className="text-[11px] text-gray-400">
                    By default, the app uses high-definition Web SpeechSynthesis. You can also provide an ElevenLabs API key for studio ultra-realistic cloned voice narrations.
                </p>
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
                        <label className="text-[11px] text-gray-400 block mb-1">Custom Voice ID (Optional)</label>
                        <input
                            type="text"
                            value={elevenLabsVoiceId}
                            onChange={(e) => setElevenLabsVoiceId(e.target.value)}
                            placeholder="e.g. 21m00Tcm4TlvDq8ikWAM"
                            className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-white text-xs font-mono focus:border-purple-400/50 outline-none"
                        />
                    </div>
                </div>
            </div>

            <h3 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-4 flex items-center gap-2">
                <Palette className="w-4 h-4" /> Visual Identity
            </h3>
            <div>
                <label className="block text-sm text-gray-400 mb-3">Video Style</label>
                <div className="flex flex-wrap gap-2">
                    {STYLES.map(s => (
                        <button
                            key={s}
                            type="button"
                            onClick={() => setVisualStyle(s)}
                            className={`px-4 py-2 rounded-full text-sm transition-all border ${
                                visualStyle === s
                                ? 'bg-indigo-600 text-white border-indigo-500 shadow-[0_0_15px_rgba(79,70,229,0.4)] font-medium' 
                                : 'bg-white/5 text-white/60 border-transparent hover:bg-white/10'
                            }`}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </div>
          </section>

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/5 bg-white/5">
          <button
            onClick={handleSave}
            className="w-full bg-white text-black font-bold py-3.5 rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 shadow-lg"
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

