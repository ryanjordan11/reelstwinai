
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { motion } from 'framer-motion';
import { Copy, PenTool, Sparkles, Wand2, ArrowLeft } from 'lucide-react';
import React, { useState } from 'react';
import { generateScript } from '../services/geminiService';

interface ScriptCreatorProps {
  onBack: () => void;
}

const ScriptCreator: React.FC<ScriptCreatorProps> = ({ onBack }) => {
  const [topic, setTopic] = useState('');
  const [script, setScript] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setIsLoading(true);
    try {
      const result = await generateScript(topic);
      setScript(result);
    } catch (e) {
      console.error(e);
      setScript("Error generating script. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(script);
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
        <div className="flex items-center gap-4 mb-6">
            <button 
                onClick={onBack}
                className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-all border border-white/5 text-white/60 hover:text-white"
                title="Back"
            >
                <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="h-px flex-1 bg-white/10"></div>
        </div>

        <div className="text-center mb-10">
            <h1 className="text-4xl font-bogle text-white mb-2">Viral Script Writer</h1>
            <p className="text-white/50">Turn any idea into a high-retention reel script instantly.</p>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
            {/* Input Section */}
            <div className="w-full md:w-1/3 space-y-4">
                <div className="bg-neutral-900 border border-white/10 p-6 rounded-3xl">
                    <label className="block text-xs font-bold uppercase tracking-widest text-white/50 mb-3">
                        What is your video about?
                    </label>
                    <textarea
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="e.g. How to bake sourdough bread for beginners..."
                        className="w-full h-40 bg-black/50 border border-white/10 rounded-xl p-4 text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 resize-none text-sm mb-4"
                    />
                    <button
                        onClick={handleGenerate}
                        disabled={isLoading || !topic.trim()}
                        className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                            isLoading || !topic.trim() 
                            ? 'bg-white/5 text-white/20 cursor-not-allowed' 
                            : 'bg-white text-black hover:scale-105 shadow-lg shadow-white/10'
                        }`}
                    >
                        {isLoading ? (
                            <Sparkles className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                <Wand2 className="w-5 h-5" />
                                Generate Script
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Output Section */}
            <div className="w-full md:w-2/3">
                <div className="bg-neutral-900 border border-white/10 rounded-3xl p-6 md:p-8 min-h-[400px] relative">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2 text-white/50">
                            <PenTool className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-widest">Script Output</span>
                        </div>
                        {script && (
                            <button 
                                onClick={copyToClipboard}
                                className="p-2 hover:bg-white/10 rounded-lg text-white/50 hover:text-white transition-colors"
                                title="Copy to clipboard"
                            >
                                <Copy className="w-5 h-5" />
                            </button>
                        )}
                    </div>

                    {script ? (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="prose prose-invert prose-sm max-w-none whitespace-pre-wrap font-mono text-white/80"
                        >
                            {script}
                        </motion.div>
                    ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-white/20">
                            <PenTool className="w-12 h-12 mb-4 opacity-20" />
                            <p className="text-sm font-medium">Ready to write</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};

export default ScriptCreator;
