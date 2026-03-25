
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { motion, AnimatePresence } from 'framer-motion';
import React, { useState } from 'react';
import { X, ArrowRight, CheckCircle } from 'lucide-react';

interface MiniCourseProps {
  onClose: () => void;
}

const STEPS = [
  {
    title: "The 3-Second Rule",
    desc: "You have exactly 3 seconds to stop the scroll. We use a 'Pattern Interrupt'.",
    visual: "⚡️"
  },
  {
    title: "The Value Stack",
    desc: "Deliver 3 pieces of value in rapid succession. Don't let them breathe.",
    visual: "📚"
  },
  {
    title: "The Payoff",
    desc: "Resolve the tension you created in the hook. Make it satisfying.",
    visual: "🎯"
  }
];

const MiniCourse: React.FC<MiniCourseProps> = ({ onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
        setCurrentStep(prev => prev + 1);
    } else {
        onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 backdrop-blur-xl p-6">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative"
      >
        <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-white/5 rounded-full hover:bg-white/10 text-white transition-colors z-10">
             <X className="w-5 h-5" />
        </button>

        <div className="flex h-[500px]">
            {/* Sidebar Progress */}
            <div className="w-1/3 bg-white/5 border-r border-white/5 p-8 flex flex-col justify-center gap-6">
                {STEPS.map((_step, idx) => (
                    <div key={idx} className={`flex items-center gap-3 transition-colors ${idx === currentStep ? 'text-white' : 'text-white/20'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border ${idx === currentStep ? 'bg-white text-black border-white' : idx < currentStep ? 'bg-green-500 border-green-500 text-black' : 'border-white/20'}`}>
                            {idx < currentStep ? <CheckCircle className="w-4 h-4" /> : idx + 1}
                        </div>
                        <span className="text-sm font-bold">{idx === currentStep ? "Current" : idx < currentStep ? "Completed" : "Next"}</span>
                    </div>
                ))}
            </div>

            {/* Content Area */}
            <div className="w-2/3 p-12 flex flex-col justify-center relative">
                 <AnimatePresence mode="wait">
                    <motion.div
                        key={currentStep}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="flex flex-col h-full justify-center"
                    >
                         <div className="text-6xl mb-6">{STEPS[currentStep].visual}</div>
                         <h2 className="text-3xl font-bogle text-white mb-4">{STEPS[currentStep].title}</h2>
                         <p className="text-gray-400 text-lg leading-relaxed mb-8">{STEPS[currentStep].desc}</p>
                         
                         <button 
                            onClick={handleNext}
                            className="w-fit px-8 py-4 bg-white text-black font-bold rounded-xl hover:scale-105 transition-transform flex items-center gap-2"
                         >
                            {currentStep === STEPS.length - 1 ? "Finish Demo" : "Next Principle"}
                            <ArrowRight className="w-5 h-5" />
                         </button>
                    </motion.div>
                 </AnimatePresence>
            </div>
        </div>
      </motion.div>
    </div>
  );
};

export default MiniCourse;
