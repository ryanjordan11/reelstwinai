/**
 * @license
 * SPDX-License-Identifier: MIT
 * 
 * AI Video Creation Studio Composer
 * Standalone page featuring a centered compact composer that transforms into
 * a streaming AI generation conversation with live video render cards.
 */
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  ArrowUp, 
  User, 
  RectangleVertical, 
  RectangleHorizontal, 
  Mic, 
  MicOff, 
  Wand2, 
  ChevronDown, 
  Cpu, 
  SlidersHorizontal,
  Check,
  Plus,
  X,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Download,
  Copy,
  Scissors,
  AlertCircle
} from 'lucide-react';
import { 
  AspectRatio, 
  CameoProfile, 
  FeedPost,
  GenerateVideoParams, 
  GenerationMode, 
  ImageFile, 
  PostStatus,
  Preset, 
  Resolution, 
  UserSettings, 
  VeoModel, 
  AvatarPersona
} from '../types';
import { transcribeAudio, enhanceVideoPrompt } from '../services/geminiService';
import { getSavedAvatars } from './AvatarCreator';
import { VIDEO_MODELS } from './BottomPromptBar';

const PRESETS: Preset[] = [
  { id: 'cinematic', label: 'Cinematic', promptSuffix: ', cinematic lighting, 4k, anamorphic lens, shallow depth of field, high budget movie style' },
  { id: 'cyberpunk', label: 'Cyberpunk', promptSuffix: ', neon lights, futuristic city, rainy night, cyberpunk aesthetics, pink and blue hues' },
  { id: 'vintage', label: 'Vintage 90s', promptSuffix: ', vhs aesthetic, 90s camcorder style, slight grain, nostalgic feel' },
  { id: 'nature', label: 'Nat Geo', promptSuffix: ', national geographic style, ultra realistic, detailed textures, 8k, wildlife photography' },
  { id: 'anime', label: 'Anime', promptSuffix: ', anime style, studio ghibli inspired, vibrant colors, detailed background' },
  { id: 'claymation', label: 'Claymation', promptSuffix: ', stop motion claymation style, aardman animation style, detailed clay texture, soft lighting' },
  { id: '3d-render', label: '3D Render', promptSuffix: ', 3d octane render, unreal engine 5, raytracing, hyper realistic, crisp details' },
  { id: 'noir', label: 'Film Noir', promptSuffix: ', black and white film noir, high contrast, dramatic shadows, rain, mystery atmosphere' },
];

const examplePrompts = [
  "Walking the red carpet at a movie premiere...",
  "Vibecoding on a snowy mountain top at sunrise...",
  "Piloting a retro spaceship through a neon nebula...",
  "Sipping espresso in a rainy Tokyo cyber-cafe...",
  "Surfing a glowing bioluminescent wave at midnight...",
  "A tiny origami dragon soaring through cherry blossoms...",
];

const defaultCameoProfiles: CameoProfile[] = [
  { id: '1', name: 'asr', imageUrl: 'https://api.dicebear.com/7.x/avataaars/png?seed=asr&backgroundColor=transparent' },
  { id: '2', name: 'skirano', imageUrl: 'https://api.dicebear.com/7.x/avataaars/png?seed=skirano&backgroundColor=transparent' },
  { id: '3', name: 'lc-99', imageUrl: 'https://api.dicebear.com/7.x/avataaars/png?seed=lc99&backgroundColor=transparent' },
  { id: '4', name: 'sama', imageUrl: 'https://api.dicebear.com/7.x/avataaars/png?seed=sama&backgroundColor=transparent' },
  { id: '5', name: 'justinem', imageUrl: 'https://api.dicebear.com/7.x/avataaars/png?seed=justinem&backgroundColor=transparent' },
];

const urlToImageFile = async (url: string): Promise<ImageFile> => {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const base64 = reader.result.split(',')[1];
        const file = new File([blob], 'cameo.png', { type: blob.type });
        resolve({ file, base64 });
      } else {
        reject(new Error("Failed to read image data as string"));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

interface ComposerPageProps {
  userSettings: UserSettings | null;
  onGenerate: (params: GenerateVideoParams) => void;
  forcedPrompt?: string;
  onOpenAvatarStudio: () => void;
  onOpenFeed: () => void;
  posts?: FeedPost[];
  onOpenEditor?: () => void;
}

export const ComposerPage: React.FC<ComposerPageProps> = ({
  userSettings,
  onGenerate,
  forcedPrompt,
  onOpenAvatarStudio,
  onOpenFeed,
  posts = [],
  onOpenEditor,
}) => {
  const [prompt, setPrompt] = useState(forcedPrompt || '');
  const [promptIndex, setPromptIndex] = useState(0);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(AspectRatio.PORTRAIT);
  const [selectedModelId, setSelectedModelId] = useState<string>(
    userSettings?.customVideoModel || VeoModel.VEO_FAST
  );
  const [customModelInput, setCustomModelInput] = useState('');
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const [isEnhancingPrompt, setIsEnhancingPrompt] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Cameo/Avatar profile selection
  const [profiles, setProfiles] = useState<CameoProfile[]>(defaultCameoProfiles);
  const [selectedCameoId, setSelectedCameoId] = useState<string | null>(null);
  const [profileImages, setProfileImages] = useState<{ [key: string]: ImageFile }>({});

  // Stream items generated during this session
  const [sessionPostIds, setSessionPostIds] = useState<string[]>([]);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamEndRef = useRef<HTMLDivElement>(null);

  // Rotating placeholder cycle
  useEffect(() => {
    const interval = setInterval(() => {
      setPromptIndex((prev) => (prev + 1) % examplePrompts.length);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  // Sync forced prompt when passed
  useEffect(() => {
    if (forcedPrompt) {
      setPrompt(forcedPrompt);
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }
  }, [forcedPrompt]);

  // Load custom avatars
  useEffect(() => {
    try {
      const savedAvatars: AvatarPersona[] = getSavedAvatars();
      if (savedAvatars && savedAvatars.length > 0) {
        const userProfiles: CameoProfile[] = savedAvatars.map(av => ({
          id: `user-${av.id}`,
          name: av.name,
          imageUrl: av.avatarBase64,
          personaId: av.id
        }));
        setProfiles([...userProfiles, ...defaultCameoProfiles]);

        const initialProfileImages: { [key: string]: ImageFile } = {};
        savedAvatars.forEach(av => {
          if (av.avatarBase64 && av.avatarBase64.startsWith('data:')) {
            try {
              const mimeType = av.avatarBase64.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,.*/)?.[1] || 'image/png';
              const base64Data = av.avatarBase64.split(',')[1];
              const byteCharacters = atob(base64Data);
              const byteNumbers = new Array(byteCharacters.length);
              for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
              }
              const byteArray = new Uint8Array(byteNumbers);
              const blob = new Blob([byteArray], { type: mimeType });
              const file = new File([blob], `${av.name.toLowerCase()}.png`, { type: mimeType });

              initialProfileImages[`user-${av.id}`] = {
                file,
                base64: base64Data
              };
            } catch (decErr) {
              console.warn("Could not decode avatar base64 data for avatar:", av.name, decErr);
            }
          }
        });
        setProfileImages(prev => ({ ...prev, ...initialProfileImages }));

        if (userSettings?.activeAvatarId) {
          const targetProfileId = `user-${userSettings.activeAvatarId}`;
          setSelectedCameoId(targetProfileId);
        }
      }
    } catch (err) {
      console.warn("Failed to load saved avatars in ComposerPage:", err);
    }
  }, [userSettings?.activeAvatarId]);

  // Pre-fetch cameo profile image files
  useEffect(() => {
    defaultCameoProfiles.forEach(async (profile) => {
      if (!profileImages[profile.id]) {
        try {
          const imageFile = await urlToImageFile(profile.imageUrl);
          setProfileImages(prev => ({ ...prev, [profile.id]: imageFile }));
        } catch (e) {
          console.error("Failed to load default cameo image", e);
        }
      }
    });
  }, []);

  // Auto-scroll stream when new items arrive
  useEffect(() => {
    if (sessionPostIds.length > 0) {
      streamEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [sessionPostIds, posts]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const base64Data = (uploadEvent.target?.result as string).split(',')[1];
        const newProfileId = `custom-${Date.now()}`;
        const newProfile: CameoProfile = {
          id: newProfileId,
          name: file.name.split('.')[0] || 'Actor',
          imageUrl: uploadEvent.target?.result as string,
        };
        setProfiles(prev => [newProfile, ...prev]);
        setProfileImages(prev => ({ ...prev, [newProfileId]: { file, base64: base64Data } }));
        setSelectedCameoId(newProfileId);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVoiceInput = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        const chunks: Blob[] = [];

        mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(chunks, { type: 'audio/webm' });
          const text = await transcribeAudio(audioBlob);
          if (text) {
            setPrompt(prev => prev ? `${prev} ${text}` : text);
          }
          stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
        setIsRecording(true);
      } catch (e) {
        console.error("Failed to access microphone", e);
      }
    }
  };

  const handleMagicEnhancePrompt = async () => {
    if (!prompt.trim() || isEnhancingPrompt) return;
    setIsEnhancingPrompt(true);
    try {
      const enhanced = await enhanceVideoPrompt(prompt);
      setPrompt(enhanced);
    } catch (err) {
      console.warn("Could not enhance prompt:", err);
    } finally {
      setIsEnhancingPrompt(false);
    }
  };

  const fillExamplePrompt = () => {
    setPrompt(examplePrompts[promptIndex]);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handlePresetSelect = (preset: Preset) => {
    setPrompt(prev => {
      const cleanPrev = prev.trim();
      return cleanPrev ? `${cleanPrev}${preset.promptSuffix}` : `${preset.label} shot${preset.promptSuffix}`;
    });
    setShowPresets(false);
  };

  const handleSubmit = async () => {
    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt) return;

    const activeModelId = customModelInput.trim() || selectedModelId;
    let mode = GenerationMode.TEXT_TO_VIDEO;
    let referenceImages: ImageFile[] | undefined = undefined;
    let startFrame: ImageFile | null = null;

    if (selectedCameoId) {
      if (profileImages[selectedCameoId]) {
        if (activeModelId === VeoModel.VEO) {
          mode = GenerationMode.REFERENCES_TO_VIDEO;
          referenceImages = [profileImages[selectedCameoId]];
        } else {
          mode = GenerationMode.FRAMES_TO_VIDEO;
          startFrame = profileImages[selectedCameoId];
        }
      } else {
        const profile = profiles.find(p => p.id === selectedCameoId);
        if (profile) {
          try {
            const imgFile = await urlToImageFile(profile.imageUrl);
            setProfileImages(prev => ({ ...prev, [profile.id]: imgFile }));
            if (activeModelId === VeoModel.VEO) {
              mode = GenerationMode.REFERENCES_TO_VIDEO;
              referenceImages = [imgFile];
            } else {
              mode = GenerationMode.FRAMES_TO_VIDEO;
              startFrame = imgFile;
            }
          } catch (e) {
            console.error("Failed to load cameo image", e);
          }
        }
      }
    }

    const params: GenerateVideoParams = {
      prompt: trimmedPrompt,
      model: activeModelId,
      customModelId: activeModelId,
      aspectRatio: aspectRatio,
      resolution: Resolution.P720,
      mode: mode,
      referenceImages: referenceImages,
      startFrame: startFrame,
    };

    // Trigger video generation
    onGenerate(params);

    // Track in session stream (the newest post will appear in posts list)
    // We register the timestamp marker to match posts generated
    setSessionPostIds(prev => [`gen-${Date.now()}`, ...prev]);
    setPrompt('');
  };

  const handleCopyPrompt = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const currentModelObj = VIDEO_MODELS.find(m => m.id === selectedModelId);
  const activeModelDisplay = customModelInput.trim() 
    ? `Custom: ${customModelInput.trim()}`
    : currentModelObj?.name.split(' ')[0] + ' ' + (currentModelObj?.name.split(' ')[1] || 'Veo');

  // Filter posts that are either user generated or active in this session
  const streamPosts = posts.filter(p => p.isUserGenerated || p.status === PostStatus.GENERATING);
  const hasStreamItems = streamPosts.length > 0;

  return (
    <div className="w-full h-full flex flex-col justify-between relative bg-black overflow-hidden select-none">
      
      {/* Background radial atmosphere */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_40%,_rgba(120,50,220,0.06),_transparent_75%)]"></div>

      {/* TOP BAR / THREAD HEADER (When stream is active) */}
      {hasStreamItems && (
        <div className="w-full px-4 sm:px-6 py-2.5 bg-neutral-900/60 border-b border-white/10 backdrop-blur-xl flex items-center justify-between z-20 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-bold text-white tracking-wide">
              Active Studio Stream ({streamPosts.length} Generation{streamPosts.length > 1 ? 's' : ''})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenFeed()}
              className="text-xs text-white/60 hover:text-white px-2.5 py-1 rounded-lg hover:bg-white/5 transition-colors"
            >
              Explore Feed
            </button>
            {onOpenEditor && (
              <button
                onClick={onOpenEditor}
                className="text-xs bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-300 px-2.5 py-1 rounded-lg transition-colors font-medium flex items-center gap-1.5"
              >
                <Scissors className="w-3 h-3" />
                <span>Open in Storyboard</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* STREAM AREA: Displays above composer when items exist, or centers composer if empty */}
      <div className={`flex-1 overflow-y-auto no-scrollbar px-4 sm:px-6 relative z-10 ${hasStreamItems ? 'py-6 space-y-6 max-w-4xl mx-auto w-full' : 'flex flex-col items-center justify-center'}`}>
        
        {/* EMPTY STATE: Centered Header & Branding */}
        {!hasStreamItems && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full flex flex-col items-center text-center mb-6 max-w-xl"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.06] border border-white/10 text-xs font-semibold text-amber-300 mb-3 shadow-inner">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>AI Video Reel Engine</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white mb-2">
              What will you create?
            </h1>
            <p className="text-xs sm:text-sm text-neutral-400 max-w-md font-light">
              Select an actor, choose your aspect ratio, and type a prompt. Your video stream will generate live above.
            </p>
          </motion.div>
        )}

        {/* ACTIVE STREAM: Chat-Style Generation Feed */}
        {hasStreamItems && (
          <div className="space-y-6 w-full pb-6">
            {streamPosts.map((post) => (
              <StreamCard 
                key={post.id} 
                post={post} 
                onRemix={(remixPrompt) => {
                  setPrompt(remixPrompt);
                  if (textareaRef.current) textareaRef.current.focus();
                }}
                onCopyPrompt={(text) => handleCopyPrompt(text, post.id)}
                isCopied={copiedId === post.id}
                onOpenEditor={onOpenEditor}
              />
            ))}
            <div ref={streamEndRef} />
          </div>
        )}

        {/* CENTERED COMPOSER (Empty state) */}
        {!hasStreamItems && (
          <div className="w-full flex justify-center">
            <ComposerCapsule
              prompt={prompt}
              setPrompt={setPrompt}
              textareaRef={textareaRef}
              fileInputRef={fileInputRef}
              promptIndex={promptIndex}
              fillExamplePrompt={fillExamplePrompt}
              handleSubmit={handleSubmit}
              aspectRatio={aspectRatio}
              setAspectRatio={setAspectRatio}
              selectedModelId={selectedModelId}
              setSelectedModelId={setSelectedModelId}
              customModelInput={customModelInput}
              setCustomModelInput={setCustomModelInput}
              showModelPicker={showModelPicker}
              setShowModelPicker={setShowModelPicker}
              showPresets={showPresets}
              setShowPresets={setShowPresets}
              handlePresetSelect={handlePresetSelect}
              isEnhancingPrompt={isEnhancingPrompt}
              handleMagicEnhancePrompt={handleMagicEnhancePrompt}
              isRecording={isRecording}
              handleVoiceInput={handleVoiceInput}
              profiles={profiles}
              selectedCameoId={selectedCameoId}
              setSelectedCameoId={setSelectedCameoId}
              handleFileUpload={handleFileUpload}
              onOpenAvatarStudio={onOpenAvatarStudio}
              activeModelDisplay={activeModelDisplay}
            />
          </div>
        )}
      </div>

      {/* DOCKED BOTTOM COMPOSER (When stream has active items) */}
      {hasStreamItems && (
        <div className="w-full p-4 sm:p-5 border-t border-white/10 bg-black/85 backdrop-blur-2xl flex justify-center z-30 shrink-0">
          <ComposerCapsule
            prompt={prompt}
            setPrompt={setPrompt}
            textareaRef={textareaRef}
            fileInputRef={fileInputRef}
            promptIndex={promptIndex}
            fillExamplePrompt={fillExamplePrompt}
            handleSubmit={handleSubmit}
            aspectRatio={aspectRatio}
            setAspectRatio={setAspectRatio}
            selectedModelId={selectedModelId}
            setSelectedModelId={setSelectedModelId}
            customModelInput={customModelInput}
            setCustomModelInput={setCustomModelInput}
            showModelPicker={showModelPicker}
            setShowModelPicker={setShowModelPicker}
            showPresets={showPresets}
            setShowPresets={setShowPresets}
            handlePresetSelect={handlePresetSelect}
            isEnhancingPrompt={isEnhancingPrompt}
            handleMagicEnhancePrompt={handleMagicEnhancePrompt}
            isRecording={isRecording}
            handleVoiceInput={handleVoiceInput}
            profiles={profiles}
            selectedCameoId={selectedCameoId}
            setSelectedCameoId={setSelectedCameoId}
            handleFileUpload={handleFileUpload}
            onOpenAvatarStudio={onOpenAvatarStudio}
            activeModelDisplay={activeModelDisplay}
          />
        </div>
      )}

    </div>
  );
};

/* =========================================================================
   COMPOSER CAPSULE: EXACT COMPACT SLEEK COMPONENT FROM USER SCREENSHOT
   ========================================================================= */
interface ComposerCapsuleProps {
  prompt: string;
  setPrompt: (p: string) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  promptIndex: number;
  fillExamplePrompt: () => void;
  handleSubmit: () => void;
  aspectRatio: AspectRatio;
  setAspectRatio: (ar: AspectRatio) => void;
  selectedModelId: string;
  setSelectedModelId: (m: string) => void;
  customModelInput: string;
  setCustomModelInput: (v: string) => void;
  showModelPicker: boolean;
  setShowModelPicker: (v: boolean) => void;
  showPresets: boolean;
  setShowPresets: (v: boolean) => void;
  handlePresetSelect: (p: Preset) => void;
  isEnhancingPrompt: boolean;
  handleMagicEnhancePrompt: () => void;
  isRecording: boolean;
  handleVoiceInput: () => void;
  profiles: CameoProfile[];
  selectedCameoId: string | null;
  setSelectedCameoId: (id: string | null) => void;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onOpenAvatarStudio: () => void;
  activeModelDisplay: string;
}

const ComposerCapsule: React.FC<ComposerCapsuleProps> = ({
  prompt,
  setPrompt,
  textareaRef,
  fileInputRef,
  promptIndex,
  fillExamplePrompt,
  handleSubmit,
  aspectRatio,
  setAspectRatio,
  selectedModelId,
  setSelectedModelId,
  customModelInput,
  setCustomModelInput,
  showModelPicker,
  setShowModelPicker,
  showPresets,
  setShowPresets,
  handlePresetSelect,
  isEnhancingPrompt,
  handleMagicEnhancePrompt,
  isRecording,
  handleVoiceInput,
  profiles,
  selectedCameoId,
  setSelectedCameoId,
  handleFileUpload,
  onOpenAvatarStudio,
  activeModelDisplay,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className={`w-full max-w-2xl bg-[#141416]/95 border border-[#27272a] backdrop-blur-2xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] relative ring-1 ring-white/5 transition-all duration-300 ${isExpanded ? 'rounded-[28px] p-3 text-white' : 'rounded-full px-3 py-2.5 text-white'}`}>
      
      {/* Expanded Cameos & Face Selector Sub-card (Screenshot 1) */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            initial={{ opacity: 0, height: 0, scale: 0.98 }}
            animate={{ opacity: 1, height: 'auto', scale: 1 }}
            exit={{ opacity: 0, height: 0, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="bg-[#0e0e10] rounded-2xl p-2.5 border border-[#222225] shadow-inner relative mb-2.5">
              
              {/* Header Row: Label + Model Selector + Aspect Ratio Controls */}
              <div className="flex items-center justify-between mb-2 px-2 text-white/70 pt-0.5">
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-white/50" />
                  <p className="text-[10px] font-bold uppercase tracking-wider font-mono text-white/60">
                    SELECT FACE & MODEL
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {/* Model Selector Dropdown */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        setShowModelPicker(!showModelPicker);
                        setShowPresets(false);
                      }}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#1a1a1d] hover:bg-[#25252a] text-white/90 hover:text-white border border-white/10 text-[11px] font-medium transition-all"
                      title="Select Video Generation Engine"
                    >
                      <Cpu className="w-3 h-3 text-amber-400" />
                      <span className="max-w-[110px] truncate">{activeModelDisplay}</span>
                      <ChevronDown className="w-3 h-3 text-white/40" />
                    </button>

                    {/* Model Picker Popover */}
                    <AnimatePresence>
                      {showModelPicker && (
                        <motion.div
                          initial={{ opacity: 0, y: 5, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 5, scale: 0.95 }}
                          className="absolute bottom-full right-0 mb-3 w-72 bg-[#18181b] border border-white/10 rounded-2xl shadow-2xl p-3 z-[70] ring-1 ring-white/10 space-y-2 text-left"
                        >
                          <div className="text-[10px] font-bold uppercase tracking-wider text-white/40 px-1">
                            Video Model Engine
                          </div>
                          <div className="space-y-1">
                            {VIDEO_MODELS.map((model) => {
                              const isSelected = selectedModelId === model.id && !customModelInput.trim();
                              return (
                                <button
                                  key={model.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedModelId(model.id);
                                    setCustomModelInput('');
                                    setShowModelPicker(false);
                                  }}
                                  className={`w-full text-left p-2 rounded-xl transition-all flex items-start justify-between ${
                                    isSelected 
                                      ? 'bg-amber-400/10 border border-amber-400/50 text-white' 
                                      : 'hover:bg-white/5 text-white/70 hover:text-white border border-transparent'
                                  }`}
                                >
                                  <div>
                                    <div className="text-xs font-bold flex items-center gap-1.5">
                                      <span>{model.name}</span>
                                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/10 text-white/60 font-mono">
                                        {model.badge}
                                      </span>
                                    </div>
                                    <p className="text-[10px] text-white/40 leading-tight mt-0.5">{model.description}</p>
                                  </div>
                                  {isSelected && <Check className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />}
                                </button>
                              );
                            })}
                          </div>

                          {/* Custom Model ID input */}
                          <div className="pt-2 border-t border-white/5">
                            <label className="block text-[10px] font-semibold text-white/60 mb-1">
                              Enter Custom Model ID
                            </label>
                            <input
                              type="text"
                              value={customModelInput}
                              onChange={(e) => setCustomModelInput(e.target.value)}
                              placeholder="e.g. veo-3.1-generate-preview"
                              className="w-full bg-black/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-amber-400/60"
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Aspect Ratio Selector */}
                  <div className="flex items-center gap-1 bg-[#1a1a1d] rounded-lg p-0.5 border border-white/10">
                    <button
                      onClick={() => setAspectRatio(AspectRatio.PORTRAIT)}
                      className={`p-1.5 rounded-md transition-all ${aspectRatio === AspectRatio.PORTRAIT ? 'bg-white/20 text-white shadow-sm border border-white/20' : 'text-white/40 hover:text-white/80 hover:bg-white/5'}`}
                      title="Reel (9:16 Portrait)"
                    >
                      <RectangleVertical className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setAspectRatio(AspectRatio.LANDSCAPE)}
                      className={`p-1.5 rounded-md transition-all ${aspectRatio === AspectRatio.LANDSCAPE ? 'bg-white/20 text-white shadow-sm border border-white/20' : 'text-white/40 hover:text-white/80 hover:bg-white/5'}`}
                      title="Cinema (16:9 Landscape)"
                    >
                      <RectangleHorizontal className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Avatar Carousel Strip */}
              <div className="flex gap-2.5 overflow-x-auto no-scrollbar items-center px-1.5 py-1">
                {/* Avatar Studio pill button */}
                <button
                  onClick={onOpenAvatarStudio}
                  type="button"
                  className="h-12 px-3.5 shrink-0 rounded-2xl bg-gradient-to-r from-[#4f46e5]/40 to-[#7c3aed]/40 border border-[#6366f1]/50 hover:border-[#818cf8] text-white flex items-center gap-2 transition-all duration-300 hover:scale-105 shadow-md"
                  title="Open Avatar Studio"
                >
                  <Wand2 className="w-4 h-4 text-[#a5b4fc] shrink-0" />
                  <span className="text-xs font-bold tracking-tight whitespace-nowrap">Avatar Studio</span>
                </button>

                {/* Upload (+) button */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-12 h-12 shrink-0 rounded-2xl border-2 border-dashed border-[#3f3f46] hover:border-white/60 bg-transparent text-white/40 hover:text-white flex items-center justify-center transition-all duration-300 group/upload hover:scale-105"
                  title="Upload photo reference"
                >
                  <Plus className="w-5 h-5 transition-transform group-hover/upload:rotate-90 duration-300" />
                  <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/png, image/jpeg, image/webp" className="hidden" />
                </button>
                
                <div className="w-px h-7 bg-[#27272a] shrink-0 rounded-full mx-0.5"></div>

                {profiles.map((profile) => {
                  const isSelected = selectedCameoId === profile.id;
                  return (
                    <button
                      key={profile.id}
                      onClick={() => setSelectedCameoId(isSelected ? null : profile.id)}
                      className={`w-12 h-12 shrink-0 rounded-2xl overflow-hidden transition-all duration-300 relative group/cameo bg-[#1c1c20] ${
                        isSelected
                          ? 'ring-2 ring-[#818cf8] ring-offset-2 ring-offset-black scale-105 opacity-100 z-10 shadow-lg shadow-indigo-500/30'
                          : 'opacity-50 hover:opacity-100 hover:scale-105 grayscale hover:grayscale-0 border border-white/5'
                      }`}
                      title={profile.name}
                    >
                      <img src={profile.imageUrl} alt={profile.name} className="w-full h-full object-cover" />
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Input Row */}
      <div className="flex items-center gap-2 px-1 py-0.5 relative">
        {/* Style Presets Button */}
        <div className="relative shrink-0">
          <button 
            onClick={() => {
              setShowPresets(!showPresets);
              setShowModelPicker(false);
            }}
            className={`w-11 h-11 flex items-center justify-center rounded-full transition-all duration-300 bg-[#222225] text-neutral-300 hover:text-white hover:bg-[#2c2c30] border border-white/5 shadow-md`}
            title="Styles & Presets"
          >
            <SlidersHorizontal className="w-5 h-5" />
          </button>

          {/* Presets Popover */}
          <AnimatePresence>
            {showPresets && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: -10, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute bottom-full left-0 mb-3 w-48 bg-[#1a1a1c] border border-white/10 rounded-2xl shadow-2xl p-2 z-[60] flex flex-col gap-1 ring-1 ring-white/10 max-h-60 overflow-y-auto no-scrollbar"
              >
                <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white/40">Presets</p>
                {PRESETS.map(preset => (
                  <button
                    key={preset.id}
                    onClick={() => handlePresetSelect(preset)}
                    className="px-3 py-2 rounded-lg hover:bg-white/10 text-left text-sm text-white/80 hover:text-white transition-colors flex items-center gap-2"
                  >
                    <Sparkles className="w-3 h-3 text-indigo-400" />
                    {preset.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* Animated Placeholder & Textarea */}
        <div className="flex-grow relative py-1 flex items-center min-w-0 px-1">
          <AnimatePresence mode="wait">
            {prompt === '' && (
              <motion.div
                key={examplePrompts[promptIndex]}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.25 }}
                className="absolute inset-y-0 left-1 flex items-center w-full pointer-events-none pr-2"
              >
                <span className="text-neutral-400 text-sm sm:text-base font-light font-sans tracking-wide truncate flex-grow">
                  {isExpanded ? examplePrompts[promptIndex] : "Describe the scene..."}
                </span>
                {isExpanded && (
                  <button
                    type="button"
                    className="ml-2 px-1.5 py-0.5 rounded border border-white/20 bg-white/5 text-[10px] font-mono text-white/50 uppercase flex items-center gap-1 pointer-events-auto cursor-pointer hover:bg-white/10 hover:text-white/70 transition-colors shrink-0"
                    onClick={fillExamplePrompt}
                  >
                    Tab
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={(e) => {
              setPrompt(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              } else if (e.key === 'Tab' && prompt === '' && isExpanded) {
                e.preventDefault();
                fillExamplePrompt();
              }
            }}
            rows={1}
            className="w-full bg-transparent text-white outline-none resize-none overflow-hidden py-1 leading-relaxed text-sm sm:text-base font-light font-sans tracking-wide relative z-10 placeholder:text-transparent"
            style={{ height: '28px' }}
          />
        </div>

        {/* Action Buttons: Magic Enhance + Voice + Expand/Collapse (+) + Submit */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Magic Enhance */}
          <button
            type="button"
            onClick={handleMagicEnhancePrompt}
            disabled={!prompt.trim() || isEnhancingPrompt}
            className={`w-11 h-11 flex items-center justify-center rounded-full transition-all duration-300 border border-white/5 ${
              isEnhancingPrompt
                ? 'bg-purple-500/20 text-purple-300 border-purple-500/50 animate-spin'
                : prompt.trim()
                ? 'bg-[#222225] text-purple-300 hover:bg-[#2c2c30] hover:scale-105 shadow-sm'
                : 'bg-[#222225] text-neutral-400 hover:text-neutral-200'
            }`}
            title="Magic AI Prompt Polish"
          >
            <Sparkles className="w-5 h-5" />
          </button>

          {/* Voice Input */}
          <button
            onClick={handleVoiceInput}
            className={`w-11 h-11 flex items-center justify-center rounded-full transition-all duration-300 border border-white/5 ${
              isRecording 
                ? 'bg-red-500/20 text-red-500 border-red-500/50 animate-pulse' 
                : 'bg-[#222225] text-neutral-400 hover:text-white hover:bg-[#2c2c30]'
            }`}
            title="Voice Input"
          >
            {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Glowing Purple Expand Toggle (+) Button from Screenshot 2 when collapsed */}
          {!isExpanded && (
            <button
              type="button"
              onClick={() => setIsExpanded(true)}
              className="w-11 h-11 flex items-center justify-center rounded-full transition-all duration-300 bg-gradient-to-tr from-[#6366f1] to-[#9333ea] ring-2 ring-white ring-offset-2 ring-offset-[#141416] text-white shadow-[0_0_20px_rgba(147,51,234,0.6)] hover:scale-105 active:scale-95"
              title="Expand Face & Model Selector"
            >
              <Plus className="w-5 h-5" />
            </button>
          )}

          {/* Clear prompt button when text exists */}
          {prompt.trim() && (
            <button
              onClick={() => setPrompt('')}
              className="w-11 h-11 flex items-center justify-center rounded-full transition-all duration-300 bg-[#222225] text-neutral-400 border border-white/5 hover:bg-[#2c2c30] hover:text-white"
              title="Clear Prompt"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          {/* Submit Arrow */}
          <button
            onClick={handleSubmit}
            disabled={!prompt.trim()}
            className={`w-11 h-11 flex items-center justify-center rounded-full transition-all duration-300 ${
              prompt.trim()
                ? 'bg-white text-black hover:scale-105 shadow-[0_0_20px_rgba(255,255,255,0.4)]'
                : 'bg-[#222225] text-neutral-500 border border-white/5 cursor-not-allowed'
            }`}
            title="Generate Video"
          >
            <ArrowUp className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

/* =========================================================================
   STREAM CARD: CHAT/STREAM ITEM DISPLAYING USER PROMPT & VIDEO GENERATION
   ========================================================================= */
interface StreamCardProps {
  post: FeedPost;
  onRemix: (prompt: string) => void;
  onCopyPrompt: (prompt: string) => void;
  isCopied: boolean;
  onOpenEditor?: () => void;
}

const StreamCard: React.FC<StreamCardProps> = ({
  post,
  onRemix,
  onCopyPrompt,
  isCopied,
  onOpenEditor,
}) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play().catch(() => {});
        setIsPlaying(true);
      }
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleDownload = () => {
    if (!post.videoUrl) return;
    const a = document.createElement('a');
    a.href = post.videoUrl;
    a.download = `reels-studio-${post.id}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const isGenerating = post.status === PostStatus.GENERATING;
  const isError = post.status === PostStatus.ERROR;
  const isSuccess = post.status === PostStatus.SUCCESS || (!post.status && post.videoUrl);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full bg-neutral-900/70 border border-white/10 rounded-3xl p-4 sm:p-5 shadow-2xl backdrop-blur-xl ring-1 ring-white/5 space-y-4"
    >
      {/* Header: User Profile, Engine Badge, and Timestamp */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-3">
          <img 
            src={post.avatarUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=creator'} 
            alt={post.username} 
            className="w-8 h-8 rounded-full border border-white/20 object-cover bg-black"
          />
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-2">
              <span>{post.username || 'You'}</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-400/15 text-amber-300 border border-amber-400/30">
                {post.modelTag || 'Veo 3.1'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {post.prompt && (
            <button
              onClick={() => onCopyPrompt(post.prompt || '')}
              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] text-white/70 hover:text-white transition-colors flex items-center gap-1.5"
              title="Copy Prompt"
            >
              {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{isCopied ? 'Copied' : 'Copy Prompt'}</span>
            </button>
          )}

          {post.prompt && (
            <button
              onClick={() => onRemix(post.prompt || '')}
              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] text-white/70 hover:text-white transition-colors flex items-center gap-1.5"
              title="Remix Prompt in Composer"
            >
              <RotateCcw className="w-3 h-3 text-indigo-400" />
              <span>Remix</span>
            </button>
          )}
        </div>
      </div>

      {/* Prompt Content */}
      <div className="bg-black/40 rounded-2xl p-3.5 border border-white/5 text-sm text-neutral-200 leading-relaxed font-light">
        <p>{post.prompt || post.description}</p>
      </div>

      {/* GENERATION STATE: Live Progress Stream */}
      {isGenerating && (
        <div className="w-full bg-black/60 border border-amber-400/30 rounded-2xl p-8 flex flex-col items-center justify-center text-center space-y-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-purple-500/5 to-amber-500/5 animate-pulse"></div>
          
          <div className="relative">
            <div className="w-14 h-14 rounded-full border-2 border-amber-400/40 border-t-amber-400 animate-spin flex items-center justify-center"></div>
            <Sparkles className="w-6 h-6 text-amber-400 absolute inset-0 m-auto animate-pulse" />
          </div>

          <div>
            <h4 className="text-base font-bold text-white mb-1">
              Synthesizing cinematic motion with Google Veo...
            </h4>
            <p className="text-xs text-neutral-400 max-w-sm">
              Rendering realistic physical lighting, camera optics, and temporal continuity.
            </p>
          </div>

          <div className="w-48 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-amber-400 via-purple-500 to-indigo-400 rounded-full animate-[pulse_1.5s_ease-in-out_infinite] w-3/4"></div>
          </div>
        </div>
      )}

      {/* ERROR STATE */}
      {isError && (
        <div className="w-full bg-red-500/10 border border-red-500/30 rounded-2xl p-5 flex items-center gap-3 text-red-200">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <div className="text-xs">
            <span className="font-bold block mb-0.5">Generation Error</span>
            <span>{post.errorMessage || 'Could not complete video generation. Please check your API settings.'}</span>
          </div>
        </div>
      )}

      {/* SUCCESS STATE: Inline Video Player with Controls */}
      {isSuccess && post.videoUrl && (
        <div className="space-y-3">
          <div className="relative w-full rounded-2xl overflow-hidden bg-black flex items-center justify-center group/player max-h-[500px]">
            <video
              ref={videoRef}
              src={post.videoUrl}
              autoPlay
              loop
              muted={isMuted}
              playsInline
              className="max-h-[500px] w-auto max-w-full rounded-2xl object-contain"
            />

            {/* Video Overlay Controls */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover/player:opacity-100 transition-opacity p-4 flex flex-col justify-between pointer-events-none">
              <div></div>
              
              <div className="flex items-center justify-between pointer-events-auto">
                <button
                  onClick={togglePlay}
                  className="p-2.5 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 transition-all hover:scale-110"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleMute}
                    className="p-2.5 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 transition-all hover:scale-110"
                  >
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>

                  <button
                    onClick={handleDownload}
                    className="p-2.5 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 transition-all hover:scale-110"
                    title="Download MP4 Video"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="text-[11px] text-white/50">
              Rendered with {post.modelTag || 'Google Veo 3.1'} • 1080p MP4
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleDownload}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white transition-all flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download MP4</span>
              </button>

              {onOpenEditor && (
                <button
                  onClick={onOpenEditor}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-xs font-bold text-white transition-all flex items-center gap-1.5 shadow-md"
                >
                  <Scissors className="w-3.5 h-3.5" />
                  <span>Add to Timeline</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </motion.div>
  );
};

export default ComposerPage;
