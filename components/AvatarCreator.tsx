/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useRef } from 'react';
import { 
  ArrowLeft, 
  Sparkles, 
  User, 
  Save, 
  Trash2, 
  Clapperboard, 
  RefreshCw, 
  Wand2, 
  Layers, 
  Camera, 
  AlertCircle,
  Mic,
  Volume2,
  BadgeCheck,
  Plus
} from 'lucide-react';
import { AvatarPersona, UserSettings } from '../types';
import { generateAvatarImage } from '../services/geminiService';
import { speakTextWithSync, VOICE_PROFILES } from '../services/ttsService';

interface AvatarCreatorProps {
  userSettings: UserSettings | null;
  onBack: () => void;
  onSelectAvatarForReel: (avatar: AvatarPersona) => void;
  onUpdateUserSettings: (newSettings: UserSettings) => void;
}

const AVATAR_STYLES = [
  { 
    id: 'photorealistic', 
    label: 'Photorealistic Twin', 
    icon: '📸', 
    desc: 'Hyper-realistic 8k studio headshot with natural skin textures and depth of field.' 
  },
  { 
    id: 'cyberpunk', 
    label: 'Cyberpunk Neon Host', 
    icon: '⚡', 
    desc: 'Futuristic aesthetic with subtle cyber-implants, iridescent reflections, and neon backlight.' 
  },
  { 
    id: 'anime_cinematic', 
    label: 'Cinematic Anime / Shonen', 
    icon: '✨', 
    desc: 'High-budget anime character art style with vibrant eyes and expressive features.' 
  },
  { 
    id: '3d_pixar', 
    label: '3D Stylized Animation', 
    icon: '🧸', 
    desc: 'Polished character look reminiscent of modern 3D feature animated films.' 
  },
  { 
    id: 'vintage_noir', 
    label: 'Vintage Noir / Film Grain', 
    icon: '🎞️', 
    desc: 'Dramatic high-contrast monochrome with atmospheric 35mm film grain and rim lighting.' 
  },
  { 
    id: 'luxury_editorial', 
    label: 'High-Fashion Editorial', 
    icon: '💎', 
    desc: 'Vogue-style haute couture editorial lighting, dramatic gaze, and minimalist color palette.' 
  },
];

const LIGHTING_OPTIONS = [
  'Dramatic Rim & Volumetric Glow',
  'Soft Golden Hour Natural Light',
  'Cyberpunk Neon Blue & Magenta',
  'Studio Softbox Beauty Lighting',
  'Cinematic High-Contrast Shadows'
];

const EXPRESSIONS = [
  'Confident & Charismatic Smile',
  'Intense & Focused Direct Gaze',
  'Warm, Approachable & Friendly',
  'Mysterious & Enigmatic Smirk',
  'Energetic Viral Creator Vibe'
];

const AVATAR_STORAGE_KEY = 'veo_saved_avatar_personas';

export const getSavedAvatars = (): AvatarPersona[] => {
  try {
    const data = localStorage.getItem(AVATAR_STORAGE_KEY);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error("Error reading saved avatars", e);
  }
  return [
    {
      id: 'default-ai-host',
      name: 'Kai Vance',
      tagline: 'AI Tech & Trend Commentator',
      avatarBase64: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
      style: 'Photorealistic',
      genderOrArchetype: 'Non-binary / Neutral',
      isRealSelf: false,
      bio: 'High-energy presenter specializing in viral AI tool breakdowns and tech teasers.',
      createdAt: Date.now() - 100000,
      isActive: true,
      voiceSettings: {
        voiceName: 'alex',
        pitch: 1.0,
        rate: 1.05
      }
    },
    {
      id: 'default-cyber-host',
      name: 'Nova 7',
      tagline: 'Cyberpunk Reels Host',
      avatarBase64: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80',
      style: 'Cyberpunk Neon Host',
      genderOrArchetype: 'Futuristic Male',
      isRealSelf: false,
      bio: 'Cybernetic avatar delivering fast-paced cinematic storytelling.',
      createdAt: Date.now() - 200000,
      isActive: false,
      voiceSettings: {
        voiceName: 'aaron',
        pitch: 0.95,
        rate: 1.1
      }
    }
  ];
};

const AvatarCreator: React.FC<AvatarCreatorProps> = ({
  userSettings,
  onBack,
  onSelectAvatarForReel,
  onUpdateUserSettings,
}) => {
  const [avatars, setAvatars] = useState<AvatarPersona[]>(getSavedAvatars);
  const [activeTab, setActiveTab] = useState<'create' | 'vault'>('create');
  const [creationMode, setCreationMode] = useState<'real_self' | 'ai_synthesized'>('real_self');

  // Real Self Form State
  const [realPhotos, setRealPhotos] = useState<string[]>([]);
  const [realName, setRealName] = useState(userSettings?.displayName || 'My Digital Twin');
  const [realTagline, setRealTagline] = useState('Official Digital Twin');
  const [realBio, setRealBio] = useState('Authentic self for personalized AI Reels.');
  const [selectedVoiceProfile, setSelectedVoiceProfile] = useState(VOICE_PROFILES[0].id);
  const [voicePitch, setVoicePitch] = useState(1.0);
  const [voiceRate, setVoiceRate] = useState(1.0);
  const realFileInputRef = useRef<HTMLInputElement>(null);

  // AI Persona Form State
  const [aiName, setAiName] = useState('Astra');
  const [aiTagline, setAiTagline] = useState('Viral Reels Host');
  const [selectedStyle, setSelectedStyle] = useState(AVATAR_STYLES[0].id);
  const [genderOrArchetype, setGenderOrArchetype] = useState('Female');
  const [lookDetails, setLookDetails] = useState('Wavy auburn hair, hazel eyes, sharp modern aesthetic');
  const [outfit, setOutfit] = useState('Sleek dark bomber jacket with clean minimalist branding');
  const [lighting, setLighting] = useState(LIGHTING_OPTIONS[0]);
  const [expression, setExpression] = useState(EXPRESSIONS[0]);
  const [customPrompt, setCustomPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const saveAvatarsToStorage = (updated: AvatarPersona[]) => {
    setAvatars(updated);
    try {
      localStorage.setItem(AVATAR_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error("Failed to persist avatars", e);
    }
  };

  // Real Self Photo Handlers
  const handleRealPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setRealPhotos(prev => [...prev, reader.result as string].slice(0, 5));
        }
      };
      reader.readAsDataURL(file);
    });

    if (realFileInputRef.current) realFileInputRef.current.value = '';
  };

  const handleDeleteRealPhoto = (indexToDelete: number) => {
    setRealPhotos(prev => prev.filter((_, idx) => idx !== indexToDelete));
  };

  const handleSaveRealSelfPersona = () => {
    if (realPhotos.length === 0) {
      setError('Please upload at least one real photo / selfie of yourself.');
      return;
    }

    const newPersona: AvatarPersona = {
      id: `real-self-${Date.now()}`,
      name: realName.trim() || 'My Real Persona',
      tagline: realTagline.trim() || 'Official Digital Twin',
      avatarBase64: realPhotos[0],
      style: 'Real Photography',
      genderOrArchetype: 'Real Persona',
      isRealSelf: true,
      realPhotos: realPhotos,
      bio: realBio,
      createdAt: Date.now(),
      isActive: true,
      voiceSettings: {
        voiceName: selectedVoiceProfile,
        pitch: voicePitch,
        rate: voiceRate,
      }
    };

    const updated = [newPersona, ...avatars.filter(a => a.id !== newPersona.id)];
    saveAvatarsToStorage(updated);
    
    // Update userSettings avatar
    if (userSettings) {
      onUpdateUserSettings({
        ...userSettings,
        displayName: realName || userSettings.displayName,
        avatarBase64: realPhotos[0],
        activeAvatarId: newPersona.id
      });
    }

    setActiveTab('vault');
  };

  // AI Generation Handler
  const handleGenerateAiPersona = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const chosenStyle = AVATAR_STYLES.find(s => s.id === selectedStyle);
      const compositePrompt = customPrompt.trim() || (
        `A high quality close-up portrait of a ${genderOrArchetype.toLowerCase()} avatar named ${aiName}. ` +
        `Appearance: ${lookDetails}. Outfit: ${outfit}. Expression: ${expression}. ` +
        `Lighting: ${lighting}. Style: ${chosenStyle?.desc || 'Photorealistic 4K portrait'}. Centered composition, masterpiece quality.`
      );

      const base64Image = await generateAvatarImage(compositePrompt, chosenStyle?.label);
      setPreviewImage(base64Image);
    } catch (err: any) {
      setError(err.message || 'Failed to generate AI avatar. Check your API Key in Settings.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveAiPersona = () => {
    if (!previewImage) return;

    const chosenStyle = AVATAR_STYLES.find(s => s.id === selectedStyle);
    const newPersona: AvatarPersona = {
      id: `ai-clone-${Date.now()}`,
      name: aiName.trim() || 'AI Persona',
      tagline: aiTagline.trim() || chosenStyle?.label || 'Synthesized Cast Host',
      avatarBase64: previewImage,
      style: chosenStyle?.label || 'Synthesized Character',
      genderOrArchetype: genderOrArchetype,
      isRealSelf: false,
      bio: `${lookDetails} | ${outfit}`,
      createdAt: Date.now(),
      isActive: true,
      voiceSettings: {
        voiceName: selectedVoiceProfile,
        pitch: voicePitch,
        rate: voiceRate,
      }
    };

    const updated = [newPersona, ...avatars.filter(a => a.id !== newPersona.id)];
    saveAvatarsToStorage(updated);
    setActiveTab('vault');
  };

  const handleDeletePersona = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = avatars.filter(a => a.id !== id);
    saveAvatarsToStorage(updated);
  };

  const handleTestVoice = (persona: AvatarPersona) => {
    const profile = VOICE_PROFILES.find(p => p.id === persona.voiceSettings?.voiceName) || VOICE_PROFILES[0];
    const phrase = `Hello! I am ${persona.name}. Ready to create high retention video reels.`;
    
    speakTextWithSync(phrase, {
      voiceName: profile.browserVoiceMatch?.[0],
      pitch: persona.voiceSettings?.pitch || 1.0,
      rate: persona.voiceSettings?.rate || 1.05
    });
  };

  return (
    <div className="w-full max-w-[1300px] mx-auto p-4 sm:p-6 pb-36 text-white">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 border-b border-white/10 pb-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all border border-white/10"
            title="Back to Feed"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-bogle font-bold text-white tracking-wide">
                Avatar & Persona Studio
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Real Self + AI Clones
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              Create and anchor your real digital twin or synthesize AI archetypes for consistent reel casting.
            </p>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-2 bg-white/5 p-1 rounded-2xl border border-white/10 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('create')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'create' 
                ? 'bg-white text-black shadow-md' 
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>Create Persona</span>
          </button>
          <button
            onClick={() => setActiveTab('vault')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'vault' 
                ? 'bg-white text-black shadow-md' 
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Persona Vault ({avatars.length})</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-white/50 hover:text-white">✕</button>
        </div>
      )}

      {/* CREATE TAB */}
      {activeTab === 'create' && (
        <div className="space-y-6">
          
          {/* Mode Switcher: Real Self vs AI Synthesized */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div 
              onClick={() => setCreationMode('real_self')}
              className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                creationMode === 'real_self'
                  ? 'bg-gradient-to-br from-indigo-950/60 to-purple-950/40 border-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.2)] ring-1 ring-indigo-400/40'
                  : 'bg-white/[0.02] border-white/10 hover:bg-white/[0.05]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">Real Self (Digital Twin)</h3>
                    <p className="text-[11px] text-gray-400">Upload your own real photos / headshots</p>
                  </div>
                </div>
                {creationMode === 'real_self' && <BadgeCheck className="w-5 h-5 text-indigo-400" />}
              </div>
              <p className="text-xs text-gray-300 mt-2">
                Anchor your genuine face, voice, and real identity into AI Reels. Cast yourself in futuristic scenes, exotic locations, or educational videos.
              </p>
            </div>

            <div 
              onClick={() => setCreationMode('ai_synthesized')}
              className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                creationMode === 'ai_synthesized'
                  ? 'bg-gradient-to-br from-amber-950/60 to-orange-950/40 border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.2)] ring-1 ring-amber-400/40'
                  : 'bg-white/[0.02] border-white/10 hover:bg-white/[0.05]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">AI Synthesized Character</h3>
                    <p className="text-[11px] text-gray-400">Generate stylized archetypes with AI</p>
                  </div>
                </div>
                {creationMode === 'ai_synthesized' && <BadgeCheck className="w-5 h-5 text-amber-400" />}
              </div>
              <p className="text-xs text-gray-300 mt-2">
                Craft custom virtual creators, anime protagonists, 3D animated avatars, or cyberpunk news hosts using prompts and style presets.
              </p>
            </div>
          </div>

          {/* REAL SELF MODE FORM */}
          {creationMode === 'real_self' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: Photo Uploads & Camera */}
              <div className="lg:col-span-6 space-y-6">
                <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-6 space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-2">
                        <Camera className="w-4 h-4" /> Real Photos & Headshots
                      </h3>
                      <p className="text-xs text-gray-400 mt-1">Upload 1 to 5 clear photos of yourself from different angles</p>
                    </div>
                    <span className="text-xs text-white/50">{realPhotos.length} / 5</span>
                  </div>

                  {/* Photo Grid */}
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                    {realPhotos.map((photo, idx) => (
                      <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden border border-indigo-400/40 group shadow-md">
                        <img src={photo} alt={`Selfie ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          onClick={() => handleDeleteRealPhoto(idx)}
                          className="absolute inset-0 bg-red-950/80 opacity-0 group-hover:opacity-100 flex items-center justify-center text-red-200 transition-opacity"
                          title="Delete photo"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                        {idx === 0 && (
                          <span className="absolute bottom-1 left-1 right-1 text-center text-[9px] font-bold bg-indigo-600 text-white rounded py-0.5">
                            Primary
                          </span>
                        )}
                      </div>
                    ))}

                    {realPhotos.length < 5 && (
                      <button
                        onClick={() => realFileInputRef.current?.click()}
                        className="aspect-square rounded-2xl border-2 border-dashed border-white/20 hover:border-indigo-400 hover:bg-indigo-500/5 transition-all flex flex-col items-center justify-center gap-1.5 text-white/50 hover:text-indigo-300"
                      >
                        <Plus className="w-5 h-5" />
                        <span className="text-[10px] font-bold">Add Photo</span>
                      </button>
                    )}
                  </div>

                  <input 
                    type="file" 
                    ref={realFileInputRef} 
                    multiple 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleRealPhotoUpload} 
                  />

                  <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-[11px] text-indigo-300 leading-relaxed">
                    💡 <strong>Pro Tip:</strong> For best results in AI video reels, upload 1 straight headshot, 1 three-quarters angle, and 1 smiling photo with good natural lighting.
                  </div>
                </div>

                {/* Voice Profile & Synthesis */}
                <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-6 space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-purple-400 flex items-center gap-2">
                    <Mic className="w-4 h-4" /> AI Voice Narration & Clone Tone
                  </h3>
                  
                  <div>
                    <label className="text-xs text-gray-400 block mb-2">Voice Style</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {VOICE_PROFILES.map((vp) => (
                        <button
                          key={vp.id}
                          type="button"
                          onClick={() => setSelectedVoiceProfile(vp.id)}
                          className={`p-3 rounded-xl border text-left transition-all ${
                            selectedVoiceProfile === vp.id
                              ? 'bg-purple-500/20 border-purple-400 text-purple-200 shadow-md'
                              : 'bg-white/[0.02] border-white/10 hover:bg-white/[0.05] text-white/70'
                          }`}
                        >
                          <div className="text-xs font-bold text-white">{vp.name}</div>
                          <div className="text-[10px] text-gray-400 mt-0.5">{vp.accent}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div>
                      <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>Pitch</span>
                        <span>{voicePitch}x</span>
                      </div>
                      <input 
                        type="range" 
                        min="0.7" 
                        max="1.4" 
                        step="0.05" 
                        value={voicePitch} 
                        onChange={(e) => setVoicePitch(parseFloat(e.target.value))}
                        className="w-full accent-purple-400"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>Speech Rate</span>
                        <span>{voiceRate}x</span>
                      </div>
                      <input 
                        type="range" 
                        min="0.8" 
                        max="1.3" 
                        step="0.05" 
                        value={voiceRate} 
                        onChange={(e) => setVoiceRate(parseFloat(e.target.value))}
                        className="w-full accent-purple-400"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const profile = VOICE_PROFILES.find(p => p.id === selectedVoiceProfile) || VOICE_PROFILES[0];
                      speakTextWithSync(profile.samplePhrase, {
                        voiceName: profile.browserVoiceMatch?.[0],
                        pitch: voicePitch,
                        rate: voiceRate
                      });
                    }}
                    className="px-4 py-2 rounded-xl bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 border border-purple-500/30 text-xs font-bold flex items-center justify-center gap-2 transition-all w-full"
                  >
                    <Volume2 className="w-4 h-4" />
                    Test Voice Narration
                  </button>
                </div>
              </div>

              {/* Right Column: Identity Details & Save */}
              <div className="lg:col-span-6 space-y-6">
                <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-6 space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-white/50 flex items-center gap-2">
                    <User className="w-4 h-4" /> Identity Details
                  </h3>

                  <div>
                    <label className="text-xs text-gray-400 block mb-1.5">Real Creator Name</label>
                    <input 
                      type="text" 
                      value={realName} 
                      onChange={(e) => setRealName(e.target.value)}
                      placeholder="e.g. Seth Anderson"
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-indigo-400 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-gray-400 block mb-1.5">Creator Tagline / Niche</label>
                    <input 
                      type="text" 
                      value={realTagline} 
                      onChange={(e) => setRealTagline(e.target.value)}
                      placeholder="e.g. AI Film Director & Tech Host"
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-indigo-400 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-gray-400 block mb-1.5">Persona Bio & Style Notes</label>
                    <textarea 
                      rows={3}
                      value={realBio} 
                      onChange={(e) => setRealBio(e.target.value)}
                      placeholder="e.g. High energy, authentic storytelling, modern aesthetic"
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-indigo-400 outline-none resize-none"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveRealSelfPersona}
                    disabled={realPhotos.length === 0}
                    className={`w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-xl ${
                      realPhotos.length === 0
                        ? 'bg-white/10 text-white/30 cursor-not-allowed'
                        : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:brightness-110 shadow-indigo-500/25'
                    }`}
                  >
                    <Save className="w-4 h-4" />
                    Save & Anchor Real Digital Twin
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* AI SYNTHESIZED CHARACTER FORM */}
          {creationMode === 'ai_synthesized' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Form Controls */}
              <div className="lg:col-span-7 space-y-6">
                <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-6 space-y-5">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" /> Visual Archetype & Style
                  </h3>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {AVATAR_STYLES.map(style => (
                      <button
                        key={style.id}
                        type="button"
                        onClick={() => setSelectedStyle(style.id)}
                        className={`p-3.5 rounded-2xl border text-left transition-all ${
                          selectedStyle === style.id
                            ? 'bg-amber-400/20 border-amber-400 text-amber-200 shadow-md ring-1 ring-amber-400/40'
                            : 'bg-white/[0.02] border-white/10 hover:bg-white/[0.05] text-white/70'
                        }`}
                      >
                        <div className="text-lg mb-1">{style.icon}</div>
                        <div className="text-xs font-bold text-white">{style.label}</div>
                        <div className="text-[10px] text-gray-400 mt-1 line-clamp-2">{style.desc}</div>
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-gray-400 block mb-1.5">Avatar Name</label>
                      <input 
                        type="text" 
                        value={aiName} 
                        onChange={(e) => setAiName(e.target.value)}
                        placeholder="e.g. Astra Nova"
                        className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-amber-400 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 block mb-1.5">Tagline / Role</label>
                      <input 
                        type="text" 
                        value={aiTagline} 
                        onChange={(e) => setAiTagline(e.target.value)}
                        placeholder="e.g. Viral Reels Host"
                        className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-amber-400 outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-gray-400 block mb-1.5">Gender / Archetype</label>
                      <input 
                        type="text" 
                        value={genderOrArchetype} 
                        onChange={(e) => setGenderOrArchetype(e.target.value)}
                        placeholder="e.g. Female / Male / Cybernetic"
                        className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-amber-400 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 block mb-1.5">Lighting Mood</label>
                      <select
                        value={lighting}
                        onChange={(e) => setLighting(e.target.value)}
                        className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-white text-xs focus:border-amber-400 outline-none"
                      >
                        {LIGHTING_OPTIONS.map((opt, i) => (
                          <option key={i} value={opt} className="bg-neutral-900 text-white">{opt}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-gray-400 block mb-1.5">Facial Expression</label>
                    <select
                      value={expression}
                      onChange={(e) => setExpression(e.target.value)}
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-white text-xs focus:border-amber-400 outline-none"
                    >
                      {EXPRESSIONS.map((opt, i) => (
                        <option key={i} value={opt} className="bg-neutral-900 text-white">{opt}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-gray-400 block mb-1.5">Face & Appearance Details</label>
                    <input 
                      type="text" 
                      value={lookDetails} 
                      onChange={(e) => setLookDetails(e.target.value)}
                      placeholder="e.g. Wavy auburn hair, hazel eyes, sharp cheekbones"
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-amber-400 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-gray-400 block mb-1.5">Outfit & Wardrobe</label>
                    <input 
                      type="text" 
                      value={outfit} 
                      onChange={(e) => setOutfit(e.target.value)}
                      placeholder="e.g. Matte black tactical jacket with neon trim"
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-amber-400 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-gray-400 block mb-1.5">Optional Custom Override Prompt</label>
                    <input 
                      type="text" 
                      value={customPrompt} 
                      onChange={(e) => setCustomPrompt(e.target.value)}
                      placeholder="Leave blank to use auto-composed archetype prompt"
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2 text-white text-xs focus:border-amber-400 outline-none"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleGenerateAiPersona}
                    disabled={isGenerating}
                    className={`w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg ${
                      isGenerating
                        ? 'bg-amber-400/20 text-amber-300 cursor-wait'
                        : 'bg-amber-400 text-black hover:bg-amber-300 shadow-amber-400/20'
                    }`}
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Generating AI Persona...
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-4 h-4" />
                        Generate Persona Portrait
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Preview & Save Column */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-6 flex flex-col items-center text-center space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-white/50">
                    Portrait Preview
                  </h3>

                  <div className="w-full aspect-square rounded-2xl overflow-hidden border border-white/15 bg-black/60 flex items-center justify-center relative shadow-2xl">
                    {previewImage ? (
                      <img src={previewImage} alt="Generated Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <div className="p-8 text-white/30 flex flex-col items-center gap-2">
                        <Sparkles className="w-12 h-12" />
                        <span className="text-xs">Click "Generate Persona Portrait" to render preview</span>
                      </div>
                    )}
                  </div>

                  {previewImage && (
                    <button
                      type="button"
                      onClick={handleSaveAiPersona}
                      className="w-full py-3.5 rounded-xl bg-white text-black font-bold text-sm hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 shadow-lg"
                    >
                      <Save className="w-4 h-4" />
                      Save Persona to Vault
                    </button>
                  )}
                </div>
              </div>

            </div>
          )}

        </div>
      )}

      {/* VAULT TAB */}
      {activeTab === 'vault' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Your Saved Persona Cast</h2>
            <button
              onClick={() => setActiveTab('create')}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              Create New
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {avatars.map((persona) => {
              const isReal = persona.isRealSelf;
              return (
                <div 
                  key={persona.id}
                  className={`rounded-3xl border overflow-hidden p-5 flex flex-col justify-between transition-all relative group ${
                    isReal 
                      ? 'bg-gradient-to-b from-indigo-950/40 to-black border-indigo-500/30 hover:border-indigo-400 shadow-lg' 
                      : 'bg-white/[0.02] border-white/10 hover:border-white/20'
                  }`}
                >
                  <div>
                    {/* Badge */}
                    <div className="flex items-center justify-between mb-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        isReal 
                          ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 flex items-center gap-1' 
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      }`}>
                        {isReal ? <><BadgeCheck className="w-3 h-3 text-indigo-400" /> Real Digital Twin</> : persona.style}
                      </span>

                      <button
                        onClick={(e) => handleDeletePersona(persona.id, e)}
                        className="p-1.5 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Delete Persona"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Avatar Image */}
                    <div className="w-full aspect-square rounded-2xl overflow-hidden mb-4 border border-white/10 bg-black/60 relative">
                      <img src={persona.avatarBase64} alt={persona.name} className="w-full h-full object-cover" />
                    </div>

                    <h3 className="text-base font-bold text-white">{persona.name}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">{persona.tagline || persona.style}</p>
                    {persona.bio && <p className="text-[11px] text-gray-300 mt-2 line-clamp-2">{persona.bio}</p>}
                  </div>

                  {/* Actions */}
                  <div className="mt-5 pt-4 border-t border-white/10 flex flex-col gap-2">
                    <button
                      onClick={() => onSelectAvatarForReel(persona)}
                      className="w-full py-2.5 rounded-xl bg-white text-black font-bold text-xs hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 shadow-md"
                    >
                      <Clapperboard className="w-3.5 h-3.5" />
                      Cast in Reel
                    </button>
                    <button
                      onClick={() => handleTestVoice(persona)}
                      className="w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 text-[11px] font-medium transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Volume2 className="w-3.5 h-3.5 text-purple-400" />
                      Test Voice
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};

export default AvatarCreator;
