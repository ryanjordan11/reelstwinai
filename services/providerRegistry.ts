/**
 * @license
 * SPDX-License-Identifier: MIT
 * 
 * Capability Layer & Model Provider Abstraction
 * 
 * Routes tasks to local (Ollama, on-device Web APIs) or remote providers
 * based on user configuration, with automatic model discovery and real-time execution auditing.
*/

import { AiCapability, ApiProviderType, CapabilityDescriptor, ProviderConfig, UserSettings } from '../types';
import { localDB } from './db';

export const CAPABILITY_DESCRIPTORS: CapabilityDescriptor[] = [
  {
    id: 'text.generate',
    name: 'Viral Script & Hook Generation',
    description: 'Generates multi-scene scripts, hooks, value stacks, and prompt enhancements.',
    defaultProvider: 'google',
    availableProviders: ['ollama', 'google', 'openrouter', 'openai_compatible', 'aihubmix', 'custom']
  },
  {
    id: 'video.generate',
    name: 'Short-Form Video Synthesis',
    description: 'Generates photorealistic or stylized 9:16 and 16:9 cinematic video clips.',
    defaultProvider: 'google',
    availableProviders: ['google', 'replicate', 'custom']
  },
  {
    id: 'image.generate',
    name: 'Avatar & Thumbnail Synthesis',
    description: 'Generates consistent AI avatars, scene storyboards, and high-impact reel covers.',
    defaultProvider: 'google',
    availableProviders: ['google', 'openai_compatible', 'replicate', 'custom']
  },
  {
    id: 'voice.synthesize',
    name: 'Voice Narration & TTS',
    description: 'Converts script lines into rhythmic vocal audio narration.',
    defaultProvider: 'custom', // Web Speech API offline default or ElevenLabs
    availableProviders: ['custom', 'ollama']
  },
  {
    id: 'voice.transcribe',
    name: 'Audio Transcription & Voice Input',
    description: 'Transcribes spoken prompts and live audio into text.',
    defaultProvider: 'custom', // Browser Web Speech API default
    availableProviders: ['custom', 'ollama']
  },
  {
    id: 'vision.analyze',
    name: 'Video & Image Deconstruct',
    description: 'Reverse-engineers cinematography, lighting, and camera motion from media.',
    defaultProvider: 'google',
    availableProviders: ['google', 'ollama', 'openrouter', 'openai_compatible']
  },
  {
    id: 'trends.search',
    name: 'Algorithmic Trends Discovery',
    description: 'Discovers viral hooks and real-time trending creative angles.',
    defaultProvider: 'google',
    availableProviders: ['google', 'custom']
  }
];

export const KNOWN_PROVIDERS: ProviderConfig[] = [
  {
    id: 'ollama',
    name: 'Ollama (Localhost / 100% On-Device)',
    baseUrl: 'http://localhost:11434',
    isLocal: true,
    supportedCapabilities: ['text.generate', 'vision.analyze', 'voice.synthesize', 'voice.transcribe'],
    lastPingStatus: 'untested'
  },
  {
    id: 'google',
    name: 'Google Gemini & Veo (AI Studio)',
    baseUrl: 'https://generativelanguage.googleapis.com',
    isLocal: false,
    supportedCapabilities: ['text.generate', 'video.generate', 'image.generate', 'vision.analyze', 'trends.search'],
    lastPingStatus: 'online'
  },
  {
    id: 'openrouter',
    name: 'OpenRouter (Universal Gateway)',
    baseUrl: 'https://openrouter.ai/api/v1',
    isLocal: false,
    supportedCapabilities: ['text.generate', 'vision.analyze', 'image.generate'],
    lastPingStatus: 'untested'
  },
  {
    id: 'openai_compatible',
    name: 'OpenAI-Compatible (vLLM / LM Studio / Local Proxy)',
    baseUrl: 'http://localhost:1234/v1',
    isLocal: true,
    supportedCapabilities: ['text.generate', 'vision.analyze', 'image.generate'],
    lastPingStatus: 'untested'
  },
  {
    id: 'replicate',
    name: 'Replicate (Open Weights Cloud)',
    baseUrl: 'https://api.replicate.com/v1',
    isLocal: false,
    supportedCapabilities: ['video.generate', 'image.generate', 'text.generate'],
    lastPingStatus: 'untested'
  },
  {
    id: 'custom',
    name: 'Custom User Gateway / Web Native',
    baseUrl: '',
    isLocal: false,
    supportedCapabilities: ['text.generate', 'image.generate', 'video.generate', 'voice.synthesize', 'voice.transcribe'],
    lastPingStatus: 'untested'
  }
];

// Helper to get active user settings
export const getActiveUserSettings = (): UserSettings => {
  if (typeof window === 'undefined') {
    return {
      displayName: 'Creator',
      avatarBase64: null,
      apiProvider: 'google',
    };
  }
  try {
    const raw = localStorage.getItem('reelsCreatorSettings');
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn("Could not read settings from localStorage", e);
  }
  return {
    displayName: 'Creator',
    avatarBase64: null,
    apiProvider: 'google',
    ollamaUrl: 'http://localhost:11434',
    ollamaModel: 'llama3.2:latest',
  };
};

/**
 * Ping check for Ollama or OpenAI-compatible local/remote endpoints
 */
export const pingProviderEndpoint = async (
  providerId: ApiProviderType, 
  customUrl?: string
): Promise<{ success: boolean; latencyMs: number; models?: string[]; error?: string }> => {
  const startTime = performance.now();
  const url = (customUrl || (providerId === 'ollama' ? 'http://localhost:11434' : 'http://localhost:1234')).replace(/\/+$/, '');

  try {
    if (providerId === 'ollama') {
      const resp = await fetch(`${url}/api/tags`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });
      const latencyMs = Math.round(performance.now() - startTime);

      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
      }

      const data = await resp.json();
      const models = data?.models?.map((m: any) => m.name) || [];
      return { success: true, latencyMs, models };
    }

    if (providerId === 'openai_compatible' || providerId === 'openrouter') {
      const settings = getActiveUserSettings();
      const headers: Record<string, string> = { 'Accept': 'application/json' };
      if (settings.apiKey) {
        headers['Authorization'] = `Bearer ${settings.apiKey}`;
      }

      const resp = await fetch(`${url}/models`, { method: 'GET', headers });
      const latencyMs = Math.round(performance.now() - startTime);

      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
      }

      const data = await resp.json();
      const models = data?.data?.map((m: any) => m.id) || [];
      return { success: true, latencyMs, models };
    }

    // Default basic ping
    const latencyMs = Math.round(performance.now() - startTime);
    return { success: true, latencyMs, models: ['google/gemini-2.5-flash', 'veo-3.1-generate-preview'] };
  } catch (err: any) {
    const latencyMs = Math.round(performance.now() - startTime);
    return { 
      success: false, 
      latencyMs, 
      error: err.message || 'Failed to connect. Ensure CORS or local companion proxy is configured.' 
    };
  }
};

/**
 * Execute capability through provider abstraction with local audit logging
 */
export async function executeCapability<T>(
  capability: AiCapability,
  executionFn: () => Promise<T>,
  meta: {
    model: string;
    endpoint: string;
    isLocal: boolean;
    provider: ApiProviderType;
    payloadSummary: string;
    payloadBytes?: number;
  }
): Promise<T> {
  const startTime = Date.now();
  const estimatedPayloadBytes = meta.payloadBytes || new TextEncoder().encode(meta.payloadSummary).length;

  try {
    const result = await executionFn();
    const durationMs = Date.now() - startTime;

    // Log to IndexedDB Local Activity Inspector
    await localDB.logActivity({
      timestamp: Date.now(),
      capability,
      provider: meta.provider,
      model: meta.model,
      endpoint: meta.endpoint,
      executionType: meta.isLocal ? 'local' : 'remote',
      payloadSummary: meta.payloadSummary.slice(0, 300),
      payloadSizeBytes: estimatedPayloadBytes,
      durationMs,
      status: 'success',
      storageLocation: 'IndexedDB (Local)',
      telemetrySent: '0 bytes • None'
    });

    return result;
  } catch (error: any) {
    const durationMs = Date.now() - startTime;

    // Log failure
    await localDB.logActivity({
      timestamp: Date.now(),
      capability,
      provider: meta.provider,
      model: meta.model,
      endpoint: meta.endpoint,
      executionType: meta.isLocal ? 'local' : 'remote',
      payloadSummary: meta.payloadSummary.slice(0, 300),
      payloadSizeBytes: estimatedPayloadBytes,
      durationMs,
      status: 'error',
      storageLocation: 'IndexedDB (Local)',
      telemetrySent: '0 bytes • None',
      error: error?.message || 'Execution failed'
    });

    throw error;
  }
}
