
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { motion } from 'framer-motion';
import { Facebook, Mail, PlayCircle, Star, TrendingUp } from 'lucide-react';
import React from 'react';

const CoursePage: React.FC = () => {
  return (
    <div className="w-full max-w-[1200px] mx-auto p-6 md:p-12 pb-32 text-white">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-16"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-full text-yellow-400 mb-6">
          <Star className="w-4 h-4 fill-yellow-400" />
          <span className="text-xs font-bold tracking-widest uppercase">The #1 Viral Engineering Course</span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bogle mb-6 bg-clip-text text-transparent bg-gradient-to-br from-white via-gray-200 to-gray-500">
          Crack the Code.<br />Go Viral.
        </h1>
        
        <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-8 font-light leading-relaxed">
          Learn the exact engineering principles Seth Anderson used to generate <span className="text-white font-bold">billions of views</span> across social media platforms.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button className="px-8 py-4 bg-white text-black font-bold rounded-xl hover:scale-105 transition-transform flex items-center gap-2 shadow-[0_0_30px_rgba(255,255,255,0.3)]">
            <PlayCircle className="w-5 h-5" />
            Join the Course
          </button>
          <button className="px-8 py-4 bg-white/10 border border-white/20 text-white font-bold rounded-xl hover:bg-white/20 transition-colors flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Book Free Consult
          </button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
        {[
          { icon: TrendingUp, title: "Algorithm Hacking", desc: "Reverse engineer the feed to guarantee distribution." },
          { icon: PlayCircle, title: "Retention Mechanics", desc: "Script structures that keep users watching till the end." },
          { icon: Star, title: "Monetization", desc: "Turn views into paying clients and brand deals." }
        ].map((item, i) => (
          <div key={i} className="p-8 bg-neutral-900/50 border border-white/10 rounded-3xl hover:border-white/30 transition-colors">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6">
              <item.icon className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-3">{item.title}</h3>
            <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>

      <div className="p-10 bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-white/10 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-8">
        <div>
          <h2 className="text-3xl font-bogle mb-2">Connect with Seth</h2>
          <p className="text-gray-400">Get daily tips and behind-the-scenes content.</p>
        </div>
        <a 
          href="#" 
          className="px-6 py-3 bg-[#1877F2] hover:bg-[#166fe5] text-white font-bold rounded-xl transition-colors flex items-center gap-2 shadow-lg"
        >
          <Facebook className="w-5 h-5" />
          Follow on Facebook
        </a>
      </div>
    </div>
  );
};

export default CoursePage;
