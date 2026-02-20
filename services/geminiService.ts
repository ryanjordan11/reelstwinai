
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import {
  GoogleGenAI,
  VideoGenerationReferenceImage,
  VideoGenerationReferenceType,
} from '@google/genai';
import {GenerateVideoParams, GenerationMode, ImageFile, VideoFile} from '../types';

// Helper to retrieve API key (User provided > Environment)
export const getApiKey = (): string | undefined => {
  try {
    const settingsStr = localStorage.getItem('reelsCreatorSettings');
    if (settingsStr) {
      const settings = JSON.parse(settingsStr);
      if (settings.apiKey && settings.apiKey.trim() !== '') {
        return settings.apiKey;
      }
    }
  } catch (e) {
    console.error("Error reading settings for API key", e);
  }
  return process.env.API_KEY;
};

export const generateScript = async (topic: string): Promise<string> => {
  const apiKey = getApiKey();
  const ai = new GoogleGenAI({apiKey});
  
  // Using flash-lite for faster text responses as requested
  const response = await ai.models.generateContent({
    model: 'gemini-flash-lite-latest', 
    contents: `Write a viral 30-second Instagram Reel/TikTok script about: "${topic}".
    
    Structure the response exactly like this:
    **HOOK (0-3s)**: [Visual & Audio hook]
    **BODY (3-25s)**: [Key value/story]
    **CTA (25-30s)**: [Call to action]
    **CAPTION**: [Suggested caption with hashtags]
    
    Keep it punchy, high-energy, and optimized for retention.`,
  });

  return response.text || "Could not generate script.";
};

export const analyzeVideo = async (videoFile: VideoFile): Promise<string> => {
  const apiKey = getApiKey();
  const ai = new GoogleGenAI({apiKey});

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
  const apiKey = getApiKey();
  const ai = new GoogleGenAI({ apiKey });
  
  // Convert blob to base64
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Remove data URL prefix (e.g., "data:audio/webm;base64,")
      const base64Data = result.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(audioBlob);
  });

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

export const generateCoverImage = async (prompt: string): Promise<string> => {
  const apiKey = getApiKey();
  const ai = new GoogleGenAI({ apiKey });
  console.log("Generating cover image...", prompt);
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          text: prompt + ", high quality, youtube thumbnail style, vibrant, 4k, no text"
        }
      ]
    },
    config: {
      // 2.5 Flash Image doesn't support aspect ratio config directly in standard config object yet in all SDK versions,
      // but usually prompts help. We will crop/fit in UI.
    }
  });

  // Extract image
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("No image generated");
};

// Fix: API key is now handled by process.env.API_KEY, so it's removed from parameters.
export const generateVideo = async (
  params: GenerateVideoParams,
): Promise<{url: string; blob: Blob}> => {
  console.log('Starting video generation with params:', params);

  const apiKey = getApiKey();
  const ai = new GoogleGenAI({apiKey});

  const generateVideoPayload: any = {
    model: params.model,
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
    throw new Error(operation.error.message || 'Video generation failed.');
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
