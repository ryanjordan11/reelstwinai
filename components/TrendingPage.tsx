
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { motion } from 'framer-motion';
import { Flame, ArrowUpRight, Wand2, Search } from 'lucide-react';
import React from 'react';
import { UserSettings } from '../types';

interface TrendingPageProps {
  userSettings: UserSettings | null;
  onRemixTrend: (prompt: string) => void;
}

const TRENDS = [
  {
    id: 1,
    title: "POV: You found the glitch",
    category: "Visual Effect",
    searchVolume: "2.4M Searches",
    description: "A reality-bending transition where the environment pixelates and shifts.",
    promptTemplate: "A first person POV video where the [NICHE] environment suddenly glitches into a [STYLE] digital wireframe world. [TONE] atmosphere."
  },
  {
    id: 2,
    title: "Morning Routine ASMR",
    category: "Lifestyle",
    searchVolume: "1.8M Searches",
    description: "Satisfying sounds and crisp visuals of starting the day right.",
    promptTemplate: "A highly satisfying ASMR montage of a morning routine for a [NICHE] expert. Close up shots, crisp audio. [STYLE] lighting. [TONE] vibe."
  },
  {
    id: 3,
    title: "The 'Unlock' Moment",
    category: "Educational",
    searchVolume: "950K Searches",
    description: "That specific moment when a complex concept suddenly clicks.",
    promptTemplate: "A cinematic visualization of a [NICHE] concept being unlocked in the mind. Glowing neural networks, bright realization. [STYLE] aesthetic. [TONE] narration."
  },
  {
    id: 4,
    title: "Neon City Drive",
    category: "Aesthetic",
    searchVolume: "3.2M Searches",
    description: "Synthwave vibes driving through a futuristic city at night.",
    promptTemplate: "Driving a retro car through a futuristic neon city related to [NICHE]. [STYLE] visuals, synthwave colors. [TONE] energy."
  },
    {
    id: 5,
    title: "Tiny World",
    category: "Macro",
    searchVolume: "1.2M Searches",
    description: "Macro shots making everyday objects look like giant landscapes.",
    promptTemplate: "Macro extreme close-up shots of [NICHE] tools or items, making them look like giant landscapes. [STYLE] photography. [TONE] wonder."
  }
];

const TrendingPage: React.FC<TrendingPageProps> = ({ userSettings, onRemixTrend }) => {

  const handleRemix = (trend: typeof TRENDS[0]) => {
    const niche = userSettings?.niche || "general";
    const style = userSettings?.visualStyle || "cinematic";
    const tone = userSettings?.tone || "engaging";

    let finalPrompt = trend.promptTemplate
      .replace('[NICHE]', niche)
      .replace('[STYLE]', style)
      .replace('[TONE]', tone);

    // Add extra context
    finalPrompt += ` High quality, 4k, trending on social media.`;

    onRemixTrend(finalPrompt);
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto p-6 pb-32">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
            <div className="p-3 bg-red-500/10 rounded-2xl border border-red-500/20">
                <Flame className="w-6 h-6 text-red-500" />
            </div>
            <div>
                <h1 className="text-3xl font-bogle text-white">Trending Now</h1>
                <p className="text-white/50 text-sm">Real-time viral formats tailored to your niche.</p>
            </div>
        </div>
        
        {userSettings?.niche && (
            <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10 text-xs text-white/60">
                <span>Personalized for:</span>
                <span className="text-white font-bold">{userSettings.niche}</span>
            </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {TRENDS.map((trend, index) => (
          <motion.div
            key={trend.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="group relative bg-neutral-900 border border-white/10 rounded-3xl p-6 hover:border-white/20 transition-all hover:-translate-y-1 shadow-lg"
          >
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                     <span className="px-2.5 py-1 bg-white/5 rounded-lg text-[10px] font-bold uppercase tracking-wider text-white/70 border border-white/5">
                        {trend.category}
                     </span>
                     <span className="flex items-center gap-1 text-[10px] text-green-400">
                        <ArrowUpRight className="w-3 h-3" />
                        {trend.searchVolume}
                     </span>
                </div>
            </div>

            <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-purple-400 transition-colors">{trend.title}</h3>
            <p className="text-gray-400 text-sm leading-relaxed mb-8 min-h-[40px]">{trend.description}</p>

            <button
                onClick={() => handleRemix(trend)}
                className="w-full py-3 bg-white text-black font-bold rounded-xl flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform shadow-[0_0_20px_rgba(255,255,255,0.15)] group-hover:shadow-[0_0_30px_rgba(255,255,255,0.3)]"
            >
                <Wand2 className="w-4 h-4" />
                Remix for {userSettings?.niche || "Me"}
            </button>
            
            {/* Background Glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default TrendingPage;
