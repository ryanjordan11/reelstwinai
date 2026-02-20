
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { motion, AnimatePresence } from 'framer-motion';
import React, { useState } from 'react';
import { Clapperboard, Sparkles, ChevronDown, PlayCircle, Video, PenTool, Scan, Image as ImageIcon, Scissors, TrendingUp, X, ArrowRight, CheckCircle } from 'lucide-react';
import CoursePage from './CoursePage';
import MiniCourse from './MiniCourse';

interface LandingPageProps {
  onEnter: () => void;
}

const FEATURES = [
    {
        title: "AI Video Generation",
        desc: "Powered by Google Veo. Turn text prompts into cinematic 1080p video instantly.",
        icon: Video,
        color: "from-blue-500 to-cyan-500",
        colSpan: "md:col-span-2"
    },
    {
        title: "Viral Script Writer",
        desc: "Generate high-retention scripts with hooks, value stacks, and CTAs.",
        icon: PenTool,
        color: "from-purple-500 to-pink-500",
        colSpan: "md:col-span-1"
    },
    {
        title: "Video Analysis",
        desc: "Upload viral clips. AI breaks down the pacing, format, and psychology.",
        icon: Scan,
        color: "from-green-500 to-emerald-500",
        colSpan: "md:col-span-1"
    },
    {
        title: "Cover Creator",
        desc: "Design click-worthy thumbnails using Nano Banana image models.",
        icon: ImageIcon,
        color: "from-orange-500 to-red-500",
        colSpan: "md:col-span-1"
    },
    {
        title: "Storyboard Editor",
        desc: "Sequence your clips, add text overlays, and export ready-to-post reels.",
        icon: Scissors,
        color: "from-indigo-500 to-violet-500",
        colSpan: "md:col-span-1"
    },
    {
        title: "Trend Remixing",
        desc: "Real-time feed of viral formats tailored to your specific niche.",
        icon: TrendingUp,
        color: "from-yellow-500 to-orange-500",
        colSpan: "md:col-span-2"
    }
];

const LandingPage: React.FC<LandingPageProps> = ({ onEnter }) => {
  const [showDemo, setShowDemo] = useState(false);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black text-white font-sans scroll-smooth">
      <AnimatePresence>
        {showDemo && <MiniCourse onClose={() => setShowDemo(false)} />}
      </AnimatePresence>

      {/* Hero Section */}
      <div className="relative h-screen flex flex-col items-center justify-center overflow-hidden">
        {/* Background Video Layer */}
        <div className="absolute inset-0 z-0 opacity-40">
            <video 
                autoPlay 
                loop 
                muted 
                playsInline
                className="w-full h-full object-cover grayscale opacity-50 scale-105"
            >
                {/* Public Stock Video for Background */}
                <source src="https://assets.mixkit.co/videos/preview/mixkit-crowds-of-people-cross-a-street-junction-4401-large.mp4" type="video/mp4" />
            </video>
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-black via-black/80 to-black"></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_black_100%)]"></div>
        </div>

        {/* Animated Background Orbs */}
        <motion.div 
            animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-purple-900/30 rounded-full blur-[120px] pointer-events-none z-0" 
        />
        <motion.div 
            animate={{ 
                scale: [1, 1.1, 1],
                opacity: [0.2, 0.4, 0.2],
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-900/30 rounded-full blur-[100px] pointer-events-none z-0" 
        />

        {/* Main Content */}
        <motion.div 
            initial="hidden"
            animate="visible"
            variants={{
                hidden: { opacity: 0 },
                visible: { opacity: 1, transition: { staggerChildren: 0.2 } }
            }}
            className="relative z-10 text-center flex flex-col items-center p-6 max-w-4xl"
        >
            <motion.div 
                variants={{
                    hidden: { y: -20, opacity: 0 },
                    visible: { y: 0, opacity: 1 }
                }}
                className="mb-8 p-5 bg-white/5 rounded-[2rem] ring-1 ring-white/10 backdrop-blur-xl shadow-[0_0_60px_rgba(255,255,255,0.05)] relative group"
            >
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-[2rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                <Clapperboard className="w-20 h-20 text-white relative z-10 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]" />
            </motion.div>

            <motion.h1 
                variants={{
                    hidden: { y: 20, opacity: 0, scale: 0.9 },
                    visible: { y: 0, opacity: 1, scale: 1 }
                }}
                className="text-7xl md:text-9xl font-bogle text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/40 tracking-tight drop-shadow-2xl mb-2"
            >
            REELS<br/>CREATOR
            </motion.h1>
            
            <motion.div 
                variants={{
                    hidden: { opacity: 0 },
                    visible: { opacity: 1 }
                }}
                className="flex items-center gap-4 mb-12"
            >
                <div className="h-px w-12 bg-gradient-to-r from-transparent to-white/50"></div>
                <p className="text-lg md:text-xl text-white/70 font-light tracking-[0.2em] uppercase">
                By Seth Anderson
                </p>
                <div className="h-px w-12 bg-gradient-to-l from-transparent to-white/50"></div>
            </motion.div>

            <motion.button
            variants={{
                hidden: { y: 20, opacity: 0 },
                visible: { y: 0, opacity: 1 }
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onEnter}
            className="group relative px-10 py-5 bg-white text-black rounded-full font-bold tracking-widest text-sm transition-all duration-300 shadow-[0_0_40px_rgba(255,255,255,0.15)] hover:shadow-[0_0_60px_rgba(255,255,255,0.4)] overflow-hidden"
            >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out"></div>
            <span className="flex items-center gap-3 relative z-10">
                START CREATING
                <Sparkles className="w-4 h-4 text-purple-600" />
            </span>
            </motion.button>

            {/* Feature Tags */}
            <motion.div 
                variants={{
                    hidden: { opacity: 0 },
                    visible: { opacity: 1 }
                }}
                className="mt-16 flex gap-6 md:gap-12 text-xs md:text-sm text-white/30 font-medium tracking-widest uppercase"
            >
                <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div> AI Powered</span>
                <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse delay-75"></div> Viral Scripts</span>
                <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse delay-150"></div> Instant Video</span>
            </motion.div>
        </motion.div>

        <motion.div 
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute bottom-10 z-10"
        >
            <ChevronDown className="w-6 h-6 text-white/30" />
        </motion.div>
      </div>

      {/* Features Grid Section */}
      <div className="relative bg-[#050505] z-20 border-t border-white/10">
          <div className="w-full max-w-[1200px] mx-auto p-6 md:p-12 py-24">
              <div className="text-center mb-16">
                  <h2 className="text-4xl font-bogle text-white mb-4">Complete Creative Suite</h2>
                  <p className="text-white/50 max-w-2xl mx-auto">Everything you need to go from idea to posted reel, powered by the latest Gemini models.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {FEATURES.map((feature, idx) => (
                      <motion.div
                          key={idx}
                          initial={{ opacity: 0, y: 20 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: idx * 0.1 }}
                          className={`${feature.colSpan} group relative bg-neutral-900/50 border border-white/10 rounded-3xl p-8 hover:bg-neutral-900 transition-colors overflow-hidden`}
                      >
                          <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-10 blur-[80px] transition-opacity duration-500 rounded-full translate-x-1/2 -translate-y-1/2`}></div>
                          
                          <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 shadow-lg`}>
                              <feature.icon className="w-6 h-6 text-white" />
                          </div>
                          
                          <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                          <p className="text-gray-400 leading-relaxed">{feature.desc}</p>
                      </motion.div>
                  ))}
              </div>
          </div>
      </div>

      {/* Course Content Section (Below the fold) */}
      <div className="relative bg-black z-20">
          <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-[#050505] to-transparent z-10"></div>
          
          <div className="w-full max-w-[1200px] mx-auto p-6 md:p-12 pb-32 text-white relative">
            <div className="text-center mb-16 pt-20">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-full text-yellow-400 mb-6">
                    <Sparkles className="w-4 h-4 fill-yellow-400" />
                    <span className="text-xs font-bold tracking-widest uppercase">Masterclass Included</span>
                </div>
                
                <h2 className="text-4xl md:text-6xl font-bogle mb-6">
                    Engineering Virality
                </h2>
                <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-8 font-light">
                    This isn't just a tool. It's a complete system for dominating the feed.
                </p>

                <button 
                    onClick={() => setShowDemo(true)}
                    className="px-8 py-4 bg-white/10 border border-white/20 text-white font-bold rounded-xl hover:bg-white/20 transition-colors flex items-center gap-3 mx-auto"
                >
                    <PlayCircle className="w-5 h-5" />
                    Watch Interactive Demo
                </button>
            </div>

            {/* Reuse Course Content Layout */}
            <CoursePage />
          </div>
      </div>
    </div>
  );
};

export default LandingPage;
