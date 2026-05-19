
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { AnimatePresence, motion } from 'framer-motion';
import React, { useCallback, useEffect, useState } from 'react';
import ApiKeyDialog from './components/ApiKeyDialog';
import BottomPromptBar from './components/BottomPromptBar';
import VideoCard from './components/VideoCard';
import LandingPage from './components/LandingPage';
import SettingsDialog from './components/SettingsDialog';
import CoursePage from './components/CoursePage';
import ScriptCreator from './components/ScriptCreator';
import GalleryPage from './components/GalleryPage';
import TrendingPage from './components/TrendingPage';
import VideoAnalyzer from './components/VideoAnalyzer';
import VoiceControl from './components/VoiceControl';
import StoryboardPage from './components/StoryboardPage';
import ProfilePage from './components/ProfilePage';
import CoverCreator from './components/CoverCreator';
import { generateVideo } from './services/geminiService';
import { AppView, FeedPost, GenerateVideoParams, PostStatus, UserSettings } from './types';
import { Clapperboard, Settings, GraduationCap, LayoutGrid, Home, Flame, Scissors, User, Image as ImageIcon, ArrowLeft } from 'lucide-react';

// Type definition for the AI Studio injection
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    aistudio?: AIStudio;
  }
}

// Sample video URLs for the feed (public domain/creative commons from Mixkit for demo reliability)
const sampleVideos: FeedPost[] = [
  {
    id: 's1',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-sign-1232-large.mp4',
    username: 'alisa_fortin',
    avatarUrl: 'https://api.dicebear.com/9.x/fun-emoji/svg?seed=Maria',
    description: 'Sipping coffee at a cyberpunk cafe',
    modelTag: 'Veo Fast',
    status: PostStatus.SUCCESS,
    likes: 124,
    hasLiked: false,
    comments: []
  },
  {
    id: 's2',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-dog-catching-a-ball-1225-large.mp4',
    username: 'osanseviero',
    avatarUrl: 'https://api.dicebear.com/9.x/fun-emoji/svg?seed=Emery',
    description: 'At a llama petting zoo',
    modelTag: 'Veo Fast',
    status: PostStatus.SUCCESS,
    likes: 89,
    hasLiked: false,
    comments: []
  },
  {
    id: 's3',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-hands-holding-a-smart-phone-with-a-green-screen-1153-large.mp4',
    username: 'ammaar',
    avatarUrl: 'https://api.dicebear.com/9.x/fun-emoji/svg?seed=Kimberly',
    description: 'At a red carpet ceremony',
    modelTag: 'Veo',
    status: PostStatus.SUCCESS,
    likes: 450,
    hasLiked: false,
    comments: []
  },
    {
    id: 's4',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-a-beautiful-forest-1186-large.mp4',
    username: 'OfficialLoganK',
    avatarUrl: 'https://api.dicebear.com/9.x/fun-emoji/svg?seed=Jocelyn',
    description: 'Vibe coding on a mountain.',
    modelTag: 'Veo Fast',
    status: PostStatus.SUCCESS,
    likes: 210,
    hasLiked: false,
    comments: []
  },
    {
    id: 's5',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-tree-branches-in-the-breeze-1188-large.mp4',
    username: 'kat_kampf',
    avatarUrl: 'https://api.dicebear.com/9.x/fun-emoji/svg?seed=Jameson',
    description: 'Exploring a majestic temple in a forest.',
    modelTag: 'Veo Fast',
    status: PostStatus.SUCCESS,
    likes: 330,
    hasLiked: false,
    comments: []
  },
    {
    id: 's6',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-concert-lights-2276-large.mp4',
    username: 'joshwoodward',
    avatarUrl: 'https://api.dicebear.com/9.x/fun-emoji/svg?seed=Jade',
    description: 'On the Google Keynote stage.',
    modelTag: 'Veo Fast',
    status: PostStatus.SUCCESS,
    likes: 560,
    hasLiked: false,
    comments: []
  },    
];

const App: React.FC = () => {
  // Load User Generated Posts from localStorage for initial state
  const getInitialFeed = (): FeedPost[] => {
    const savedPosts = localStorage.getItem('reelsCreatorUserPosts');
    if (savedPosts) {
      try {
        const parsedPosts = JSON.parse(savedPosts);
        if (Array.isArray(parsedPosts)) {
          return [...parsedPosts, ...sampleVideos];
        }
      } catch (e) {
        console.error("Failed to load user posts", e);
      }
    }
    return sampleVideos;
  };

  const [feed, setFeed] = useState<FeedPost[]>(getInitialFeed);
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [showLandingPage, setShowLandingPage] = useState(true);
  const [errorToast, setErrorToast] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<AppView>(AppView.FEED);
  
  // Prompt state management to allow Trending page to set it
  const [forcedPrompt, setForcedPrompt] = useState<string | undefined>(undefined);
  
  // User Profile Settings
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);

  // Load settings on mount
  useEffect(() => {
    // Load Settings
    const savedSettings = localStorage.getItem('reelsCreatorSettings');
    if (savedSettings) {
      try {
        setUserSettings(JSON.parse(savedSettings));
      } catch (e) {
        console.error("Failed to load settings", e);
      }
    }
  }, []);

  // Save settings handler
  const handleSaveSettings = (settings: UserSettings) => {
    setUserSettings(settings);
    localStorage.setItem('reelsCreatorSettings', JSON.stringify(settings));
    setShowSettingsDialog(false);
  };

  // Auto-dismiss error toast
  useEffect(() => {
    if (errorToast) {
      const timer = setTimeout(() => setErrorToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [errorToast]);

  const saveUserPost = (post: FeedPost) => {
     // Get existing
     const savedPostsStr = localStorage.getItem('reelsCreatorUserPosts');
     let savedPosts: FeedPost[] = [];
     if (savedPostsStr) {
         try {
             savedPosts = JSON.parse(savedPostsStr);
         } catch (e) { console.error(e); }
     }
     // Add new or update
     const index = savedPosts.findIndex(p => p.id === post.id);
     if (index >= 0) {
         savedPosts[index] = post;
     } else {
         savedPosts.unshift(post);
     }
     // Save back (limit to last 20 to avoid quota issues for this demo)
     localStorage.setItem('reelsCreatorUserPosts', JSON.stringify(savedPosts.slice(0, 20)));
  };

  const updateFeedPost = (id: string, updates: Partial<FeedPost>) => {
    setFeed(prevFeed => {
      const newFeed = prevFeed.map(post => {
        if (post.id === id) {
            const updatedPost = { ...post, ...updates };
            // If it's a user generated post, save it to local storage
            if (updatedPost.isUserGenerated) {
                saveUserPost(updatedPost);
            }
            return updatedPost;
        }
        return post;
      });
      return newFeed;
    });
  };

  const handleLike = (postId: string) => {
      setFeed(prev => prev.map(p => {
          if (p.id === postId) {
              const newLiked = !p.hasLiked;
              return {
                  ...p,
                  hasLiked: newLiked,
                  likes: newLiked ? p.likes + 1 : p.likes - 1
              };
          }
          return p;
      }));
  };

  const handleComment = (postId: string, text: string) => {
      const username = userSettings?.displayName || "You";
      setFeed(prev => prev.map(p => {
          if (p.id === postId) {
              const commentId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
              return {
                  ...p,
                  comments: [...(p.comments || []), { id: commentId, username, text, timestamp: Date.now() }]
              };
          }
          return p;
      }));
  };

  const handleManualUpload = (file: File) => {
      const objectUrl = URL.createObjectURL(file);
      const newPostId = `upload-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const newPost: FeedPost = {
          id: newPostId,
          videoUrl: objectUrl,
          username: userSettings?.displayName || 'You',
          avatarUrl: userSettings?.avatarBase64 || 'https://api.dicebear.com/7.x/avataaars/svg?seed=you',
          description: "Uploaded from my gallery",
          modelTag: "Uploaded",
          status: PostStatus.SUCCESS,
          timestamp: Date.now(),
          isUserGenerated: true,
          likes: 0,
          hasLiked: false,
          comments: []
      };
      setFeed(prev => [newPost, ...prev]);
      saveUserPost(newPost);
  };

  const processGeneration = async (postId: string, params: GenerateVideoParams) => {
    try {
      const { url } = await generateVideo(params);
      updateFeedPost(postId, { videoUrl: url, status: PostStatus.SUCCESS });
    } catch (error) {
      console.error('Video generation failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error.';
      updateFeedPost(postId, { status: PostStatus.ERROR, errorMessage: errorMessage });
      
      // Global error toast for specific API key issues
      if (typeof errorMessage === 'string' && (
          errorMessage.includes('API_KEY_INVALID') || 
          errorMessage.includes('permission denied') ||
          errorMessage.includes('Requested entity was not found')
      )) {
        setErrorToast('Invalid API key or permissions. Please check billing.');
      }
    }
  };

  const handleGenerate = useCallback(async (params: GenerateVideoParams) => {
    // Check if user has a custom key set (prioritize this over window.aistudio)
    const hasCustomKey = userSettings?.apiKey && userSettings.apiKey.trim().length > 0;

    // API Key Check - deferred until generation attempt
    // Only force aistudio key selection if NO custom key is provided
    if (!hasCustomKey && window.aistudio) {
      try {
        if (!(await window.aistudio.hasSelectedApiKey())) {
          setShowApiKeyDialog(true);
          return;
        }
      } catch (error) {
        setShowApiKeyDialog(true);
        return;
      }
    }
    
    // Clear forced prompt after use
    setForcedPrompt(undefined);

    // Automatically switch to Gallery to show progress if we are in course or scripts page
    if (currentView === AppView.COURSE || currentView === AppView.SCRIPTS || currentView === AppView.TRENDING || currentView === AppView.ANALYZE) {
        setCurrentView(AppView.GALLERY);
    }

    const newPostId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const refImage = params.referenceImages?.[0]?.base64;

    // Use User Settings for profile info if available
    const postUsername = userSettings?.displayName || 'you';
    const postAvatar = userSettings?.avatarBase64 || 'https://api.dicebear.com/7.x/avataaars/svg?seed=you';

    // Create new post object with GENERATING status
    const newPost: FeedPost = {
      id: newPostId,
      username: postUsername,
      avatarUrl: postAvatar,
      description: params.prompt,
      modelTag: params.model === 'veo-3.1-fast-generate-preview' ? 'Veo Fast' : 'Veo',
      status: PostStatus.GENERATING,
      referenceImageBase64: refImage,
      isUserGenerated: true,
      timestamp: Date.now(),
      likes: 0,
      hasLiked: false,
      comments: []
    };

    // Save initial state so it appears in gallery immediately
    saveUserPost(newPost);

    // Prepend to feed immediately
    setFeed(prev => [newPost, ...prev]);

    // Start generation in background
    processGeneration(newPostId, params);

  }, [userSettings, currentView]);

  const handleApiKeyDialogContinue = async () => {
    setShowApiKeyDialog(false);
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
    }
  };

  const handleRemixTrend = (prompt: string) => {
    // Switch to Home view and populate prompt bar
    setCurrentView(AppView.FEED); // Or stay on Trending? Better to go to Feed/Creation context.
    // We need a way to pass this prompt to the BottomPromptBar.
    // We will use a state variable for this.
    setForcedPrompt(prompt);
  };
  
  // Voice Navigation Callback
  const handleVoiceNavigate = (view: AppView) => {
      setCurrentView(view);
  };

  // If we are showing the landing page
  if (showLandingPage) {
    return <LandingPage onEnter={() => setShowLandingPage(false)} />;
  }

  const renderView = () => {
      switch(currentView) {
          case AppView.GALLERY:
              return <GalleryPage posts={feed} />;
          case AppView.SCRIPTS:
              return <ScriptCreator onBack={() => setCurrentView(AppView.FEED)} />;
          case AppView.COURSE:
              return <CoursePage />;
          case AppView.TRENDING:
              return <TrendingPage userSettings={userSettings} onRemixTrend={handleRemixTrend} />;
          case AppView.ANALYZE:
              return <VideoAnalyzer onBack={() => setCurrentView(AppView.FEED)} />;
          case AppView.EDITOR:
              return <StoryboardPage galleryPosts={feed} onBack={() => setCurrentView(AppView.FEED)} />;
          case AppView.PROFILE:
              return <ProfilePage userSettings={userSettings} posts={feed} onUpload={handleManualUpload} onEditProfile={() => setShowSettingsDialog(true)} />;
          case AppView.COVER_CREATOR:
              return <CoverCreator onBack={() => setCurrentView(AppView.FEED)} />;
          case AppView.FEED:
          default:
              return (
                <div className="w-full max-w-[1600px] mx-auto p-4 md:p-6 pb-48 relative z-10">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                        <AnimatePresence initial={false}>
                        {feed.map((post) => (
                            <VideoCard key={post.id} post={post} onLike={handleLike} onComment={handleComment} />
                        ))}
                        </AnimatePresence>
                    </div>
                </div>
              );
      }
  };

  return (
    <div className="h-screen w-screen bg-black text-white flex flex-col overflow-hidden font-sans selection:bg-white/20 selection:text-white">
      {showApiKeyDialog && (
        <ApiKeyDialog onContinue={handleApiKeyDialogContinue} />
      )}

      {showSettingsDialog && (
        <SettingsDialog 
            currentSettings={userSettings} 
            onSave={handleSaveSettings}
            onClose={() => setShowSettingsDialog(false)}
        />
      )}
      
      {/* Error Toast */}
      <AnimatePresence>
        {errorToast && (
            <motion.div 
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 24, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="fixed top-0 left-1/2 -translate-x-1/2 z-[60] bg-neutral-900/80 border border-white/10 text-white px-5 py-3 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-xl max-w-md text-center text-sm font-medium flex items-center gap-3"
            >
                <div className="w-2 h-2 rounded-full bg-red-500 shrink-0 animate-pulse"></div>
                {errorToast}
            </motion.div>
        )}
      </AnimatePresence>
      
      {/* Voice Control Global Component - Hide on creation views */}
      {![AppView.EDITOR, AppView.SCRIPTS, AppView.COVER_CREATOR, AppView.ANALYZE].includes(currentView) && (
        <VoiceControl onNavigate={handleVoiceNavigate} />
      )}

      <main className="flex-1 h-full relative overflow-y-auto overflow-x-hidden no-scrollbar bg-black flex flex-col">
        {/* Ambient background light */}
        <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_0%,_rgba(255,255,255,0.03),_transparent_70%)]"></div>

        {/* Top Bar - Hide on creation views to give more space */}
        {![AppView.EDITOR, AppView.SCRIPTS, AppView.COVER_CREATOR, AppView.ANALYZE].includes(currentView) && (
          <header className="sticky top-0 z-30 w-full px-6 py-4 pointer-events-none">
              {/* Glass background for header */}
              <div className="absolute inset-0 bg-black/80 backdrop-blur-xl border-b border-white/5" />
              
              <div className="relative flex items-center justify-between text-white pointer-events-auto max-w-[1600px] mx-auto w-full">
                  
                  {/* Logo & Brand & Back Button */}
                  <div className="flex items-center gap-4">
                      {/* Back Button - Only shows when not on FEED */}
                      {currentView !== AppView.FEED && (
                          <button 
                              onClick={() => setCurrentView(AppView.FEED)}
                              className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-all border border-white/5 text-white/80 hover:text-white group"
                              title="Back to Feed"
                          >
                              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
                          </button>
                      )}

                      <div className="flex items-center gap-3.5 cursor-pointer group" onClick={() => setCurrentView(AppView.FEED)}>
                          <Clapperboard className="w-7 h-7 text-white group-hover:text-purple-400 transition-colors" />
                          <div className="flex flex-col">
                              <h1 className="font-bogle text-2xl text-white tracking-wide uppercase leading-none">Reels Creator</h1>
                              <span className="text-[10px] text-white/40 tracking-widest hidden md:block">BY SETH ANDERSON</span>
                          </div>
                      </div>
                  </div>

                  {/* Navigation - Centered (Desktop) / Hidden Mobile (Can handle mobile responsive differently, but keeping simple for now) */}
                  <nav className="hidden md:flex items-center gap-1 bg-white/5 rounded-full p-1 border border-white/10">
                      <button 
                          onClick={() => setCurrentView(AppView.FEED)}
                          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${currentView === AppView.FEED ? 'bg-white text-black shadow-md' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
                      >
                          Feed
                      </button>
                      <button 
                           onClick={() => setCurrentView(AppView.TRENDING)}
                           className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${currentView === AppView.TRENDING ? 'bg-white text-black shadow-md' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
                      >
                          Trending
                      </button>
                      <button 
                           onClick={() => setCurrentView(AppView.EDITOR)}
                           className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${currentView === AppView.EDITOR ? 'bg-white text-black shadow-md' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
                      >
                          Editor
                      </button>
                      <button 
                           onClick={() => setCurrentView(AppView.COVER_CREATOR)}
                           className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${currentView === AppView.COVER_CREATOR ? 'bg-white text-black shadow-md' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
                      >
                          Covers
                      </button>
                      <button 
                           onClick={() => setCurrentView(AppView.GALLERY)}
                           className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${currentView === AppView.GALLERY ? 'bg-white text-black shadow-md' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
                      >
                          Gallery
                      </button>
                      <button 
                           onClick={() => setCurrentView(AppView.SCRIPTS)}
                           className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${currentView === AppView.SCRIPTS ? 'bg-white text-black shadow-md' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
                      >
                          Scripts
                      </button>
                  </nav>

                  {/* Right Actions */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setCurrentView(AppView.COURSE)}
                      className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full text-xs font-bold uppercase tracking-wider hover:scale-105 transition-transform shadow-lg shadow-purple-900/20"
                    >
                      <GraduationCap className="w-4 h-4" />
                      Learn More
                    </button>
                    
                     <button 
                      onClick={() => setCurrentView(AppView.PROFILE)}
                      className={`p-2 rounded-full transition-colors backdrop-blur-md border border-white/5 group ${currentView === AppView.PROFILE ? 'bg-white text-black' : 'bg-white/10 hover:bg-white/20 text-white/80'}`}
                      title="Profile"
                    >
                      <User className="w-5 h-5 group-hover:scale-105 transition-transform" />
                    </button>

                    <button 
                      onClick={() => setShowSettingsDialog(true)}
                      className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors backdrop-blur-md border border-white/5 group"
                      title="Creator Settings"
                    >
                      <Settings className="w-5 h-5 text-white/80 group-hover:text-white group-hover:rotate-90 transition-all duration-500" />
                    </button>
                  </div>
              </div>

              {/* Mobile Nav (Simple Bottom Row styled as sub-header for now to ensure visibility) */}
              <div className="md:hidden flex justify-center mt-3 relative pointer-events-auto">
                   <nav className="flex items-center gap-1 bg-white/5 rounded-xl p-1 border border-white/10 backdrop-blur-md overflow-x-auto no-scrollbar max-w-full">
                      <button 
                          onClick={() => setCurrentView(AppView.FEED)}
                          className={`p-2 rounded-lg transition-all ${currentView === AppView.FEED ? 'bg-white text-black' : 'text-white/60'}`}
                      >
                          <Home className="w-4 h-4" />
                      </button>
                      <button 
                           onClick={() => setCurrentView(AppView.TRENDING)}
                           className={`p-2 rounded-lg transition-all ${currentView === AppView.TRENDING ? 'bg-white text-black' : 'text-white/60'}`}
                      >
                          <Flame className="w-4 h-4" />
                      </button>
                      <button 
                           onClick={() => setCurrentView(AppView.EDITOR)}
                           className={`p-2 rounded-lg transition-all ${currentView === AppView.EDITOR ? 'bg-white text-black' : 'text-white/60'}`}
                      >
                          <Scissors className="w-4 h-4" />
                      </button>
                      <button 
                           onClick={() => setCurrentView(AppView.COVER_CREATOR)}
                           className={`p-2 rounded-lg transition-all ${currentView === AppView.COVER_CREATOR ? 'bg-white text-black' : 'text-white/60'}`}
                      >
                          <ImageIcon className="w-4 h-4" />
                      </button>
                      <button 
                           onClick={() => setCurrentView(AppView.GALLERY)}
                           className={`p-2 rounded-lg transition-all ${currentView === AppView.GALLERY ? 'bg-white text-black' : 'text-white/60'}`}
                      >
                          <LayoutGrid className="w-4 h-4" />
                      </button>
                       <button 
                           onClick={() => setCurrentView(AppView.PROFILE)}
                           className={`p-2 rounded-lg transition-all ${currentView === AppView.PROFILE ? 'bg-white text-black' : 'text-white/60'}`}
                      >
                          <User className="w-4 h-4" />
                      </button>
                  </nav>
              </div>
          </header>
        )}

        {/* Content Area */}
        {renderView()}

      </main>

      {/* Hide prompt bar if in editor or other full-screen creation modes */}
      {![AppView.EDITOR, AppView.SCRIPTS, AppView.COVER_CREATOR, AppView.ANALYZE].includes(currentView) && (
        <BottomPromptBar 
          onGenerate={handleGenerate} 
          userSettings={userSettings} 
          forcedPrompt={forcedPrompt}
        />
      )}
    </div>
  );
};

export default App;
