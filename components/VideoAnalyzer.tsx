
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { motion } from 'framer-motion';
import { Upload, Film, Sparkles, Check, AlertCircle } from 'lucide-react';
import React, { useState, useRef } from 'react';
import { analyzeVideo } from '../services/geminiService';
import { VideoFile } from '../types';

const VideoAnalyzer: React.FC = () => {
  const [videoFile, setVideoFile] = useState<VideoFile | null>(null);
  const [analysis, setAnalysis] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size (20MB limit for demo robustness)
    if (file.size > 20 * 1024 * 1024) {
        alert("Video too large. Please upload under 20MB.");
        return;
    }

    const reader = new FileReader();
    reader.onload = () => {
        if (typeof reader.result === 'string') {
            const base64 = reader.result.split(',')[1];
            setVideoFile({ file, base64 });
            setAnalysis('');
        }
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!videoFile) return;
    setIsAnalyzing(true);
    try {
        const result = await analyzeVideo(videoFile);
        setAnalysis(result);
    } catch (error) {
        console.error("Analysis failed", error);
        setAnalysis("Failed to analyze video. Please try again or use a shorter clip.");
    } finally {
        setIsAnalyzing(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-6 pb-32">
        <div className="text-center mb-10">
            <h1 className="text-4xl font-bogle text-white mb-2">Video Understanding</h1>
            <p className="text-white/50">Upload a viral clip to breakdown its format, style, and psychology.</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
            {/* Upload Area */}
            <div className="w-full lg:w-1/3">
                <div 
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-3xl h-[300px] flex flex-col items-center justify-center cursor-pointer transition-all ${videoFile ? 'border-green-500/50 bg-green-500/10' : 'border-white/20 hover:border-white/40 hover:bg-white/5'}`}
                >
                    <input type="file" ref={fileInputRef} className="hidden" accept="video/mp4, video/mov" onChange={handleFileChange} />
                    
                    {videoFile ? (
                        <>
                             <Film className="w-12 h-12 text-green-400 mb-4" />
                             <p className="font-bold text-white mb-1">Ready to Analyze</p>
                             <p className="text-xs text-white/50">{videoFile.file.name}</p>
                        </>
                    ) : (
                        <>
                             <Upload className="w-12 h-12 text-white/30 mb-4" />
                             <p className="font-bold text-white mb-1">Upload Video</p>
                             <p className="text-xs text-white/50">MP4, MOV (Max 20MB)</p>
                        </>
                    )}
                </div>

                <button
                    onClick={handleAnalyze}
                    disabled={!videoFile || isAnalyzing}
                    className={`mt-4 w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                        isAnalyzing || !videoFile
                        ? 'bg-white/5 text-white/20 cursor-not-allowed'
                        : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:scale-105 shadow-lg'
                    }`}
                >
                    {isAnalyzing ? (
                         <>
                            <Sparkles className="w-5 h-5 animate-spin" />
                            Analyzing...
                         </>
                    ) : (
                         <>
                            <Sparkles className="w-5 h-5" />
                            Analyze Structure
                         </>
                    )}
                </button>
            </div>

            {/* Results Area */}
            <div className="w-full lg:w-2/3">
                <div className="bg-neutral-900 border border-white/10 rounded-3xl p-8 min-h-[400px] relative">
                     <div className="absolute top-0 left-0 px-6 py-4 border-b border-white/10 w-full flex items-center gap-2 text-white/50">
                        <Check className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-widest">Analysis Report</span>
                     </div>
                     
                     <div className="mt-10 prose prose-invert prose-sm max-w-none font-mono whitespace-pre-wrap text-white/80">
                        {analysis ? (
                             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                {analysis}
                             </motion.div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-[300px] text-white/20">
                                <AlertCircle className="w-12 h-12 mb-4 opacity-20" />
                                <p>Analysis will appear here</p>
                            </div>
                        )}
                     </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default VideoAnalyzer;
