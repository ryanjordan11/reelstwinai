/**
 * @license
 * SPDX-License-Identifier: MIT
 * 
 * Model Provider Abstraction & Execution Service
 * 
 * Routes capabilities (text, video, image, vision, audio) across:
 * - Localhost / Ollama (100% On-Device, Offline, Zero Telemetry)
 * - Google Gemini & Veo (AI Studio)
 * - OpenRouter & OpenAI-Compatible Gateways
 * - Replicate Open Weights
 * 
 * Automatically audits every run in the Local Activity Inspector.
*/

import {
  GoogleGenAI,
  VideoGenerationReferenceImage,
  VideoGenerationReferenceType,
} from '@google/genai';
import { ApiProviderType, GenerateVideoParams, GenerationMode, VideoFile } from '../types';
import { executeCapability, getActiveUserSettings } from './providerRegistry';

export interface ApiConfiguration {
  provider: ApiProviderType;
  apiKey?: string;
  baseUrl?: string;
  ollamaUrl?: string;
  ollamaModel?: string;
  customTextModel?: string;
  customImageModel?: string;
}

// Helper to retrieve active API settings
export const getApiConfig = (): ApiConfiguration => {
  const settings = getActiveUserSettings();
  return {
    provider: settings.apiProvider || 'google',
    apiKey: settings.apiKey?.trim() || (typeof process !== 'undefined' ? process.env.API_KEY : undefined),
    baseUrl: settings.apiGatewayUrl?.trim() || undefined,
    ollamaUrl: settings.ollamaUrl?.trim() || 'http://localhost:11434',
    ollamaModel: settings.ollamaModel?.trim() || 'llama3.2:latest',
    customTextModel: settings.customTextModel?.trim() || undefined,
    customImageModel: settings.customImageModel?.trim() || undefined,
  };
};

export const getApiKey = (): string | undefined => {
  return getApiConfig().apiKey;
};

export const getApiGatewayUrl = (): string | undefined => {
  return getApiConfig().baseUrl;
};

export const getApiClient = (): GoogleGenAI => {
  const config = getApiConfig();
  const options: any = { apiKey: config.apiKey };
  if (config.baseUrl) {
    options.httpOptions = { baseUrl: config.baseUrl };
  }
  return new GoogleGenAI(options);
};

// Ollama Chat/Completion Fetcher (100% Localhost)
const callOllama = async (
  prompt: string,
  systemInstruction?: string,
  modelOverride?: string
): Promise<string> => {
  const config = getApiConfig();
  const baseUrl = (config.ollamaUrl || 'http://localhost:11434').replace(/\/+$/, '');
  const model = modelOverride || config.ollamaModel || 'llama3.2:latest';
  const endpoint = `${baseUrl}/api/chat`;

  const messages: any[] = [];
  if (systemInstruction) {
    messages.push({ role: 'system', content: systemInstruction });
  }
  messages.push({ role: 'user', content: prompt });

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages,
      stream: false,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Ollama Error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  const reply = data?.message?.content;
  if (!reply) {
    throw new Error('No content returned from local Ollama model.');
  }
  return reply;
};

// OpenAI-compatible Chat Completion fetcher
const callOpenAICompatibleChat = async (
  prompt: string,
  systemInstruction?: string,
  modelOverride?: string
): Promise<string> => {
  const config = getApiConfig();
  let baseUrl = config.baseUrl;
  
  if (!baseUrl) {
    if (config.provider === 'openrouter') baseUrl = 'https://openrouter.ai/api/v1';
    else if (config.provider === 'aihubmix') baseUrl = 'https://aihubmix.com/v1';
    else if (config.provider === 'vercel') baseUrl = 'https://gateway.ai.vercel.com/v1';
    else baseUrl = 'http://localhost:1234/v1';
  }

  baseUrl = baseUrl.replace(/\/+$/, '');
  const endpoint = baseUrl.endsWith('/chat/completions') ? baseUrl : `${baseUrl}/chat/completions`;

  const model = modelOverride || config.customTextModel || (
    config.provider === 'openrouter' ? 'google/gemini-2.5-flash' :
    config.provider === 'aihubmix' ? 'gemini-2.5-flash' :
    'gpt-4o-mini'
  );

  const messages: any[] = [];
  if (systemInstruction) {
    messages.push({ role: 'system', content: systemInstruction });
  }
  messages.push({ role: 'user', content: prompt });

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (config.apiKey) {
    headers['Authorization'] = `Bearer ${config.apiKey}`;
  }

  const res = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    let parsedMessage = errorText;
    try {
      const errJson = JSON.parse(errorText);
      parsedMessage = errJson.error?.message || errJson.message || errorText;
    } catch {}
    throw new Error(`API Error (${res.status}): ${parsedMessage}`);
  }

  const data = await res.json();
  const reply = data.choices?.[0]?.message?.content;
  if (!reply) {
    throw new Error('No content returned from AI provider.');
  }
  return reply;
};

// Test Connection Helper for verifying keys & gateway endpoints
export const testApiConnection = async (testConfig: {
  provider: ApiProviderType;
  apiKey?: string;
  baseUrl?: string;
  ollamaUrl?: string;
  ollamaModel?: string;
  customTextModel?: string;
}): Promise<{ success: boolean; message: string; latencyMs: number }> => {
  const startTime = Date.now();

  try {
    if (testConfig.provider === 'ollama') {
      const ollamaUrl = (testConfig.ollamaUrl || 'http://localhost:11434').replace(/\/+$/, '');
      const resp = await fetch(`${ollamaUrl}/api/tags`);
      const latencyMs = Date.now() - startTime;
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      const modelNames = data?.models?.map((m: any) => m.name).join(', ') || 'none found';
      return {
        success: true,
        message: `Connected to Localhost Ollama! Available models: ${modelNames} (${latencyMs}ms)`,
        latencyMs,
      };
    }

    const apiKey = testConfig.apiKey?.trim();
    if (!apiKey && testConfig.provider !== 'custom') {
      return { success: false, message: 'Please provide an API Key first.', latencyMs: 0 };
    }

    if (testConfig.provider === 'google') {
      const options: any = { apiKey };
      if (testConfig.baseUrl) {
        options.httpOptions = { baseUrl: testConfig.baseUrl };
      }
      const ai = new GoogleGenAI(options);
      const res = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: 'Ping test. Reply with: OK',
      });
      const latencyMs = Date.now() - startTime;
      return {
        success: true,
        message: `Successfully connected to Google Gemini! Response: "${res.text?.trim() || 'OK'}" (${latencyMs}ms)`,
        latencyMs,
      };
    } else {
      let baseUrl = testConfig.baseUrl?.trim();
      if (!baseUrl) {
        if (testConfig.provider === 'openrouter') baseUrl = 'https://openrouter.ai/api/v1';
        else if (testConfig.provider === 'aihubmix') baseUrl = 'https://aihubmix.com/v1';
        else if (testConfig.provider === 'vercel') baseUrl = 'https://gateway.ai.vercel.com/v1';
        else baseUrl = 'http://localhost:1234/v1';
      }
      baseUrl = baseUrl.replace(/\/+$/, '');
      const endpoint = baseUrl.endsWith('/chat/completions') ? baseUrl : `${baseUrl}/chat/completions`;
      const model = testConfig.customTextModel?.trim() || 'gpt-4o-mini';

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: 'Ping test. Reply with: OK' }],
          max_tokens: 20,
        }),
      });

      const latencyMs = Date.now() - startTime;
      if (!res.ok) {
        const errText = await res.text();
        return { success: false, message: `Connection failed (${res.status}): ${errText}`, latencyMs };
      }

      const data = await res.json();
      const reply = data.choices?.[0]?.message?.content?.trim() || 'OK';
      return {
        success: true,
        message: `Successfully connected! Model responded: "${reply}" (${latencyMs}ms)`,
        latencyMs,
      };
    }
  } catch (err: any) {
    const latencyMs = Date.now() - startTime;
    return {
      success: false,
      message: `Connection error: ${err.message || String(err)}`,
      latencyMs,
    };
  }
};

/**
 * CAPABILITY: text.generate (Viral Script Creation)
 */
export const generateScript = async (topic: string): Promise<string> => {
  const config = getApiConfig();

  const scriptPrompt = `Write a viral 30-second Instagram Reel/TikTok script about: "${topic}".
    
Structure the response exactly like this:
**HOOK (0-3s)**: [Visual & Audio hook]
**BODY (3-25s)**: [Key value/story]
**CTA (25-30s)**: [Call to action]
**CAPTION**: [Suggested caption with hashtags]

Keep it punchy, high-energy, and optimized for retention.`;

  return executeCapability(
    'text.generate',
    async () => {
      if (config.provider === 'ollama') {
        return await callOllama(scriptPrompt, 'You are an elite short-form viral scriptwriter for Instagram Reels, YouTube Shorts, and TikTok.');
      }
      if (config.provider === 'openrouter' || config.provider === 'aihubmix' || config.provider === 'custom' || config.provider === 'openai_compatible') {
        return await callOpenAICompatibleChat(scriptPrompt, 'You are an elite short-form viral scriptwriter.');
      }

      const ai = getApiClient();
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash', 
        contents: scriptPrompt,
      });
      return response.text || "Could not generate script.";
    },
    {
      capability: 'text.generate',
      provider: config.provider,
      model: config.provider === 'ollama' ? (config.ollamaModel || 'llama3.2') : (config.customTextModel || 'gemini-2.5-flash'),
      endpoint: config.provider === 'ollama' ? (config.ollamaUrl || 'http://localhost:11434') : 'api.google.com',
      isLocal: config.provider === 'ollama',
      payloadSummary: `Generate script for: ${topic}`,
    } as any
  );
};

/**
 * CAPABILITY: vision.analyze (Video Deconstruct)
 */
export const analyzeVideo = async (videoFile: VideoFile): Promise<string> => {
  const config = getApiConfig();

  return executeCapability(
    'vision.analyze',
    async () => {
      if (config.provider === 'openrouter' || config.provider === 'aihubmix' || config.provider === 'custom' || config.provider === 'openai_compatible') {
        const prompt = `Analyze this video clip (File: ${videoFile.file.name}).
Break down its format, visual style, psychological hooks, and viral retention mechanics.
Provide a timestamped breakdown of key moments and suggestions to optimize for TikTok and Instagram Reels. Output in Markdown.`;
        return await callOpenAICompatibleChat(prompt, 'You are an expert video viral analyst.');
      }

      const ai = getApiClient();
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: videoFile.file.type,
                data: videoFile.base64,
              }
            },
            {
              text: "Analyze this viral video. Breakdown its format, visual style, psychological hooks, and retention mechanics. Provide a timestamped breakdown of key moments. Output in Markdown."
            }
          ]
        }
      });

      return response.text || "Could not analyze video.";
    },
    {
      capability: 'vision.analyze',
      provider: config.provider,
      model: 'gemini-2.5-pro',
      endpoint: 'generativelanguage.googleapis.com',
      isLocal: false,
      payloadSummary: `Analyze video: ${videoFile.file.name} (${Math.round(videoFile.file.size / 1024)} KB)`,
      payloadBytes: videoFile.file.size,
    } as any
  );
};

/**
 * CAPABILITY: voice.transcribe (Audio to Text)
 */
export const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
  const config = getApiConfig();

  return executeCapability(
    'voice.transcribe',
    async () => {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          const base64Data = result.split(',')[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(audioBlob);
      });

      if (config.provider === 'openrouter' || config.provider === 'aihubmix' || config.provider === 'custom') {
        return await callOpenAICompatibleChat('Transcribe audio audio notes or speech to script text.', 'You are a transcription assistant.');
      }

      const ai = getApiClient();
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: audioBlob.type || 'audio/webm',
                data: base64,
              }
            },
            {
              text: "Transcribe the spoken audio exactly. Do not add any commentary."
            }
          ]
        }
      });

      return response.text || "";
    },
    {
      capability: 'voice.transcribe',
      provider: config.provider,
      model: 'gemini-2.5-flash',
      endpoint: 'generativelanguage.googleapis.com',
      isLocal: false,
      payloadSummary: `Transcribe voice audio (${Math.round(audioBlob.size / 1024)} KB)`,
      payloadBytes: audioBlob.size,
    } as any
  );
};

/**
 * CAPABILITY: image.generate (Avatar & Digital Twin Generation)
 */
export const generateAvatarImage = async (avatarPrompt: string, style?: string): Promise<string> => {
  const config = getApiConfig();
  const styleSuffix = style ? `, style: ${style}` : '';
  const fullPrompt = `${avatarPrompt}${styleSuffix}, high quality portrait avatar, centered character headshot and upper body, volumetric lighting, 8k render, masterpiece, clean background`;

  return executeCapability(
    'image.generate',
    async () => {
      if (config.provider === 'openrouter' || config.provider === 'aihubmix' || config.provider === 'custom' || config.provider === 'openai_compatible') {
        let baseUrl = config.baseUrl;
        if (!baseUrl) {
          if (config.provider === 'openrouter') baseUrl = 'https://openrouter.ai/api/v1';
          else if (config.provider === 'aihubmix') baseUrl = 'https://aihubmix.com/v1';
          else baseUrl = 'http://localhost:1234/v1';
        }
        baseUrl = baseUrl.replace(/\/+$/, '');
        const imgEndpoint = `${baseUrl}/images/generations`;

        try {
          const res = await fetch(imgEndpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${config.apiKey}`,
            },
            body: JSON.stringify({
              prompt: fullPrompt,
              model: config.customImageModel || 'dall-e-3',
              n: 1,
              size: '1024x1024',
              response_format: 'b64_json',
            }),
          });

          if (res.ok) {
            const data = await res.json();
            const b64 = data.data?.[0]?.b64_json;
            if (b64) return `data:image/png;base64,${b64}`;
            const url = data.data?.[0]?.url;
            if (url) return url;
          }
        } catch (e) {
          console.warn("Avatar image endpoint failed, trying Gemini fallback...", e);
        }
      }

      const ai = getApiClient();
      const response = await ai.models.generateContent({
        model: config.customImageModel || 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: fullPrompt }],
        },
        config: {},
      });

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
      throw new Error("No avatar image could be generated. Please check your API key and model settings.");
    },
    {
      capability: 'image.generate',
      provider: config.provider,
      model: config.customImageModel || 'gemini-2.5-flash-image',
      endpoint: 'generativelanguage.googleapis.com',
      isLocal: false,
      payloadSummary: `Generate avatar portrait: ${avatarPrompt.slice(0, 100)}`,
    } as any
  );
};

/**
 * CAPABILITY: text.generate (Prompt Director Enhancement)
 */
export const enhanceVideoPrompt = async (
  rawPrompt: string, 
  personaDetails?: { name?: string; style?: string; niche?: string }
): Promise<string> => {
  const config = getApiConfig();
  const context = personaDetails ? `Context: Character is "${personaDetails.name || 'Hero'}", Style is "${personaDetails.style || 'Cinematic'}", Niche is "${personaDetails.niche || 'General'}".` : '';
  const prompt = `You are a Hollywood AI Video Director specializing in Google Veo and short-form Reels.
Convert the user's simple idea into a detailed, cinematic video generation prompt with dynamic camera movement, lighting, motion beats, and atmospheric realism.

User Idea: "${rawPrompt}"
${context}

Rules:
- Keep the output to 1-2 concise, vivid sentences (under 60 words).
- Focus strictly on visual motion, camera angle, realistic lighting, and action.
- Do NOT include quotes, headers, or explanations. Output ONLY the raw enhanced prompt.`;

  return executeCapability(
    'text.generate',
    async () => {
      if (config.provider === 'ollama') {
        const text = await callOllama(prompt, 'You are an elite video prompt engineer for Veo and Sora.');
        return text.replace(/^["']|["']$/g, '').trim();
      }
      if (config.provider === 'openrouter' || config.provider === 'aihubmix' || config.provider === 'custom' || config.provider === 'openai_compatible') {
        const text = await callOpenAICompatibleChat(prompt, 'You are an elite video prompt engineer for Veo and Sora.');
        return text.replace(/^["']|["']$/g, '').trim();
      }

      const ai = getApiClient();
      const response = await ai.models.generateContent({
        model: config.customTextModel || 'gemini-2.5-flash',
        contents: prompt,
      });

      return (response.text || rawPrompt).replace(/^["']|["']$/g, '').trim();
    },
    {
      capability: 'text.generate',
      provider: config.provider,
      model: config.provider === 'ollama' ? (config.ollamaModel || 'llama3.2') : (config.customTextModel || 'gemini-2.5-flash'),
      endpoint: config.provider === 'ollama' ? (config.ollamaUrl || 'http://localhost:11434') : 'api.google.com',
      isLocal: config.provider === 'ollama',
      payloadSummary: `Enhance prompt: ${rawPrompt.slice(0, 80)}`,
    } as any
  );
};

/**
 * CAPABILITY: image.generate (Cover Art & Thumbnails)
 */
export const generateCoverImage = async (prompt: string): Promise<string> => {
  const config = getApiConfig();

  return executeCapability(
    'image.generate',
    async () => {
      if (config.provider === 'openrouter' || config.provider === 'aihubmix' || config.provider === 'custom') {
        let baseUrl = config.baseUrl;
        if (!baseUrl) {
          if (config.provider === 'openrouter') baseUrl = 'https://openrouter.ai/api/v1';
          else if (config.provider === 'aihubmix') baseUrl = 'https://aihubmix.com/v1';
          else baseUrl = 'https://api.openai.com/v1';
        }
        baseUrl = baseUrl.replace(/\/+$/, '');
        const imgEndpoint = `${baseUrl}/images/generations`;

        try {
          const res = await fetch(imgEndpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${config.apiKey}`,
            },
            body: JSON.stringify({
              prompt: `${prompt}, youtube thumbnail style, vibrant, 4k, no text`,
              model: config.customImageModel || 'dall-e-3',
              n: 1,
              size: '1024x1024',
              response_format: 'b64_json',
            }),
          });

          if (res.ok) {
            const data = await res.json();
            const b64 = data.data?.[0]?.b64_json;
            if (b64) return `data:image/png;base64,${b64}`;
            const url = data.data?.[0]?.url;
            if (url) return url;
          }
        } catch (e) {
          console.warn("Images generation endpoint failed, trying chat fallback...", e);
        }
      }

      const ai = getApiClient();
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              text: prompt + ", high quality, youtube thumbnail style, vibrant, 4k, no text"
            }
          ]
        },
        config: {}
      });

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
      throw new Error("No image generated");
    },
    {
      capability: 'image.generate',
      provider: config.provider,
      model: 'gemini-2.5-flash-image',
      endpoint: 'generativelanguage.googleapis.com',
      isLocal: false,
      payloadSummary: `Generate cover image: ${prompt.slice(0, 100)}`,
    } as any
  );
};

/**
 * CAPABILITY: video.generate (Google Veo 3.1 Synthesis)
 */
export const generateVideo = async (
  params: GenerateVideoParams,
): Promise<{url: string; blob: Blob}> => {
  const apiKey = getApiKey();
  const ai = getApiClient();
  const selectedModel = params.customModelId?.trim() || params.model;

  return executeCapability(
    'video.generate',
    async () => {
      const generateVideoPayload: any = {
        model: selectedModel,
        prompt: params.prompt,
        config: {
          numberOfVideos: 1,
          aspectRatio: params.aspectRatio,
          resolution: params.resolution,
        },
      };

      if (params.mode === GenerationMode.FRAMES_TO_VIDEO) {
        if (params.startFrame) {
          generateVideoPayload.image = {
            imageBytes: params.startFrame.base64,
            mimeType: params.startFrame.file.type,
          };
        }

        const finalEndFrame = params.isLooping
          ? params.startFrame
          : params.endFrame;
        if (finalEndFrame) {
          generateVideoPayload.config.lastFrame = {
            imageBytes: finalEndFrame.base64,
            mimeType: finalEndFrame.file.type,
          };
        }
      } else if (params.mode === GenerationMode.REFERENCES_TO_VIDEO) {
        const referenceImagesPayload: VideoGenerationReferenceImage[] = [];

        if (params.referenceImages) {
          for (const img of params.referenceImages) {
            referenceImagesPayload.push({
              image: {
                imageBytes: img.base64,
                mimeType: img.file.type,
              },
              referenceType: VideoGenerationReferenceType.ASSET,
            });
          }
        }

        if (params.styleImage) {
          referenceImagesPayload.push({
            image: {
              imageBytes: params.styleImage.base64,
              mimeType: params.styleImage.file.type,
            },
            referenceType: VideoGenerationReferenceType.STYLE,
          });
        }

        if (referenceImagesPayload.length > 0) {
          generateVideoPayload.config.referenceImages = referenceImagesPayload;
        }
      }

      let operation = await ai.models.generateVideos(generateVideoPayload);

      while (!operation.done) {
        await new Promise((resolve) => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({operation: operation});
      }

      if (operation.error) {
        const errorMessage = (operation.error as any).message || 'Video generation failed.';
        throw new Error(errorMessage);
      }

      if (operation.response) {
        const videos = operation.response.generatedVideos;
        if (!videos || videos.length === 0) {
          throw new Error('No videos were generated. The prompt or reference image might have triggered safety filters.');
        }

        const firstVideo = videos[0];
        if (!firstVideo?.video?.uri) {
          throw new Error('Generated video is missing a URI.');
        }

        const url = decodeURIComponent(firstVideo.video.uri);
        const headers: Record<string, string> = {};
        if (apiKey) {
          headers['x-goog-api-key'] = apiKey;
        }

        const res = await fetch(url, { headers });
        if (!res.ok) {
          throw new Error(`Failed to fetch video: ${res.status} ${res.statusText}`);
        }

        const videoBlob = await res.blob();
        const videoUrl = URL.createObjectURL(videoBlob);

        return {url: videoUrl, blob: videoBlob};
      } else {
        throw new Error('Video generation finished but no video was returned.');
      }
    },
    {
      capability: 'video.generate',
      provider: 'google',
      model: selectedModel,
      endpoint: 'generativelanguage.googleapis.com',
      isLocal: false,
      payloadSummary: `Synthesize ${params.aspectRatio} video: ${params.prompt.slice(0, 100)}`,
    } as any
  );
};

export const enhancePrompt = async (prompt: string, style?: string): Promise<string> => {
  return enhanceVideoPrompt(prompt, { style });
};
