
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useRef, useState } from 'react';
import { X, Upload, User, Save, Briefcase, Palette, Mic, Key, ExternalLink, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { UserSettings } from '../types';

interface SettingsDialogProps {
  currentSettings: UserSettings | null;
  onSave: (settings: UserSettings) => void;
  onClose: () => void;
}

const TONES = ['Humorous', 'Educational', 'Inspirational', 'Sarcastic', 'Professional', 'High Energy'];
const STYLES = ['Cinematic', 'Minimalist', 'Neon/Cyberpunk', 'Vintage/Retro', 'Corporate', 'Vlog Style'];

const SettingsDialog: React.FC<SettingsDialogProps> = ({ currentSettings, onSave, onClose }) => {
  const [displayName, setDisplayName] = useState(currentSettings?.displayName || '');
  const [avatarBase64, setAvatarBase64] = useState<string | null>(currentSettings?.avatarBase64 || null);
  
  // New Fields
  const [niche, setNiche] = useState(currentSettings?.niche || '');
  const [tone, setTone] = useState(currentSettings?.tone || 'High Energy');
  const [visualStyle, setVisualStyle] = useState(currentSettings?.visualStyle || 'Cinematic');
  
  // API Key Field
  const [apiKey, setApiKey] = useState(currentSettings?.apiKey || '');
  const [showApiKey, setShowApiKey] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

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
      apiKey: apiKey.trim()
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#111] border border-white/10 w-full max-w-2xl rounded-3xl p-0 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/5">
          <h2 className="text-2xl font-bogle text-white tracking-wide">Creator Settings</h2>
          <button onClick={onClose} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
            <X className="w-5 h-5 text-white/70" />
          </button>
        </div>

        <div className="overflow-y-auto p-6 space-y-8 no-scrollbar">
          
          {/* Section: API Configuration (Priority) */}
          <section className="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-5">
             <h3 className="text-xs font-bold uppercase tracking-widest text-yellow-500 mb-4 flex items-center gap-2">
                <Key className="w-4 h-4" /> API Configuration
            </h3>
            
            <div className="mb-4">
                 <p className="text-sm text-gray-300 mb-3 leading-relaxed">
                    To use the video generation features, you must provide your own Google Gemini API key. 
                    This ensures you have full control over your usage and billing.
                 </p>
                 <a 
                    href="https://aistudio.google.com/app/apikey" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-xs font-bold text-yellow-400 hover:text-yellow-300 underline underline-offset-4"
                 >
                    Get your API Key from Google AI Studio <ExternalLink className="w-3 h-3" />
                 </a>
            </div>

            <div className="relative">
                <input
                    type={showApiKey ? "text" : "password"}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Paste your API key here (starts with AIza...)"
                    className="w-full bg-black/50 border border-white/10 rounded-xl pl-4 pr-12 py-3 text-white focus:outline-none focus:border-yellow-500/50 transition-colors font-mono text-sm"
                />
                <button 
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors"
                >
                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
            </div>
            
            {!apiKey && (
                <div className="mt-3 flex items-start gap-2 text-xs text-yellow-500/70">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>Video generation will not work without a valid API key.</span>
                </div>
            )}
          </section>

          <div className="h-px bg-white/5 w-full"></div>

          {/* Section: Identity */}
          <section>
            <h3 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-4 flex items-center gap-2">
                <User className="w-4 h-4" /> Profile
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
                                placeholder="e.g. Fitness, AI Tech, Vegan Cooking"
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
                <Mic className="w-4 h-4" /> Brand Voice
            </h3>
            <div className="mb-6">
                <label className="block text-sm text-gray-400 mb-3">Preferred Tone</label>
                <div className="flex flex-wrap gap-2">
                    {TONES.map(t => (
                        <button
                            key={t}
                            onClick={() => setTone(t)}
                            className={`px-4 py-2 rounded-full text-sm transition-all border ${
                                tone === t 
                                ? 'bg-white text-black border-white' 
                                : 'bg-white/5 text-white/60 border-transparent hover:bg-white/10'
                            }`}
                        >
                            {t}
                        </button>
                    ))}
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
                            onClick={() => setVisualStyle(s)}
                            className={`px-4 py-2 rounded-full text-sm transition-all border ${
                                visualStyle === s
                                ? 'bg-indigo-600 text-white border-indigo-500 shadow-[0_0_15px_rgba(79,70,229,0.4)]' 
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
            className="w-full bg-white text-black font-bold py-3.5 rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save Settings
          </button>
        </div>

      </div>
    </div>
  );
};

export default SettingsDialog;
