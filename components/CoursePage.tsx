/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  PlayCircle, 
  Sparkles, 
  PenTool, 
  Layers, 
  Eye, 
  Flame,
  Wand2
} from 'lucide-react';
import React from 'react';

interface CoursePageProps {
  onStartCreating?: () => void;
  onOpenScriptAI?: () => void;
}

const VIRAL_PILLARS = [
  {
    icon: Flame,
    title: "1. The 3-Second Pattern Interrupt",
    desc: "Stop the scroll instantly. Visual contradiction, motion velocity, or an unexpected audio cue in the first 90 frames.",
    tag: "Hook Mastery",
    color: "from-amber-500 to-rose-600"
  },
  {
    icon: Layers,
    title: "2. Zero-Fluff Value Stacking",
    desc: "Rapid delivery of high-signal takeaways without introductory filler. Keep viewers cognitively engaged every 2 seconds.",
    tag: "Retention Engine",
    color: "from-purple-500 to-indigo-600"
  },
  {
    icon: Eye,
    title: "3. The Open-Loop Payoff",
    desc: "Plant a curiosity gap in the first 5 seconds and only resolve it in the final 2 seconds to maximize loop completion rates.",
    tag: "Loop Engineering",
    color: "from-cyan-500 to-blue-600"
  },
  {
    icon: PenTool,
    title: "4. Algorithmic Script Cadence",
    desc: "Shorter syllables, rhythmic vocal pauses, and sensory visual adjectives designed specifically for short-form retention graphs.",
    tag: "Script AI",
    color: "from-emerald-500 to-teal-600"
  }
];

const CoursePage: React.FC<CoursePageProps> = ({ onStartCreating, onOpenScriptAI }) => {
  return (
    <div className="w-full max-w-[1200px] mx-auto p-6 md:p-12 pb-32 text-white">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-16"
      >
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-purple-500/10 border border-purple-500/20 rounded-full text-purple-300 mb-6">
          <Sparkles className="w-4 h-4 fill-purple-400" />
          <span className="text-xs font-bold tracking-widest uppercase">Viral Engineering Framework</span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bogle mb-6 bg-clip-text text-transparent bg-gradient-to-br from-white via-gray-100 to-gray-400">
          Crack the Code.<br />Dominate the Feed.
        </h1>
        
        <p className="text-lg md:text-xl text-neutral-400 max-w-2xl mx-auto mb-4 font-light leading-relaxed">
          Master the short-form psychology and visual retention mechanics behind viral content.
        </p>

        <div className="inline-block px-4 py-1 rounded-full bg-white/[0.04] border border-white/10 text-xs text-neutral-400 font-mono mb-8">
          Made by <span className="text-white font-semibold">Ryan Jordan</span> • Inspired by <span className="text-white font-semibold">Seth Anderson</span>
        </div>

        {/* Action Buttons (Direct creative suite actions, NO join course or book consult) */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          {onStartCreating && (
            <button 
              onClick={onStartCreating}
              className="px-8 py-4 bg-white text-black font-bold rounded-2xl hover:scale-105 transition-all flex items-center gap-2 shadow-[0_0_30px_rgba(255,255,255,0.25)]"
            >
              <Wand2 className="w-5 h-5 text-purple-700" />
              Launch Studio Composer
            </button>
          )}
          {onOpenScriptAI && (
            <button 
              onClick={onOpenScriptAI}
              className="px-8 py-4 bg-white/10 border border-white/20 text-white font-bold rounded-2xl hover:bg-white/20 transition-all flex items-center gap-2"
            >
              <PenTool className="w-5 h-5 text-indigo-400" />
              Generate Viral Scripts
            </button>
          )}
        </div>
      </motion.div>

      {/* 4 Pillars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
        {VIRAL_PILLARS.map((item, i) => {
          const Icon = item.icon;
          return (
            <div 
              key={i} 
              className="p-8 bg-neutral-900/60 border border-white/10 rounded-3xl hover:border-white/25 transition-all group relative overflow-hidden"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 bg-gradient-to-br ${item.color} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-neutral-300">
                  {item.tag}
                </span>
              </div>
              
              <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
              <p className="text-neutral-400 text-sm leading-relaxed">{item.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Production Blueprint Card */}
      <div className="p-8 md:p-10 bg-gradient-to-r from-purple-950/40 via-neutral-900/80 to-indigo-950/40 border border-white/10 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="max-w-xl">
          <div className="flex items-center gap-2 text-purple-400 text-xs font-bold uppercase tracking-wider mb-2">
            <TrendingUp className="w-4 h-4" />
            <span>Algorithmic Retention Rule</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bogle mb-2 text-white">
            Pacing & 8-Second Scene Cuts
          </h2>
          <p className="text-neutral-400 text-sm leading-relaxed">
            Multi-scene storyboards with dynamic camera zooms, sound effects, and subtitle color emphasis increase completion rates by over 240% compared to static single-shot video.
          </p>
        </div>

        {onStartCreating && (
          <button 
            onClick={onStartCreating}
            className="px-6 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-purple-900/40 shrink-0 flex items-center gap-2"
          >
            <PlayCircle className="w-5 h-5" />
            Apply to Reel
          </button>
        )}
      </div>
    </div>
  );
};

export default CoursePage;
