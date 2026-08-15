/**
 * @license
 * SPDX-License-Identifier: MIT
 * 
 * Portable Project Format (.creatorstudio)
 * Bundles project JSON, timeline clips, scene narration, avatar assets, and metadata
 * into a standalone ZIP container without proprietary lock-in.
*/

import JSZip from 'jszip';
import { LocalProject, AvatarPersona, FeedPost } from '../types';
import { localDB } from './db';

export interface CreatorStudioManifest {
  format: 'creatorstudio';
  formatVersion: '1.0.0';
  createdAt: number;
  appName: string;
  appVersion: string;
  projectId: string;
  title: string;
  clipsCount: number;
  hasAvatars: boolean;
}

/**
 * Exports a project and its associated clips/avatars as a portable .creatorstudio zip file
 */
export const exportProjectBundle = async (
  project: LocalProject,
  associatedPosts?: FeedPost[],
  associatedAvatars?: AvatarPersona[]
): Promise<Blob> => {
  const zip = new JSZip();

  const manifest: CreatorStudioManifest = {
    format: 'creatorstudio',
    formatVersion: '1.0.0',
    createdAt: Date.now(),
    appName: 'Reels Creator',
    appVersion: '1.0.0',
    projectId: project.id,
    title: project.title,
    clipsCount: project.clips?.length || 0,
    hasAvatars: (associatedAvatars && associatedAvatars.length > 0) || false,
  };

  // 1. Write Manifest
  zip.file('manifest.json', JSON.stringify(manifest, null, 2));

  // 2. Write Project JSON
  zip.file('project.json', JSON.stringify(project, null, 2));

  // 3. Write Associated Clips / Posts Metadata
  if (associatedPosts && associatedPosts.length > 0) {
    zip.file('clips.json', JSON.stringify(associatedPosts, null, 2));
  }

  // 4. Write Associated Avatars
  if (associatedAvatars && associatedAvatars.length > 0) {
    zip.file('avatars.json', JSON.stringify(associatedAvatars, null, 2));
  }

  // 5. Generate ZIP Blob
  const blob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 }
  });

  return blob;
};

/**
 * Triggers browser download for a .creatorstudio project bundle
 */
export const downloadProjectBundle = async (
  project: LocalProject,
  associatedPosts?: FeedPost[],
  associatedAvatars?: AvatarPersona[]
): Promise<void> => {
  const blob = await exportProjectBundle(project, associatedPosts, associatedAvatars);
  const cleanTitle = project.title.toLowerCase().replace(/[^a-z0-9_-]/g, '_') || 'project';
  const fileName = `${cleanTitle}.creatorstudio`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * Imports a .creatorstudio archive file and unpacks it into IndexedDB
 */
export const importProjectBundle = async (
  file: File
): Promise<{ project: LocalProject; postsImported: number; avatarsImported: number }> => {
  const zip = new JSZip();
  const loadedZip = await zip.loadAsync(file);

  // 1. Read manifest
  const manifestFile = loadedZip.file('manifest.json');
  if (!manifestFile) {
    throw new Error('Invalid .creatorstudio file: Missing manifest.json');
  }
  const manifestRaw = await manifestFile.async('string');
  const manifest: CreatorStudioManifest = JSON.parse(manifestRaw);

  if (manifest.format !== 'creatorstudio') {
    throw new Error('Unrecognized project archive format');
  }

  // 2. Read project.json
  const projectFile = loadedZip.file('project.json');
  if (!projectFile) {
    throw new Error('Invalid .creatorstudio file: Missing project.json');
  }
  const projectRaw = await projectFile.async('string');
  const project: LocalProject = JSON.parse(projectRaw);

  // Ensure new ID or preserve ID and save to IndexedDB
  await localDB.saveProject(project);

  let postsImported = 0;
  let avatarsImported = 0;

  // 3. Read clips.json if exists
  const clipsFile = loadedZip.file('clips.json');
  if (clipsFile) {
    try {
      const clipsRaw = await clipsFile.async('string');
      const posts: FeedPost[] = JSON.parse(clipsRaw);
      for (const p of posts) {
        await localDB.savePost(p);
        postsImported++;
      }
    } catch (e) {
      console.warn("Could not import clips from bundle", e);
    }
  }

  // 4. Read avatars.json if exists
  const avatarsFile = loadedZip.file('avatars.json');
  if (avatarsFile) {
    try {
      const avatarsRaw = await avatarsFile.async('string');
      const avatars: AvatarPersona[] = JSON.parse(avatarsRaw);
      for (const a of avatars) {
        await localDB.saveAvatar(a);
        avatarsImported++;
      }
    } catch (e) {
      console.warn("Could not import avatars from bundle", e);
    }
  }

  return { project, postsImported, avatarsImported };
};
