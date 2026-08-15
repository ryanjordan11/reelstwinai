/**
 * @license
 * SPDX-License-Identifier: MIT
 * 
 * Reels Creator Studio
 * Voice-native • Local-first • Open-source • Bring any model
 * Made by Ryan Jordan • Inspired by Seth Anderson
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
import ScriptCreator from './components/ScriptCreator';
import GalleryPage from './components/GalleryPage';
import TrendingPage from './components/TrendingPage';
import VideoAnalyzer from './components/VideoAnalyzer';
import StoryboardPage from './components/StoryboardPage';
import ProfilePage from './components/ProfilePage';
import CoverCreator from './components/CoverCreator';
import AvatarCreator from './components/AvatarCreator';
import ComposerPage from './components/ComposerPage';
import ActivityInspector from './components/ActivityInspector';
import DevHubModal from './components/DevHubModal';
import { generateVideo } from './services/geminiService';
import { localDB } from './services/db';
import { AppView, FeedMode, FeedPost, GenerateVideoParams, PostStatus, UserSettings } from './types';
import { 
  Settings, 
  LayoutGrid, 
  User, 
  ArrowLeft, 
  Menu, 
  Sparkles,
  Smartphone,
  PanelLeftClose,
  PanelLeftOpen
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

// Sample video URLs for the feed with reliable CORS-enabled streams
const sampleVideos: FeedPost[] = [
  {
    id: 's1',
    videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
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
    videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
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
    videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
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
    videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
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
    videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
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
    videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
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
  const [showInspector, setShowInspector] = useState(false);
  const [showDevHub, setShowDevHub] = useState(false);
  const [showLandingPage, setShowLandingPage] = useState(false);
  const [errorToast, setErrorToast] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<AppView>(AppView.COMPOSER);
  
  // Feed Display Mode: 'grid' (multi-column) or 'single' (TikTok-style vertical reel)
  const [feedMode, setFeedMode] = useState<FeedMode>('grid');

  // Sidebar collapsed / mobile drawer states
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return localStorage.getItem('reelsCreatorSidebarCollapsed') === 'true';
  });
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  
  // Prompt state management to allow Trending / SingleFeed to set it
  const [forcedPrompt, setForcedPrompt] = useState<string | undefined>(undefined);
  
  // User Profile Settings
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);

  // Toggle and persist sidebar collapsed state
  const handleToggleSidebar = useCallback(() => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('reelsCreatorSidebarCollapsed', String(next));
      return next;
    });
  }, []);

  // Keyboard shortcut (Ctrl+B / Cmd+B) for toggling sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        handleToggleSidebar();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleToggleSidebar]);

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
     // Persist in IndexedDB
     localDB.savePost(post).catch(console.warn);

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
         console.warn("Storage quota exceeded in localStorage, IndexedDB retains full asset.", err);
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
    const isOllama = userSettings?.apiProvider === 'ollama';

    if (!hasCustomKey && !isOllama && window.aistudio) {
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

    // If generating from other tool pages, navigate to COMPOSER to see the stream
    if (currentView === AppView.SCRIPTS || currentView === AppView.TRENDING || currentView === AppView.ANALYZE) {
        setCurrentView(AppView.COMPOSER);
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
        return 'AI Studio Composer';
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
                <ComposerPage 
                  userSettings={userSettings}
                  onGenerate={handleGenerate}
                  forcedPrompt={forcedPrompt}
                  onOpenAvatarStudio={() => setCurrentView(AppView.AVATAR_CREATOR)}
                  onOpenFeed={() => setCurrentView(AppView.FEED)}
                  posts={feed}
                  onOpenEditor={() => setCurrentView(AppView.EDITOR)}
                />
              );
          case AppView.AVATAR_CREATOR:
              return (
                <AvatarCreator 
                  userSettings={userSettings}
                  onBack={() => setCurrentView(AppView.FEED)}
                  onSelectAvatarForReel={() => setCurrentView(AppView.COMPOSER)}
                  onUpdateUserSettings={handleSaveSettings}
                />
              );
          case AppView.EDITOR:
              return (
                <StoryboardPage 
                  galleryPosts={feed}
                  onBack={() => setCurrentView(AppView.FEED)}
                  onDeletePost={handleDeletePost}
                />
              );
          case AppView.TRENDING:
              return (
                <TrendingPage 
                  userSettings={userSettings} 
                  onRemixTrend={handleRemixTrend} 
                />
              );
          case AppView.COVER_CREATOR:
              return <CoverCreator onBack={() => setCurrentView(AppView.FEED)} />;
          case AppView.GALLERY:
              return <GalleryPage posts={feed} onDeletePost={handleDeletePost} />;
          case AppView.SCRIPTS:
              return <ScriptCreator onBack={() => setCurrentView(AppView.FEED)} />;
          case AppView.ANALYZE:
              return <VideoAnalyzer onBack={() => setCurrentView(AppView.FEED)} />;
          case AppView.PROFILE:
              return (
                <ProfilePage 
                  userSettings={userSettings} 
                  posts={feed} 
                  onEditProfile={() => setShowSettingsDialog(true)} 
                  onUpload={handleManualUpload}
                  onDeletePost={handleDeletePost}
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
                <div className="p-4 sm:p-6 max-w-7xl mx-auto w-full">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-28">
                    {feed.map((post) => (
                      <VideoCard
                        key={post.id}
                        post={post}
                        onLike={() => handleLike(post.id)}
                        onComment={(id, text) => handleComment(id, text)}
                        onDelete={post.isUserGenerated ? () => handleDeletePost(post.id) : undefined}
                      />
                    ))}
                  </div>
                </div>
              );
      }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-black font-sans text-white antialiased selection:bg-purple-500 selection:text-white">
      
      {/* API Key Selection Dialog (Google Native) */}
      {showApiKeyDialog && (
        <ApiKeyDialog
          onContinue={handleApiKeyDialogContinue}
        />
      )}

      {/* Settings Dialog (AI Providers, Ollama Localhost, Identity, Storage) */}
      {showSettingsDialog && (
        <SettingsDialog
          currentSettings={userSettings}
          onSave={handleSaveSettings}
          onClose={() => setShowSettingsDialog(false)}
        />
      )}

      {/* Local Activity Inspector (Zero Telemetry Verification) */}
      <ActivityInspector
        isOpen={showInspector}
        onClose={() => setShowInspector(false)}
      />

      {/* Developer Hub (Architecture, Docker, Plugin Spec, MIT) */}
      <DevHubModal
        isOpen={showDevHub}
        onClose={() => setShowDevHub(false)}
      />
      
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

      {/* LEFT SIDEBAR NAVIGATION */}
      <Sidebar 
        currentView={currentView}
        onSelectView={(view) => setCurrentView(view)}
        onOpenSettings={() => setShowSettingsDialog(true)}
        onOpenDevHub={() => setShowDevHub(true)}
        onOpenInspector={() => setShowInspector(true)}
        userSettings={userSettings}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleSidebar}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* MAIN WORKSPACE AREA */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-black relative">
        
        {/* Ambient background lighting */}
        <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_0%,_rgba(147,51,234,0.04),_transparent_70%)]"></div>

        {/* CLEAN, MINIMALIST TOP BAR */}
        <header className="sticky top-0 z-30 w-full px-4 md:px-6 py-3 border-b border-white/10 bg-black/85 backdrop-blur-xl flex items-center justify-between shrink-0">
          
          {/* Left Title, Desktop Toggle & Mobile Hamburger */}
          <div className="flex items-center gap-3">
            {/* Desktop Sidebar Toggle */}
            <button
              type="button"
              onClick={handleToggleSidebar}
              className="hidden lg:flex p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white transition-all items-center justify-center group"
              title={isSidebarCollapsed ? "Expand Sidebar (Ctrl+B)" : "Collapse Sidebar (Ctrl+B)"}
            >
              {isSidebarCollapsed ? (
                <PanelLeftOpen className="w-4 h-4 text-purple-400 group-hover:scale-105 transition-transform" />
              ) : (
                <PanelLeftClose className="w-4 h-4 text-white/70 group-hover:text-white transition-colors" />
              )}
            </button>

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

          {/* Center / Right: FEED MODE TOGGLE & ACTION BUTTONS */}
          <div className="flex items-center gap-2.5">
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

            {/* Quick Composer Shortcut on Feed */}
            {currentView === AppView.FEED && (
              <button
                onClick={() => setCurrentView(AppView.COMPOSER)}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 hover:from-amber-500/30 hover:to-yellow-500/30 border border-amber-400/40 rounded-xl text-xs font-bold text-amber-300 transition-all shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Create Video</span>
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
                title="Settings (API Keys, Audio, Models, Storage)"
              >
                <Settings className="w-4 h-4 group-hover:rotate-45 transition-transform" />
              </button>
            </div>

          </div>

        </header>

        {/* Viewport Content */}
        <main className="flex-1 h-full relative overflow-y-auto overflow-x-hidden no-scrollbar bg-black flex flex-col">
          {renderView()}
        </main>

        {/* Primary Bottom Floating Composer Bar on Feed */}
        {currentView === AppView.FEED && (
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
