/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { AnimatePresence, motion } from 'framer-motion';
import React, { useCallback, useEffect, useState } from 'react';
import ApiKeyDialog from './components/ApiKeyDialog';
import BottomPromptBar from './components/BottomPromptBar';
import VideoCard from './components/VideoCard';
import SingleFeed from './components/SingleFeed';
import Sidebar from './components/Sidebar';
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
import AvatarCreator from './components/AvatarCreator';
import ComposerCanvas from './components/ComposerCanvas';
import { generateVideo } from './services/geminiService';
import { AppView, FeedMode, FeedPost, GenerateVideoParams, PostStatus, UserSettings } from './types';
import { 
  Settings, 
  LayoutGrid, 
  User, 
  ArrowLeft, 
  Menu, 
  Sparkles,
  Smartphone
} from 'lucide-react';

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
    description: 'Sipping coffee at a cyberpunk cafe with holographic rain',
    prompt: 'Cinematic cyberpunk cafe in Neo Tokyo, neon reflections in puddle, 4k photorealistic',
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
    description: 'Playful golden retriever catching a glowing neon disc at sunset',
    prompt: 'Slow motion golden retriever jumping to catch a glowing disc in golden hour park',
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
    description: 'Futuristic AI hologram smartphone interface hovering over hands',
    prompt: 'Futuristic smartphone with 3D holographic interface projection, sci-fi luxury',
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
    description: 'FPV drone dive through misty mountain pine forests at sunrise',
    prompt: 'FPV high speed drone footage diving through evergreen mountain fog, cinematic lighting',
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
    description: 'Ancient mystical bamboo temple garden swaying in gentle wind',
    prompt: 'Ancient zen temple with swaying cherry blossoms and soft volumetric sunlight',
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
    description: 'Epic stadium EDM concert with lasers, pyro, and massive crowd energy',
    prompt: 'Stadium concert stage with strobe lights, lasers, pyro, energetic audience',
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
  
  // Feed Display Mode: 'grid' (multi-column) or 'single' (TikTok-style vertical reel)
  const [feedMode, setFeedMode] = useState<FeedMode>('grid');

  // Sidebar collapsed / mobile drawer states
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  
  // Prompt state management to allow Trending / SingleFeed to set it
  const [forcedPrompt, setForcedPrompt] = useState<string | undefined>(undefined);
  
  // User Profile Settings
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);

  // Load settings on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('reelsCreatorSettings');
    if (savedSettings) {
      try {
        setUserSettings(JSON.parse(savedSettings));
      } catch (e) {
        console.error("Failed to load settings", e);
      }
    }

    const savedFeedMode = localStorage.getItem('reelsCreatorFeedMode');
    if (savedFeedMode === 'grid' || savedFeedMode === 'single') {
      setFeedMode(savedFeedMode as FeedMode);
    }
  }, []);

  // Save settings handler
  const handleSaveSettings = (settings: UserSettings) => {
    setUserSettings(settings);
    localStorage.setItem('reelsCreatorSettings', JSON.stringify(settings));
    setShowSettingsDialog(false);
  };

  const handleToggleFeedMode = (mode: FeedMode) => {
    setFeedMode(mode);
    localStorage.setItem('reelsCreatorFeedMode', mode);
  };

  // Auto-dismiss error toast
  useEffect(() => {
    if (errorToast) {
       const timer = setTimeout(() => setErrorToast(null), 10000);
       return () => clearTimeout(timer);
    }
  }, [errorToast]);

  const saveUserPost = (post: FeedPost) => {
     const savedPostsStr = localStorage.getItem('reelsCreatorUserPosts');
     let savedPosts: FeedPost[] = [];
     if (savedPostsStr) {
         try {
             savedPosts = JSON.parse(savedPostsStr);
         } catch (e) { console.error(e); }
     }
     const index = savedPosts.findIndex(p => p.id === post.id);
     if (index >= 0) {
         savedPosts[index] = post;
     } else {
         savedPosts.unshift(post);
     }
     
     try {
         localStorage.setItem('reelsCreatorUserPosts', JSON.stringify(savedPosts.slice(0, 10)));
     } catch (err: any) {
         console.warn("Storage quota exceeded, stripping heavy base64 assets...", err);
         try {
             localStorage.setItem('reelsCreatorUserPosts', JSON.stringify(savedPosts.slice(0, 5)));
         } catch (err2) {
             try {
                 const skimmedPosts = savedPosts.slice(0, 8).map((p, idx) => {
                     if (idx > 0) {
                         return {
                             ...p,
                             videoUrl: p.videoUrl?.startsWith('data:') ? '' : p.videoUrl,
                             referenceImageBase64: ''
                         };
                     }
                     return p;
                 });
                 localStorage.setItem('reelsCreatorUserPosts', JSON.stringify(skimmedPosts));
             } catch (err3) {
                 console.error("Storage full. Using in-memory mode for this session.", err3);
                 setErrorToast("Storage quota reached! Content will be stored in-memory for this session.");
             }
         }
     }
  };

  const updateFeedPost = (id: string, updates: Partial<FeedPost>) => {
    setFeed(prevFeed => {
      const newFeed = prevFeed.map(post => {
        if (post.id === id) {
            const updatedPost = { ...post, ...updates };
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
      
      const lowerMsg = String(errorMessage).toLowerCase();
      if (lowerMsg.includes('permission_denied') || lowerMsg.includes('permission') || lowerMsg.includes('403')) {
        setErrorToast('Permission Denied (403). Make sure your key is valid and has Veo permissions, or configure a custom API gateway in Settings!');
      } else if (lowerMsg.includes('quota') || lowerMsg.includes('limit') || lowerMsg.includes('429') || lowerMsg.includes('resource_exhausted')) {
        setErrorToast('Quota limits exceeded (429). Check your billing plan, or set up a custom Vercel AI Gateway/API Key inside Settings.');
      } else if (lowerMsg.includes('api_key_invalid') || lowerMsg.includes('invalid api key')) {
        setErrorToast('Invalid API key. Please check your key in the settings tab.');
      } else {
        setErrorToast(`Generation failed: ${errorMessage.slice(0, 100)}... Check Settings to configure custom API Gateways.`);
      }
    }
  };

  const handleGenerate = useCallback(async (params: GenerateVideoParams) => {
    const hasCustomKey = userSettings?.apiKey && userSettings.apiKey.trim().length > 0;

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
    
    setForcedPrompt(undefined);

    if (currentView === AppView.COURSE || currentView === AppView.SCRIPTS || currentView === AppView.TRENDING || currentView === AppView.ANALYZE) {
        setCurrentView(AppView.GALLERY);
    }

    const newPostId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const refImage = params.referenceImages?.[0]?.base64;

    const postUsername = userSettings?.displayName || 'you';
    const postAvatar = userSettings?.avatarBase64 || 'https://api.dicebear.com/7.x/avataaars/svg?seed=you';

    const newPost: FeedPost = {
      id: newPostId,
      username: postUsername,
      avatarUrl: postAvatar,
      description: params.prompt,
      modelTag: params.model === 'veo-3.1-lite-generate-preview' ? 'Veo Fast' : 'Veo',
      status: PostStatus.GENERATING,
      referenceImageBase64: refImage,
      isUserGenerated: true,
      timestamp: Date.now(),
      likes: 0,
      hasLiked: false,
      comments: []
    };

    saveUserPost(newPost);
    setFeed(prev => [newPost, ...prev]);
    processGeneration(newPostId, params);

  }, [userSettings, currentView]);

  const handleApiKeyDialogContinue = async () => {
    setShowApiKeyDialog(false);
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
    }
  };

  const handleRemixTrend = (prompt: string) => {
    setForcedPrompt(prompt);
    setCurrentView(AppView.COMPOSER);
  };
  
  const handleVoiceNavigate = (view: AppView) => {
      setCurrentView(view);
  };

  const handleDeletePost = (postId: string) => {
    setFeed(prevFeed => {
      const updated = prevFeed.filter(p => p.id !== postId);
      const userOnly = updated.filter(p => p.isUserGenerated);
      try {
        localStorage.setItem('reelsCreatorUserPosts', JSON.stringify(userOnly));
      } catch (e) {
        console.error("Failed to update user posts in storage", e);
      }
      return updated;
    });
  };

  // If showing landing page
  if (showLandingPage) {
    return <LandingPage onEnter={() => setShowLandingPage(false)} />;
  }

  // Get current view human-readable title
  const getViewTitle = () => {
    switch (currentView) {
      case AppView.COMPOSER:
        return 'Canvas Composer Studio';
      case AppView.AVATAR_CREATOR:
        return 'Real Self & AI Avatar Studio';
      case AppView.EDITOR:
        return 'Multi-Scene Storyboard Editor';
      case AppView.TRENDING:
        return 'Viral Trending Topics';
      case AppView.COVER_CREATOR:
        return 'Thumbnail & Cover Creator';
      case AppView.GALLERY:
        return 'Creation Gallery & Assets';
      case AppView.SCRIPTS:
        return 'Viral Script & Hook AI';
      case AppView.ANALYZE:
        return 'Video Prompt Analyzer';
      case AppView.COURSE:
        return 'AI Masterclass & Lessons';
      case AppView.PROFILE:
        return 'Creator Profile & Uploads';
      case AppView.FEED:
      default:
        return 'Explore Video Reels';
    }
  };

  const renderView = () => {
      switch(currentView) {
          case AppView.COMPOSER:
              return (
                <ComposerCanvas 
                  userSettings={userSettings}
                  onGenerate={handleGenerate}
                  latestPost={feed.find(p => p.isUserGenerated && p.status === PostStatus.SUCCESS) || feed[0]}
                  onSendToEditor={() => setCurrentView(AppView.EDITOR)}
                  onOpenAvatarStudio={() => setCurrentView(AppView.AVATAR_CREATOR)}
                />
              );
          case AppView.GALLERY:
              return <GalleryPage posts={feed} onDeletePost={handleDeletePost} />;
          case AppView.SCRIPTS:
              return <ScriptCreator onBack={() => setCurrentView(AppView.FEED)} />;
          case AppView.COURSE:
              return <CoursePage />;
          case AppView.TRENDING:
              return <TrendingPage userSettings={userSettings} onRemixTrend={handleRemixTrend} />;
          case AppView.ANALYZE:
              return <VideoAnalyzer onBack={() => setCurrentView(AppView.FEED)} />;
          case AppView.EDITOR:
              return <StoryboardPage galleryPosts={feed} onBack={() => setCurrentView(AppView.FEED)} onDeletePost={handleDeletePost} />;
          case AppView.PROFILE:
              return (
                <ProfilePage 
                  userSettings={userSettings} 
                  posts={feed} 
                  onUpload={handleManualUpload} 
                  onEditProfile={() => setShowSettingsDialog(true)} 
                  onDeletePost={handleDeletePost}
                />
              );
          case AppView.COVER_CREATOR:
              return <CoverCreator onBack={() => setCurrentView(AppView.FEED)} />;
          case AppView.AVATAR_CREATOR:
              return (
                <AvatarCreator 
                  userSettings={userSettings}
                  onBack={() => setCurrentView(AppView.FEED)}
                  onSelectAvatarForReel={(avatar) => {
                    if (userSettings) {
                      const updatedSettings: UserSettings = {
                        ...userSettings,
                        activeAvatarId: avatar.id,
                        avatarBase64: avatar.avatarBase64
                      };
                      handleSaveSettings(updatedSettings);
                    }
                    setCurrentView(AppView.COMPOSER);
                  }}
                  onUpdateUserSettings={(newSettings) => {
                    handleSaveSettings(newSettings);
                  }}
                />
              );
          case AppView.FEED:
          default:
              if (feedMode === 'single') {
                return (
                  <SingleFeed 
                    posts={feed}
                    onLike={handleLike}
                    onComment={handleComment}
                    onRemixPrompt={handleRemixTrend}
                    onDeletePost={handleDeletePost}
                    onOpenAvatarStudio={() => setCurrentView(AppView.AVATAR_CREATOR)}
                  />
                );
              }

              return (
                <div className="w-full max-w-[1600px] mx-auto p-4 md:p-6 pb-48 relative z-10">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                        <AnimatePresence initial={false}>
                        {feed.map((post) => (
                            <VideoCard 
                              key={post.id} 
                              post={post} 
                              onLike={handleLike} 
                              onComment={handleComment} 
                              onDelete={post.isUserGenerated ? handleDeletePost : undefined}
                            />
                        ))}
                        </AnimatePresence>
                    </div>
                </div>
              );
      }
  };

  return (
    <div className="h-screen w-screen bg-black text-white flex overflow-hidden font-sans selection:bg-purple-500/30 selection:text-white">
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
                className="fixed top-0 left-1/2 -translate-x-1/2 z-[60] bg-neutral-900/90 border border-white/15 text-white px-5 py-3 rounded-2xl shadow-2xl backdrop-blur-xl max-w-md text-center text-sm font-medium flex items-center gap-3"
            >
                <div className="w-2 h-2 rounded-full bg-red-500 shrink-0 animate-pulse"></div>
                {errorToast}
            </motion.div>
        )}
      </AnimatePresence>
      
      {/* Voice Control Global Component - Hide on creation views */}
      {![AppView.EDITOR, AppView.SCRIPTS, AppView.COVER_CREATOR, AppView.ANALYZE, AppView.AVATAR_CREATOR].includes(currentView) && (
        <VoiceControl onNavigate={handleVoiceNavigate} />
      )}

      {/* LEFT SIDEBAR NAVIGATION */}
      <Sidebar 
        currentView={currentView}
        onSelectView={(view) => setCurrentView(view)}
        onOpenSettings={() => setShowSettingsDialog(true)}
        userSettings={userSettings}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* MAIN WORKSPACE AREA */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-black relative">
        
        {/* Ambient background lighting */}
        <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_0%,_rgba(147,51,234,0.04),_transparent_70%)]"></div>

        {/* CLEAN, MINIMALIST TOP BAR */}
        <header className="sticky top-0 z-30 w-full px-4 md:px-6 py-3 border-b border-white/10 bg-black/85 backdrop-blur-xl flex items-center justify-between shrink-0">
          
          {/* Left Title & Mobile Hamburger */}
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80"
              title="Open Navigation Menu"
            >
              <Menu className="w-4 h-4" />
            </button>

            {/* Back to Feed button when not on FEED */}
            {currentView !== AppView.FEED && (
              <button 
                onClick={() => setCurrentView(AppView.FEED)}
                className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-all border border-white/10 text-white/70 hover:text-white group"
                title="Back to Feed"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              </button>
            )}

            <div>
              <h2 className="text-sm md:text-base font-bold text-white tracking-wide">
                {getViewTitle()}
              </h2>
              {currentView === AppView.FEED && (
                <p className="text-[10px] text-white/40 font-medium hidden sm:block">
                  Discover trending AI video reels, prompts, and cinematic shots
                </p>
              )}
            </div>
          </div>

          {/* Center / Right: FEED MODE TOGGLE (Full Grid vs Single Reel TikTok) */}
          <div className="flex items-center gap-3">
            {currentView === AppView.FEED && (
              <div className="flex items-center p-1 bg-neutral-900/90 border border-white/15 rounded-2xl shadow-inner">
                <button
                  type="button"
                  onClick={() => handleToggleFeedMode('grid')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    feedMode === 'grid'
                      ? 'bg-white text-black shadow-md font-bold'
                      : 'text-white/60 hover:text-white'
                  }`}
                  title="Grid Feed (Multi-Card View)"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Grid Feed</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleToggleFeedMode('single')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    feedMode === 'single'
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md font-bold shadow-purple-900/30'
                      : 'text-white/60 hover:text-white'
                  }`}
                  title="Single Reel (TikTok / Reels Immersive View)"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Single Reel</span>
                  <span className="text-[9px] px-1 py-0.2 rounded bg-pink-500/20 text-pink-300 font-bold border border-pink-500/30 hidden md:inline">
                    TikTok
                  </span>
                </button>
              </div>
            )}

            {/* Quick Canvas Composer Shortcut on Feed */}
            {currentView === AppView.FEED && (
              <button
                onClick={() => setCurrentView(AppView.COMPOSER)}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-600/30 to-indigo-600/30 hover:from-purple-600/50 hover:to-indigo-600/50 border border-purple-400/40 rounded-xl text-xs font-bold text-purple-200 transition-all shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-300" />
                <span>Open Canvas</span>
              </button>
            )}

            {/* Profile & Settings Buttons */}
            <div className="flex items-center gap-1.5">
              <button 
                onClick={() => setCurrentView(AppView.PROFILE)}
                className={`p-2 rounded-xl transition-colors border ${
                  currentView === AppView.PROFILE 
                    ? 'bg-white text-black border-white' 
                    : 'bg-white/5 hover:bg-white/10 text-white/80 border-white/10'
                }`}
                title="Profile & Uploads"
              >
                <User className="w-4 h-4" />
              </button>

              <button 
                onClick={() => setShowSettingsDialog(true)}
                className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-colors border border-white/10 text-white/80 hover:text-white group"
                title="Settings (API Keys, Audio, Models)"
              >
                <Settings className="w-4 h-4 group-hover:rotate-45 transition-transform" />
              </button>
            </div>

          </div>

        </header>

        {/* Scrollable Viewport Content */}
        <main className="flex-1 h-full relative overflow-y-auto overflow-x-hidden no-scrollbar bg-black flex flex-col">
          {renderView()}
        </main>

        {/* Show bottom prompt bar on GRID FEED view */}
        {currentView === AppView.FEED && feedMode === 'grid' && (
          <BottomPromptBar 
            onGenerate={handleGenerate} 
            userSettings={userSettings} 
            forcedPrompt={forcedPrompt}
            onOpenAvatarStudio={() => setCurrentView(AppView.AVATAR_CREATOR)}
          />
        )}

      </div>
    </div>
  );
};

export default App;
