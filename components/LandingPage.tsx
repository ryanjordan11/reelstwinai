/**
 * @license
 * SPDX-License-Identifier: MIT
 * 
 * Reels Creator - Landing Page
 * Voice-native. Local-first. Open-source. Bring any model.
 * Your keys. Your models. Your media. Your machine.
 * Made by Ryan Jordan • Inspired by Seth Anderson
*/

import { motion } from 'framer-motion';
import React from 'react';
import { 
  Clapperboard, 
  Sparkles, 
  ChevronDown, 
  Video, 
  PenTool, 
  Scan, 
  Scissors, 
  Wand2, 
  ArrowRight, 
  Zap, 
  Flame, 
  Terminal 
} from 'lucide-react';

interface LandingPageProps {
  onEnter: () => void;
}

interface FeatureItem {
  title: string;
  subtitle: string;
  desc: string;
  badge: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  gradientBg: string;
  colSpan: string;
}

const FEATURES: FeatureItem[] = [
  {
    title: "Google Veo 3.1 & Open Video",
    subtitle: "Text & Image-to-Video Engine",
    desc: "Transform short natural language prompts into fluid, cinematic 1080p video reels with realistic camera motion and lighting.",
    badge: "Next-Gen Video",
    icon: Video,
    color: "from-purple-500 to-indigo-600",
    gradientBg: "group-hover:border-purple-500/40",
    colSpan: "md:col-span-2"
  },
  {
    title: "AI Avatar & Digital Twin Studio",
    subtitle: "Character Continuity",
    desc: "Generate and store consistent digital twins and actors locally to star across all your reels and brand campaigns.",
    badge: "Digital Actors",
    icon: Wand2,
    color: "from-pink-500 to-rose-600",
    gradientBg: "group-hover:border-pink-500/40",
    colSpan: "md:col-span-1"
  },
  {
    title: "Multi-Scene Storyboard",
    subtitle: "Pacing & Transitions",
    desc: "Assemble multi-clip reels, apply cross-dissolves, glitch transitions, zoom punches, and synced voiceover soundscapes.",
    badge: "Timeline Editor",
    icon: Scissors,
    color: "from-indigo-500 to-cyan-500",
    gradientBg: "group-hover:border-indigo-500/40",
    colSpan: "md:col-span-1"
  },
  {
    title: "Viral Script & Hook AI",
    subtitle: "Engineered for Retention",
    desc: "Synthesize high-velocity 3-second hooks, value stacks, and retention formulas backed by viewer psychology.",
    badge: "Hook Engine",
    icon: PenTool,
    color: "from-amber-500 to-orange-500",
    gradientBg: "group-hover:border-amber-500/40",
    colSpan: "md:col-span-1"
  },
  {
    title: "Vision Prompt Analyzer",
    subtitle: "Reverse-Engineer Virality",
    desc: "Upload any viral reel to extract the cinematography prompt, camera lenses, lighting style, and hook architecture.",
    badge: "Vision Deconstruct",
    icon: Scan,
    color: "from-emerald-500 to-teal-500",
    gradientBg: "group-hover:border-emerald-500/40",
    colSpan: "md:col-span-1"
  },
  {
    title: "100% Local-First & Zero Telemetry",
    subtitle: "IndexedDB & Audit Inspector",
    desc: "Your prompts, media, and keys never leave your machine without your permission. Zero tracking pixels, zero hidden analytics.",
    badge: "Privacy Guarantee",
    icon: Terminal,
    color: "from-emerald-500 to-cyan-500",
    gradientBg: "group-hover:border-emerald-500/40",
    colSpan: "md:col-span-2"
  }
];

const VIRAL_PILLARS = [
  {
    step: "01",
    title: "The 3-Second Scroll Stopper",
    desc: "Pattern-interrupt hooks that seize attention immediately before users scroll past."
  },
  {
    step: "02",
    title: "High-Density Value Stacking",
    desc: "Zero-fluff storytelling delivering dopamine and insights every two to three seconds."
  },
  {
    step: "03",
    title: "The Open-Loop Rewatch Trigger",
    desc: "Seamless endings and payoff curiosity loops designed to multiply viral algorithm scores."
  }
];

const SAMPLE_SHOWCASES = [
  {
    title: "Cyberpunk Rain Cafe",
    creator: "@alisa_fortin",
    tag: "Veo Fast",
    views: "1.4M",
    likes: "124K",
    video: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
  },
  {
    title: "Golden Hour Glow",
    creator: "@osanseviero",
    tag: "Veo 3.1",
    views: "890K",
    likes: "89K",
    video: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4"
  },
  {
    title: "Holographic Phone",
    creator: "@ammaar",
    tag: "Veo Studio",
    views: "3.2M",
    likes: "450K",
    video: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4"
  }
];

const LandingPage: React.FC<LandingPageProps> = ({ onEnter }) => {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black text-white font-sans scroll-smooth no-scrollbar">
      {/* TOP FLOATING NAVIGATION BAR */}
      <header className="sticky top-0 z-50 w-full px-6 py-4 bg-black/75 backdrop-blur-xl border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 shadow-md shadow-purple-900/40">
            <Clapperboard className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bogle text-lg font-bold tracking-wide text-white block leading-none">
                REELS CREATOR
              </span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30">
                MIT
              </span>
            </div>
            <span className="text-[9px] text-white/40 tracking-widest uppercase font-semibold">
              Voice-Native • Local-First • Open-Source
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onEnter}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-black hover:bg-neutral-200 text-xs font-bold transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:scale-105"
          >
            <span>Launch Studio</span>
            <ArrowRight className="w-3.5 h-3.5 text-black" />
          </button>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative min-h-[92vh] flex flex-col items-center justify-center overflow-hidden px-4 sm:px-6 pt-12 pb-20">
        
        {/* Background Video Layer */}
        <div className="absolute inset-0 z-0 opacity-30">
          <video 
            autoPlay 
            loop 
            muted 
            playsInline
            className="w-full h-full object-cover grayscale opacity-40 scale-105"
          >
            <source src="https://assets.mixkit.co/videos/preview/mixkit-crowds-of-people-cross-a-street-junction-4401-large.mp4" type="video/mp4" />
          </video>
          {/* Gradient Overlays */}
          <div className="absolute inset-0 bg-gradient-to-b from-black via-black/85 to-black"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_black_90%)]"></div>
        </div>

        {/* Ambient Gradient Orbs */}
        <motion.div 
          animate={{ 
            scale: [1, 1.25, 1],
            opacity: [0.25, 0.45, 0.25],
          }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[10%] left-[-10%] w-[650px] h-[650px] bg-purple-900/30 rounded-full blur-[130px] pointer-events-none z-0" 
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.15, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ duration: 11, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
          className="absolute bottom-[5%] right-[-10%] w-[550px] h-[550px] bg-indigo-900/30 rounded-full blur-[110px] pointer-events-none z-0" 
        />

        {/* Main Hero Content */}
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
          }}
          className="relative z-10 text-center flex flex-col items-center max-w-5xl mx-auto"
        >
          {/* Core Hierarchy Badge */}
          <motion.div
            variants={{
              hidden: { y: -15, opacity: 0 },
              visible: { y: 0, opacity: 1 }
            }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/25 text-purple-300 text-xs font-semibold uppercase tracking-wider mb-6 shadow-inner"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>Voice-native • Local-first • Open-source • Bring any model</span>
          </motion.div>

          {/* Massive Display Title */}
          <motion.h1 
            variants={{
              hidden: { y: 20, opacity: 0, scale: 0.96 },
              visible: { y: 0, opacity: 1, scale: 1 }
            }}
            className="text-6xl sm:text-7xl md:text-9xl font-bogle text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/50 tracking-tight leading-[0.95] drop-shadow-2xl mb-6"
          >
            REELS<br/>CREATOR
          </motion.h1>

          {/* Core Principle Proposition */}
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 10 },
              visible: { opacity: 1, y: 0 }
            }}
            className="text-lg sm:text-2xl font-medium text-purple-200 tracking-wide mb-4 font-mono"
          >
            Your keys. Your models. Your media. Your machine.
          </motion.div>

          {/* Credits Bar: Made by Ryan Jordan • Inspired by Seth Anderson */}
          <motion.div 
            variants={{
              hidden: { opacity: 0, y: 10 },
              visible: { opacity: 1, y: 0 }
            }}
            className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mb-8"
          >
            <div className="h-px w-8 sm:w-16 bg-gradient-to-r from-transparent to-white/40"></div>
            <div className="px-4 py-1.5 rounded-full bg-white/[0.04] border border-white/15 text-xs sm:text-sm text-neutral-300 backdrop-blur-md">
              Made by <span className="text-white font-bold">Ryan Jordan</span>
              <span className="mx-2 text-white/30">•</span>
              Inspired by <span className="text-purple-300 font-semibold">Seth Anderson</span>
            </div>
            <div className="h-px w-8 sm:w-16 bg-gradient-to-l from-transparent to-white/40"></div>
          </motion.div>

          {/* Subtitle */}
          <motion.p
            variants={{
              hidden: { opacity: 0, y: 10 },
              visible: { opacity: 1, y: 0 }
            }}
            className="text-base sm:text-lg text-neutral-300 max-w-2xl mx-auto font-light leading-relaxed mb-10"
          >
            From natural language prompts to viral video reels in seconds. Complete client-side IndexedDB persistence, Ollama localhost support, portable project bundles, and direct Google Veo rendering.
          </motion.p>

          {/* Action CTAs */}
          <motion.div
            variants={{
              hidden: { y: 20, opacity: 0 },
              visible: { y: 0, opacity: 1 }
            }}
            className="flex flex-col sm:flex-row items-center gap-4"
          >
            <button
              onClick={onEnter}
              className="w-full sm:w-auto px-10 py-5 bg-white text-black rounded-2xl font-bold tracking-widest text-sm transition-all duration-300 shadow-[0_0_50px_rgba(255,255,255,0.25)] hover:shadow-[0_0_70px_rgba(255,255,255,0.5)] hover:scale-105 flex items-center justify-center gap-3 group overflow-hidden relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out"></div>
              <span>START CREATING NOW</span>
              <Sparkles className="w-4 h-4 text-purple-600" />
            </button>
          </motion.div>

          {/* Tech Feature Badges */}
          <motion.div 
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1 }
            }}
            className="mt-14 flex flex-wrap justify-center gap-4 sm:gap-8 text-xs text-neutral-400 font-medium tracking-wider uppercase font-mono"
          >
            <span className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
              Ollama & Localhost
            </span>
            <span className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse delay-75"></div>
              Google Veo 3.1 Native
            </span>
            <span className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse delay-150"></div>
              IndexedDB Storage
            </span>
            <span className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-pink-400 animate-pulse delay-200"></div>
              Zero-Telemetry MIT
            </span>
          </motion.div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div 
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute bottom-4 z-10 cursor-pointer text-white/30 hover:text-white transition-colors"
          onClick={() => {
            const el = document.getElementById('studio-suite');
            el?.scrollIntoView({ behavior: 'smooth' });
          }}
        >
          <ChevronDown className="w-6 h-6" />
        </motion.div>
      </section>

      {/* LIVE SHOWCASE MINI-FEED PREVIEW */}
      <section className="relative z-20 py-16 px-6 bg-gradient-to-b from-black via-neutral-950 to-[#070709] border-t border-white/10">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10">
            <div>
              <div className="inline-flex items-center gap-2 text-purple-400 text-xs font-bold uppercase tracking-wider mb-2">
                <Flame className="w-4 h-4 text-amber-400" />
                <span>Featured AI Creations</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bogle text-white">
                Rendered with Cinematic AI
              </h2>
            </div>
            <p className="text-sm text-neutral-400 max-w-md mt-2 md:mt-0">
              Browse reels generated with custom lighting recipes, camera motions, and realistic AI avatars.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {SAMPLE_SHOWCASES.map((item, idx) => (
              <div 
                key={idx}
                className="group relative aspect-[9/16] max-h-[480px] bg-neutral-900 rounded-3xl overflow-hidden border border-white/10 hover:border-purple-500/40 transition-all shadow-xl flex flex-col justify-between p-4"
              >
                {/* Background Video */}
                <video 
                  src={item.video}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-80"
                />
                
                {/* Gradient vignette */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/90 pointer-events-none"></div>

                {/* Top badge */}
                <div className="relative z-10 flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-bold text-white font-mono">
                    {item.tag}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-purple-600/80 backdrop-blur-md text-[10px] font-bold text-white">
                    {item.views} views
                  </span>
                </div>

                {/* Bottom info */}
                <div className="relative z-10">
                  <div className="text-xs font-bold text-purple-300">{item.creator}</div>
                  <h4 className="text-sm font-bold text-white mt-0.5 leading-snug">{item.title}</h4>
                  <button 
                    onClick={onEnter}
                    className="mt-3 w-full py-2 bg-white/15 hover:bg-white text-white hover:text-black rounded-xl text-xs font-bold transition-all backdrop-blur-md flex items-center justify-center gap-1.5"
                  >
                    <span>Remix Prompt</span>
                    <Sparkles className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMPLETE CREATIVE SUITE BENTO GRID */}
      <section id="studio-suite" className="relative bg-[#070709] z-20 py-24 px-6 border-t border-white/10">
        <div className="w-full max-w-[1200px] mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/10 border border-purple-500/20 rounded-full text-purple-300 text-xs font-bold tracking-wider uppercase mb-3">
              <Zap className="w-3.5 h-3.5" />
              <span>Full Studio Ecosystem</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-bogle text-white mb-4">
              Everything You Need to Dominate Short-Form
            </h2>
            <p className="text-neutral-400 max-w-2xl mx-auto text-base font-light">
              A comprehensive studio designed for creators, marketers, and developers to produce viral video content with open-source sovereignty.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {FEATURES.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.08 }}
                  className={`${feature.colSpan} group relative bg-neutral-900/60 border border-white/10 ${feature.gradientBg} rounded-3xl p-8 hover:bg-neutral-900/90 transition-all overflow-hidden`}
                >
                  <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-15 blur-[90px] transition-opacity duration-500 rounded-full translate-x-1/2 -translate-y-1/2`}></div>
                  
                  <div className="flex items-start justify-between mb-6">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-neutral-300">
                      {feature.badge}
                    </span>
                  </div>
                  
                  <div className="text-xs font-semibold text-purple-300 mb-1">{feature.subtitle}</div>
                  <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                  <p className="text-neutral-400 text-sm leading-relaxed">{feature.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* VIRAL PSYCHOLOGY & PRINCIPLES (Inspired by Seth Anderson) */}
      <section className="relative bg-black z-20 py-24 px-6 border-t border-white/10">
        <div className="w-full max-w-[1200px] mx-auto text-white">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-300 mb-4">
              <Sparkles className="w-4 h-4 fill-amber-400" />
              <span className="text-xs font-bold tracking-widest uppercase">The Short-Form Formula</span>
            </div>
            
            <h2 className="text-4xl sm:text-6xl font-bogle mb-4">
              Engineering Algorithm Virality
            </h2>
            <p className="text-lg text-neutral-400 max-w-2xl mx-auto font-light">
              Built upon the short-form psychology and visual retention rules that capture millions of organic views.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            {VIRAL_PILLARS.map((pillar, i) => (
              <div 
                key={i} 
                className="p-8 bg-neutral-900/40 border border-white/10 rounded-3xl relative overflow-hidden group hover:border-white/20 transition-colors"
              >
                <div className="text-4xl font-bogle text-purple-500/40 font-mono mb-4">
                  {pillar.step}
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{pillar.title}</h3>
                <p className="text-neutral-400 text-sm leading-relaxed">{pillar.desc}</p>
              </div>
            ))}
          </div>

          {/* Bottom Launch Banner */}
          <div className="p-8 md:p-12 bg-gradient-to-r from-purple-950/60 via-neutral-900 to-indigo-950/60 border border-purple-500/30 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl">
            <div>
              <h3 className="text-2xl sm:text-3xl font-bogle text-white mb-2">
                Ready to create your next viral reel?
              </h3>
              <p className="text-neutral-400 text-sm max-w-xl">
                Open the canvas composer, select an AI avatar actor, type your vision, and render within moments.
              </p>
            </div>

            <button
              onClick={onEnter}
              className="px-8 py-4 bg-white text-black font-bold rounded-2xl hover:scale-105 transition-all text-sm tracking-wider uppercase shadow-xl shrink-0 flex items-center gap-2"
            >
              <span>Launch Reels Studio</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="w-full py-12 px-6 bg-[#050507] border-t border-white/10 text-center text-xs text-neutral-500">
        <div className="max-w-4xl mx-auto flex flex-col items-center gap-4">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Clapperboard className="w-4 h-4 text-purple-400" />
            <span>Reels Creator</span>
          </div>

          <div className="text-neutral-400 text-xs">
            Made by <span className="text-white font-semibold">Ryan Jordan</span> • Inspired by <span className="text-purple-300 font-semibold">Seth Anderson</span>
          </div>

          <p className="text-[11px] text-neutral-500 max-w-md">
            Voice-native • Local-first • Open-source • MIT Licensed • 0 Telemetry
          </p>
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;
