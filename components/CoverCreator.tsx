
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useRef } from 'react';
import { Download, Sparkles, Image as ImageIcon, Wand2, ArrowLeft } from 'lucide-react';
import { generateCoverImage } from '../services/geminiService';

interface CoverCreatorProps {
  onBack: () => void;
}

const CoverCreator: React.FC<CoverCreatorProps> = ({ onBack }) => {
  const [prompt, setPrompt] = useState('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [overlayText, setOverlayText] = useState('');
  const [textColor, setTextColor] = useState('#ffffff');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleGenerate = async () => {
      if (!prompt.trim()) return;
      setIsGenerating(true);
      setErrorMsg(null);
      try {
          const base64 = await generateCoverImage(prompt);
          setGeneratedImage(base64);
      } catch (error: any) {
          console.error("Cover generation failed", error);
          const errorText = error instanceof Error ? error.message : String(error);
          if (errorText.toLowerCase().includes('quota') || errorText.toLowerCase().includes('limit') || errorText.toLowerCase().includes('429') || errorText.toLowerCase().includes('resource_exhausted')) {
              setErrorMsg("Quota limits exceeded (429) for Gemini! Set up a custom API Key or a Vercel AI Gateway proxy in the Settings menu (⚙️) to continue.");
          } else {
              setErrorMsg(`Generation failed: ${errorText.slice(0, 150)}... You can specify a custom API Key or Gateway in Settings.`);
          }
      } finally {
          setIsGenerating(false);
      }
  };

  const handleDownload = () => {
      if (!generatedImage || !canvasRef.current) return;
      
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const img = new Image();
      img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          
          // Draw Image
          ctx.drawImage(img, 0, 0);

          // Draw Text
          if (overlayText) {
              ctx.font = 'bold 80px "Inter", sans-serif';
              ctx.fillStyle = textColor;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.shadowColor = 'rgba(0,0,0,0.8)';
              ctx.shadowBlur = 20;
              ctx.shadowOffsetX = 4;
              ctx.shadowOffsetY = 4;
              
              // Simple word wrap
              const words = overlayText.split(' ');
              let line = '';
              let y = canvas.height / 2;
              const lineHeight = 100;

              for (let n = 0; n < words.length; n++) {
                const testLine = line + words[n] + ' ';
                const metrics = ctx.measureText(testLine);
                const testWidth = metrics.width;
                if (testWidth > canvas.width - 100 && n > 0) {
                    ctx.fillText(line, canvas.width / 2, y);
                    line = words[n] + ' ';
                    y += lineHeight;
                } else {
                    line = testLine;
                }
              }
              ctx.fillText(line, canvas.width / 2, y);
          }

          // Trigger download
          const link = document.createElement('a');
          link.download = 'cover-image.png';
          link.href = canvas.toDataURL();
          link.click();
      };
      img.src = generatedImage;
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
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
            <h1 className="text-4xl font-bogle text-white mb-2">Cover Creator</h1>
            <p className="text-white/50">Design viral thumbnails instantly with AI.</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
            {/* Controls */}
            <div className="w-full lg:w-1/3 space-y-6">
                <div className="bg-neutral-900 border border-white/10 p-6 rounded-3xl space-y-4">
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-white/50 mb-2">Image Prompt</label>
                        <textarea 
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="e.g. A futuristic neon city with a giant robot..."
                            className="w-full h-32 bg-black/50 border border-white/10 rounded-xl p-3 text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 resize-none"
                        />
                    </div>
                    
                    {errorMsg && (
                        <div className="bg-red-500/10 border border-red-500/30 text-red-200 text-xs p-3 rounded-xl leading-normal space-y-1">
                            <p className="font-semibold text-red-400">Generation Limit Hit</p>
                            <p>{errorMsg}</p>
                        </div>
                    )}

                    <button
                        onClick={handleGenerate}
                        disabled={isGenerating || !prompt.trim()}
                        className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                            isGenerating 
                            ? 'bg-white/5 text-white/20 cursor-not-allowed'
                            : 'bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:scale-105 shadow-lg'
                        }`}
                    >
                         {isGenerating ? <Sparkles className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
                         Generate Background
                    </button>
                </div>

                {generatedImage && (
                    <div className="bg-neutral-900 border border-white/10 p-6 rounded-3xl space-y-4">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-widest text-white/50 mb-2">Overlay Text</label>
                            <input 
                                type="text"
                                value={overlayText}
                                onChange={(e) => setOverlayText(e.target.value)}
                                placeholder="Add title..."
                                className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-white/30"
                            />
                        </div>
                        <div>
                             <label className="block text-xs font-bold uppercase tracking-widest text-white/50 mb-2">Text Color</label>
                             <div className="flex gap-2">
                                 {['#ffffff', '#ffff00', '#ff0000', '#00ff00', '#00ffff'].map(c => (
                                     <button 
                                        key={c} 
                                        onClick={() => setTextColor(c)}
                                        className={`w-8 h-8 rounded-full border-2 ${textColor === c ? 'border-white' : 'border-transparent'}`}
                                        style={{ backgroundColor: c }}
                                     />
                                 ))}
                             </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Preview */}
            <div className="w-full lg:w-2/3">
                 <div className="bg-[#050505] border border-white/10 rounded-3xl p-8 min-h-[500px] flex items-center justify-center relative overflow-hidden">
                     {generatedImage ? (
                         <div className="relative group max-w-full">
                             <img src={generatedImage} alt="Generated Cover" className="rounded-xl shadow-2xl max-h-[500px]" />
                             
                             {/* Text Overlay Preview (CSS approximation) */}
                             {overlayText && (
                                 <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-8">
                                     <h2 
                                        className="text-4xl md:text-6xl font-bold text-center drop-shadow-xl"
                                        style={{ color: textColor, textShadow: '2px 2px 10px rgba(0,0,0,0.8)' }}
                                     >
                                         {overlayText}
                                     </h2>
                                 </div>
                             )}

                             <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                 <button 
                                    onClick={handleDownload}
                                    className="bg-white text-black px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-lg hover:bg-gray-200"
                                 >
                                     <Download className="w-4 h-4" /> Download
                                 </button>
                             </div>
                         </div>
                     ) : (
                         <div className="text-center text-white/20">
                             <ImageIcon className="w-20 h-20 mx-auto mb-4 opacity-20" />
                             <p>Your creation will appear here</p>
                         </div>
                     )}
                 </div>
                 {/* Hidden Canvas for High Res Rendering */}
                 <canvas ref={canvasRef} className="hidden" />
            </div>
        </div>
    </div>
  );
};

export default CoverCreator;
