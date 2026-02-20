
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { AnimatePresence } from 'framer-motion';
import { Grid, Image as ImageIcon } from 'lucide-react';
import React from 'react';
import { FeedPost } from '../types';
import VideoCard from './VideoCard';

interface GalleryPageProps {
  posts: FeedPost[];
}

const GalleryPage: React.FC<GalleryPageProps> = ({ posts }) => {
  // Filter for user generated content
  const userPosts = posts.filter(post => post.isUserGenerated);

  return (
    <div className="w-full max-w-[1600px] mx-auto p-6 pb-32">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
             <Grid className="w-6 h-6 text-white" />
        </div>
        <div>
            <h1 className="text-3xl font-bogle text-white">My Gallery</h1>
            <p className="text-white/50 text-sm">Your generated reels and creations.</p>
        </div>
      </div>

      {userPosts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 border border-dashed border-white/10 rounded-3xl bg-white/5">
          <div className="w-20 h-20 bg-black rounded-full flex items-center justify-center mb-6 ring-1 ring-white/10">
            <ImageIcon className="w-8 h-8 text-white/30" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No creations yet</h3>
          <p className="text-white/40 max-w-sm text-center leading-relaxed">
            Start generating videos using the prompt bar below. Your creations will be stored here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <AnimatePresence initial={false}>
            {userPosts.map((post) => (
              <VideoCard key={post.id} post={post} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default GalleryPage;
