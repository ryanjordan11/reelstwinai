/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { AspectRatio, Preset, PromptHistoryItem } from '../types';

export const CAMERA_PRESETS: Preset[] = [
  {
    id: 'fpv-drone',
    category: 'camera',
    label: 'FPV Drone Dive',
    promptSuffix: ', fast dynamic FPV racing drone diving down, sweeping cinematic banking motion, 4k 60fps',
    description: 'High-speed sweeping dive with dynamic banking'
  },
  {
    id: 'dolly-zoom',
    category: 'camera',
    label: 'Dolly Zoom (Vertigo)',
    promptSuffix: ', dramatic Hitchcock vertigo dolly zoom effect, optical background expansion, cinematic tension',
    description: 'Perspective warp with subject held in focus'
  },
  {
    id: 'orbit-360',
    category: 'camera',
    label: '360° Orbit Arc',
    promptSuffix: ', seamless 360 degree orbital camera rotation around subject, buttery smooth gimbal tracking',
    description: 'Full rotational camera wrap around character'
  },
  {
    id: 'whip-pan',
    category: 'camera',
    label: 'Speed Whip Pan',
    promptSuffix: ', energetic rapid whip pan camera transition, motion blur snap into sharp subject focus',
    description: 'High-energy fast snap transition'
  },
  {
    id: 'steadicam-follow',
    category: 'camera',
    label: 'Steadicam Follow',
    promptSuffix: ', immersive over-the-shoulder steadicam tracking shot, continuous long take, smooth motion',
    description: 'Smooth walking motion behind character'
  },
  {
    id: 'crane-reveal',
    category: 'camera',
    label: 'Crane Boom Reveal',
    promptSuffix: ', sweeping vertical crane boom shot rising up to reveal breathtaking grand vista background',
    description: 'Vertical lift from ground to sky view'
  },
  {
    id: 'low-hero',
    category: 'camera',
    label: 'Low Angle Hero',
    promptSuffix: ', dramatic worm-eye low angle hero perspective, epic scale, towering cinematic presence',
    description: 'Empowering low angle hero framing'
  },
];

export const STYLE_PRESETS: Preset[] = [
  {
    id: 'imax-70mm',
    category: 'style',
    label: 'IMAX 70mm Film',
    promptSuffix: ', shot on 70mm IMAX film, Panavision anamorphic lenses, natural film grain, rich color grade, Kodak Vision3',
    description: 'Christopher Nolan style ultra-wide clarity'
  },
  {
    id: 'cyberpunk-neon',
    category: 'style',
    label: 'Cyberpunk Neon',
    promptSuffix: ', futuristic cyberpunk metropolis, glowing holographic signage, wet reflective streets, volumetric cyan and magenta neon',
    description: 'Blade Runner 2049 aesthetic'
  },
  {
    id: 'vhs-retro-90s',
    category: 'style',
    label: '90s VHS Camcorder',
    promptSuffix: ', 1990s retro VHS camcorder tape footage, chromatic aberration, tape scanlines, nostalgic warm bloom',
    description: 'Lo-fi nostalgic retro tape'
  },
  {
    id: 'studio-high-fashion',
    category: 'style',
    label: 'Vogue Fashion Editorial',
    promptSuffix: ', ultra high-end fashion magazine editorial, crisp studio beauty lighting, sharp fabric textures, 8k masterpiece',
    description: 'High-end runway and magazine look'
  },
  {
    id: 'anime-shinkai',
    category: 'style',
    label: 'Makoto Shinkai Anime',
    promptSuffix: ', Makoto Shinkai anime style, glowing twilight clouds, hyper-detailed glistening reflections, vibrant watercolor hues',
    description: 'Glistening emotional anime sky'
  },
  {
    id: 'dark-gothic',
    category: 'style',
    label: 'Dark Gothic Fantasy',
    promptSuffix: ', dark gothic aesthetic, ethereal moonlight, ancient stone arches, moody fog mist, cinematic shadow play',
    description: 'Moody atmospheric fantasy'
  },
];

export const LIGHTING_PRESETS: Preset[] = [
  {
    id: 'golden-hour-rays',
    category: 'lighting',
    label: 'Golden Hour Volumetric',
    promptSuffix: ', warm golden hour sunlight, God rays piercing through atmosphere, soft lens flare, amber glow',
    description: 'Dreamy sunset backlight'
  },
  {
    id: 'bicolor-split',
    category: 'lighting',
    label: 'Teal & Orange Split',
    promptSuffix: ', bi-color rim lighting, dramatic teal ambient backlight with warm orange key light, blockbuster color separation',
    description: 'Hollywood cinema color contrast'
  },
  {
    id: 'rembrandt-moody',
    category: 'lighting',
    label: 'Moody Rembrandt',
    promptSuffix: ', classic Rembrandt lighting triangle on cheek, deep directional chiaroscuro shadows, artful contrast',
    description: 'Classical dramatic portrait lighting'
  },
  {
    id: 'cyber-neon-rim',
    category: 'lighting',
    label: 'Neon Edge Rim Light',
    promptSuffix: ', high-intensity electric blue rim lighting outlining subject silhouette, moody dark background',
    description: 'Sharp futuristic silhouette definition'
  },
  {
    id: 'beauty-softbox',
    category: 'lighting',
    label: 'High-Key Beauty Softbox',
    promptSuffix: ', high-key diffused softbox lighting, zero harsh shadows, flawless luminous skin tones, pristine clarity',
    description: 'Clean commercial beauty studio'
  }
];

const PROMPT_HISTORY_KEY = 'reelsCreator_prompt_history';

export const getPromptHistory = (): PromptHistoryItem[] => {
  try {
    const raw = localStorage.getItem(PROMPT_HISTORY_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to load prompt history', e);
  }
  return [
    {
      id: 'default-1',
      prompt: 'Cinematic drone flythrough of a futuristic cyberpunk city at dusk with neon billboards and rainy streets',
      model: 'veo-3.1-lite-generate-preview',
      aspectRatio: AspectRatio.PORTRAIT,
      timestamp: Date.now() - 3600000 * 2,
      isFavorite: true
    },
    {
      id: 'default-2',
      prompt: 'Ultra-realistic fashion model walking on a Paris boulevard during golden hour with natural lens flare',
      model: 'veo-3.1-generate-preview',
      aspectRatio: AspectRatio.PORTRAIT,
      timestamp: Date.now() - 3600000 * 5,
      isFavorite: false
    }
  ];
};

export const savePromptToHistory = (
  prompt: string,
  model: string,
  aspectRatio: AspectRatio,
  cameoName?: string
): PromptHistoryItem[] => {
  try {
    const existing = getPromptHistory();
    // Avoid duplicate at top
    const filtered = existing.filter(item => item.prompt.trim() !== prompt.trim());
    const newItem: PromptHistoryItem = {
      id: `prompt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      prompt: prompt.trim(),
      model,
      aspectRatio,
      timestamp: Date.now(),
      cameoName,
      isFavorite: false
    };
    const updated = [newItem, ...filtered].slice(0, 30); // keep last 30
    localStorage.setItem(PROMPT_HISTORY_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Failed to save prompt to history', e);
    return getPromptHistory();
  }
};

export const toggleFavoritePrompt = (id: string): PromptHistoryItem[] => {
  const existing = getPromptHistory();
  const updated = existing.map(item => 
    item.id === id ? { ...item, isFavorite: !item.isFavorite } : item
  );
  try {
    localStorage.setItem(PROMPT_HISTORY_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to update favorite prompt', e);
  }
  return updated;
};

export const deletePromptFromHistory = (id: string): PromptHistoryItem[] => {
  const existing = getPromptHistory();
  const updated = existing.filter(item => item.id !== id);
  try {
    localStorage.setItem(PROMPT_HISTORY_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to delete prompt from history', e);
  }
  return updated;
};

export const clearAllPromptHistory = (): void => {
  try {
    localStorage.removeItem(PROMPT_HISTORY_KEY);
  } catch (e) {
    console.error('Failed to clear prompt history', e);
  }
};
