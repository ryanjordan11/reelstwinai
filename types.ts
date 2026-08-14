
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
export enum AppState {
  IDLE,
  LOADING,
  SUCCESS,
  ERROR,
}

export enum VeoModel {
  VEO_FAST = 'veo-3.1-lite-generate-preview',
  VEO = 'veo-3.1-generate-preview',
}

export enum AspectRatio {
  LANDSCAPE = '16:9',
  PORTRAIT = '9:16',
}

export enum Resolution {
  P720 = '720p',
  P1080 = '1080p',
}

export enum GenerationMode {
  TEXT_TO_VIDEO = 'Text to Video',
  FRAMES_TO_VIDEO = 'Frames to Video',
  REFERENCES_TO_VIDEO = 'References to Video',
  // EXTEND_VIDEO = 'Extend Video',
}

export interface ImageFile {
  file: File;
  base64: string;
}

export interface VideoFile {
  file: File;
  base64: string;
}

export interface GenerateVideoParams {
  prompt: string;
  model: VeoModel | string;
  aspectRatio: AspectRatio;
  resolution: Resolution;
  mode: GenerationMode;
  startFrame?: ImageFile | null;
  endFrame?: ImageFile | null;
  referenceImages?: ImageFile[];
  styleImage?: ImageFile | null;
  inputVideo?: VideoFile | null;
  isLooping?: boolean;
  customModelId?: string;
}

export enum PostStatus {
  GENERATING = 'generating',
  SUCCESS = 'success',
  ERROR = 'error',
}

export interface Comment {
  id: string;
  username: string;
  text: string;
  timestamp: number;
}

export interface FeedPost {
  id: string;
  videoUrl?: string;
  username: string;
  avatarUrl: string;
  description: string;
  prompt?: string;
  modelTag: string;
  status?: PostStatus; // If undefined, implies legacy/sample success
  errorMessage?: string;
  referenceImageBase64?: string; // To show during loading
  timestamp?: number;
  isUserGenerated?: boolean;
  
  // Social Features
  likes: number;
  hasLiked: boolean;
  comments: Comment[];
}

export interface CameoProfile {
  id: string;
  name: string;
  imageUrl: string; // In a real app, this would be a URL. For this demo, we'll use base64 placeholders.
  personaId?: string;
}

export interface AvatarPersona {
  id: string;
  name: string;
  tagline?: string;
  avatarBase64: string;
  style: string;
  genderOrArchetype?: string;
  prompt?: string;
  bio?: string;
  createdAt: number;
  isActive?: boolean;
  isRealSelf?: boolean; // Flag for real user photo upload vs synthesized AI character
  realPhotos?: string[]; // Multiple real selfies/angles uploaded
  voiceSettings?: {
    voiceName?: string;
    pitch?: number;
    rate?: number;
    elevenLabsVoiceId?: string;
  };
}

export type ApiProviderType = 'google' | 'vercel' | 'openrouter' | 'aihubmix' | 'replicate' | 'custom';

export interface UserSettings {
  displayName: string;
  avatarBase64: string | null;
  // Brand & Niche Settings
  niche?: string;
  tone?: string;
  visualStyle?: string;
  bio?: string;
  // API Config
  apiProvider?: ApiProviderType;
  apiKey?: string;
  apiGatewayUrl?: string;
  customTextModel?: string;
  customImageModel?: string;
  customVideoModel?: string;
  replicateApiKey?: string;
  elevenLabsApiKey?: string;
  elevenLabsVoiceId?: string;
  activeAvatarId?: string;
}

export enum AppView {
  FEED = 'feed',
  COMPOSER = 'composer', // Dedicated Canvas Studio
  EDITOR = 'editor',     // Multi-Scene Storyboard & Timeline
  AVATAR_CREATOR = 'avatar_creator',
  GALLERY = 'gallery',
  SCRIPTS = 'scripts',
  COVER_CREATOR = 'cover_creator',
  COURSE = 'course',
  TRENDING = 'trending',
  ANALYZE = 'analyze',
  PROFILE = 'profile',
}

export type FeedMode = 'grid' | 'single';

export type TransitionType = 
  | 'none' 
  | 'fade' 
  | 'crossfade' 
  | 'dip-to-black' 
  | 'dip-to-white' 
  | 'slide-left' 
  | 'slide-right' 
  | 'wipe' 
  | 'zoom' 
  | 'zoom-in' 
  | 'zoom-out' 
  | 'glitch' 
  | 'blur' 
  | 'cut';

export interface CaptionWord {
  word: string;
  start: number; // seconds
  end: number;   // seconds
}

export interface CaptionStyle {
  font: 'impact' | 'sans' | 'serif' | 'bebas' | 'mono';
  color: string;
  highlightColor: string;
  bgBox: boolean;
  animation: 'karaoke' | 'pop' | 'typewriter' | 'glow';
  position: 'bottom' | 'center' | 'top';
  size: number;
}

export interface StoryboardClip {
  id: string;
  sourcePostId: string;
  duration?: number; // duration in seconds
  transition?: TransitionType;
  transitionDurationSec?: number;
  scriptNarration?: string;
  captionText?: string;
  captionStyle?: CaptionStyle;
  audioNarrationText?: string;
  audioNarrationUrl?: string;
  voiceName?: string;
  textOverlay?: {
    content: string;
    position: 'top' | 'center' | 'bottom';
    style: 'classic' | 'modern' | 'bold';
  };
}

export interface Preset {
  id: string;
  category?: 'camera' | 'style' | 'lighting' | 'angle' | 'general' | 'mood' | string;
  label: string;
  promptSuffix: string;
  icon?: string;
  description?: string;
}

export interface PromptHistoryItem {
  id: string;
  prompt: string;
  model: string;
  aspectRatio: AspectRatio;
  timestamp: number;
  cameoName?: string;
  isFavorite?: boolean;
}
