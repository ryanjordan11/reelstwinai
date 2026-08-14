/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useRef, useEffect } from 'react';
import { 
  Clapperboard, 
  Sparkles, 
  Volume2, 
  Mic, 
  Grid, 
  Layers, 
  Type, 
  Palette, 
  Camera, 
  Sun, 
  Wand2, 
  Plus, 
  Trash2, 
  History, 
  Star, 
  Film
} from 'lucide-react';
import { 
  AspectRatio, 
  CaptionStyle, 
  CaptionWord, 
  FeedPost, 
  GenerateVideoParams, 
  GenerationMode, 
  ImageFile, 
  Resolution, 
  UserSettings, 
  VeoModel,
  AvatarPersona 
} from '../types';
import { CAMERA_PRESETS, LIGHTING_PRESETS, STYLE_PRESETS, getPromptHistory, savePromptToHistory, toggleFavoritePrompt } from '../services/presetService';
import { VOICE_PROFILES, generateWordTimestamps, speakTextWithSync } from '../services/ttsService';
import { enhancePrompt } from '../services/geminiService';
import { getSavedAvatars } from './AvatarCreator';

interface ComposerCanvasProps {
  userSettings: UserSettings | null;
  onGenerate: (params: GenerateVideoParams) => void;
  latestPost?: FeedPost | null;
  onSendToEditor: (post: FeedPost) => void;
  onOpenAvatarStudio: () => void;
}

const ComposerCanvas: React.FC<ComposerCanvasProps> = ({
  userSettings,
  onGenerate,
  latestPost,
  onSendToEditor,
  onOpenAvatarStudio,
}) => {
  // Canvas Configuration State
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(AspectRatio.PORTRAIT);
  const [showGrid, setShowGrid] = useState(true);
  const [showSafeZones, setShowSafeZones] = useState(false);
  const [resolution, setResolution] = useState<Resolution>(Resolution.P720);

  // Generation Prompt & Settings
  const [prompt, setPrompt] = useState('Cinematic fashion model walking through neon-lit futuristic Tokyo at night with rainy reflections and volumetric glow');
  const [selectedModel, setSelectedModel] = useState<string>(userSettings?.customVideoModel || VeoModel.VEO_FAST);
  const [isEnhancingPrompt, setIsEnhancingPrompt] = useState(false);

  // Persona / Reference Frame
  const [avatars, setAvatars] = useState<AvatarPersona[]>(getSavedAvatars);
  const [selectedAvatarId, setSelectedAvatarId] = useState<string | null>(userSettings?.activeAvatarId || avatars[0]?.id || null);
  const [referenceImages, setReferenceImages] = useState<ImageFile[]>([]);
  const refFileInputRef = useRef<HTMLInputElement>(null);

  // Studio Composer Tabs
  const [activeTab, setActiveTab] = useState<'prompt' | 'presets' | 'voice' | 'captions' | 'history'>('prompt');

  // Voice Narration & TTS Studio State
  const [scriptNarration, setScriptNarration] = useState('Welcome to the next generation of AI video reels. Watch as real-time intelligence brings visual stories to life.');
  const [selectedVoice, setSelectedVoice] = useState(VOICE_PROFILES[0].id);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentSpokenWord, setCurrentSpokenWord] = useState('');
  const [speechProgress, setSpeechProgress] = useState(0);

  // Auto-Captions State
  const [enableCaptions, setEnableCaptions] = useState(true);
  const [captionWords, setCaptionWords] = useState<CaptionWord[]>([]);
  const [captionStyle, setCaptionStyle] = useState<CaptionStyle>({
    font: 'impact',
    color: '#ffffff',
    highlightColor: '#facc15',
    bgBox: true,
    animation: 'karaoke',
    position: 'bottom',
    size: 24,
  });

  const videoRef = useRef<HTMLVideoElement>(null);

  // Prompt History
  const [promptHistoryList, setPromptHistoryList] = useState(getPromptHistory);

  const selectedAvatar = avatars.find(a => a.id === selectedAvatarId);

  // Update caption words when script narration changes
  useEffect(() => {
    if (scriptNarration) {
      setCaptionWords(generateWordTimestamps(scriptNarration, 6.0));
    }
  }, [scriptNarration]);

  // Load avatars from storage
  useEffect(() => {
    setAvatars(getSavedAvatars());
  }, []);

  const handleEnhance = async () => {
    if (!prompt.trim()) return;
    setIsEnhancingPrompt(true);
    try {
      const enhanced = await enhancePrompt(prompt);
      setPrompt(enhanced);
    } catch (e) {
      console.error("Enhance failed", e);
    } finally {
      setIsEnhancingPrompt(false);
    }
  };

  const handleApplyPreset = (presetSuffix: string) => {
    setPrompt(prev => {
      const cleaned = prev.trim();
      return cleaned ? `${cleaned}${presetSuffix}` : presetSuffix.replace(/^,\s*/, '');
    });
  };

  const handleRefFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          const base64 = reader.result.split(',')[1];
          setReferenceImages(prev => [...prev, { file, base64 }].slice(0, 3));
        }
      };
      reader.readAsDataURL(file);
    }
    if (refFileInputRef.current) refFileInputRef.current.value = '';
  };

  const handleDeleteRefImage = (index: number) => {
    setReferenceImages(prev => prev.filter((_, idx) => idx !== index));
  };

  const handlePlayVoiceNarration = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    setIsSpeaking(true);
    const profile = VOICE_PROFILES.find(p => p.id === selectedVoice) || VOICE_PROFILES[0];
    
    speakTextWithSync(scriptNarration, {
      voiceName: profile.browserVoiceMatch?.[0],
      pitch: selectedAvatar?.voiceSettings?.pitch || 1.0,
      rate: selectedAvatar?.voiceSettings?.rate || 1.05
    }, {
      onStart: () => setIsSpeaking(true),
      onWord: (word, _, progress) => {
        setCurrentSpokenWord(word);
        setSpeechProgress(progress);
      },
      onEnd: () => {
        setIsSpeaking(false);
        setCurrentSpokenWord('');
        setSpeechProgress(0);
      },
      onError: () => {
        setIsSpeaking(false);
      }
    });
  };

  const handleTriggerGenerate = () => {
    if (!prompt.trim()) return;

    // Save prompt to history
    const updatedHistory = savePromptToHistory(
      prompt,
      selectedModel,
      aspectRatio,
      selectedAvatar?.name
    );
    setPromptHistoryList(updatedHistory);

    // Build Generation Params
    const startFrame = referenceImages[0] || (selectedAvatar ? {
      file: new File([], 'avatar.png'),
      base64: selectedAvatar.avatarBase64.replace(/^data:image\/[a-z]+;base64,/, '')
    } : null);

    onGenerate({
      prompt: prompt.trim(),
      model: selectedModel,
      aspectRatio,
      resolution,
      mode: startFrame ? GenerationMode.FRAMES_TO_VIDEO : GenerationMode.TEXT_TO_VIDEO,
      startFrame: startFrame,
      referenceImages: referenceImages,
    });
  };

  const getFontFamilyClass = (font: CaptionStyle['font']) => {
    switch (font) {
      case 'impact': return 'font-black uppercase tracking-wider font-sans';
      case 'bebas': return 'font-extrabold uppercase tracking-widest font-mono';
      case 'serif': return 'font-serif italic font-bold';
      case 'mono': return 'font-mono uppercase font-bold';
      default: return 'font-sans font-bold';
    }
  };

  return (
    <div className="w-full max-w-[1400px] mx-auto p-4 sm:p-6 pb-36 text-white">
      
      {/* Studio Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bogle font-bold text-white tracking-wide">
              Studio Composer & Canvas
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Live Generation Stage
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Real-time interactive canvas with avatar casting, auto-karaoke captions, and voice synthesis.
          </p>
        </div>

        {/* Quick Canvas Aspect Ratio Controls */}
        <div className="flex items-center gap-2 bg-white/5 p-1 rounded-2xl border border-white/10">
          <button
            onClick={() => setAspectRatio(AspectRatio.PORTRAIT)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              aspectRatio === AspectRatio.PORTRAIT 
                ? 'bg-amber-400 text-black shadow-md' 
                : 'text-white/60 hover:text-white'
            }`}
          >
            9:16 Reel
          </button>
          <button
            onClick={() => setAspectRatio(AspectRatio.LANDSCAPE)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              aspectRatio === AspectRatio.LANDSCAPE 
                ? 'bg-amber-400 text-black shadow-md' 
                : 'text-white/60 hover:text-white'
            }`}
          >
            16:9 Cinema
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT / CENTER: THE DEDICATED CANVAS STAGE */}
        <div className="lg:col-span-7 flex flex-col items-center">
          
          {/* Canvas Viewport Frame */}
          <div className="w-full flex flex-col items-center bg-black/60 border border-white/15 rounded-3xl p-4 sm:p-6 shadow-2xl relative">
            
            {/* Canvas Toolbar Top */}
            <div className="w-full flex items-center justify-between mb-3 px-2 text-xs text-white/50">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setShowGrid(!showGrid)} 
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border transition-colors ${
                    showGrid ? 'bg-white/15 border-white/30 text-white' : 'border-white/10 text-white/40'
                  }`}
                  title="Toggle Composition Grid"
                >
                  <Grid className="w-3.5 h-3.5" />
                  <span>Grid</span>
                </button>
                <button 
                  onClick={() => setShowSafeZones(!showSafeZones)} 
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border transition-colors ${
                    showSafeZones ? 'bg-white/15 border-white/30 text-white' : 'border-white/10 text-white/40'
                  }`}
                  title="Toggle Social UI Safe Zones"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Safe Zones</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] bg-white/5 px-2 py-0.5 rounded border border-white/10">
                  {aspectRatio}
                </span>
                <button
                  onClick={() => setResolution(resolution === Resolution.P720 ? Resolution.P1080 : Resolution.P720)}
                  className="font-mono text-[11px] bg-white/5 hover:bg-white/15 px-2 py-0.5 rounded border border-white/10 text-amber-300"
                  title="Toggle Resolution"
                >
                  {resolution}
                </button>
              </div>
            </div>

            {/* Interactive Canvas Element */}
            <div 
              className={`relative overflow-hidden rounded-2xl bg-gradient-to-b from-neutral-900 to-black border border-white/20 shadow-2xl transition-all ${
                aspectRatio === AspectRatio.PORTRAIT 
                  ? 'w-[320px] sm:w-[360px] h-[570px] sm:h-[640px]' 
                  : 'w-full max-w-[620px] h-[350px] sm:h-[390px]'
              }`}
            >
              
              {/* Composition Grid Overlay */}
              {showGrid && (
                <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 z-10 opacity-25">
                  <div className="border-r border-b border-white/40"></div>
                  <div className="border-r border-b border-white/40"></div>
                  <div className="border-b border-white/40"></div>
                  <div className="border-r border-b border-white/40"></div>
                  <div className="border-r border-b border-white/40"></div>
                  <div className="border-b border-white/40"></div>
                  <div className="border-r border-b border-white/40"></div>
                  <div className="border-r border-b border-white/40"></div>
                  <div></div>
                </div>
              )}

              {/* Safe Zones Overlay (TikTok/Reels UI bounds) */}
              {showSafeZones && aspectRatio === AspectRatio.PORTRAIT && (
                <div className="absolute inset-0 pointer-events-none z-15 p-4 flex flex-col justify-between border-2 border-dashed border-red-400/30">
                  <div className="text-[9px] text-red-300 font-mono">TOP UI ZONE (80px)</div>
                  <div className="text-[9px] text-red-300 font-mono text-right">RIGHT ACTION BUTTONS (60px)</div>
                  <div className="text-[9px] text-red-300 font-mono">BOTTOM CAPTIONS & AUDIO BAR (120px)</div>
                </div>
              )}

              {/* Video Player or Live Preview Placeholder */}
              {latestPost?.videoUrl ? (
                <video
                  ref={videoRef}
                  src={latestPost.videoUrl}
                  className="w-full h-full object-cover"
                  loop
                  autoPlay
                  playsInline
                  muted
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-radial from-neutral-900 to-black">
                  {selectedAvatar ? (
                    <div className="relative mb-4 group">
                      <div className={`w-28 h-28 rounded-full overflow-hidden border-2 ${
                        isSpeaking ? 'border-amber-400 ring-4 ring-amber-400/40 animate-pulse' : 'border-indigo-400/60'
                      } shadow-2xl`}>
                        <img src={selectedAvatar.avatarBase64} alt={selectedAvatar.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-black/80 text-[10px] font-bold text-amber-300 border border-amber-400/40 whitespace-nowrap">
                        {selectedAvatar.isRealSelf ? 'Real Twin' : 'AI Host'}
                      </div>
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/30 mb-4">
                      <Clapperboard className="w-8 h-8" />
                    </div>
                  )}

                  <h3 className="text-sm font-bold text-white mb-1">Live Composer Stage</h3>
                  <p className="text-xs text-gray-400 max-w-[240px] line-clamp-2">
                    {prompt || 'Enter your scene prompt on the right to start generating.'}
                  </p>
                </div>
              )}

              {/* LIVE AUTO-CAPTIONS OVERLAY */}
              {enableCaptions && (
                <div className={`absolute left-4 right-4 z-20 pointer-events-none flex flex-col items-center ${
                  captionStyle.position === 'top' ? 'top-12' : captionStyle.position === 'center' ? 'top-1/2 -translate-y-1/2' : 'bottom-16'
                }`}>
                  <div className={`px-4 py-2 rounded-xl text-center max-w-[90%] ${
                    captionStyle.bgBox ? 'bg-black/75 backdrop-blur-md border border-white/10 shadow-2xl' : ''
                  }`}>
                    <p className={`text-base sm:text-lg leading-snug tracking-wide ${getFontFamilyClass(captionStyle.font)}`} style={{ color: captionStyle.color }}>
                      {captionWords.map((cw, idx) => {
                        const isCurrent = currentSpokenWord.toLowerCase().includes(cw.word.toLowerCase()) || (speechProgress > 0 && idx === Math.floor(speechProgress * captionWords.length));
                        return (
                          <span 
                            key={idx} 
                            className={`inline-block mr-1.5 transition-all duration-150 ${
                              isCurrent ? 'scale-110' : 'opacity-90'
                            }`}
                            style={{
                              color: isCurrent ? captionStyle.highlightColor : captionStyle.color,
                              textShadow: isCurrent ? `0 0 12px ${captionStyle.highlightColor}` : '0 2px 4px rgba(0,0,0,0.8)'
                            }}
                          >
                            {cw.word}
                          </span>
                        );
                      })}
                    </p>
                  </div>
                </div>
              )}

              {/* Cast Persona Pin Badge (Top Left of Canvas) */}
              {selectedAvatar && (
                <div className="absolute top-3 left-3 z-20 flex items-center gap-2 bg-black/70 backdrop-blur-md px-2.5 py-1.5 rounded-full border border-white/20 shadow-lg">
                  <div className="w-6 h-6 rounded-full overflow-hidden border border-amber-400">
                    <img src={selectedAvatar.avatarBase64} alt={selectedAvatar.name} className="w-full h-full object-cover" />
                  </div>
                  <span className="text-[11px] font-bold text-white truncate max-w-[100px]">
                    {selectedAvatar.name}
                  </span>
                </div>
              )}

            </div>

            {/* Canvas Playback & Action Controls */}
            <div className="w-full max-w-[400px] mt-4 flex items-center justify-between gap-3">
              <button
                onClick={handlePlayVoiceNarration}
                className={`flex-1 py-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  isSpeaking 
                    ? 'bg-amber-400 text-black border-amber-400 animate-pulse' 
                    : 'bg-white/5 hover:bg-white/10 border-white/10 text-white'
                }`}
              >
                <Volume2 className="w-4 h-4 text-purple-400" />
                <span>{isSpeaking ? 'Speaking Script...' : 'Test Voice Audio'}</span>
              </button>

              {latestPost && (
                <button
                  onClick={() => onSendToEditor(latestPost)}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg transition-all"
                  title="Send generated clip to Multi-Scene Storyboard"
                >
                  <Film className="w-4 h-4" />
                  <span>To Storyboard</span>
                </button>
              )}
            </div>

          </div>

        </div>

        {/* RIGHT: COMPOSER CONTROLS & TABS */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* Sub Navigation Tabs */}
          <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-2xl border border-white/10 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab('prompt')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeTab === 'prompt' ? 'bg-amber-400 text-black shadow-md' : 'text-white/60 hover:text-white'
              }`}
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>Prompt</span>
            </button>
            <button
              onClick={() => setActiveTab('presets')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeTab === 'presets' ? 'bg-amber-400 text-black shadow-md' : 'text-white/60 hover:text-white'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Camera & Styles</span>
            </button>
            <button
              onClick={() => setActiveTab('voice')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeTab === 'voice' ? 'bg-amber-400 text-black shadow-md' : 'text-white/60 hover:text-white'
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Voice TTS</span>
            </button>
            <button
              onClick={() => setActiveTab('captions')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeTab === 'captions' ? 'bg-amber-400 text-black shadow-md' : 'text-white/60 hover:text-white'
              }`}
            >
              <Type className="w-3.5 h-3.5" />
              <span>Captions</span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeTab === 'history' ? 'bg-amber-400 text-black shadow-md' : 'text-white/60 hover:text-white'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>History</span>
            </button>
          </div>

          {/* TAB 1: PROMPT & GENERATION PARAMS */}
          {activeTab === 'prompt' && (
            <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> Scene Prompt
                </label>
                <button
                  type="button"
                  onClick={handleEnhance}
                  disabled={isEnhancingPrompt || !prompt}
                  className="text-[11px] text-amber-300 hover:text-amber-200 flex items-center gap-1 disabled:opacity-40"
                >
                  <Wand2 className={`w-3 h-3 ${isEnhancingPrompt ? 'animate-spin' : ''}`} />
                  <span>{isEnhancingPrompt ? 'Enhancing...' : 'AI Enhance'}</span>
                </button>
              </div>

              <textarea
                rows={4}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe your scene in cinematic detail..."
                className="w-full bg-black/60 border border-white/15 rounded-2xl p-4 text-white text-sm focus:border-amber-400 outline-none resize-none leading-relaxed"
              />

              {/* Model Picker */}
              <div>
                <label className="text-xs text-gray-400 block mb-1.5">Video Model Engine</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: VeoModel.VEO_FAST, name: 'Veo 3.1 Fast', badge: 'Ultra Fast' },
                    { id: VeoModel.VEO, name: 'Veo 3.1 Quality', badge: '1080p Cine' },
                    ...(userSettings?.customVideoModel ? [{ id: userSettings.customVideoModel, name: userSettings.customVideoModel, badge: 'Custom' }] : [])
                  ].map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSelectedModel(m.id)}
                      className={`p-2 rounded-xl border text-left transition-all ${
                        selectedModel === m.id
                          ? 'bg-amber-400/20 border-amber-400 text-amber-200'
                          : 'bg-white/[0.02] border-white/10 hover:bg-white/[0.05] text-white/70'
                      }`}
                    >
                      <div className="text-xs font-bold text-white truncate">{m.name}</div>
                      <div className="text-[10px] text-amber-400">{m.badge}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Cast Persona Selector */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs text-gray-400">Cast Avatar Reference</label>
                  <button 
                    onClick={onOpenAvatarStudio}
                    className="text-[11px] text-indigo-400 hover:underline"
                  >
                    + Manage Personas
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {avatars.map(avatar => (
                    <button
                      key={avatar.id}
                      type="button"
                      onClick={() => setSelectedAvatarId(avatar.id === selectedAvatarId ? null : avatar.id)}
                      className={`p-1.5 rounded-xl border text-center transition-all flex flex-col items-center ${
                        selectedAvatarId === avatar.id
                          ? 'bg-amber-400/20 border-amber-400 ring-1 ring-amber-400'
                          : 'bg-white/[0.02] border-white/10 hover:bg-white/[0.05]'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full overflow-hidden mb-1 border border-white/20">
                        <img src={avatar.avatarBase64} alt={avatar.name} className="w-full h-full object-cover" />
                      </div>
                      <span className="text-[10px] font-bold text-white truncate max-w-full">{avatar.name.split(' ')[0]}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Reference Images Upload */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs text-gray-400">Reference Image Frames</label>
                  <span className="text-[10px] text-white/40">{referenceImages.length}/3</span>
                </div>
                <div className="flex items-center gap-2">
                  {referenceImages.map((img, idx) => (
                    <div key={idx} className="relative w-14 h-14 rounded-xl overflow-hidden border border-white/20 group">
                      <img src={`data:image/png;base64,${img.base64}`} alt="Ref" className="w-full h-full object-cover" />
                      <button
                        onClick={() => handleDeleteRefImage(idx)}
                        className="absolute inset-0 bg-red-900/80 opacity-0 group-hover:opacity-100 flex items-center justify-center text-red-200 transition-opacity"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {referenceImages.length < 3 && (
                    <button
                      onClick={() => refFileInputRef.current?.click()}
                      className="w-14 h-14 rounded-xl border border-dashed border-white/20 hover:border-amber-400 hover:bg-amber-400/5 flex flex-col items-center justify-center text-white/40 hover:text-amber-300 transition-all"
                    >
                      <Plus className="w-4 h-4" />
                      <span className="text-[8px] font-bold">Add</span>
                    </button>
                  )}
                  <input type="file" ref={refFileInputRef} accept="image/*" className="hidden" onChange={handleRefFileUpload} />
                </div>
              </div>

              {/* Generate CTA Button */}
              <button
                type="button"
                onClick={handleTriggerGenerate}
                disabled={!prompt.trim()}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500 text-black font-extrabold text-sm hover:brightness-110 transition-all shadow-xl shadow-amber-400/20 flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Render Reel on Canvas</span>
              </button>
            </div>
          )}

          {/* TAB 2: CAMERA PRESETS & STYLES */}
          {activeTab === 'presets' && (
            <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-5 space-y-5">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2 flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5" /> Camera Movements
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {CAMERA_PRESETS.map(p => (
                    <button
                      key={p.id}
                      onClick={() => handleApplyPreset(p.promptSuffix)}
                      className="p-2.5 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.06] hover:border-amber-400/50 text-left transition-all group"
                    >
                      <div className="text-xs font-bold text-white group-hover:text-amber-300">{p.label}</div>
                      <div className="text-[10px] text-gray-400 mt-0.5 line-clamp-1">{p.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-purple-400 mb-2 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5" /> Visual Film Styles
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {STYLE_PRESETS.map(s => (
                    <button
                      key={s.id}
                      onClick={() => handleApplyPreset(s.promptSuffix)}
                      className="p-2.5 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.06] hover:border-purple-400/50 text-left transition-all group"
                    >
                      <div className="text-xs font-bold text-white group-hover:text-purple-300">{s.label}</div>
                      <div className="text-[10px] text-gray-400 mt-0.5 line-clamp-1">{s.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-orange-400 mb-2 flex items-center gap-1.5">
                  <Sun className="w-3.5 h-3.5" /> Lighting Setups
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {LIGHTING_PRESETS.map(l => (
                    <button
                      key={l.id}
                      onClick={() => handleApplyPreset(l.promptSuffix)}
                      className="p-2.5 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.06] hover:border-orange-400/50 text-left transition-all group"
                    >
                      <div className="text-xs font-bold text-white group-hover:text-orange-300">{l.label}</div>
                      <div className="text-[10px] text-gray-400 mt-0.5 line-clamp-1">{l.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: VOICE & NARRATION TTS STUDIO */}
          {activeTab === 'voice' && (
            <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                  <Mic className="w-3.5 h-3.5" /> Script Narration
                </label>
                <span className="text-[10px] text-white/40">Syncs to canvas captions</span>
              </div>

              <textarea
                rows={3}
                value={scriptNarration}
                onChange={(e) => setScriptNarration(e.target.value)}
                placeholder="Type the narration your avatar will speak..."
                className="w-full bg-black/60 border border-white/15 rounded-2xl p-3.5 text-white text-xs focus:border-purple-400 outline-none resize-none leading-relaxed"
              />

              <div>
                <label className="text-xs text-gray-400 block mb-2">Narrator Voice Profile</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {VOICE_PROFILES.map(vp => (
                    <button
                      key={vp.id}
                      onClick={() => setSelectedVoice(vp.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        selectedVoice === vp.id
                          ? 'bg-purple-500/20 border-purple-400 text-purple-200'
                          : 'bg-white/[0.02] border-white/10 hover:bg-white/[0.05] text-white/70'
                      }`}
                    >
                      <div className="text-xs font-bold text-white">{vp.name}</div>
                      <div className="text-[10px] text-gray-400">{vp.accent}</div>
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={handlePlayVoiceNarration}
                className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg"
              >
                <Volume2 className="w-4 h-4" />
                <span>{isSpeaking ? 'Stop Audio' : 'Preview Voice Narration'}</span>
              </button>
            </div>
          )}

          {/* TAB 4: AUTO-CAPTIONS & SUBTITLES */}
          {activeTab === 'captions' && (
            <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-yellow-400 flex items-center gap-1.5">
                  <Type className="w-3.5 h-3.5" /> Word-by-Word Karaoke Captions
                </label>
                <input
                  type="checkbox"
                  checked={enableCaptions}
                  onChange={(e) => setEnableCaptions(e.target.checked)}
                  className="accent-yellow-400 w-4 h-4"
                />
              </div>

              {/* Font Family */}
              <div>
                <label className="text-xs text-gray-400 block mb-1.5">Typography Style</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['impact', 'sans', 'bebas', 'serif', 'mono'] as const).map(font => (
                    <button
                      key={font}
                      onClick={() => setCaptionStyle(prev => ({ ...prev, font }))}
                      className={`py-2 rounded-xl border text-xs font-bold uppercase transition-all ${
                        captionStyle.font === font
                          ? 'bg-yellow-400 text-black border-yellow-400 shadow-md'
                          : 'bg-white/[0.02] border-white/10 hover:bg-white/[0.05] text-white/70'
                      }`}
                    >
                      {font}
                    </button>
                  ))}
                </div>
              </div>

              {/* Position */}
              <div>
                <label className="text-xs text-gray-400 block mb-1.5">Canvas Position</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['bottom', 'center', 'top'] as const).map(pos => (
                    <button
                      key={pos}
                      onClick={() => setCaptionStyle(prev => ({ ...prev, position: pos }))}
                      className={`py-1.5 rounded-xl border text-xs capitalize transition-all ${
                        captionStyle.position === pos
                          ? 'bg-white text-black font-bold'
                          : 'bg-white/5 border-white/10 text-white/60'
                      }`}
                    >
                      {pos}
                    </button>
                  ))}
                </div>
              </div>

              {/* Colors */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Highlight Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={captionStyle.highlightColor}
                      onChange={(e) => setCaptionStyle(prev => ({ ...prev, highlightColor: e.target.value }))}
                      className="w-8 h-8 rounded border-none bg-transparent cursor-pointer"
                    />
                    <span className="text-xs font-mono text-white/70">{captionStyle.highlightColor}</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Background Glass Box</label>
                  <button
                    onClick={() => setCaptionStyle(prev => ({ ...prev, bgBox: !prev.bgBox }))}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                      captionStyle.bgBox ? 'bg-white/20 border-white/40 text-white' : 'border-white/10 text-white/40'
                    }`}
                  >
                    {captionStyle.bgBox ? 'Enabled' : 'Disabled'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: PROMPT HISTORY */}
          {activeTab === 'history' && (
            <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-5 space-y-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-white/50 flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5" /> Prompt History & Favorites
                </h3>
                <span className="text-[10px] text-white/40">{promptHistoryList.length} saved</span>
              </div>

              <div className="space-y-2 max-h-[350px] overflow-y-auto no-scrollbar">
                {promptHistoryList.map(item => (
                  <div
                    key={item.id}
                    className="p-3 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] transition-all flex flex-col justify-between gap-2"
                  >
                    <p className="text-xs text-white leading-relaxed line-clamp-2">{item.prompt}</p>
                    <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[10px] text-white/40">
                      <span>{new Date(item.timestamp).toLocaleDateString()}</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            const updated = toggleFavoritePrompt(item.id);
                            setPromptHistoryList(updated);
                          }}
                          className={`p-1 rounded hover:text-amber-400 ${item.isFavorite ? 'text-amber-400' : 'text-white/30'}`}
                          title="Favorite prompt"
                        >
                          <Star className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setPrompt(item.prompt)}
                          className="px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 font-bold hover:bg-amber-400/30"
                        >
                          Load Prompt
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};

export default ComposerCanvas;
