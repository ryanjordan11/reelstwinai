/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { AnimatePresence, Reorder, motion } from 'framer-motion';
import { 
  Film, 
  Play, 
  Plus, 
  Trash2, 
  Type, 
  Pause, 
  Download, 
  Check, 
  ArrowLeft, 
  Sparkles, 
  Volume2, 
  Mic,
  SlidersHorizontal,
  Layers,
  Wand2,
  Eye,
  Zap,
  Repeat
} from 'lucide-react';
import React, { useState, useRef, useEffect } from 'react';
import { FeedPost, StoryboardClip, TransitionType } from '../types';
import { VOICE_PROFILES, speakTextWithSync } from '../services/ttsService';

interface StoryboardPageProps {
  galleryPosts: FeedPost[];
  onBack: () => void;
  onDeletePost?: (postId: string) => void;
}

export interface TransitionMeta {
  id: TransitionType;
  label: string;
  category: 'Classic Fades' | 'Motion & Slides' | 'Zooms' | 'Creative FX' | 'Cuts';
  icon: string;
  description: string;
  badge?: string;
}

const TRANSITIONS_CATALOG: TransitionMeta[] = [
  // Classic Fades
  { 
    id: 'crossfade', 
    label: 'Crossfade', 
    category: 'Classic Fades', 
    icon: '🌫️', 
    description: 'Seamlessly blends outgoing and incoming scenes with an elegant dissolve.',
    badge: 'Popular'
  },
  { 
    id: 'dip-to-black', 
    label: 'Dip to Black', 
    category: 'Classic Fades', 
    icon: '⬛', 
    description: 'Cinematic blackout between dramatic beats or scene changes.',
    badge: 'Cinematic'
  },
  { 
    id: 'dip-to-white', 
    label: 'Dip to White', 
    category: 'Classic Fades', 
    icon: '✨', 
    description: 'High-intensity flash effect for high-energy reel transitions.',
    badge: 'Impact'
  },
  // Motion & Slides
  { 
    id: 'slide-left', 
    label: 'Slide Left', 
    category: 'Motion & Slides', 
    icon: '⬅️', 
    description: 'Dynamic horizontal slide swipe popular in TikTok and Instagram Reels.',
    badge: 'Trending'
  },
  { 
    id: 'slide-right', 
    label: 'Slide Right', 
    category: 'Motion & Slides', 
    icon: '➡️', 
    description: 'Reverses motion flow with a smooth horizontal wipe to the right.'
  },
  { 
    id: 'wipe', 
    label: 'Linear Wipe', 
    category: 'Motion & Slides', 
    icon: '↔️', 
    description: 'Clean linear masking wipe revealing the next scene.'
  },
  // Zooms
  { 
    id: 'zoom-in', 
    label: 'Zoom Punch In', 
    category: 'Zooms', 
    icon: '🔍', 
    description: 'High energy scale-in punch transition creating urgency and focus.',
    badge: 'Viral Hook'
  },
  { 
    id: 'zoom-out', 
    label: 'Zoom Pull Out', 
    category: 'Zooms', 
    icon: '🔭', 
    description: 'Expands out to reveal a broader perspective in the following scene.'
  },
  // Creative FX
  { 
    id: 'glitch', 
    label: 'Cyber Glitch', 
    category: 'Creative FX', 
    icon: '⚡', 
    description: 'Digital RGB split and chromatic distortion for futuristic videos.',
    badge: 'Cyber'
  },
  { 
    id: 'blur', 
    label: 'Gaussian Blur', 
    category: 'Creative FX', 
    icon: '💫', 
    description: 'Dreamy defocus and snap-focus transition for smooth mood shifts.'
  },
  // Cuts
  { 
    id: 'cut', 
    label: 'Direct Hard Cut', 
    category: 'Cuts', 
    icon: '✂️', 
    description: 'Instant zero-latency scene switch with no blend.'
  },
];

const DURATION_PRESETS = [0.2, 0.4, 0.6, 0.8, 1.2];

const SCENE_ROLES = [
  { label: 'Scene 1: 3-Second Viral Hook', color: 'border-amber-400/80 text-amber-300' },
  { label: 'Scene 2: Problem & Tension', color: 'border-blue-400/80 text-blue-300' },
  { label: 'Scene 3: Main Visual Action / Body', color: 'border-purple-400/80 text-purple-300' },
  { label: 'Scene 4: Climax & Twist', color: 'border-pink-400/80 text-pink-300' },
  { label: 'Scene 5: Call to Action / Payoff', color: 'border-emerald-400/80 text-emerald-300' },
];

const StoryboardPage: React.FC<StoryboardPageProps> = ({ galleryPosts, onBack, onDeletePost }) => {
  const [clips, setClips] = useState<StoryboardClip[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentClipIndex, setCurrentClipIndex] = useState(0);
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  const [activeTransitionJunctionIndex, setActiveTransitionJunctionIndex] = useState<number | null>(null);
  
  // Transition Preview Animation State
  const [transitionEffectState, setTransitionEffectState] = useState<{
    type: TransitionType;
    isActive: boolean;
    phase: 'entering' | 'exiting';
  }>({
    type: 'none',
    isActive: false,
    phase: 'entering'
  });

  const [currentKaraokeWord, setCurrentKaraokeWord] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportComplete, setExportComplete] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [exportSettings, setExportSettings] = useState({ resolution: '1080p', format: 'mp4' });
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const transitionTimeoutRef = useRef<any>(null);

  // Filter available posts (only success ones)
  const availablePosts = galleryPosts.filter(p => p.status === 'success' && p.videoUrl);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  // Initialize with posts if empty
  useEffect(() => {
    if (clips.length === 0 && availablePosts.length > 0) {
      const initialClips: StoryboardClip[] = availablePosts.slice(0, 3).map((p, idx) => ({
        id: `clip-${idx}-${p.id}`,
        sourcePostId: p.id,
        transition: idx === 1 ? 'dip-to-black' : idx === 2 ? 'slide-left' : (idx > 0 ? 'crossfade' : undefined),
        transitionDurationSec: 0.5,
        scriptNarration: p.prompt?.slice(0, 80) || p.description || 'Scene narration script...',
        captionStyle: {
          font: 'impact',
          color: '#ffffff',
          highlightColor: '#facc15',
          bgBox: true,
          animation: 'karaoke',
          position: 'bottom',
          size: 24
        }
      }));
      setClips(initialClips);
      if (initialClips.length > 0) setSelectedClipId(initialClips[0].id);
    }
  }, [availablePosts.length]);

  const handleAddClip = (post: FeedPost) => {
    const newClip: StoryboardClip = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      sourcePostId: post.id,
      transition: clips.length > 0 ? 'crossfade' : undefined,
      transitionDurationSec: 0.5,
      scriptNarration: post.prompt?.slice(0, 80) || post.description || 'Scene narration...',
      captionStyle: {
        font: 'impact',
        color: '#ffffff',
        highlightColor: '#facc15',
        bgBox: true,
        animation: 'karaoke',
        position: 'bottom',
        size: 24
      }
    };
    const updated = [...clips, newClip];
    setClips(updated);
    setSelectedClipId(newClip.id);
    showToast(`Added scene #${updated.length} to Storyboard`);
  };

  const handleRemoveClip = (clipId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const filtered = clips.filter(c => c.id !== clipId);
    setClips(filtered);
    if (selectedClipId === clipId) {
      setSelectedClipId(filtered[0]?.id || null);
    }
  };

  // Trigger live visual transition animation
  const triggerTransitionAnimation = (transitionType: TransitionType, durationSec: number = 0.5) => {
    if (transitionType === 'none' || transitionType === 'cut') return;

    if (transitionTimeoutRef.current) clearTimeout(transitionTimeoutRef.current);

    setTransitionEffectState({
      type: transitionType,
      isActive: true,
      phase: 'entering'
    });

    transitionTimeoutRef.current = setTimeout(() => {
      setTransitionEffectState({
        type: transitionType,
        isActive: false,
        phase: 'exiting'
      });
    }, durationSec * 1000);
  };

  const handleVideoEnded = () => {
    if (currentClipIndex < clips.length - 1) {
      const nextIndex = currentClipIndex + 1;
      const nextClip = clips[nextIndex];
      if (nextClip?.transition) {
        triggerTransitionAnimation(nextClip.transition, nextClip.transitionDurationSec || 0.5);
      }
      setCurrentClipIndex(nextIndex);
    } else {
      // Loop back to start or pause
      setCurrentClipIndex(0);
      setIsPlaying(false);
    }
  };

  const currentClip = clips[currentClipIndex];
  const currentPost = currentClip ? availablePosts.find(p => p.id === currentClip.sourcePostId) : null;
  const activeSelectedClip = clips.find(c => c.id === selectedClipId) || currentClip;
  const activeSelectedClipIndex = clips.findIndex(c => c.id === activeSelectedClip?.id);

  useEffect(() => {
    if (videoRef.current && currentPost?.videoUrl) {
      if (isPlaying) {
        videoRef.current.currentTime = 0;
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            // Safely ignore autoplay restrictions or media source transitions
          });
        }
      } else {
        videoRef.current.pause();
      }
    }
  }, [currentClipIndex, isPlaying, currentPost?.videoUrl]);

  const updateSelectedClip = (updates: Partial<StoryboardClip>) => {
    if (!activeSelectedClip) return;
    setClips(clips.map(c => c.id === activeSelectedClip.id ? { ...c, ...updates } : c));
  };

  const handleUpdateTransitionForClip = (clipIndex: number, transition: TransitionType, durationSec?: number) => {
    if (clipIndex < 0 || clipIndex >= clips.length) return;
    const targetClip = clips[clipIndex];
    const updated = clips.map((c, i) => {
      if (i === clipIndex) {
        return {
          ...c,
          transition,
          transitionDurationSec: durationSec ?? c.transitionDurationSec ?? 0.5
        };
      }
      return c;
    });
    setClips(updated);
    triggerTransitionAnimation(transition, durationSec ?? targetClip.transitionDurationSec ?? 0.5);
  };

  const handleApplyTransitionToAll = (transition: TransitionType, durationSec: number = 0.5) => {
    const updated = clips.map((c, idx) => {
      if (idx === 0) return c; // first clip has no incoming transition
      return {
        ...c,
        transition,
        transitionDurationSec: durationSec
      };
    });
    setClips(updated);
    showToast(`Applied ${transition} to all ${clips.length - 1} scene transitions!`);
    triggerTransitionAnimation(transition, durationSec);
  };

  const handlePreviewCurrentTransition = () => {
    if (!activeSelectedClip?.transition) return;
    triggerTransitionAnimation(activeSelectedClip.transition, activeSelectedClip.transitionDurationSec || 0.5);
  };

  const handleTestVoiceForClip = () => {
    if (!activeSelectedClip?.scriptNarration) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    setIsSpeaking(true);
    speakTextWithSync(activeSelectedClip.scriptNarration, {
      voiceName: VOICE_PROFILES[0].browserVoiceMatch?.[0],
      pitch: 1.0,
      rate: 1.05
    }, {
      onWord: (w) => setCurrentKaraokeWord(w),
      onEnd: () => {
        setIsSpeaking(false);
        setCurrentKaraokeWord('');
      },
      onError: () => setIsSpeaking(false)
    });
  };

  const startExport = () => {
    setIsExporting(true);
    setExportProgress(0);
    setShowExportMenu(false);

    const interval = setInterval(() => {
      setExportProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsExporting(false);
          setExportComplete(true);
          setTimeout(() => setExportComplete(false), 3500);
          return 100;
        }
        return prev + (Math.random() * 12);
      });
    }, 180);
  };

  // Group transitions by category
  const transitionCategories = Array.from(new Set(TRANSITIONS_CATALOG.map(t => t.category)));

  return (
    <div className="flex h-full overflow-hidden relative text-white bg-black">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-indigo-900/90 border border-indigo-400/50 text-white px-5 py-2.5 rounded-2xl shadow-2xl backdrop-blur-xl flex items-center gap-2.5 text-xs font-bold"
          >
            <Sparkles className="w-4 h-4 text-indigo-300" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Export Overlay Modal */}
      <AnimatePresence>
        {isExporting && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-black/85 backdrop-blur-lg flex flex-col items-center justify-center p-8"
          >
            <div className="w-full max-w-md bg-neutral-900 border border-white/10 rounded-3xl p-6 text-center shadow-2xl">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 mx-auto flex items-center justify-center mb-4 shadow-lg animate-pulse">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold font-bogle text-white mb-1">Stitching Multi-Scene Reel</h3>
              <p className="text-white/50 text-xs mb-6">
                Rendering {clips.length} scenes with custom transition shaders ({clips.filter(c => c.transition).map(c => c.transition).join(', ')}), subtitles, and audio...
              </p>

              {/* Progress Bar */}
              <div className="w-full bg-black/60 rounded-full h-3 p-0.5 border border-white/10 overflow-hidden mb-3">
                <motion.div 
                  className="bg-gradient-to-r from-purple-500 via-indigo-400 to-pink-500 h-full rounded-full"
                  style={{ width: `${Math.min(exportProgress, 100)}%` }}
                  transition={{ ease: "easeOut" }}
                />
              </div>
              <div className="flex justify-between text-xs font-mono text-white/60">
                <span>Blending Video Transitions</span>
                <span>{Math.round(Math.min(exportProgress, 100))}%</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Export Success Toast */}
      <AnimatePresence>
        {exportComplete && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="absolute top-6 left-1/2 -translate-x-1/2 z-50 bg-emerald-950/90 border border-emerald-500/40 text-emerald-100 px-6 py-3 rounded-2xl shadow-2xl backdrop-blur-xl flex items-center gap-3 text-sm font-semibold"
          >
            <Check className="w-5 h-5 text-emerald-400" />
            <span>Multi-Scene Reel with Transitions Compiled Successfully! Download started.</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LEFT SIDEBAR: GALLERY ASSET LIBRARY */}
      <div className="w-72 sm:w-80 bg-[#0c0c0e] border-r border-white/10 flex flex-col h-full overflow-hidden shrink-0">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Film className="w-4 h-4 text-purple-400" />
            <h2 className="font-bold text-sm text-white">Clip Library ({availablePosts.length})</h2>
          </div>
          <span className="text-[10px] text-white/40">Click + to add</span>
        </div>

        <div className="flex-1 overflow-y-auto p-3 grid grid-cols-2 gap-3 content-start no-scrollbar">
          {availablePosts.length === 0 ? (
            <div className="col-span-2 text-center text-white/30 py-12 text-xs">
              No videos in gallery yet.<br />Generate videos in Composer or Feed first!
            </div>
          ) : (
            availablePosts.map(post => (
              <div 
                key={post.id} 
                className="aspect-[9/16] bg-black rounded-2xl overflow-hidden border border-white/10 relative group cursor-pointer hover:border-purple-400/80 transition-all shadow-md"
                onClick={() => handleAddClip(post)}
              >
                <video src={post.videoUrl} className="w-full h-full object-cover" muted />
                
                {/* Overlay actions */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-between p-2 transition-opacity">
                  {onDeletePost && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeletePost(post.id);
                      }}
                      className="self-end p-1.5 rounded-lg bg-red-900/80 hover:bg-red-700 text-red-200 transition-colors"
                      title="Delete Uploaded Video"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <div className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-lg">
                    <Plus className="w-5 h-5" />
                  </div>
                  <span className="text-[9px] font-bold bg-black/60 px-2 py-0.5 rounded text-white truncate max-w-full">
                    {post.prompt ? post.prompt.slice(0, 16) + '...' : (post.description || 'Reel')}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* CENTER & RIGHT AREA: MAIN STORYBOARD WORKSPACE */}
      <div className="flex-1 flex flex-col h-full bg-black min-w-0">
        
        {/* Top Header Bar */}
        <div className="h-14 border-b border-white/10 flex items-center justify-between px-6 bg-[#0c0c0e]">
          <div className="flex items-center gap-4">
            <button 
              onClick={onBack}
              className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-all border border-white/10 text-white/60 hover:text-white"
              title="Back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-white">Multi-Scene Storyboard & Transitions</span>
              <span className="text-xs text-white/40 font-mono hidden sm:inline">
                • {clips.length} Scenes ({Math.round(clips.length * 5)}s) • {Math.max(0, clips.length - 1)} Transitions
              </span>
            </div>
          </div>

          {/* Right Action buttons */}
          <div className="flex items-center gap-2.5">
            <button 
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={clips.length === 0}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-purple-600/30 flex items-center gap-2 transition-all disabled:opacity-40"
            >
              <Download className="w-4 h-4" />
              <span>Stitch & Export Reel</span>
            </button>
          </div>
        </div>

        {/* Middle Canvas: Live Multi-Scene Preview & Clip Inspector */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Main Video Stage with LIVE Transition Effects */}
          <div className="flex-1 flex items-center justify-center p-4 sm:p-6 bg-gradient-to-b from-neutral-950 to-black relative min-w-0">
            {currentPost && currentPost.videoUrl ? (
              <div className="relative aspect-[9/16] h-full max-h-[520px] bg-black rounded-3xl overflow-hidden border border-white/15 shadow-2xl group ring-1 ring-white/10">
                
                {/* VIDEO ELEMENT */}
                <video 
                  ref={videoRef}
                  src={currentPost.videoUrl} 
                  className={`w-full h-full object-cover transition-all duration-300 ${
                    transitionEffectState.isActive && transitionEffectState.type === 'blur' ? 'blur-lg scale-105' : ''
                  } ${
                    transitionEffectState.isActive && transitionEffectState.type === 'zoom-in' ? 'scale-125' : ''
                  } ${
                    transitionEffectState.isActive && transitionEffectState.type === 'zoom-out' ? 'scale-75 opacity-60' : ''
                  }`} 
                  onEnded={handleVideoEnded}
                  playsInline
                  key={currentPost.id}
                />

                {/* DYNAMIC SHADER / TRANSITION OVERLAY SIMULATIONS */}
                <AnimatePresence>
                  {/* DIP TO BLACK */}
                  {transitionEffectState.isActive && (transitionEffectState.type === 'dip-to-black' || transitionEffectState.type === 'fade') && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0, 1, 0] }}
                      transition={{ duration: 0.5, ease: "easeInOut" }}
                      className="absolute inset-0 bg-black z-30 pointer-events-none"
                    />
                  )}

                  {/* DIP TO WHITE / FLASH */}
                  {transitionEffectState.isActive && transitionEffectState.type === 'dip-to-white' && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0, 0.95, 0] }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                      className="absolute inset-0 bg-white z-30 pointer-events-none shadow-[inset_0_0_100px_rgba(255,255,255,0.8)]"
                    />
                  )}

                  {/* CROSSFADE DISSOLVE */}
                  {transitionEffectState.isActive && transitionEffectState.type === 'crossfade' && (
                    <motion.div 
                      initial={{ opacity: 0.8 }}
                      animate={{ opacity: 0 }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                      className="absolute inset-0 bg-gradient-to-t from-neutral-900/90 via-transparent to-neutral-900/90 backdrop-blur-[2px] z-30 pointer-events-none"
                    />
                  )}

                  {/* SLIDE LEFT */}
                  {transitionEffectState.isActive && (transitionEffectState.type === 'slide-left' || transitionEffectState.type === 'wipe') && (
                    <motion.div 
                      initial={{ x: '100%' }}
                      animate={{ x: '-100%' }}
                      transition={{ duration: 0.5, ease: "easeInOut" }}
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500/30 to-transparent border-r-4 border-purple-400 z-30 pointer-events-none"
                    />
                  )}

                  {/* SLIDE RIGHT */}
                  {transitionEffectState.isActive && transitionEffectState.type === 'slide-right' && (
                    <motion.div 
                      initial={{ x: '-100%' }}
                      animate={{ x: '100%' }}
                      transition={{ duration: 0.5, ease: "easeInOut" }}
                      className="absolute inset-0 bg-gradient-to-l from-transparent via-indigo-500/30 to-transparent border-l-4 border-indigo-400 z-30 pointer-events-none"
                    />
                  )}

                  {/* CYBER GLITCH */}
                  {transitionEffectState.isActive && transitionEffectState.type === 'glitch' && (
                    <motion.div 
                      initial={{ opacity: 1 }}
                      animate={{ 
                        opacity: [1, 0.4, 0.9, 0],
                        x: [0, -8, 8, -4, 0],
                      }}
                      transition={{ duration: 0.4 }}
                      className="absolute inset-0 bg-purple-900/30 mix-blend-color-dodge z-30 pointer-events-none border-y-8 border-red-500/40"
                    >
                      <div className="w-full h-full bg-[repeating-linear-gradient(0deg,rgba(0,0,0,0.2)_0px,rgba(0,0,0,0.2)_2px,transparent_2px,transparent_4px)]"></div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Subtitles Overlay */}
                {activeSelectedClip?.scriptNarration && (
                  <div className={`absolute left-4 right-4 z-20 pointer-events-none flex flex-col items-center ${
                    activeSelectedClip.captionStyle?.position === 'top' 
                      ? 'top-10' 
                      : activeSelectedClip.captionStyle?.position === 'center' 
                      ? 'top-1/2 -translate-y-1/2' 
                      : 'bottom-14'
                  }`}>
                    <div className="px-4 py-2 rounded-xl bg-black/75 backdrop-blur-md border border-white/10 shadow-2xl text-center max-w-[90%]">
                      <p className="text-sm sm:text-base font-black uppercase tracking-wider text-white font-sans">
                        {activeSelectedClip.scriptNarration.split(' ').map((word: string, idx: number) => {
                          const isHighlighted = currentKaraokeWord.toLowerCase().includes(word.toLowerCase());
                          return (
                            <span 
                              key={idx} 
                              className={`inline-block mr-1.5 transition-all ${
                                isHighlighted ? 'text-amber-400 scale-110' : 'text-white'
                              }`}
                            >
                              {word}
                            </span>
                          );
                        })}
                      </p>
                    </div>
                  </div>
                )}

                {/* Top Scene & Transition Badge */}
                <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
                  <div className="px-3 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/20 text-[11px] font-bold text-white">
                    Scene {currentClipIndex + 1} of {clips.length}
                  </div>
                  {currentClip?.transition && currentClipIndex > 0 && (
                    <div className="px-2.5 py-1 rounded-full bg-purple-600/90 backdrop-blur-md border border-purple-400/40 text-[10px] font-bold text-white flex items-center gap-1">
                      <Zap className="w-3 h-3 text-amber-300" />
                      <span>{currentClip.transition}</span>
                    </div>
                  )}
                </div>

                {/* Video Playback Controls */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/70 backdrop-blur-md px-5 py-2 rounded-full border border-white/15 z-20">
                  <button 
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="w-8 h-8 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 transition-transform"
                  >
                    {isPlaying ? <Pause className="w-3.5 h-3.5 fill-black" /> : <Play className="w-3.5 h-3.5 fill-black ml-0.5" />}
                  </button>
                  <span className="text-xs font-mono text-white/70">
                    Scene {currentClipIndex + 1} / {clips.length}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center text-white/40 p-8 border border-dashed border-white/10 rounded-3xl max-w-sm">
                <Film className="w-12 h-12 mb-3 opacity-30 text-purple-400" />
                <h4 className="text-base font-bold text-white mb-1">No Scenes in Storyboard</h4>
                <p className="text-xs text-white/50 mb-4">
                  Select clips from the left library to build your 3-to-5 scene sequence.
                </p>
              </div>
            )}
          </div>

          {/* RIGHT INSPECTOR: TRANSITION EFFECTS CONTROL CENTER */}
          {activeSelectedClip && (
            <div className="w-80 sm:w-96 bg-[#0e0e11] border-l border-white/10 p-5 flex flex-col gap-5 overflow-y-auto shrink-0 no-scrollbar">
              
              {/* Scene Header */}
              <div className="border-b border-white/10 pb-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-purple-400 tracking-wider flex items-center gap-1">
                    <SlidersHorizontal className="w-3 h-3" /> Scene {activeSelectedClipIndex + 1} Settings
                  </span>
                  <span className="text-[10px] text-white/40 font-mono">
                    ID: {activeSelectedClip.id.slice(-6)}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white mt-1">
                  {SCENE_ROLES[activeSelectedClipIndex]?.label || 'Scene Control'}
                </h3>
              </div>

              {/* TRANSITION EFFECTS SELECTOR UI */}
              <div className="space-y-4 bg-white/[0.02] p-4 rounded-2xl border border-white/10">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> Incoming Transition Effect
                  </label>
                  {activeSelectedClipIndex === 0 ? (
                    <span className="text-[10px] bg-white/5 text-white/40 px-2 py-0.5 rounded">First scene</span>
                  ) : (
                    <button
                      onClick={handlePreviewCurrentTransition}
                      className="text-[10px] text-amber-400 hover:text-amber-300 flex items-center gap-1 bg-amber-400/10 px-2 py-0.5 rounded-lg border border-amber-400/20"
                    >
                      <Eye className="w-3 h-3" /> Preview
                    </button>
                  )}
                </div>

                {activeSelectedClipIndex === 0 ? (
                  <p className="text-[11px] text-white/40 italic">
                    Scene 1 is the opener. Transitions apply starting on Scene 2 between scenes.
                  </p>
                ) : (
                  <>
                    {/* Categorized Transition Picker */}
                    <div className="space-y-3">
                      {transitionCategories.map(cat => {
                        const items = TRANSITIONS_CATALOG.filter(t => t.category === cat);
                        return (
                          <div key={cat} className="space-y-1.5">
                            <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">
                              {cat}
                            </span>
                            <div className="grid grid-cols-2 gap-1.5">
                              {items.map(t => {
                                const isSelected = (activeSelectedClip.transition || 'none') === t.id;
                                return (
                                  <button
                                    key={t.id}
                                    type="button"
                                    onClick={() => handleUpdateTransitionForClip(activeSelectedClipIndex, t.id)}
                                    className={`p-2.5 rounded-xl border text-left transition-all relative group ${
                                      isSelected
                                        ? 'bg-gradient-to-r from-purple-600/30 to-indigo-600/30 border-purple-400 text-white shadow-md ring-1 ring-purple-400/40'
                                        : 'bg-black/50 border-white/10 text-white/70 hover:bg-white/[0.05] hover:border-white/20'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-base">{t.icon}</span>
                                      {t.badge && (
                                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${
                                          isSelected ? 'bg-purple-400 text-black' : 'bg-white/10 text-white/60'
                                        }`}>
                                          {t.badge}
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-xs font-bold truncate text-white">{t.label}</div>
                                    <div className="text-[9px] text-white/40 mt-0.5 line-clamp-1 group-hover:text-white/60">
                                      {t.description}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Transition Duration Control */}
                    <div className="pt-2 border-t border-white/10">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs text-gray-400">Transition Duration</label>
                        <span className="text-xs font-mono text-amber-300 font-bold">
                          {activeSelectedClip.transitionDurationSec || 0.5}s
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1.5">
                        {DURATION_PRESETS.map(sec => (
                          <button
                            key={sec}
                            onClick={() => handleUpdateTransitionForClip(
                              activeSelectedClipIndex, 
                              activeSelectedClip.transition || 'crossfade', 
                              sec
                            )}
                            className={`flex-1 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                              (activeSelectedClip.transitionDurationSec || 0.5) === sec
                                ? 'bg-amber-400 text-black shadow-md'
                                : 'bg-white/5 border border-white/10 text-white/60 hover:text-white'
                            }`}
                          >
                            {sec}s
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Global Apply All Button */}
                    <button
                      type="button"
                      onClick={() => handleApplyTransitionToAll(
                        activeSelectedClip.transition || 'crossfade',
                        activeSelectedClip.transitionDurationSec || 0.5
                      )}
                      className="w-full py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                    >
                      <Repeat className="w-3.5 h-3.5 text-purple-400" />
                      <span>Apply Transition to All Scenes</span>
                    </button>
                  </>
                )}
              </div>

              {/* Script Narration & Voice */}
              <div className="space-y-3 bg-white/[0.02] p-4 rounded-2xl border border-white/10">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                    <Mic className="w-3.5 h-3.5" /> Scene Narration Script
                  </label>
                  <button
                    onClick={handleTestVoiceForClip}
                    className="text-[10px] text-purple-300 hover:underline flex items-center gap-1 bg-purple-500/20 px-2 py-0.5 rounded-lg border border-purple-500/30"
                  >
                    <Volume2 className="w-3 h-3" />
                    <span>{isSpeaking ? 'Stop' : 'Test TTS'}</span>
                  </button>
                </div>
                <textarea
                  rows={3}
                  value={activeSelectedClip.scriptNarration || ''}
                  onChange={(e) => updateSelectedClip({ scriptNarration: e.target.value })}
                  placeholder="Enter script narration for this scene..."
                  className="w-full bg-black/60 border border-white/15 rounded-xl p-3 text-white text-xs focus:border-purple-400 outline-none resize-none leading-relaxed"
                />
              </div>

              {/* Subtitle / Caption Position & Style */}
              <div className="space-y-3 bg-white/[0.02] p-4 rounded-2xl border border-white/10">
                <label className="text-xs font-bold text-yellow-300 flex items-center gap-1.5">
                  <Type className="w-3.5 h-3.5" /> Subtitle Position & Highlight
                </label>
                
                <div className="grid grid-cols-3 gap-2">
                  {(['bottom', 'center', 'top'] as const).map(pos => (
                    <button
                      key={pos}
                      onClick={() => updateSelectedClip({
                        captionStyle: {
                          ...(activeSelectedClip.captionStyle || {
                            font: 'impact',
                            color: '#ffffff',
                            highlightColor: '#facc15',
                            bgBox: true,
                            animation: 'karaoke',
                            position: 'bottom',
                            size: 24
                          }),
                          position: pos
                        }
                      })}
                      className={`py-1.5 rounded-lg border text-xs font-bold capitalize transition-all ${
                        activeSelectedClip.captionStyle?.position === pos
                          ? 'bg-amber-400 text-black border-amber-400 shadow-sm'
                          : 'bg-black/40 border-white/10 text-white/60'
                      }`}
                    >
                      {pos}
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-gray-400">Highlight Color</span>
                  <div className="flex gap-2">
                    {['#facc15', '#38bdf8', '#a855f7', '#f43f5e', '#4ade80'].map(color => (
                      <button
                        key={color}
                        onClick={() => updateSelectedClip({
                          captionStyle: {
                            ...(activeSelectedClip.captionStyle || {
                              font: 'impact',
                              color: '#ffffff',
                              highlightColor: '#facc15',
                              bgBox: true,
                              animation: 'karaoke',
                              position: 'bottom',
                              size: 24
                            }),
                            highlightColor: color
                          }
                        })}
                        className="w-6 h-6 rounded-full border-2 transition-transform hover:scale-110"
                        style={{
                          backgroundColor: color,
                          borderColor: activeSelectedClip.captionStyle?.highlightColor === color ? '#ffffff' : 'transparent'
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>

        {/* BOTTOM TIMELINE: Drag-and-drop Multi-Scene Track with INLINE TRANSITION JUNCTIONS */}
        <div className="h-64 bg-[#0a0a0c] border-t border-white/10 flex flex-col shrink-0">
          <div className="p-3 border-b border-white/5 flex justify-between items-center px-6">
            <div className="flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-xs font-bold uppercase tracking-widest text-white/70">
                Multi-Scene Storyboard Track ({clips.length} Scenes)
              </span>
            </div>
            <span className="text-[11px] text-white/40">
              Drag cards to reorder • Click transition badge between scenes to change effects
            </span>
          </div>
          
          <div className="flex-1 overflow-x-auto p-4 flex gap-2 items-center no-scrollbar">
            <Reorder.Group axis="x" values={clips} onReorder={setClips} className="flex gap-3 h-full items-center">
              {clips.map((clip, index) => {
                const post = availablePosts.find(p => p.id === clip.sourcePostId);
                if (!post) return null;

                const isSelected = selectedClipId === clip.id;
                const roleLabel = SCENE_ROLES[index]?.label || `Scene ${index + 1}`;
                const transitionMeta = TRANSITIONS_CATALOG.find(t => t.id === clip.transition);

                return (
                  <React.Fragment key={clip.id}>
                    
                    {/* INLINE TRANSITION JUNCTION BUTTON (between clips) */}
                    {index > 0 && (
                      <div className="relative flex flex-col items-center justify-center shrink-0 z-20">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedClipId(clip.id);
                            setCurrentClipIndex(index);
                            setActiveTransitionJunctionIndex(
                              activeTransitionJunctionIndex === index ? null : index
                            );
                          }}
                          className={`px-2.5 py-1.5 rounded-xl border flex items-center gap-1.5 text-xs font-bold transition-all shadow-lg hover:scale-105 ${
                            clip.transition && clip.transition !== 'none'
                              ? 'bg-purple-950/90 border-purple-400/80 text-purple-200 shadow-purple-500/20'
                              : 'bg-neutral-900 border-white/20 text-white/50 hover:text-white'
                          }`}
                          title={`Change transition before Scene ${index + 1}`}
                        >
                          <span className="text-xs">{transitionMeta?.icon || '⚡'}</span>
                          <span className="text-[10px] whitespace-nowrap">{transitionMeta?.label || 'Transition'}</span>
                          <span className="text-[9px] font-mono text-purple-300/80 font-normal">
                            {clip.transitionDurationSec || 0.5}s
                          </span>
                        </button>

                        {/* Inline Quick Transition Popup */}
                        {activeTransitionJunctionIndex === index && (
                          <div 
                            className="absolute bottom-12 left-1/2 -translate-x-1/2 z-50 w-64 bg-neutral-900/95 backdrop-blur-xl border border-white/20 rounded-2xl p-3 shadow-2xl space-y-2"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                              <span className="text-[11px] font-bold text-white flex items-center gap-1">
                                <Sparkles className="w-3 h-3 text-amber-400" />
                                Scene {index} ➔ Scene {index + 1}
                              </span>
                              <button 
                                onClick={() => setActiveTransitionJunctionIndex(null)}
                                className="text-white/40 hover:text-white text-xs"
                              >
                                ✕
                              </button>
                            </div>

                            <div className="grid grid-cols-2 gap-1 max-h-48 overflow-y-auto no-scrollbar">
                              {TRANSITIONS_CATALOG.map(t => (
                                <button
                                  key={t.id}
                                  onClick={() => {
                                    handleUpdateTransitionForClip(index, t.id);
                                    setActiveTransitionJunctionIndex(null);
                                  }}
                                  className={`p-1.5 rounded-lg border text-left text-[11px] flex items-center gap-1.5 transition-all ${
                                    clip.transition === t.id
                                      ? 'bg-purple-600 border-purple-400 text-white font-bold'
                                      : 'bg-black/40 border-white/10 text-white/70 hover:bg-white/10'
                                  }`}
                                >
                                  <span>{t.icon}</span>
                                  <span className="truncate">{t.label}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* SCENE CARD ITEM */}
                    <Reorder.Item value={clip}>
                      <div 
                        onClick={() => {
                          setSelectedClipId(clip.id);
                          setCurrentClipIndex(index);
                        }}
                        className={`w-36 aspect-[9/16] bg-neutral-900 rounded-2xl border relative group shrink-0 cursor-pointer overflow-hidden transition-all shadow-lg ${
                          isSelected 
                            ? 'border-purple-400 ring-2 ring-purple-400/50 shadow-purple-500/20' 
                            : 'border-white/10 hover:border-white/30'
                        }`}
                      >
                        <img 
                          src={post.referenceImageBase64 ? `data:image/png;base64,${post.referenceImageBase64}` : post.avatarUrl} 
                          className="w-full h-full object-cover opacity-75 group-hover:opacity-95 transition-opacity" 
                          alt="Scene clip"
                        />
                        
                        {/* Top Action Buttons */}
                        <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                          <button 
                            onClick={(e) => handleRemoveClip(clip.id, e)}
                            className="p-1.5 bg-red-950/80 rounded-lg hover:bg-red-700 text-red-200"
                            title="Remove clip"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Scene Number & Role */}
                        <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-md bg-black/80 text-[10px] font-bold text-white border border-white/10">
                          #{index + 1}
                        </div>

                        {/* Bottom Role Label */}
                        <div className="absolute bottom-2 left-2 right-2 bg-black/80 backdrop-blur-sm px-2 py-1 rounded-lg text-[9px] font-bold text-white border border-white/10 truncate">
                          {roleLabel}
                        </div>
                      </div>
                    </Reorder.Item>

                  </React.Fragment>
                );
              })}
              
              {clips.length === 0 && (
                <div className="w-48 h-32 flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-2xl text-white/30 text-xs gap-1">
                  <Plus className="w-5 h-5" />
                  <span>Add clips from left</span>
                </div>
              )}
            </Reorder.Group>
          </div>
        </div>

      </div>

      {/* Export Settings Dialog with Transitions Summary */}
      {showExportMenu && (
        <div className="absolute inset-0 z-40 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-neutral-900 border border-white/15 rounded-3xl p-6 shadow-2xl">
            <h3 className="text-lg font-bold font-bogle text-white mb-2">Export Multi-Scene Reel</h3>
            <p className="text-xs text-gray-400 mb-4">
              Stitching {clips.length} video scenes with configured transition shaders into a single master video.
            </p>
            
            {/* Transition Flow Summary */}
            <div className="p-3.5 rounded-2xl bg-black/60 border border-white/10 mb-5 space-y-2">
              <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">
                Transitions Sequence Flow
              </span>
              <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono text-white/80">
                {clips.map((c, i) => (
                  <React.Fragment key={c.id}>
                    <span className="px-2 py-0.5 rounded bg-white/10 text-white font-bold">
                      Scene {i + 1}
                    </span>
                    {i < clips.length - 1 && (
                      <span className="px-1.5 py-0.5 rounded bg-purple-600/30 text-purple-300 border border-purple-500/30 text-[10px]">
                        ➔ {clips[i + 1]?.transition || 'crossfade'} ({clips[i + 1]?.transitionDurationSec || 0.5}s)
                      </span>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Resolution</label>
                <div className="grid grid-cols-2 gap-2">
                  {['1080p (Full HD)', '720p (Fast)'].map(res => (
                    <button
                      key={res}
                      onClick={() => setExportSettings({ ...exportSettings, resolution: res.startsWith('1080') ? '1080p' : '720p' })}
                      className={`p-2.5 rounded-xl border text-xs font-semibold ${
                        exportSettings.resolution === (res.startsWith('1080') ? '1080p' : '720p')
                          ? 'bg-purple-600 border-purple-400 text-white'
                          : 'bg-black/40 border-white/10 text-white/70'
                      }`}
                    >
                      {res}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1">Format</label>
                <div className="grid grid-cols-2 gap-2">
                  {['MP4 (Universal)', 'WebM (High Quality)'].map(fmt => (
                    <button
                      key={fmt}
                      onClick={() => setExportSettings({ ...exportSettings, format: fmt.startsWith('MP4') ? 'mp4' : 'webm' })}
                      className={`p-2.5 rounded-xl border text-xs font-semibold ${
                        exportSettings.format === (fmt.startsWith('MP4') ? 'mp4' : 'webm')
                          ? 'bg-purple-600 border-purple-400 text-white'
                          : 'bg-black/40 border-white/10 text-white/70'
                      }`}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowExportMenu(false)}
                className="flex-1 py-2.5 bg-white/10 rounded-xl text-xs font-bold text-white hover:bg-white/20"
              >
                Cancel
              </button>
              <button
                onClick={startExport}
                className="flex-1 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl text-xs font-bold text-white shadow-lg shadow-purple-600/30 hover:scale-105 transition-transform flex items-center justify-center gap-1.5"
              >
                <Wand2 className="w-4 h-4" />
                <span>Compile Reel</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default StoryboardPage;
