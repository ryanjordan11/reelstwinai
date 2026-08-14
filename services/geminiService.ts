
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import {
  GoogleGenAI,
  VideoGenerationReferenceImage,
  VideoGenerationReferenceType,
} from '@google/genai';
import { ApiProviderType, GenerateVideoParams, GenerationMode, VideoFile } from '../types';

export interface ApiConfiguration {
  provider: ApiProviderType;
  apiKey?: string;
  baseUrl?: string;
  customTextModel?: string;
  customImageModel?: string;
}

// Helper to retrieve all active API settings
export const getApiConfig = (): ApiConfiguration => {
  try {
    const settingsStr = localStorage.getItem('reelsCreatorSettings');
    if (settingsStr) {
      const settings = JSON.parse(settingsStr);
      return {
        provider: settings.apiProvider || 'google',
        apiKey: settings.apiKey?.trim() || process.env.API_KEY,
        baseUrl: settings.apiGatewayUrl?.trim() || undefined,
        customTextModel: settings.customTextModel?.trim() || undefined,
        customImageModel: settings.customImageModel?.trim() || undefined,
      };
    }
  } catch (e) {
    console.error("Error reading settings for API config", e);
  }
  return {
    provider: 'google',
    apiKey: process.env.API_KEY,
    baseUrl: undefined,
  };
};

// Helper to retrieve API key (User provided > Environment)
export const getApiKey = (): string | undefined => {
  return getApiConfig().apiKey;
};

// Helper to retrieve API Gateway Base URL
export const getApiGatewayUrl = (): string | undefined => {
  return getApiConfig().baseUrl;
};

// Main client factory helper for Google GenAI SDK
export const getApiClient = (): GoogleGenAI => {
  const config = getApiConfig();
  const options: any = { apiKey: config.apiKey };
  if (config.baseUrl) {
    options.httpOptions = { baseUrl: config.baseUrl };
  }
  return new GoogleGenAI(options);
};

// OpenAI-compatible Chat Completion fetcher (OpenRouter, AIHubMix, Vercel Gateway, Custom)
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
    else baseUrl = 'https://api.openai.com/v1';
  }

  // Remove trailing slashes
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
  if (config.provider === 'openrouter') {
    headers['HTTP-Referer'] = typeof window !== 'undefined' ? window.location.origin : 'https://cameo.studio';
    headers['X-Title'] = 'Cameo AI Reel Creator';
  }

  console.log(`Sending Chat request to ${endpoint} with model: ${model}`);
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
  customTextModel?: string;
}): Promise<{ success: boolean; message: string; latencyMs: number }> => {
  const startTime = Date.now();
  const apiKey = testConfig.apiKey?.trim();

  if (!apiKey && testConfig.provider !== 'custom') {
    return { success: false, message: 'Please provide an API Key first.', latencyMs: 0 };
  }

  try {
    if (testConfig.provider === 'google') {
      const options: any = { apiKey };
      if (testConfig.baseUrl) {
        options.httpOptions = { baseUrl: testConfig.baseUrl };
      }
      const ai = new GoogleGenAI(options);
      const res = await ai.models.generateContent({
        model: 'gemini-flash-lite-latest',
        contents: 'Ping test. Reply with: OK',
      });
      const latencyMs = Date.now() - startTime;
      return {
        success: true,
        message: `Successfully connected to Google Gemini! Response: "${res.text?.trim() || 'OK'}" (${latencyMs}ms)`,
        latencyMs,
      };
    } else {
      // Replicate Provider Test
      if (testConfig.provider === 'replicate') {
        const repHeaders: Record<string, string> = {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        };
        const repRes = await fetch('https://api.replicate.com/v1/models', {
          method: 'GET',
          headers: repHeaders
        });
        const latencyMs = Date.now() - startTime;
        if (!repRes.ok) {
          const errText = await repRes.text();
          throw new Error(`Replicate Error (${repRes.status}): ${errText}`);
        }
        return {
          success: true,
          message: `Successfully authenticated with Replicate API Gateway! (${latencyMs}ms)`,
          latencyMs
        };
      }

      // OpenRouter / AIHubMix / Vercel / Custom
      let baseUrl = testConfig.baseUrl?.trim();
      if (!baseUrl) {
        if (testConfig.provider === 'openrouter') baseUrl = 'https://openrouter.ai/api/v1';
        else if (testConfig.provider === 'aihubmix') baseUrl = 'https://aihubmix.com/v1';
        else if (testConfig.provider === 'vercel') baseUrl = 'https://gateway.ai.vercel.com/v1';
        else baseUrl = 'https://api.openai.com/v1';
      }
      baseUrl = baseUrl.replace(/\/+$/, '');
      const endpoint = baseUrl.endsWith('/chat/completions') ? baseUrl : `${baseUrl}/chat/completions`;

      const model = testConfig.customTextModel?.trim() || (
        testConfig.provider === 'openrouter' ? 'google/gemini-2.5-flash' :
        testConfig.provider === 'aihubmix' ? 'gemini-2.5-flash' :
        'gpt-4o-mini'
      );

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }
      if (testConfig.provider === 'openrouter') {
        headers['HTTP-Referer'] = typeof window !== 'undefined' ? window.location.origin : 'https://cameo.studio';
        headers['X-Title'] = 'Cameo AI Reel Creator';
      }

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
        let errMsg = errText;
        try {
          const parsed = JSON.parse(errText);
          errMsg = parsed.error?.message || parsed.message || errText;
        } catch {}
        return {
          success: false,
          message: `Connection failed (${res.status}): ${errMsg}`,
          latencyMs,
        };
      }

      const data = await res.json();
      const reply = data.choices?.[0]?.message?.content?.trim() || 'OK';
      return {
        success: true,
        message: `Successfully connected to ${testConfig.provider.toUpperCase()}! Model [${model}] responded: "${reply}" (${latencyMs}ms)`,
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

export const generateScript = async (topic: string): Promise<string> => {
  const config = getApiConfig();

  const scriptPrompt = `Write a viral 30-second Instagram Reel/TikTok script about: "${topic}".
    
Structure the response exactly like this:
**HOOK (0-3s)**: [Visual & Audio hook]
**BODY (3-25s)**: [Key value/story]
**CTA (25-30s)**: [Call to action]
**CAPTION**: [Suggested caption with hashtags]

Keep it punchy, high-energy, and optimized for retention.`;

  if (config.provider === 'openrouter' || config.provider === 'aihubmix' || config.provider === 'custom') {
    return await callOpenAICompatibleChat(scriptPrompt, 'You are an elite short-form viral scriptwriter for Instagram Reels, YouTube Shorts, and TikTok.');
  }

  const ai = getApiClient();
  
  // Using flash-lite for faster text responses as requested
  const response = await ai.models.generateContent({
    model: 'gemini-flash-lite-latest', 
    contents: scriptPrompt,
  });

  return response.text || "Could not generate script.";
};

export const analyzeVideo = async (videoFile: VideoFile): Promise<string> => {
  const config = getApiConfig();

  if (config.provider === 'openrouter' || config.provider === 'aihubmix' || config.provider === 'custom') {
    const prompt = `Analyze this video clip (File: ${videoFile.file.name}, type: ${videoFile.file.type}).
Break down its format, visual style, psychological hooks, and viral retention mechanics.
Provide a timestamped breakdown of key moments and suggestions to optimize for TikTok and Instagram Reels. Output in Markdown.`;
    return await callOpenAICompatibleChat(prompt, 'You are an expert video viral analyst.');
  }

  const ai = getApiClient();

  console.log("Analyzing video...");
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
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
};

export const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
  console.log("Transcribing audio...", audioBlob.type);
  const config = getApiConfig();

  // Convert blob to base64
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
    model: 'gemini-3-flash-preview',
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
};

export const generateAvatarImage = async (avatarPrompt: string, style?: string): Promise<string> => {
  const config = getApiConfig();
  console.log("Generating avatar with prompt:", avatarPrompt, style);

  const styleSuffix = style ? `, style: ${style}` : '';
  const fullPrompt = `${avatarPrompt}${styleSuffix}, high quality portrait avatar, centered character headshot and upper body, volumetric lighting, 8k render, masterpiece, clean background`;

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
          prompt: fullPrompt,
          model: config.customImageModel || (config.provider === 'aihubmix' ? 'dall-e-3' : 'dall-e-3'),
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
      parts: [
        {
          text: fullPrompt,
        },
      ],
    },
    config: {},
  });

  // Extract image
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("No avatar image could be generated. Please check your API key and model settings.");
};

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
- Focus strictly on visual motion, camera angle (e.g. tracking shot, slow push-in, low angle dolly), realistic lighting, and action.
- Do NOT include quotes, headers, or explanations. Output ONLY the raw enhanced prompt.`;

  if (config.provider === 'openrouter' || config.provider === 'aihubmix' || config.provider === 'custom') {
    const text = await callOpenAICompatibleChat(prompt, 'You are an elite video prompt engineer for Veo and Sora.');
    return text.replace(/^["']|["']$/g, '').trim();
  }

  const ai = getApiClient();
  const response = await ai.models.generateContent({
    model: config.customTextModel || 'gemini-flash-lite-latest',
    contents: prompt,
  });

  return (response.text || rawPrompt).replace(/^["']|["']$/g, '').trim();
};

export const generateCoverImage = async (prompt: string): Promise<string> => {
  const config = getApiConfig();
  console.log("Generating cover image with provider:", config.provider, prompt);

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
          model: config.customImageModel || (config.provider === 'aihubmix' ? 'dall-e-3' : 'dall-e-3'),
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

  // Extract image
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("No image generated");
};

// Veo & AI Video Generation
export const generateVideo = async (
  params: GenerateVideoParams,
): Promise<{url: string; blob: Blob}> => {
  console.log('Starting video generation with params:', params);

  const apiKey = getApiKey();
  const ai = getApiClient();

  const selectedModel = params.customModelId?.trim() || params.model;

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
      console.log(
        `Generating with start frame: ${params.startFrame.file.name}`,
      );
    }

    const finalEndFrame = params.isLooping
      ? params.startFrame
      : params.endFrame;
    if (finalEndFrame) {
      generateVideoPayload.config.lastFrame = {
        imageBytes: finalEndFrame.base64,
        mimeType: finalEndFrame.file.type,
      };
      if (params.isLooping) {
        console.log(
          `Generating a looping video using start frame as end frame: ${finalEndFrame.file.name}`,
        );
      } else {
        console.log(`Generating with end frame: ${finalEndFrame.file.name}`);
      }
    }
  } else if (params.mode === GenerationMode.REFERENCES_TO_VIDEO) {
    const referenceImagesPayload: VideoGenerationReferenceImage[] = [];

    if (params.referenceImages) {
      for (const img of params.referenceImages) {
        console.log(`Adding reference image: ${img.file.name} (${img.file.type})`);
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
      console.log(
        `Adding style image as a reference: ${params.styleImage.file.name}`,
      );
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

  console.log('Submitting video generation request...', JSON.stringify(generateVideoPayload, (k, v) => k.includes('Bytes') ? '<base64_data>' : v));
  let operation = await ai.models.generateVideos(generateVideoPayload);
  console.log('Video generation operation started:', operation.name);

  while (!operation.done) {
    await new Promise((resolve) => setTimeout(resolve, 10000));
    console.log('...Generating...');
    operation = await ai.operations.getVideosOperation({operation: operation});
  }

  if (operation.error) {
    console.error('Operation failed with error:', operation.error);
    const errorMessage = (operation.error as any).message || 'Video generation failed.';
    throw new Error(errorMessage);
  }

  if (operation.response) {
    const videos = operation.response.generatedVideos;

    if (!videos || videos.length === 0) {
      console.error('Operation finished but no videos generated. Response:', JSON.stringify(operation.response));
      throw new Error('No videos were generated. The prompt or reference image might have triggered safety filters.');
    }

    const firstVideo = videos[0];
    if (!firstVideo?.video?.uri) {
      throw new Error('Generated video is missing a URI.');
    }

    const url = decodeURIComponent(firstVideo.video.uri);
    console.log('Fetching video from:', url);

    // FIX: Using headers for authentication avoids 400 errors when process.env.API_KEY is a placeholder
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
    console.error('Operation finished without response or error:', operation);
    throw new Error('Video generation finished but no video was returned.');
  }
};

/**
 * Enhances a user's prompt with cinematic camera movements, lighting, and realistic details
 */
export const enhancePrompt = async (prompt: string, style?: string): Promise<string> => {
  if (!prompt.trim()) return prompt;
  
  try {
    const ai = getApiClient();
    const model = 'gemini-2.5-flash';
    const response = await ai.models.generateContent({
      model,
      contents: `You are an expert Hollywood cinematographer and director creating prompts for high-end AI video models like Google Veo and Runway Gen-3.
Enhance the following prompt into a detailed, cinematic video generation prompt with specific camera motion, focal lens, lighting, dynamic movement, and realistic texture.
Style preference: ${style || 'cinematic hyper-realistic'}
Keep it under 50 words, punchy, visually rich, and descriptive. Do NOT include markdown or preamble.

Original Prompt: "${prompt}"`,
    });

    const enhanced = response.text?.trim();
    if (enhanced) return enhanced;
  } catch (e) {
    console.warn("AI prompt enhancement failed, using stylistic enhancement heuristic:", e);
  }

  // Fallback heuristic enhancer
  const enhancements = [
    "cinematic 8k resolution, photorealistic textures, dynamic camera motion, 35mm anamorphic lens, volumetric lighting, hyper-detailed, masterpiece",
    "golden hour lighting, subtle handheld gimbal drift, 4k ultra-detailed, depth of field, award-winning cinematography",
    "dramatic studio lighting, slow-motion 60fps tracking shot, photorealistic reflections, rich color grading"
  ];
  const picked = enhancements[Math.floor(Math.random() * enhancements.length)];
  return `${prompt.trim()}, ${picked}`;
};


