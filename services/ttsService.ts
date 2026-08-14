/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { CaptionWord } from '../types';

export interface TTSOptions {
  voiceName?: string;
  pitch?: number; // 0.5 to 2.0
  rate?: number;  // 0.5 to 2.0
  volume?: number; // 0 to 1
  elevenLabsApiKey?: string;
  elevenLabsVoiceId?: string;
}

export interface VoiceProfile {
  id: string;
  name: string;
  gender: 'male' | 'female' | 'neutral';
  accent: string;
  samplePhrase: string;
  browserVoiceMatch?: string[];
  elevenLabsVoiceId?: string;
}

export const VOICE_PROFILES: VoiceProfile[] = [
  {
    id: 'deep-cinema',
    name: 'Marcus (Deep Cinema Narrator)',
    gender: 'male',
    accent: 'US Dramatic',
    samplePhrase: 'In a world where intelligence meets boundless imagination...',
    browserVoiceMatch: ['Google US English', 'Daniel', 'Alex', 'en-US-Standard-B', 'Fred'],
    elevenLabsVoiceId: 'pNInz6obpgDQGcFmaJgB' // Adam
  },
  {
    id: 'studio-female',
    name: 'Sophia (Ultra-Clear Studio)',
    gender: 'female',
    accent: 'US Crisp & Modern',
    samplePhrase: 'Here are the top three secrets top creators use to go viral today.',
    browserVoiceMatch: ['Samantha', 'Victoria', 'Google UK English Female', 'en-US-Standard-C'],
    elevenLabsVoiceId: '21m00Tcm4TlvDq8ikWAM' // Rachel
  },
  {
    id: 'hype-vlog',
    name: 'Leo (High-Energy Creator)',
    gender: 'male',
    accent: 'Fast & Dynamic',
    samplePhrase: 'You will not believe what just happened in AI video generation!',
    browserVoiceMatch: ['Junior', 'Google US English', 'Alex'],
    elevenLabsVoiceId: 'ErXwobaYiN019PkySvjV' // Antoni
  },
  {
    id: 'british-sophisticated',
    name: 'Eleanor (British Cinematic)',
    gender: 'female',
    accent: 'UK Elegant',
    samplePhrase: 'Welcome to an exclusive behind-the-scenes showcase of cinematic reels.',
    browserVoiceMatch: ['Google UK English Female', 'Serena', 'Oliver', 'en-GB'],
    elevenLabsVoiceId: 'EXAVITQu4vr4xnSDxMaL' // Bella
  },
  {
    id: 'chill-storyteller',
    name: 'Kai (Warm & Ambient)',
    gender: 'neutral',
    accent: 'Soothing Mid-Tone',
    samplePhrase: 'Take a deep breath and watch the horizon transform with every frame.',
    browserVoiceMatch: ['Karen', 'Google US English', 'en-US'],
    elevenLabsVoiceId: 'MF3mGyEYCl7XYWbV9V6O' // Elli
  }
];

// Helper to get system browser voices
export const getAvailableVoices = (): Promise<SpeechSynthesisVoice[]> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      resolve([]);
      return;
    }

    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      resolve(voices);
      return;
    }

    window.speechSynthesis.onvoiceschanged = () => {
      resolve(window.speechSynthesis.getVoices());
    };

    setTimeout(() => {
      resolve(window.speechSynthesis.getVoices());
    }, 500);
  });
};

// Real-time Text to Speech with event triggers and simulated word timing
export const speakTextWithSync = (
  text: string,
  options: TTSOptions = {},
  callbacks?: {
    onStart?: () => void;
    onWord?: (word: string, wordIndex: number, progress: number) => void;
    onEnd?: () => void;
    onError?: (err: any) => void;
  }
): { cancel: () => void } => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.warn('SpeechSynthesis not supported');
    callbacks?.onEnd?.();
    return { cancel: () => {} };
  }

  // Cancel any existing speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.pitch = options.pitch ?? 1.0;
  utterance.rate = options.rate ?? 1.05;
  utterance.volume = options.volume ?? 1.0;

  const words = text.split(/\s+/).filter(Boolean);
  let currentWordIndex = 0;

  // Try to match voice
  const allVoices = window.speechSynthesis.getVoices();
  if (options.voiceName) {
    const matchedVoice = allVoices.find(v => 
      v.name.toLowerCase().includes(options.voiceName!.toLowerCase()) ||
      v.lang.toLowerCase().includes(options.voiceName!.toLowerCase())
    );
    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }
  }

  utterance.onstart = () => {
    callbacks?.onStart?.();
  };

  utterance.onboundary = (event) => {
    if (event.name === 'word' || event.charIndex !== undefined) {
      // Find which word corresponds to charIndex
      const charIdx = event.charIndex;
      let cumLen = 0;
      let targetWordIdx = 0;
      for (let i = 0; i < words.length; i++) {
        cumLen += words[i].length + 1;
        if (cumLen >= charIdx) {
          targetWordIdx = i;
          break;
        }
      }
      currentWordIndex = targetWordIdx;
      const word = words[currentWordIndex] || '';
      const progress = words.length > 0 ? (currentWordIndex + 1) / words.length : 0;
      callbacks?.onWord?.(word, currentWordIndex, progress);
    }
  };

  utterance.onend = () => {
    callbacks?.onEnd?.();
  };

  utterance.onerror = (err) => {
    callbacks?.onError?.(err);
    callbacks?.onEnd?.();
  };

  window.speechSynthesis.speak(utterance);

  return {
    cancel: () => {
      window.speechSynthesis.cancel();
    }
  };
};

// Generate Word-by-Word Timestamps for Karaoke Subtitles
export const generateWordTimestamps = (
  text: string,
  totalDurationSeconds: number = 6.0
): CaptionWord[] => {
  const words = text.replace(/[\n\r]+/g, ' ').split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];

  const timePerWord = totalDurationSeconds / Math.max(1, words.length);
  return words.map((word, index) => {
    const start = index * timePerWord;
    const end = Math.min(totalDurationSeconds, (index + 1) * timePerWord);
    return {
      word,
      start: Number(start.toFixed(2)),
      end: Number(end.toFixed(2))
    };
  });
};

// Generate ElevenLabs Speech Audio if user configured API Key
export const generateElevenLabsAudio = async (
  text: string,
  apiKey: string,
  voiceId: string = '21m00Tcm4TlvDq8ikWAM'
): Promise<Blob> => {
  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'Accept': 'audio/mpeg',
      'Content-Type': 'application/json',
      'xi-api-key': apiKey.trim(),
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ElevenLabs Error (${response.status}): ${errorText}`);
  }

  return await response.blob();
};
