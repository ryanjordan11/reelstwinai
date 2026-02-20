
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { AnimatePresence, motion } from 'framer-motion';
import React, { useRef, useState, useEffect } from 'react';
import { AspectRatio, CameoProfile, GenerateVideoParams, GenerationMode, ImageFile, Preset, Resolution, UserSettings, VeoModel } from '../types';
import { ArrowUp, Plus, User, RectangleVertical, RectangleHorizontal, Mic, MicOff, SlidersHorizontal, Sparkles } from 'lucide-react';
import { transcribeAudio } from '../services/geminiService';

// Use PNG for cameos to ensure compatibility
const defaultCameoProfiles: CameoProfile[] = [
  { id: '1', name: 'asr', imageUrl: 'https://api.dicebear.com/7.x/avataaars/png?seed=asr&backgroundColor=transparent' },
  { id: '2', name: 'skirano', imageUrl: 'https://api.dicebear.com/7.x/avataaars/png?seed=skirano&backgroundColor=transparent' },
  { id: '3', name: 'lc-99', imageUrl: 'https://api.dicebear.com/7.x/avataaars/png?seed=lc99&backgroundColor=transparent' },
  { id: '4', name: 'sama', imageUrl: 'https://api.dicebear.com/7.x/avataaars/png?seed=sama&backgroundColor=transparent' },
  { id: '5', name: 'justinem', imageUrl: 'https://api.dicebear.com/7.x/avataaars/png?seed=justinem&backgroundColor=transparent' },
];

const PRESETS: Preset[] = [
    { id: 'cinematic', label: 'Cinematic', promptSuffix: ', cinematic lighting, 4k, anamorphic lens, shallow depth of field, high budget movie style' },
    { id: 'cyberpunk', label: 'Cyberpunk', promptSuffix: ', neon lights, futuristic city, rainy night, cyberpunk aesthetics, pink and blue hues' },
    { id: 'vintage', label: 'Vintage 90s', promptSuffix: ', vhs aesthetic, 90s camcorder style, slight grain, nostalgic feel' },
    { id: 'nature', label: 'Nat Geo', promptSuffix: ', national geographic style, ultra realistic, detailed textures, 8k, wildlife photography' },
    { id: 'anime', label: 'Anime', promptSuffix: ', anime style, studio ghibli inspired, vibrant colors, detailed background' },
    { id: 'claymation', label: 'Claymation', promptSuffix: ', stop motion claymation style, aardman animation style, detailed clay texture, soft lighting' },
    { id: 'pixelart', label: 'Pixel Art', promptSuffix: ', 16-bit pixel art style, vibrant colors, retro video game aesthetic' },
    { id: 'noir', label: 'Film Noir', promptSuffix: ', black and white film noir, high contrast, dramatic shadows, rain, mystery atmosphere' },
    { id: 'watercolor', label: 'Watercolor', promptSuffix: ', soft watercolor painting style, fluid textures, artistic, dreamy' },
    { id: '3d-render', label: '3D Render', promptSuffix: ', 3d octane render, unreal engine 5, raytracing, hyper realistic, crisp details' },
    { id: 'vaporwave', label: 'Vaporwave', promptSuffix: ', vaporwave aesthetic, pastel gradients, greek statues, glitches, retro computer graphics' },
    { id: 'gothic', label: 'Gothic', promptSuffix: ', gothic fantasy, dark atmosphere, intricate architecture, fog, cool color palette' },
];

const examplePrompts = [
  "Vibecoding on a snowy mountain top...",
  "Skydiving over the crystal blue Bahamas...",
  "Walking the red carpet at a movie premiere...",
  "Piloting a spaceship through a colorful nebula...",
  "Dj-ing at a massive neon music festival...",
  "Discovering an ancient temple in the jungle...",
  "Sipping coffee in a cozy Parisian cafe...",
  "Surfing a giant wave at sunset...",
  "Shredding on a guitar in front of a huge crowd...",
  "Floating in zero gravity on a space station...",
];

// Helper to fetch image from URL and convert to base64 for API
const urlToImageFile = async (url: string): Promise<ImageFile> => {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const base64 = reader.result.split(',')[1];
        // Create a dummy File object.
        const file = new File([blob], 'cameo.png', { type: blob.type });
        resolve({ file, base64 });
      } else {
        reject(new Error("Failed to read image data as string"));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};


const fileToImageFile = (file: File): Promise<ImageFile> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
            const base64 = reader.result.split(',')[1];
            if (base64) {
              resolve({file, base64});
            } else {
              reject(new Error('Failed to extract base64 data.'));
            }
        } else {
            reject(new Error('FileReader result is not a string.'));
        }
      };
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
};

interface BottomPromptBarProps {
  onGenerate: (params: GenerateVideoParams) => void;
  userSettings: UserSettings | null;
  forcedPrompt?: string; // New prop to accept prompt from outside
}

const BottomPromptBar: React.FC<BottomPromptBarProps> = ({ onGenerate, userSettings, forcedPrompt }) => {
  // Expanded by default
  const [isExpanded, setIsExpanded] = useState(true);
  const [prompt, setPrompt] = useState('');
  const [selectedCameoId, setSelectedCameoId] = useState<string | null>(null);
  const [currentAspectRatio, setCurrentAspectRatio] = useState<AspectRatio>(AspectRatio.PORTRAIT);
  
  // Voice & Presets
  const [isRecording, setIsRecording] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  // Combine default and user uploaded profiles
  const [profiles, setProfiles] = useState<CameoProfile[]>(defaultCameoProfiles);
  // Cache ImageFiles (base64 data) for profiles
  const [profileImages, setProfileImages] = useState<Record<string, ImageFile>>({});
  // Track uploaded blob URLs to revoke on unmount
  const uploadedImageUrlsRef = useRef<string[]>([]);
  
  const [promptIndex, setPromptIndex] = useState(0);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const barRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Only collapse on click outside if empty and no image selected
      if (barRef.current && !barRef.current.contains(event.target as Node) && prompt === '' && !selectedCameoId) {
        setIsExpanded(false);
      }
      if (showPresets && barRef.current && !barRef.current.contains(event.target as Node)) {
          setShowPresets(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [prompt, selectedCameoId, showPresets]);

  // Sync forced prompt from parent (Trend Remix)
  useEffect(() => {
    if (forcedPrompt) {
        setPrompt(forcedPrompt);
        setIsExpanded(true);
        if (inputRef.current) {
            setTimeout(() => {
                inputRef.current?.focus();
                // Trigger height adjustment
                if (inputRef.current) {
                   inputRef.current.style.height = 'auto';
                   inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`;
                }
            }, 100);
        }
    }
  }, [forcedPrompt]);

  // Sync user settings to profiles list
  useEffect(() => {
    if (userSettings && userSettings.avatarBase64) {
        const userProfileId = 'saved-user-profile';
        const userProfile: CameoProfile = {
            id: userProfileId,
            name: userSettings.displayName || 'You',
            imageUrl: userSettings.avatarBase64
        };

        // Cache the base64 directly since we already have it
        try {
            // Extract mimetype
            const mimeType = userSettings.avatarBase64.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,.*/)?.[1] || 'image/png';
            const base64Data = userSettings.avatarBase64.split(',')[1];
            
            // Convert base64 to blob to create a File object
            const byteCharacters = atob(base64Data);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], {type: mimeType});
            const file = new File([blob], "profile.png", { type: mimeType });

            setProfileImages(prev => ({
                ...prev,
                [userProfileId]: {
                    file: file,
                    base64: base64Data
                }
            }));
            
            setProfiles(prev => {
                // Remove existing saved profile if any, then add to front
                const clean = prev.filter(p => p.id !== userProfileId);
                return [userProfile, ...clean];
            });
        } catch (e) {
            console.error("Error processing user settings avatar", e);
        }
    }
  }, [userSettings]);

  // Cleanup object URLs only on unmount ensures they stay valid for the session
  useEffect(() => {
    return () => {
        uploadedImageUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

  // Cycle through example prompts
  useEffect(() => {
    if (prompt !== '') return; // Stop cycling if user types
    const interval = setInterval(() => {
      setPromptIndex((prev) => (prev + 1) % examplePrompts.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [prompt]);

  const handleFocus = () => setIsExpanded(true);

  const handleCameoSelect = (id: string) => {
    if (selectedCameoId === id) {
      setSelectedCameoId(null);
    } else {
      setSelectedCameoId(id);
    }
    if (!isExpanded) setIsExpanded(true);
  };

  const handleAspectRatioSelect = (ratio: AspectRatio) => {
    setCurrentAspectRatio(ratio);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        // Basic validation for image types
        if (!file.type.startsWith('image/')) {
            console.error("Only image files are supported for references.");
            return;
        }
        
        const imgFile = await fileToImageFile(file);
        const newId = `user-${Date.now()}`;
        // Create object URL for display. It is tracked in ref for cleanup on unmount.
        const objectUrl = URL.createObjectURL(file);
        uploadedImageUrlsRef.current.push(objectUrl);

        const newProfile: CameoProfile = {
            id: newId,
            name: 'You',
            imageUrl: objectUrl,
        };

        // Add to beginning of list
        setProfiles(prev => [newProfile, ...prev]);
        // Cache base64 for generation
        setProfileImages(prev => ({ ...prev, [newId]: imgFile }));
        // Auto-select and set default
        setSelectedCameoId(newId);

        if (!isExpanded) setIsExpanded(true);
      } catch (error) {
        console.error("Error uploading file", error);
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };
  
  const handleVoiceInput = async () => {
    if (isRecording) {
      // Stop recording
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    } else {
      // Start recording
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        const chunks: Blob[] = [];

        mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
        mediaRecorder.onstop = async () => {
            const blob = new Blob(chunks, { type: 'audio/webm' });
            // Transcribe
            setIsExpanded(true);
            const text = await transcribeAudio(blob);
            if (text) {
                setPrompt(prev => prev + (prev ? " " : "") + text);
                if (inputRef.current) {
                    setTimeout(() => inputRef.current?.focus(), 100);
                }
            }
            // Stop tracks
            stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
        mediaRecorderRef.current = mediaRecorder;
        setIsRecording(true);
        setIsExpanded(true); // Ensure expanded
      } catch (err) {
        console.error("Error accessing microphone:", err);
        alert("Microphone access denied or not available.");
      }
    }
  };

  const fillPrompt = () => {
      const currentPrompt = examplePrompts[promptIndex];
      setPrompt(currentPrompt);
      if (inputRef.current) {
          inputRef.current.focus();
          // Adjust height immediately
          setTimeout(() => {
              if (inputRef.current) {
                  inputRef.current.style.height = 'auto';
                  inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`;
              }
          }, 0);
      }
  };

  const getProfileImage = async (profile: CameoProfile): Promise<ImageFile> => {
    if (profileImages[profile.id]) {
        return profileImages[profile.id];
    }

    if (profile.id.startsWith('user-')) {
        // Should be in cache if uploaded
        throw new Error('Image data not found for user profile in cache.');
    }

    // Fetch for default profiles
    const imgFile = await urlToImageFile(profile.imageUrl);
    setProfileImages(prev => ({ ...prev, [profile.id]: imgFile }));
    return imgFile;
  };

  const handlePresetSelect = (preset: Preset) => {
      setPrompt(prev => {
          // Avoid appending duplicate styles
          if (prev.includes(preset.promptSuffix)) return prev;
          return prev + preset.promptSuffix;
      });
      setShowPresets(false);
  };


  const handleSubmit = async () => {
    if (!prompt.trim()) return;

    let mode = GenerationMode.TEXT_TO_VIDEO;
    let referenceImages: ImageFile[] | undefined = undefined;
    let startFrame: ImageFile | undefined = undefined;
    
    // Default to fast for text-to-video unless we are doing something complex
    let selectedModel = VeoModel.VEO_FAST;
    
    if (selectedCameoId) {
      const cameo = profiles.find(c => c.id === selectedCameoId);
      if (cameo) {
        try {
            const imgFile = await getProfileImage(cameo);
            
            // Logic to handle aspect ratio constraints
            // Reference Images usually require 16:9 in Preview.
            // Image-to-Video (Start Frame) supports 9:16.
            if (currentAspectRatio === AspectRatio.PORTRAIT) {
                // If 9:16 is selected, treat as Start Frame (Image to Video) to ensure support
                mode = GenerationMode.FRAMES_TO_VIDEO;
                selectedModel = VeoModel.VEO; 
                startFrame = imgFile;
            } else {
                // If 16:9, use References (better for consistency if available)
                mode = GenerationMode.REFERENCES_TO_VIDEO;
                selectedModel = VeoModel.VEO; 
                referenceImages = [imgFile];
            }
        } catch (e) {
            console.error("Failed to load cameo image", e);
            return; // Don't submit if image fails
        }
      }
    }

    const params: GenerateVideoParams = {
      prompt,
      model: selectedModel,
      aspectRatio: currentAspectRatio,
      resolution: Resolution.P720, // 720p is safe for both models
      mode: mode,
      referenceImages: referenceImages,
      startFrame: startFrame,
    };

    onGenerate(params);
    
    // Reset form
    setPrompt('');
    
    // Reset text area height
    if (inputRef.current) {
        inputRef.current.style.height = '28px';
        inputRef.current.focus(); // Keep focus for rapid prompting
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Tab' && prompt === '' && isExpanded) {
        e.preventDefault(); // Prevent focus change
        fillPrompt();
    }
  };

  const selectedProfile = profiles.find(p => p.id === selectedCameoId);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none mb-6">
      
      <motion.div
        ref={barRef}
        // Force overflow-visible when presets are shown to prevent clipping
        className={`w-full max-w-2xl mx-4 bg-neutral-900/90 border border-white/10 backdrop-blur-2xl shadow-[0_0_50px_rgba(0,0,0,0.7)] pointer-events-auto relative ring-1 ring-white/5 group rounded-[32px]`}
        style={{ overflow: showPresets ? 'visible' : 'hidden' }}
        initial={false}
        animate={{
          height: 'auto',
        }}
        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
      >
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
              className="px-3 pt-3"
            >
              {/* Cameos section */}
              <div className="bg-black/40 rounded-2xl p-2 border border-white/5 shadow-inner relative">
                
                {/* Header Row: Label + Aspect Ratio Controls */}
                <div className="flex items-center justify-between mb-1 px-2 text-white/70 pt-1">
                    <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5" />
                        <p className="text-[10px] font-bold uppercase tracking-wider font-sans text-white/50">Select Face</p>
                    </div>

                    <div className="flex items-center gap-1 bg-white/5 rounded-lg p-0.5 border border-white/5">
                        <button
                            onClick={() => handleAspectRatioSelect(AspectRatio.PORTRAIT)}
                            className={`p-1.5 rounded-md transition-all ${currentAspectRatio === AspectRatio.PORTRAIT ? 'bg-white/20 text-white shadow-sm' : 'text-white/30 hover:text-white/70 hover:bg-white/5'}`}
                            title="Reel (9:16)"
                        >
                            <RectangleVertical className="w-3.5 h-3.5" />
                        </button>
                        <button
                            onClick={() => handleAspectRatioSelect(AspectRatio.LANDSCAPE)}
                            className={`p-1.5 rounded-md transition-all ${currentAspectRatio === AspectRatio.LANDSCAPE ? 'bg-white/20 text-white shadow-sm' : 'text-white/30 hover:text-white/70 hover:bg-white/5'}`}
                            title="Cinema (16:9)"
                        >
                            <RectangleHorizontal className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
                
                <div className="flex gap-3 overflow-x-auto no-scrollbar items-center px-2 py-2 -my-1">
                  {/* Upload button */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className={`w-12 h-12 shrink-0 rounded-xl border-2 border-dashed border-white/20 hover:border-white/80 bg-white/0 hover:bg-white/5 text-white/40 hover:text-white flex items-center justify-center transition-all duration-300 relative group/upload hover:scale-105 hover:shadow-[0_0_15px_rgba(255,255,255,0.15)]`}
                    title="Upload your photo"
                  >
                    <Plus className="w-6 h-6 transition-transform group-hover/upload:rotate-90 duration-300" />
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/png, image/jpeg, image/webp" className="hidden" />
                  </button>
                  
                  {/* Divider */}
                  <div className="w-px h-6 bg-white/10 shrink-0 rounded-full"></div>

                  {profiles.map((profile) => (
                    <button
                      key={profile.id}
                      onClick={() => handleCameoSelect(profile.id)}
                      className={`w-12 h-12 shrink-0 rounded-xl overflow-hidden transition-all duration-300 relative group/cameo bg-black/50 ${
                        selectedCameoId === profile.id
                          ? 'ring-2 ring-white ring-offset-2 ring-offset-black/80 scale-105 opacity-100 z-10 shadow-lg'
                          : 'opacity-60 hover:opacity-100 hover:scale-105 grayscale hover:grayscale-0 border border-white/5'
                      }`}
                    >
                      <img src={profile.imageUrl} alt={profile.name} className={`w-full h-full object-cover ${profile.id.startsWith('user-') || profile.id === 'saved-user-profile' ? '' : 'p-0.5'}`} />
                      {selectedCameoId !== profile.id && <div className="absolute inset-0 bg-black/20 group-hover/cameo:bg-transparent transition-colors"></div>}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className={`flex items-end gap-3 px-3 pb-3 relative transition-all ${isExpanded ? 'pt-3' : 'pt-3'}`}>
          <div className="relative">
              <button 
                onClick={() => {
                    if (isExpanded) {
                        setShowPresets(!showPresets);
                    } else {
                        setIsExpanded(true);
                        // Delay opening presets slightly to allow expansion animation to start
                        setTimeout(() => setShowPresets(true), 150);
                    }
                }}
                className={`w-11 h-11 flex items-center justify-center rounded-full transition-all duration-300 shrink-0 shadow-lg ${showPresets ? 'bg-white text-black' : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'}`}
                title="Styles & Presets"
              >
                <SlidersHorizontal className="w-5 h-5" />
              </button>

              {/* Presets Popover */}
              <AnimatePresence>
                {showPresets && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: -10, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute bottom-full left-0 mb-4 w-48 bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl p-2 z-[60] flex flex-col gap-1 ring-1 ring-white/10 max-h-60 overflow-y-auto no-scrollbar"
                    >
                         <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white/40">Presets</p>
                         {PRESETS.map(preset => (
                             <button
                                key={preset.id}
                                onClick={() => handlePresetSelect(preset)}
                                className="px-3 py-2 rounded-lg hover:bg-white/10 text-left text-sm text-white/80 hover:text-white transition-colors flex items-center gap-2"
                             >
                                <Sparkles className="w-3 h-3 text-indigo-400" />
                                {preset.label}
                             </button>
                         ))}
                    </motion.div>
                )}
              </AnimatePresence>
          </div>
          
          <div className="flex-grow relative py-2 flex items-center">
            {/* Animated Placeholder with Tab Hint */}
            <AnimatePresence mode="wait">
              {prompt === '' && isExpanded && (
                <motion.div
                  key={examplePrompts[promptIndex]}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-y-0 left-0 flex items-center w-full pointer-events-none pr-2"
                >
                  <span className="text-white/40 text-lg font-light font-sans tracking-wide truncate flex-grow">
                    {examplePrompts[promptIndex]}
                  </span>
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="ml-2 px-1.5 py-0.5 rounded border border-white/20 bg-white/5 text-[10px] font-mono text-white/50 uppercase flex items-center gap-1 pointer-events-auto cursor-pointer hover:bg-white/10 hover:text-white/70 transition-colors"
                    onClick={fillPrompt}
                  >
                    Tab
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>

            <textarea
              ref={inputRef}
              value={prompt}
              onChange={(e) => {
                setPrompt(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
              }}
              onFocus={handleFocus}
              onKeyDown={handleKeyDown}
              rows={1}
              placeholder={!isExpanded ? "Describe the scene..." : ""}
              className={`w-full bg-transparent text-white outline-none resize-none overflow-hidden py-0.5 leading-relaxed text-lg font-light font-sans tracking-wide relative z-10 placeholder:text-white/40 ${prompt === '' && isExpanded ? 'opacity-0 focus:opacity-100' : ''}`}
              style={{ height: '28px' }}
            />
          </div>

          <div className="flex items-center gap-2.5 shrink-0 pb-0.5">
             {/* Voice Input Button */}
             <button
                onClick={handleVoiceInput}
                className={`w-11 h-11 flex items-center justify-center rounded-full transition-all duration-300 border ${
                    isRecording 
                    ? 'bg-red-500/20 text-red-500 border-red-500/50 animate-pulse' 
                    : 'bg-white/5 text-white/50 border-white/5 hover:bg-white/10 hover:text-white'
                }`}
                title="Voice Input"
             >
                 {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
             </button>

            <AnimatePresence mode="wait">
                {selectedCameoId && selectedProfile && (
                    <motion.div
                        key="cameo-badge"
                        initial={{ width: 0, opacity: 0, scale: 0.9 }}
                        animate={{ width: 'auto', opacity: 1, scale: 1 }}
                        exit={{ width: 0, opacity: 0, scale: 0.9 }}
                        className="overflow-hidden flex items-center justify-center h-11 px-1.5 bg-white/10 border border-white/10 backdrop-blur-md text-white rounded-xl"
                    >
                        <img src={selectedProfile.imageUrl} alt={selectedProfile.name} className="w-8 h-8 rounded-lg object-cover bg-black/50" />
                    </motion.div>
                )}
            </AnimatePresence>
            
            <button
              onClick={() => {
                setIsExpanded(!isExpanded);
                setShowPresets(false);
                if (!isExpanded && inputRef.current) {
                    setTimeout(() => inputRef.current?.focus(), 100);
                }
              }}
              className={`w-11 h-11 flex items-center justify-center rounded-full transition-all duration-300 shrink-0 shadow-lg ${isExpanded ? 'bg-white/10 text-white hover:bg-white/20 border border-white/10 rotate-45' : 'text-white bg-gradient-to-br from-indigo-500 to-purple-600 hover:scale-105 shadow-[0_0_15px_rgba(99,102,241,0.5)]'}`}
            >
              <Plus className={`w-5 h-5`} />
            </button>
            
            <button
              onClick={handleSubmit}
              disabled={!prompt.trim()}
              className={`w-11 h-11 flex items-center justify-center rounded-full transition-all duration-300 ${
                prompt.trim()
                  ? 'bg-white text-black hover:scale-105 shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.6)]'
                  : 'bg-white/5 text-white/30 border border-white/5 cursor-not-allowed'
              }`}
            >
              <ArrowUp className="w-5 h-5" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default BottomPromptBar;
