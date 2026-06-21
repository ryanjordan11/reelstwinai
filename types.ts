
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
  model: VeoModel;
  aspectRatio: AspectRatio;
  resolution: Resolution;
  mode: GenerationMode;
  startFrame?: ImageFile | null;
  endFrame?: ImageFile | null;
  referenceImages?: ImageFile[];
  styleImage?: ImageFile | null;
  inputVideo?: VideoFile | null;
  isLooping?: boolean;
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
}

export interface UserSettings {
  displayName: string;
  avatarBase64: string | null;
  // Brand & Niche Settings
  niche?: string;
  tone?: string;
  visualStyle?: string;
  bio?: string;
  // API Config
  apiKey?: string;
  apiGatewayUrl?: string;
}

export enum AppView {
  FEED = 'feed',
  GALLERY = 'gallery',
  SCRIPTS = 'scripts',
  COURSE = 'course',
  TRENDING = 'trending',
  ANALYZE = 'analyze',
  EDITOR = 'editor',
  PROFILE = 'profile',
  COVER_CREATOR = 'cover_creator',
}

export interface StoryboardClip {
  id: string;
  sourcePostId: string;
  textOverlay?: {
    content: string;
    position: 'top' | 'center' | 'bottom';
    style: 'classic' | 'modern' | 'bold';
  };
}

export interface Preset {
  id: string;
  label: string;
  promptSuffix: string;
  icon?: string;
}
