
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { AnimatePresence, Reorder, motion } from 'framer-motion';
import { Film, GripVertical, Play, Plus, Trash2, Type, Pause, X, Download, Share2, Check } from 'lucide-react';
import React, { useState, useRef, useEffect } from 'react';
import { FeedPost, StoryboardClip } from '../types';

interface StoryboardPageProps {
  galleryPosts: FeedPost[];
}

const StoryboardPage: React.FC<StoryboardPageProps> = ({ galleryPosts }) => {
  const [clips, setClips] = useState<StoryboardClip[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentClipIndex, setCurrentClipIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Text Editing
  const [editingClipId, setEditingClipId] = useState<string | null>(null);
  const [textInput, setTextInput] = useState('');

  // Export State
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportComplete, setExportComplete] = useState(false);
  const [exportSettings, setExportSettings] = useState({ resolution: '1080p', format: 'mp4' });

  // Filter available posts (only success ones)
  const availablePosts = galleryPosts.filter(p => p.status === 'success' && p.videoUrl);

  const handleAddClip = (post: FeedPost) => {
      const newClip: StoryboardClip = {
          id: Date.now().toString() + Math.random().toString().slice(2, 6),
          sourcePostId: post.id,
      };
      setClips([...clips, newClip]);
  };

  const handleRemoveClip = (id: string) => {
      setClips(clips.filter(c => c.id !== id));
      if (currentClipIndex >= clips.length - 1) {
          setCurrentClipIndex(Math.max(0, clips.length - 2));
      }
  };

  const handleVideoEnded = () => {
      if (currentClipIndex < clips.length - 1) {
          setCurrentClipIndex(prev => prev + 1);
      } else {
          setIsPlaying(false);
          setCurrentClipIndex(0);
      }
  };

  useEffect(() => {
      if (videoRef.current) {
          if (isPlaying) {
              videoRef.current.play().catch(e => console.error("Play failed", e));
          } else {
              videoRef.current.pause();
          }
      }
  }, [currentClipIndex, isPlaying]);

  const currentClip = clips[currentClipIndex];
  const currentPost = currentClip ? availablePosts.find(p => p.id === currentClip.sourcePostId) : null;

  const toggleTextOverlay = (clipId: string) => {
     if (editingClipId === clipId) {
         setEditingClipId(null);
     } else {
         const clip = clips.find(c => c.id === clipId);
         setEditingClipId(clipId);
         setTextInput(clip?.textOverlay?.content || '');
     }
  };

  const saveTextOverlay = () => {
      if (editingClipId) {
          setClips(clips.map(c => {
              if (c.id === editingClipId) {
                  return {
                      ...c,
                      textOverlay: textInput ? { content: textInput, position: 'center', style: 'modern' } : undefined
                  };
              }
              return c;
          }));
          setEditingClipId(null);
      }
  };

  const startExport = () => {
    setIsExporting(true);
    setExportProgress(0);
    setShowExportMenu(false);

    // Simulate export process
    const interval = setInterval(() => {
        setExportProgress(prev => {
            if (prev >= 100) {
                clearInterval(interval);
                setIsExporting(false);
                setExportComplete(true);
                setTimeout(() => setExportComplete(false), 3000); // Hide toast after 3s
                return 100;
            }
            return prev + (Math.random() * 10);
        });
    }, 200);
  };

  return (
    <div className="flex h-full overflow-hidden relative">
      
      {/* Export Overlay */}
      <AnimatePresence>
        {isExporting && (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-8"
            >
                <div className="w-full max-w-md space-y-4 text-center">
                    <h2 className="text-2xl font-bogle text-white animate-pulse">Rendering Video...</h2>
                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500 transition-all duration-200" style={{ width: `${exportProgress}%` }}></div>
                    </div>
                    <p className="text-white/50 text-sm font-mono">{Math.round(exportProgress)}% Complete</p>
                </div>
            </motion.div>
        )}
        
        {exportComplete && (
             <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="absolute top-6 left-1/2 -translate-x-1/2 z-50 bg-green-500 text-black px-6 py-3 rounded-full font-bold shadow-2xl flex items-center gap-2"
            >
                <Check className="w-5 h-5" />
                Export Successful!
            </motion.div>
        )}
      </AnimatePresence>


      {/* Sidebar: Library */}
      <div className="w-80 bg-[#0f0f0f] border-r border-white/10 flex flex-col h-full overflow-hidden shrink-0">
          <div className="p-4 border-b border-white/10 flex items-center gap-2">
              <Film className="w-4 h-4 text-purple-400" />
              <h2 className="font-bold text-sm text-white">Clip Library</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-3 grid grid-cols-2 gap-3 content-start">
              {availablePosts.length === 0 ? (
                  <div className="col-span-2 text-center text-white/30 py-10 text-xs">
                      No videos in gallery. Generate some first!
                  </div>
              ) : (
                  availablePosts.map(post => (
                      <div 
                        key={post.id} 
                        className="aspect-[9/16] bg-black rounded-lg overflow-hidden border border-white/10 relative group cursor-pointer hover:border-white/50 transition-all"
                        onClick={() => handleAddClip(post)}
                      >
                          <video src={post.videoUrl} className="w-full h-full object-cover" muted />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <Plus className="w-6 h-6 text-white" />
                          </div>
                      </div>
                  ))
              )}
          </div>
      </div>

      {/* Main Area: Preview & Timeline */}
      <div className="flex-1 flex flex-col h-full bg-black">
          
          {/* Toolbar */}
          <div className="h-14 border-b border-white/10 flex items-center justify-between px-6 bg-[#0a0a0a]">
              <div className="text-xs text-white/40 font-mono">
                  {clips.length} Clips • {Math.round(clips.length * 4.5)}s Total Est.
              </div>
              
              <div className="relative">
                  <button 
                    onClick={() => setShowExportMenu(!showExportMenu)}
                    disabled={clips.length === 0}
                    className={`px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-all ${clips.length === 0 ? 'bg-white/5 text-white/30 cursor-not-allowed' : 'bg-white text-black hover:bg-gray-200'}`}
                  >
                      <Download className="w-4 h-4" />
                      Export
                  </button>
                  
                  <AnimatePresence>
                      {showExportMenu && (
                          <motion.div 
                              initial={{ opacity: 0, y: 10, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 10, scale: 0.95 }}
                              className="absolute top-full right-0 mt-2 w-64 bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl p-4 z-50 ring-1 ring-white/10"
                          >
                               <h3 className="text-sm font-bold text-white mb-4">Export Settings</h3>
                               
                               <div className="space-y-4 mb-6">
                                   <div>
                                       <label className="block text-xs text-gray-400 mb-2">Resolution</label>
                                       <div className="flex gap-2">
                                           {['720p', '1080p', '4K'].map(res => (
                                               <button 
                                                key={res}
                                                onClick={() => setExportSettings(s => ({...s, resolution: res}))}
                                                className={`flex-1 py-1.5 rounded-md text-xs font-medium border ${exportSettings.resolution === res ? 'bg-white text-black border-white' : 'bg-transparent text-gray-400 border-white/10 hover:border-white/30'}`}
                                               >
                                                   {res}
                                               </button>
                                           ))}
                                       </div>
                                   </div>
                                   <div>
                                       <label className="block text-xs text-gray-400 mb-2">Format</label>
                                       <div className="flex gap-2">
                                           {['MP4', 'MOV'].map(fmt => (
                                               <button 
                                                key={fmt}
                                                onClick={() => setExportSettings(s => ({...s, format: fmt}))}
                                                className={`flex-1 py-1.5 rounded-md text-xs font-medium border ${exportSettings.format === fmt ? 'bg-white text-black border-white' : 'bg-transparent text-gray-400 border-white/10 hover:border-white/30'}`}
                                               >
                                                   {fmt}
                                               </button>
                                           ))}
                                       </div>
                                   </div>
                               </div>

                               <button 
                                onClick={startExport}
                                className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors"
                               >
                                   <Share2 className="w-4 h-4" />
                                   Export & Share
                               </button>
                          </motion.div>
                      )}
                  </AnimatePresence>
              </div>
          </div>

          {/* Preview Window */}
          <div className="flex-1 flex items-center justify-center p-6 relative bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.05),_transparent_70%)]">
              {currentPost ? (
                  <div className="relative aspect-[9/16] h-full max-h-[600px] bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                       <video 
                          ref={videoRef}
                          src={currentPost.videoUrl} 
                          className="w-full h-full object-cover" 
                          onEnded={handleVideoEnded}
                          playsInline
                          key={currentPost.id} // Force reload on change
                       />
                       
                       {/* Overlay Rendering */}
                       {currentClip?.textOverlay && (
                           <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                               <h2 className="text-4xl font-bogle text-white drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] text-center px-4">
                                   {currentClip.textOverlay.content}
                               </h2>
                           </div>
                       )}

                       {/* Controls Overlay */}
                       <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-black/60 backdrop-blur-md px-6 py-3 rounded-full border border-white/10 opacity-0 hover:opacity-100 transition-opacity duration-300">
                            <button 
                                onClick={() => setIsPlaying(!isPlaying)}
                                className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 transition-transform"
                            >
                                {isPlaying ? <Pause className="w-4 h-4 fill-black" /> : <Play className="w-4 h-4 fill-black ml-0.5" />}
                            </button>
                            <div className="text-xs font-mono text-white/70">
                                {currentClipIndex + 1} / {clips.length}
                            </div>
                       </div>
                  </div>
              ) : (
                  <div className="text-center text-white/30">
                      <Film className="w-16 h-16 mx-auto mb-4 opacity-20" />
                      <p>Drag clips from the library to start editing</p>
                  </div>
              )}
          </div>

          {/* Timeline Editor */}
          <div className="h-64 bg-[#0f0f0f] border-t border-white/10 flex flex-col">
              <div className="p-3 border-b border-white/5 flex justify-between items-center">
                  <span className="text-xs font-bold uppercase tracking-widest text-white/50 pl-2">Timeline</span>
              </div>
              
              <div className="flex-1 overflow-x-auto p-4 flex gap-4 items-center">
                  <Reorder.Group axis="x" values={clips} onReorder={setClips} className="flex gap-4 h-full items-center">
                      {clips.map((clip, index) => {
                          const post = availablePosts.find(p => p.id === clip.sourcePostId);
                          if (!post) return null;

                          const isActive = index === currentClipIndex;
                          const isEditing = editingClipId === clip.id;

                          return (
                              <Reorder.Item key={clip.id} value={clip}>
                                  <div className={`w-32 aspect-[9/16] bg-neutral-900 rounded-lg border relative group shrink-0 transition-all ${isActive ? 'border-purple-500 ring-2 ring-purple-500/30' : 'border-white/10 hover:border-white/30'}`}>
                                      <img src={post.referenceImageBase64 ? `data:image/png;base64,${post.referenceImageBase64}` : post.avatarUrl} className="w-full h-full object-cover opacity-60" />
                                      
                                      <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <button 
                                            onClick={(e) => { e.stopPropagation(); handleRemoveClip(clip.id); }}
                                            className="p-1.5 bg-black/60 rounded-full hover:bg-red-500/80 text-white"
                                          >
                                              <Trash2 className="w-3 h-3" />
                                          </button>
                                          <button 
                                            onClick={(e) => { e.stopPropagation(); toggleTextOverlay(clip.id); }}
                                            className={`p-1.5 rounded-full text-white ${clip.textOverlay ? 'bg-purple-500' : 'bg-black/60 hover:bg-white/20'}`}
                                          >
                                              <Type className="w-3 h-3" />
                                          </button>
                                      </div>

                                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
                                           <GripVertical className="w-6 h-6 text-white/50" />
                                      </div>

                                      {/* Text Edit Overlay */}
                                      {isEditing && (
                                          <div className="absolute inset-0 bg-black/90 z-20 flex flex-col items-center justify-center p-2">
                                              <input 
                                                autoFocus
                                                value={textInput}
                                                onChange={(e) => setTextInput(e.target.value)}
                                                className="w-full bg-transparent border-b border-white/30 text-white text-xs text-center focus:outline-none focus:border-purple-500 mb-2"
                                                placeholder="Overlay Text"
                                              />
                                              <div className="flex gap-2">
                                                  <button onClick={saveTextOverlay} className="bg-green-500/20 text-green-400 p-1 rounded hover:bg-green-500/40"><Plus className="w-3 h-3" /></button>
                                                  <button onClick={() => setEditingClipId(null)} className="bg-red-500/20 text-red-400 p-1 rounded hover:bg-red-500/40"><X className="w-3 h-3" /></button>
                                              </div>
                                          </div>
                                      )}
                                      
                                      {/* Indicator if text exists */}
                                      {clip.textOverlay && !isEditing && (
                                          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 px-1.5 py-0.5 rounded text-[8px] text-white truncate max-w-[90%] border border-white/10">
                                              {clip.textOverlay.content}
                                          </div>
                                      )}
                                  </div>
                              </Reorder.Item>
                          );
                      })}
                      
                      {clips.length === 0 && (
                          <div className="w-32 h-full flex items-center justify-center border-2 border-dashed border-white/10 rounded-lg text-white/20 text-xs">
                              Drag clips here
                          </div>
                      )}
                  </Reorder.Group>
              </div>
          </div>
      </div>
    </div>
  );
};

export default StoryboardPage;
