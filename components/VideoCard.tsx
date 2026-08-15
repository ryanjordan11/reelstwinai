
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { motion, AnimatePresence } from 'framer-motion';
import React, { useRef, useState } from 'react';
import { FeedPost, PostStatus } from '../types';
import { VeoLogo } from './icons';
import { AlertCircle, Download, Sparkles, Share2, Check, Facebook, Youtube, Instagram, Twitter, Heart, MessageCircle, Send, RefreshCw, Trash2 } from 'lucide-react';

interface VideoCardProps {
  post: FeedPost;
  onLike?: (id: string) => void;
  onComment?: (id: string, text: string) => void;
  onDelete?: (id: string) => void;
}

const VideoCard: React.FC<VideoCardProps> = ({ post, onLike, onComment, onDelete }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [, setIsHovered] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [hasError, setHasError] = useState(false);

  const status = post.status ?? PostStatus.SUCCESS; // Default to success for sample data

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (status === PostStatus.SUCCESS && !hasError && videoRef.current && post.videoUrl) {
      videoRef.current.muted = false;
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {}); // Safely swallow autoplay block
      }
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setShowShareMenu(false); // Close menu on leave
    if (status === PostStatus.SUCCESS && !hasError && videoRef.current) {
      videoRef.current.muted = true;
    }
  };

  const handleVideoError = () => {
      // This usually happens if the blob URL expired from local storage
      setHasError(true);
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click issues
    if (!post.videoUrl || status !== PostStatus.SUCCESS || hasError) return;

    try {
        // If it's a blob URL, we can download directly
        if (post.videoUrl.startsWith('blob:')) {
            const a = document.createElement('a');
            a.href = post.videoUrl;
            a.download = `cameo-video-${post.id}.mp4`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        } else {
            // For remote URLs (like samples), fetch as blob first to force download
            const response = await fetch(post.videoUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `cameo-video-${post.id}.mp4`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        }
    } catch (error) {
        console.error("Download failed:", error);
    }
  };

  const handleShareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowShareMenu(!showShareMenu);
  };

  const handleLikeClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (onLike) onLike(post.id);
  };

  const toggleComments = (e: React.MouseEvent) => {
      e.stopPropagation();
      setShowComments(!showComments);
  };

  const submitComment = (e: React.FormEvent) => {
      e.preventDefault();
      if (!commentText.trim()) return;
      if (onComment) {
          onComment(post.id, commentText);
          setCommentText('');
      }
  };

  const shareToPlatform = async (platform: string) => {
    // In a real app, this would use deep links or server-side sharing APIs.
    // For this demo, we simulate the action.
    
    // Simulate opening the app/site
    let url = "";
    switch(platform) {
        case 'facebook':
            url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(post.videoUrl || '')}`;
            break;
        case 'twitter':
             url = `https://twitter.com/intent/tweet?url=${encodeURIComponent(post.videoUrl || '')}&text=${encodeURIComponent(post.description)}`;
             break;
        case 'instagram':
        case 'tiktok':
        case 'youtube':
             // These platforms don't support simple web sharing of video files via URL.
             // We'll mimic a "download & open" flow or just copy link.
             // For the demo, we will just copy the link and show a toast.
             await navigator.clipboard.writeText(post.videoUrl || '');
             setCopied(true);
             setTimeout(() => setCopied(false), 2000);
             alert(`To share on ${platform}, the video link has been copied to your clipboard. You can also download the video.`);
             return;
        default:
             return;
    }
    
    if (url) {
        window.open(url, '_blank', 'width=600,height=400');
    }
    setShowShareMenu(false);
  };

  const renderContent = () => {
    if (hasError) {
        return (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 p-6 text-center text-white/50">
                <RefreshCw className="w-10 h-10 mb-3 opacity-50" />
                <p className="text-sm font-bold uppercase tracking-widest mb-1">Session Expired</p>
                <p className="text-xs max-w-[200px]">The video link has expired. Please regenerate this video.</p>
            </div>
        );
    }

    switch (status) {
      case PostStatus.GENERATING:
        return (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 p-6 text-center">
            {/* Background pulsing effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-950 animate-pulse"></div>
            
            {/* Reference Image if available */}
            {post.referenceImageBase64 && (
              <div className="absolute inset-0 z-0 opacity-20 blur-md">
                <img src={`data:image/png;base64,${post.referenceImageBase64}`} alt="Reference" className="w-full h-full object-cover" />
              </div>
            )}

            <div className="relative z-10 flex flex-col items-center gap-4">
              <div className="relative">
                <div className="w-12 h-12 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                <VeoLogo className="w-5 h-5 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <div>
                <p className="text-sm font-bold uppercase tracking-widest text-white mb-1 font-bogle animate-pulse">Generating Scene</p>
                <p className="text-xs text-gray-400 line-clamp-2 px-2 max-w-[200px] mx-auto">"{post.description}"</p>
              </div>
            </div>
             {/* Overlay Gradient for readability */}
             <div className="absolute inset-0 bg-black/30 pointer-events-none" />
          </div>
        );
      case PostStatus.ERROR:
        return (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/80 border border-red-500/30 p-6 text-center">
            <AlertCircle className="w-10 h-10 text-red-500 mb-3 opacity-80" />
            <p className="text-sm font-bold uppercase tracking-widest text-white mb-1 font-bogle">Generation Failed</p>
            <p className="text-xs text-red-300 line-clamp-3 px-2">{post.errorMessage || "An unexpected error occurred."}</p>
          </div>
        );
      case PostStatus.SUCCESS:
      default:
        return (
          <video
            ref={videoRef}
            src={post.videoUrl}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            loop
            muted
            playsInline
            autoPlay // Autoplay muted by default
            onError={handleVideoError}
          />
        );
    }
  };

  return (
    <motion.div
      className="relative w-full h-full rounded-3xl overflow-hidden bg-gray-900/40 border border-white/5 aspect-[9/16] group shadow-2xl shadow-black/50 ring-1 ring-black/50 flex flex-col"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.4, type: 'spring' }}
      layout // Animates layout changes when new items are added
    >
      {status === PostStatus.SUCCESS && post.status /* Check explicitly for new posts */ && (
        <div className="absolute top-4 left-4 z-20 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest text-black flex items-center gap-1 shadow-[0_2px_10px_rgba(0,0,0,0.2)]">
            <Sparkles className="w-3 h-3 text-black" />
            New
        </div>
      )}

      {/* Video or Loading/Error State */}
      <div className="flex-1 relative w-full h-full">
        {renderContent()}
      </div>

      {/* Overlay Gradient (only for success) */}
      {status === PostStatus.SUCCESS && !hasError && (
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/80 pointer-events-none transition-opacity duration-300 group-hover:opacity-90" />
      )}

      {/* Model Badge */}
      <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-black/30 border border-white/10 backdrop-blur-xl px-2.5 py-1.5 rounded-full text-xs font-medium text-white/90 pointer-events-none shadow-lg z-20">
        <VeoLogo className="w-3 h-3 opacity-80" />
        {post.modelTag}
      </div>

      {/* Comment Overlay */}
      <AnimatePresence>
        {showComments && (
            <motion.div 
                initial={{ opacity: 0, y: "100%" }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: "100%" }}
                className="absolute inset-x-0 bottom-0 top-1/4 bg-black/95 backdrop-blur-md z-30 rounded-t-3xl border-t border-white/10 flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-4 border-b border-white/10 flex justify-between items-center">
                    <h3 className="text-sm font-bold text-white">Comments</h3>
                    <button onClick={() => setShowComments(false)} className="p-1 hover:bg-white/10 rounded-full"><AlertCircle className="w-5 h-5 text-white/50 rotate-45" /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {post.comments?.length > 0 ? (
                        post.comments.map(c => (
                            <div key={c.id} className="text-sm">
                                <span className="font-bold text-white mr-2">{c.username}</span>
                                <span className="text-white/80">{c.text}</span>
                            </div>
                        ))
                    ) : (
                        <p className="text-white/30 text-center text-sm mt-10">No comments yet.</p>
                    )}
                </div>
                <form onSubmit={submitComment} className="p-3 border-t border-white/10 flex gap-2">
                    <input 
                        className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm text-white focus:outline-none focus:border-white/30"
                        placeholder="Add a comment..."
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                    />
                    <button type="submit" className="p-2 bg-blue-600 rounded-full text-white disabled:opacity-50" disabled={!commentText.trim()}><Send className="w-4 h-4" /></button>
                </form>
            </motion.div>
        )}
      </AnimatePresence>

      {/* Content Overlay */}
      <div className={`absolute bottom-0 left-0 w-full p-5 flex items-end justify-between z-20 pt-16 bg-gradient-to-t from-black via-black/50 to-transparent transition-opacity duration-300 ${status !== PostStatus.SUCCESS || hasError ? 'opacity-50 pointer-events-none' : ''}`}>
        <div className="flex-1 mr-4 pointer-events-none">
          <div className="flex items-center gap-2.5 mb-2">
            <img src={post.avatarUrl} alt={post.username} className="w-8 h-8 rounded-full border border-white/20 shadow-md" />
            <span className="font-semibold text-sm text-white drop-shadow-md backdrop-blur-[1px]">{post.username}</span>
          </div>
          <p className="text-sm text-gray-200 line-clamp-2 drop-shadow-md font-light leading-snug opacity-90 group-hover:opacity-100 transition-opacity">{post.description}</p>
        </div>

        {/* Actions Sidebar */}
        {status === PostStatus.SUCCESS && !hasError && (
          <div className="flex flex-col gap-3 items-center shrink-0 pointer-events-auto relative">
            
            {/* Like Button */}
            <div className="flex flex-col items-center gap-1">
                 <button 
                    onClick={handleLikeClick}
                    className={`p-3 rounded-full border backdrop-blur-xl transition-all shadow-[0_4px_12px_rgba(0,0,0,0.3)] group-active:scale-90 hover:scale-105 ${post.hasLiked ? 'bg-red-500/20 border-red-500/50 text-red-500' : 'bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/40'}`}
                 >
                     <Heart className={`w-5 h-5 ${post.hasLiked ? 'fill-current' : ''}`} />
                 </button>
                 <span className="text-[10px] font-bold text-white/90 drop-shadow-md">{post.likes}</span>
            </div>

            {/* Comment Button */}
            <div className="flex flex-col items-center gap-1">
                <button 
                    onClick={toggleComments}
                    className="p-3 rounded-full bg-white/10 border border-white/20 backdrop-blur-xl hover:bg-white/20 transition-all text-white shadow-[0_4px_12px_rgba(0,0,0,0.3)] group-active:scale-90 hover:scale-105 hover:border-white/40"
                >
                    <MessageCircle className="w-5 h-5" />
                </button>
                <span className="text-[10px] font-bold text-white/90 drop-shadow-md">{post.comments?.length || 0}</span>
            </div>

             {/* Share Menu Popup */}
            <AnimatePresence>
                {showShareMenu && (
                    <motion.div
                        initial={{ opacity: 0, x: 20, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 20, scale: 0.9 }}
                        className="absolute bottom-14 right-0 bg-neutral-900/95 border border-white/10 backdrop-blur-xl rounded-2xl p-2 flex flex-col gap-1 shadow-xl z-50 w-40"
                    >
                        <p className="px-2 py-1 text-[10px] uppercase font-bold text-white/40 tracking-wider">Share To</p>
                        <button onClick={() => shareToPlatform('facebook')} className="flex items-center gap-3 w-full p-2 hover:bg-white/10 rounded-lg text-sm transition-colors text-white">
                            <Facebook className="w-4 h-4 text-blue-500" /> Facebook
                        </button>
                         <button onClick={() => shareToPlatform('youtube')} className="flex items-center gap-3 w-full p-2 hover:bg-white/10 rounded-lg text-sm transition-colors text-white">
                            <Youtube className="w-4 h-4 text-red-500" /> YouTube
                        </button>
                        <button onClick={() => shareToPlatform('tiktok')} className="flex items-center gap-3 w-full p-2 hover:bg-white/10 rounded-lg text-sm transition-colors text-white">
                            <div className="w-4 h-4 bg-black rounded-full flex items-center justify-center border border-white/20 text-[8px] font-bold">TT</div> TikTok
                        </button>
                        <button onClick={() => shareToPlatform('instagram')} className="flex items-center gap-3 w-full p-2 hover:bg-white/10 rounded-lg text-sm transition-colors text-white">
                            <Instagram className="w-4 h-4 text-pink-500" /> Instagram
                        </button>
                         <button onClick={() => shareToPlatform('twitter')} className="flex items-center gap-3 w-full p-2 hover:bg-white/10 rounded-lg text-sm transition-colors text-white">
                            <Twitter className="w-4 h-4 text-blue-400" /> Twitter
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            <button 
              onClick={handleShareClick}
              className={`p-3 rounded-full border backdrop-blur-xl transition-all shadow-[0_4px_12px_rgba(0,0,0,0.3)] group-active:scale-90 hover:scale-105 ${showShareMenu || copied ? 'bg-white text-black border-white' : 'bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/40'}`}
              title="Share"
            >
               {copied ? <Check className="w-5 h-5" /> : <Share2 className="w-5 h-5" />}
            </button>
            <button 
              onClick={handleDownload}
              className="p-3 rounded-full bg-white/10 border border-white/20 backdrop-blur-xl hover:bg-white/20 transition-all text-white shadow-[0_4px_12px_rgba(0,0,0,0.3)] group-active:scale-90 hover:scale-105 hover:border-white/40"
              title="Download Video"
            >
              <Download className="w-5 h-5" />
            </button>

            {onDelete && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(post.id);
                }}
                className="p-3 rounded-full bg-red-950/60 border border-red-500/30 backdrop-blur-xl hover:bg-red-700/80 transition-all text-red-200 shadow-[0_4px_12px_rgba(0,0,0,0.3)] group-active:scale-90 hover:scale-105"
                title="Delete Upload / Creation"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default VideoCard;
