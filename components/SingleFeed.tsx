/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Download, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  ChevronUp, 
  ChevronDown, 
  Play, 
  Send, 
  X, 
  Copy, 
  Check, 
  Music, 
  Wand2,
  Trash2,
  Tv
} from 'lucide-react';
import { FeedPost, PostStatus } from '../types';

interface SingleFeedProps {
  posts: FeedPost[];
  onLike: (postId: string) => void;
  onComment: (postId: string, text: string) => void;
  onRemixPrompt?: (prompt: string) => void;
  onDeletePost?: (postId: string) => void;
  onOpenAvatarStudio?: () => void;
}

export const SingleFeed: React.FC<SingleFeedProps> = ({
  posts,
  onLike,
  onComment,
  onRemixPrompt,
  onDeletePost,
  onOpenAvatarStudio,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isExpandedDescription, setIsExpandedDescription] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [heartAnimation, setHeartAnimation] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastScrollTime = useRef(0);

  // Filter posts that are ready (or generating)
  const activePost = posts[currentIndex] || posts[0];

  // Navigate to previous reel
  const goToPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setProgress(0);
      setIsPlaying(true);
    }
  }, [currentIndex]);

  // Navigate to next reel
  const goToNext = useCallback(() => {
    if (currentIndex < posts.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setProgress(0);
      setIsPlaying(true);
    }
  }, [currentIndex, posts.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in comments
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }

      if (e.key === 'ArrowDown' || e.key === 'j') {
        e.preventDefault();
        goToNext();
      } else if (e.key === 'ArrowUp' || e.key === 'k') {
        e.preventDefault();
        goToPrev();
      } else if (e.key === ' ' || e.key === 'k') {
        e.preventDefault();
        setIsPlaying((p) => !p);
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        setIsMuted((m) => !m);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNext, goToPrev]);

  // Wheel scroll snapping
  const handleWheel = (e: React.WheelEvent) => {
    const now = Date.now();
    if (now - lastScrollTime.current < 600) return; // Debounce wheel

    if (e.deltaY > 40) {
      lastScrollTime.current = now;
      goToNext();
    } else if (e.deltaY < -40) {
      lastScrollTime.current = now;
      goToPrev();
    }
  };

  // Video playback management
  useEffect(() => {
    if (videoRef.current && activePost?.videoUrl && activePost.status === PostStatus.SUCCESS) {
      videoRef.current.currentTime = 0;
      if (isPlaying) {
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            // Autoplay policy fallback: mute and retry silently without throwing unhandled error
            if (videoRef.current) {
              videoRef.current.muted = true;
              setIsMuted(true);
              videoRef.current.play().catch(() => {});
            }
          });
        }
      } else {
        videoRef.current.pause();
      }
    }
  }, [currentIndex, isPlaying, activePost?.videoUrl, activePost?.status]);

  // Sync mute state
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  const handleTimeUpdate = () => {
    if (videoRef.current && videoRef.current.duration) {
      const current = videoRef.current.currentTime;
      const total = videoRef.current.duration;
      setProgress((current / total) * 100);
    }
  };

  const handleVideoEnded = () => {
    if (autoAdvance && currentIndex < posts.length - 1) {
      goToNext();
    } else if (videoRef.current) {
      // Loop if on last reel or autoAdvance is disabled
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    }
  };

  const handleTogglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const handleLikeClick = () => {
    if (!activePost) return;
    onLike(activePost.id);
    if (!activePost.hasLiked) {
      setHeartAnimation(true);
      setTimeout(() => setHeartAnimation(false), 900);
    }
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !activePost) return;
    onComment(activePost.id, commentText);
    setCommentText('');
  };

  const handleCopyShareLink = () => {
    if (!activePost) return;
    navigator.clipboard.writeText(activePost.videoUrl || window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleDownload = async () => {
    if (!activePost?.videoUrl) return;
    try {
      if (activePost.videoUrl.startsWith('blob:')) {
        const a = document.createElement('a');
        a.href = activePost.videoUrl;
        a.download = `reels-video-${activePost.id}.mp4`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        const response = await fetch(activePost.videoUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reels-video-${activePost.id}.mp4`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error("Download failed", err);
    }
  };

  if (!activePost || posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 text-neutral-400">
        <Tv className="w-12 h-12 mb-3 text-purple-400 opacity-40 animate-pulse" />
        <h3 className="text-lg font-bold text-white mb-1">No Reels in Feed</h3>
        <p className="text-xs text-white/50">Generate a video in the Composer or upload clips to start.</p>
      </div>
    );
  }

  const isGenerating = activePost.status === PostStatus.GENERATING;

  return (
    <div 
      ref={containerRef}
      onWheel={handleWheel}
      className="relative w-full h-[calc(100vh-4.5rem)] flex items-center justify-center p-2 sm:p-4 overflow-hidden select-none"
    >
      {/* Background Ambient Glow & Blur */}
      {activePost.videoUrl && (
        <div 
          className="absolute inset-0 opacity-20 filter blur-3xl scale-125 pointer-events-none transition-all duration-700"
          style={{
            backgroundImage: `url(${activePost.avatarUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
      )}

      {/* Main TikTok-Style Vertical Phone Frame */}
      <div className="relative aspect-[9/16] h-full max-h-[820px] w-auto max-w-full bg-black rounded-3xl overflow-hidden border border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.9)] flex flex-col group">
        
        {/* TOP STATUS HEADER BAR */}
        <div className="absolute top-0 left-0 right-0 z-30 p-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent flex items-center justify-between text-white pointer-events-auto">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[11px] font-bold font-mono">
              Reel {currentIndex + 1} / {posts.length}
            </span>
            {activePost.modelTag && (
              <span className="px-2 py-0.5 rounded-md bg-purple-600/80 backdrop-blur-md border border-purple-400/30 text-[10px] font-semibold flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-300" />
                {activePost.modelTag}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Auto advance toggle */}
            <button
              onClick={() => setAutoAdvance(!autoAdvance)}
              className={`text-[10px] font-semibold px-2 py-1 rounded-full border transition-all ${
                autoAdvance 
                  ? 'bg-purple-500/20 border-purple-400/40 text-purple-300' 
                  : 'bg-black/50 border-white/10 text-white/50'
              }`}
              title="Automatically jump to next reel when current finishes"
            >
              Auto-Next: {autoAdvance ? 'ON' : 'OFF'}
            </button>

            {/* Sound Mute Toggle */}
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-2 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/15 text-white/90 transition-all hover:scale-105"
              title={isMuted ? 'Unmute (M)' : 'Mute (M)'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>
          </div>
        </div>

        {/* CENTRAL VIDEO CANVAS */}
        <div 
          onClick={handleTogglePlay}
          className="relative flex-1 w-full h-full bg-neutral-950 flex items-center justify-center cursor-pointer overflow-hidden"
        >
          {isGenerating ? (
            <div className="flex flex-col items-center justify-center text-center p-6 space-y-4">
              <div className="relative w-20 h-20">
                <div className="absolute inset-0 rounded-full border-4 border-purple-500/20 animate-ping"></div>
                <div className="w-full h-full rounded-full border-4 border-purple-500 border-t-transparent animate-spin flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-purple-400 animate-pulse" />
                </div>
              </div>
              <div>
                <h4 className="text-base font-bold text-white">Rendering AI Reel</h4>
                <p className="text-xs text-white/60 max-w-xs mt-1 leading-relaxed">
                  {activePost.description || 'Synthesizing motion frames with Veo...'}
                </p>
              </div>
            </div>
          ) : activePost.videoUrl ? (
            <video
              ref={videoRef}
              src={activePost.videoUrl}
              className="w-full h-full object-cover"
              loop={!autoAdvance}
              playsInline
              muted={isMuted}
              onTimeUpdate={handleTimeUpdate}
              onEnded={handleVideoEnded}
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-6">
              <img 
                src={activePost.referenceImageBase64 ? `data:image/png;base64,${activePost.referenceImageBase64}` : activePost.avatarUrl} 
                alt="Thumbnail" 
                className="w-full h-full object-cover opacity-80" 
              />
            </div>
          )}

          {/* Pause / Play central splash indicator */}
          <AnimatePresence>
            {!isPlaying && !isGenerating && (
              <motion.div
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.7 }}
                className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[1px] pointer-events-none z-20"
              >
                <div className="w-16 h-16 rounded-full bg-black/70 border border-white/20 flex items-center justify-center shadow-2xl">
                  <Play className="w-8 h-8 text-white fill-white ml-1" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Big Floating Heart Animation on Double Click / Like */}
          <AnimatePresence>
            {heartAnimation && (
              <motion.div
                initial={{ opacity: 0, scale: 0.4, y: 0 }}
                animate={{ opacity: 1, scale: [0.4, 1.4, 1.1], y: -40 }}
                exit={{ opacity: 0, scale: 1.6, y: -90 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="absolute z-30 pointer-events-none flex items-center justify-center"
              >
                <Heart className="w-24 h-24 text-rose-500 fill-rose-500 drop-shadow-[0_0_25px_rgba(244,63,94,0.8)]" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* RIGHT DOCK: TIKTOK FLOATING ACTION BUTTONS */}
        <div className="absolute right-2 sm:right-3 bottom-12 z-30 flex flex-col items-center gap-2 sm:gap-2.5 pointer-events-auto">
          
          {/* Creator Avatar with follow badge */}
          <div className="relative group">
            <div 
              onClick={(e) => {
                e.stopPropagation();
                if (onOpenAvatarStudio) onOpenAvatarStudio();
              }}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 border-purple-400 overflow-hidden bg-neutral-900 shadow-xl cursor-pointer hover:scale-105 transition-transform"
            >
              <img src={activePost.avatarUrl} alt={activePost.username} className="w-full h-full object-cover" />
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onOpenAvatarStudio) onOpenAvatarStudio();
              }}
              className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 text-white flex items-center justify-center text-[10px] font-bold shadow-md hover:scale-110 transition-transform"
              title="Avatar Studio"
            >
              +
            </button>
          </div>

          {/* Like Button */}
          <div className="flex flex-col items-center">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleLikeClick();
              }}
              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center backdrop-blur-xl border transition-all ${
                activePost.hasLiked
                  ? 'bg-rose-600 border-rose-400 text-white shadow-lg shadow-rose-600/40 scale-105'
                  : 'bg-black/70 border-white/20 text-white hover:bg-black/90 hover:scale-105'
              }`}
              title="Like this Reel"
            >
              <Heart className={`w-4 h-4 sm:w-5 sm:h-5 ${activePost.hasLiked ? 'fill-white text-white' : 'text-white'}`} />
            </button>
            <span className="text-[10px] sm:text-[11px] font-bold text-white mt-0.5 drop-shadow-md font-mono">
              {activePost.likes || 0}
            </span>
          </div>

          {/* Comments Button */}
          <div className="flex flex-col items-center">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowComments(true);
              }}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/70 hover:bg-black/90 backdrop-blur-xl border border-white/20 text-white flex items-center justify-center transition-all hover:scale-105"
              title="Comments"
            >
              <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </button>
            <span className="text-[10px] sm:text-[11px] font-bold text-white mt-0.5 drop-shadow-md font-mono">
              {activePost.comments?.length || 0}
            </span>
          </div>

          {/* Remix / Prompt Clone Button */}
          {onRemixPrompt && (activePost.prompt || activePost.description) && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemixPrompt(activePost.prompt || activePost.description);
              }}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-tr from-amber-500 to-purple-600 border border-amber-300/50 text-white flex items-center justify-center transition-all shadow-lg hover:scale-105"
              title="Remix & Edit Prompt in Composer"
            >
              <Wand2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          )}

          {/* Share Button */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowShareMenu(!showShareMenu);
              }}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/70 hover:bg-black/90 backdrop-blur-xl border border-white/20 text-white flex items-center justify-center transition-all hover:scale-105"
              title="Share Reel"
            >
              <Share2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </button>

            {/* Share dropdown popup */}
            <AnimatePresence>
              {showShareMenu && (
                <motion.div
                  initial={{ opacity: 0, x: 10, scale: 0.9 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 10, scale: 0.9 }}
                  className="absolute right-12 sm:right-14 bottom-0 bg-neutral-900/95 backdrop-blur-xl border border-white/20 rounded-2xl p-2 shadow-2xl z-40 w-44 space-y-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={handleCopyShareLink}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold hover:bg-white/10 text-white transition-colors"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? 'Link Copied!' : 'Copy Video Link'}</span>
                  </button>
                  <button
                    onClick={handleDownload}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold hover:bg-white/10 text-white transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-purple-400" />
                    <span>Download MP4</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Delete Button (for user generated posts) */}
          {activePost.isUserGenerated && onDeletePost && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm("Are you sure you want to delete this creation?")) {
                  onDeletePost(activePost.id);
                  if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
                }
              }}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-red-950/80 hover:bg-red-800 backdrop-blur-xl border border-red-500/50 text-red-200 flex items-center justify-center transition-all hover:scale-105"
              title="Delete Video"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          {/* Spinning Audio Disc Vinyl Animation */}
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-black/90 border-2 border-white/30 flex items-center justify-center shadow-2xl animate-[spin_5s_linear_infinite]">
            <div className="w-3 h-3 rounded-full bg-purple-500 border border-white/50" />
          </div>
        </div>

        {/* BOTTOM METADATA OVERLAY (Creator Info, Prompt & Audio Track) */}
        <div className="absolute bottom-3 left-3 right-16 z-20 flex flex-col gap-1.5 text-white pointer-events-auto">
          {/* Creator handle */}
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-white drop-shadow-md">
              @{activePost.username || 'creator'}
            </span>
            <span className="px-1.5 py-0.2 rounded-md bg-white/20 text-[9px] font-bold text-white/90">
              AI Creator
            </span>
          </div>

          {/* Caption / Prompt */}
          <div className="text-xs text-white/90 drop-shadow-md max-w-full">
            <p className={isExpandedDescription ? 'whitespace-normal leading-relaxed' : 'line-clamp-2 leading-snug'}>
              {activePost.description || activePost.prompt || 'Cyberpunk neon video reel created with Veo AI.'}
            </p>
            {(activePost.description?.length || 0) > 80 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpandedDescription(!isExpandedDescription);
                }}
                className="text-[11px] font-bold text-purple-300 hover:text-white mt-0.5 drop-shadow"
              >
                {isExpandedDescription ? 'Show less' : '...more'}
              </button>
            )}
          </div>

          {/* Audio Ticker */}
          <div className="flex items-center gap-2 text-[11px] text-white/70 overflow-hidden mt-0.5">
            <Music className="w-3.5 h-3.5 text-purple-300 shrink-0" />
            <div className="truncate font-mono">
              Original AI Audio • @{activePost.username || 'reels_studio'}
            </div>
          </div>
        </div>

        {/* BOTTOM PROGRESS BAR SCRUBBER */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 z-30">
          <div 
            className="h-full bg-gradient-to-r from-purple-500 via-indigo-400 to-pink-500 transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* SLIDE-OVER COMMENTS DRAWER */}
        <AnimatePresence>
          {showComments && (
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="absolute inset-x-0 bottom-0 top-1/3 z-40 bg-neutral-900/95 backdrop-blur-2xl border-t border-white/20 rounded-t-3xl p-4 flex flex-col shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-purple-400" />
                  <span className="font-bold text-xs text-white">
                    Comments ({activePost.comments?.length || 0})
                  </span>
                </div>
                <button
                  onClick={() => setShowComments(false)}
                  className="p-1 rounded-full hover:bg-white/10 text-white/60 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Comment List */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 no-scrollbar">
                {(!activePost.comments || activePost.comments.length === 0) ? (
                  <div className="text-center text-white/40 py-8 text-xs">
                    No comments yet. Be the first to share your thoughts!
                  </div>
                ) : (
                  activePost.comments.map((c) => (
                    <div key={c.id} className="flex gap-2.5 items-start text-xs">
                      <div className="w-7 h-7 rounded-full bg-purple-700/60 border border-white/20 flex items-center justify-center font-bold text-white text-[10px] shrink-0">
                        {c.username.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0 bg-white/5 rounded-xl p-2 border border-white/5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white/90 text-[11px]">@{c.username}</span>
                          <span className="text-[9px] text-white/40 font-mono">
                            {new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-white/80 text-xs mt-1 leading-relaxed">{c.text}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Input Form */}
              <form onSubmit={handleCommentSubmit} className="mt-3 flex gap-2 pt-2 border-t border-white/10">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-1 bg-black/60 border border-white/15 rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/40 focus:border-purple-400 outline-none"
                />
                <button
                  type="submit"
                  disabled={!commentText.trim()}
                  className="p-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-bold transition-all shadow-md"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* FLOATING DESKTOP UP / DOWN NAVIGATION STATION */}
      <div className="hidden md:flex flex-col items-center gap-2.5 ml-3 lg:ml-5 shrink-0 z-30">
        <button
          onClick={goToPrev}
          disabled={currentIndex === 0}
          className="w-11 h-11 rounded-2xl bg-neutral-900/90 hover:bg-neutral-800 disabled:opacity-25 border border-white/20 text-white shadow-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
          title="Previous Reel (Up Arrow / K)"
        >
          <ChevronUp className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center py-1.5 px-2 rounded-xl bg-black/80 border border-white/10 shadow-lg text-center select-none min-w-[44px]">
          <span className="text-[11px] font-mono font-bold text-white">{currentIndex + 1}</span>
          <span className="text-[8px] font-mono text-white/40 uppercase">of {posts.length}</span>
        </div>

        <button
          onClick={goToNext}
          disabled={currentIndex >= posts.length - 1}
          className="w-11 h-11 rounded-2xl bg-neutral-900/90 hover:bg-neutral-800 disabled:opacity-25 border border-white/20 text-white shadow-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
          title="Next Reel (Down Arrow / J)"
        >
          <ChevronDown className="w-5 h-5" />
        </button>

        <span className="text-[9px] font-mono text-white/30 tracking-wider">↑ / ↓</span>
      </div>

    </div>
  );
};

export default SingleFeed;
