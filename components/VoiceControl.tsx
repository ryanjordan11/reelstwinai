
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, FunctionDeclaration, Type, Blob } from '@google/genai';
import { Mic, MicOff, Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppView } from '../types';
import { getApiKey } from '../services/geminiService';

interface VoiceControlProps {
  onNavigate: (view: AppView) => void;
}

const NAVIGATE_TOOL: FunctionDeclaration = {
  name: 'navigate_to_page',
  description: 'Navigate to a specific page in the application.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      page: {
        type: Type.STRING,
        description: 'The page to navigate to. Valid values: feed, trending, gallery, scripts, course, analyze.',
        enum: ['feed', 'trending', 'gallery', 'scripts', 'course', 'analyze']
      }
    },
    required: ['page']
  }
};

const VoiceControl: React.FC<VoiceControlProps> = ({ onNavigate }) => {
  const [isActive, setIsActive] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  // Refs for audio handling
  const inputContextRef = useRef<AudioContext | null>(null);
  const outputContextRef = useRef<AudioContext | null>(null);
  const inputNodeRef = useRef<ScriptProcessorNode | null>(null);
  const outputNodeRef = useRef<GainNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sessionRef = useRef<Promise<any> | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const startSession = async () => {
    try {
      const apiKey = getApiKey();
      if (!apiKey) {
          alert("Please set your API key in Settings first.");
          return;
      }

      const ai = new GoogleGenAI({ apiKey });
      
      // Setup Audio Contexts
      inputContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      outputNodeRef.current = outputContextRef.current.createGain();
      outputNodeRef.current.connect(outputContextRef.current.destination);
      
      streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Connect to Live API
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: 'You are the voice assistant for Cameo Studio. You can control the app navigation. If the user asks to go to a page, use the navigate_to_page tool. Be brief and helpful.',
          tools: [{ functionDeclarations: [NAVIGATE_TOOL] }],
        },
        callbacks: {
          onopen: () => {
             console.log("Voice session opened");
             setIsActive(true);

             // Start Input Streaming
             if (!inputContextRef.current || !streamRef.current) return;
             
             const source = inputContextRef.current.createMediaStreamSource(streamRef.current);
             const processor = inputContextRef.current.createScriptProcessor(4096, 1, 1);
             inputNodeRef.current = processor;

             processor.onaudioprocess = (e) => {
                const inputData = e.inputBuffer.getChannelData(0);
                const pcmBlob = createBlob(inputData);
                sessionPromise.then(session => {
                    session.sendRealtimeInput({ media: pcmBlob });
                });
             };

             source.connect(processor);
             processor.connect(inputContextRef.current.destination);
          },
          onmessage: async (msg: LiveServerMessage) => {
             // Handle Tool Calls
             if (msg.toolCall) {
                for (const fc of msg.toolCall.functionCalls) {
                    if (fc.name === 'navigate_to_page') {
                        const page = (fc.args as any).page;
                        console.log("Navigating to:", page);
                        onNavigate(page as AppView);
                        
                        // Send confirmation
                        sessionPromise.then(session => {
                            session.sendToolResponse({
                                functionResponses: {
                                    id: fc.id,
                                    name: fc.name,
                                    response: { result: `Navigated to ${page}` }
                                }
                            });
                        });
                    }
                }
             }

             // Handle Audio Output
             const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
             if (audioData) {
                setIsSpeaking(true);
                playAudio(audioData);
             }
             
             if (msg.serverContent?.turnComplete) {
                 setIsSpeaking(false);
             }
          },
          onclose: () => {
             setIsActive(false);
             setIsSpeaking(false);
          },
          onerror: (err) => {
              console.error(err);
              setIsActive(false);
          }
        }
      });
      
      sessionRef.current = sessionPromise;

    } catch (e) {
        console.error("Failed to start voice session", e);
        setIsActive(false);
    }
  };

  const stopSession = () => {
     // Close session logic (API doesn't strictly have close method on promise, usually rely on component unmount or just cutting stream)
     // We will stop the media tracks and audio contexts
     if (streamRef.current) {
         streamRef.current.getTracks().forEach(t => t.stop());
         streamRef.current = null;
     }
     if (inputNodeRef.current) {
         inputNodeRef.current.disconnect();
         inputNodeRef.current = null;
     }
     if (inputContextRef.current) {
         inputContextRef.current.close();
         inputContextRef.current = null;
     }
     if (outputContextRef.current) {
         outputContextRef.current.close();
         outputContextRef.current = null;
     }
     setIsActive(false);
     setIsSpeaking(false);
  };

  const createBlob = (data: Float32Array): Blob => {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
      int16[i] = data[i] * 32768;
    }
    const bytes = new Uint8Array(int16.buffer);
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);

    return {
      data: base64,
      mimeType: 'audio/pcm;rate=16000',
    };
  };

  const playAudio = async (base64: string) => {
      if (!outputContextRef.current || !outputNodeRef.current) return;
      
      const binaryString = atob(base64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      const dataInt16 = new Int16Array(bytes.buffer);
      const buffer = outputContextRef.current.createBuffer(1, dataInt16.length, 24000);
      const channelData = buffer.getChannelData(0);
      for (let i = 0; i < dataInt16.length; i++) {
          channelData[i] = dataInt16[i] / 32768.0;
      }

      const source = outputContextRef.current.createBufferSource();
      source.buffer = buffer;
      source.connect(outputNodeRef.current);
      
      const currentTime = outputContextRef.current.currentTime;
      nextStartTimeRef.current = Math.max(nextStartTimeRef.current, currentTime);
      source.start(nextStartTimeRef.current);
      nextStartTimeRef.current += buffer.duration;
      
      sourcesRef.current.add(source);
      source.onended = () => {
          sourcesRef.current.delete(source);
          if (sourcesRef.current.size === 0) setIsSpeaking(false);
      };
  };

  const toggleSession = () => {
      if (isActive) {
          stopSession();
      } else {
          startSession();
      }
  };

  return (
    <div className="fixed bottom-32 right-6 z-[60]">
        <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleSession}
            className={`w-16 h-16 rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.5)] flex items-center justify-center transition-all ${
                isActive 
                ? 'bg-red-500 text-white' 
                : 'bg-white text-black'
            }`}
        >
            <AnimatePresence mode="wait">
                {isActive ? (
                    isSpeaking ? (
                        <motion.div
                            key="speaking"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <Volume2 className="w-8 h-8 animate-pulse" />
                        </motion.div>
                    ) : (
                        <motion.div
                             key="listening"
                             initial={{ opacity: 0 }}
                             animate={{ opacity: 1 }}
                             exit={{ opacity: 0 }}
                        >
                             <Mic className="w-8 h-8" />
                        </motion.div>
                    )
                ) : (
                    <motion.div
                        key="idle"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                         <MicOff className="w-8 h-8 text-black/50" />
                    </motion.div>
                )}
            </AnimatePresence>
            
            {/* Ring Animation when active */}
            {isActive && (
                <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 animate-ping -z-10"></span>
            )}
        </motion.button>
    </div>
  );
};

export default VoiceControl;
