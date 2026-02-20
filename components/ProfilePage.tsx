
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { AnimatePresence, motion } from 'framer-motion';
import { Camera, Edit3, Grid, Settings, Upload, Video as VideoIcon } from 'lucide-react';
import React, { useRef } from 'react';
import { FeedPost, UserSettings } from '../types';
import VideoCard from './VideoCard';

interface ProfilePageProps {
  userSettings: UserSettings | null;
  posts: FeedPost[];
  onUpload: (file: File) => void;
  onEditProfile: () => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ userSettings, posts, onUpload, onEditProfile }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Filter for user generated content
  const userPosts = posts.filter(post => post.isUserGenerated);
  const totalLikes = userPosts.reduce((acc, curr) => acc + (curr.likes || 0), 0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          onUpload(file);
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="w-full max-w-[1200px] mx-auto p-6 pb-32">
        {/* Profile Header */}
        <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-12 border-b border-white/10 pb-12">
            <div className="relative">
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 p-1">
                    <img 
                        src={userSettings?.avatarBase64 || 'https://api.dicebear.com/7.x/avataaars/svg?seed=you'} 
                        alt="Profile" 
                        className="w-full h-full object-cover rounded-full bg-black" 
                    />
                </div>
                <button onClick={onEditProfile} className="absolute bottom-0 right-0 p-2 bg-white text-black rounded-full border-4 border-black hover:scale-110 transition-transform">
                    <Edit3 className="w-4 h-4" />
                </button>
            </div>

            <div className="flex-1 text-center md:text-left">
                <div className="flex flex-col md:flex-row items-center gap-4 mb-4">
                    <h1 className="text-3xl font-bold text-white">{userSettings?.displayName || "Anonymous Creator"}</h1>
                    {userSettings?.niche && (
                        <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-bold uppercase tracking-wider text-white/70">
                            {userSettings.niche} Creator
                        </span>
                    )}
                </div>
                
                <div className="flex items-center justify-center md:justify-start gap-8 mb-6">
                    <div className="text-center md:text-left">
                        <div className="text-xl font-bold text-white">{userPosts.length}</div>
                        <div className="text-xs text-white/50 uppercase tracking-widest">Posts</div>
                    </div>
                     <div className="text-center md:text-left">
                        <div className="text-xl font-bold text-white">{totalLikes}</div>
                        <div className="text-xs text-white/50 uppercase tracking-widest">Likes</div>
                    </div>
                    <div className="text-center md:text-left">
                        <div className="text-xl font-bold text-white">0</div>
                        <div className="text-xs text-white/50 uppercase tracking-widest">Followers</div>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-3">
                     <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="px-6 py-2 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                     >
                         <Upload className="w-4 h-4" />
                         Upload Video
                     </button>
                     <input type="file" ref={fileInputRef} className="hidden" accept="video/mp4,video/mov" onChange={handleFileChange} />
                     
                     <button onClick={onEditProfile} className="px-6 py-2 bg-white/10 border border-white/20 text-white font-bold rounded-lg hover:bg-white/20 transition-colors flex items-center justify-center gap-2">
                         <Settings className="w-4 h-4" />
                         Edit Profile
                     </button>
                </div>
            </div>
        </div>

        {/* Content Tabs */}
        <div className="flex items-center justify-center gap-12 border-b border-white/10 mb-8">
            <button className="flex items-center gap-2 pb-4 border-b-2 border-white text-white font-bold">
                <Grid className="w-4 h-4" />
                POSTS
            </button>
            <button className="flex items-center gap-2 pb-4 border-b-2 border-transparent text-white/50 hover:text-white transition-colors">
                <VideoIcon className="w-4 h-4" />
                REELS
            </button>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <AnimatePresence initial={false}>
            {userPosts.map((post) => (
              <VideoCard key={post.id} post={post} />
            ))}
          </AnimatePresence>
          {userPosts.length === 0 && (
              <div className="col-span-full py-20 flex flex-col items-center justify-center text-white/30">
                  <Camera className="w-16 h-16 mb-4 opacity-20" />
                  <p>No posts yet. Start creating!</p>
              </div>
          )}
        </div>
    </div>
  );
};

export default ProfilePage;
