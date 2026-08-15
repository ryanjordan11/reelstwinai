/**
 * @license
 * SPDX-License-Identifier: MIT
 * 
 * Local-First IndexedDB Persistence Engine
 * Zero telemetry, zero external cloud database dependencies.
 * All projects, avatars, scripts, presets, media blobs, and activity logs remain on your local machine.
*/

import { LocalActivityLog, LocalProject, AvatarPersona, FeedPost } from '../types';

const DB_NAME = 'ReelsCreatorLocalDB';
const DB_VERSION = 1;

export interface DBMediaBlob {
  id: string;
  name: string;
  mimeType: string;
  data: Blob | ArrayBuffer;
  sizeBytes: number;
  createdAt: number;
}

export interface StorageStats {
  projectsCount: number;
  avatarsCount: number;
  postsCount: number;
  activityLogsCount: number;
  estimatedSizeBytes: number;
  quotaBytes?: number;
  usageBytes?: number;
}

class LocalDatabase {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private openDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        reject(new Error('IndexedDB not supported in this environment'));
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // 1. Projects Store
        if (!db.objectStoreNames.contains('projects')) {
          const projectStore = db.createObjectStore('projects', { keyPath: 'id' });
          projectStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        }

        // 2. Avatars & Digital Twins Store
        if (!db.objectStoreNames.contains('avatars')) {
          const avatarStore = db.createObjectStore('avatars', { keyPath: 'id' });
          avatarStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // 3. User Posts / Videos Store
        if (!db.objectStoreNames.contains('posts')) {
          const postStore = db.createObjectStore('posts', { keyPath: 'id' });
          postStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // 4. Media Blobs Store (Heavy video/audio assets)
        if (!db.objectStoreNames.contains('mediaBlobs')) {
          const blobStore = db.createObjectStore('mediaBlobs', { keyPath: 'id' });
          blobStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // 5. Activity Logs Store (Local Audit Trail)
        if (!db.objectStoreNames.contains('activityLogs')) {
          const logStore = db.createObjectStore('activityLogs', { keyPath: 'id' });
          logStore.createIndex('timestamp', 'timestamp', { unique: false });
          logStore.createIndex('capability', 'capability', { unique: false });
        }

        // 6. Scripts Store
        if (!db.objectStoreNames.contains('scripts')) {
          const scriptStore = db.createObjectStore('scripts', { keyPath: 'id' });
          scriptStore.createIndex('createdAt', 'createdAt', { unique: false });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    return this.dbPromise;
  }

  // --- PROJECTS ---
  async saveProject(project: LocalProject): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('projects', 'readwrite');
      const store = tx.objectStore('projects');
      const req = store.put({
        ...project,
        updatedAt: Date.now(),
        version: (project.version || 0) + 1,
        schemaVersion: '1.0.0',
      });
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async getProjects(): Promise<LocalProject[]> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('projects', 'readonly');
      const store = tx.objectStore('projects');
      const req = store.getAll();
      req.onsuccess = () => {
        const results: LocalProject[] = req.result || [];
        results.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
        resolve(results);
      };
      req.onerror = () => reject(req.error);
    });
  }

  async getProject(id: string): Promise<LocalProject | null> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('projects', 'readonly');
      const store = tx.objectStore('projects');
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }

  async deleteProject(id: string): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('projects', 'readwrite');
      const store = tx.objectStore('projects');
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  // --- AVATARS ---
  async saveAvatar(avatar: AvatarPersona): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('avatars', 'readwrite');
      const store = tx.objectStore('avatars');
      const req = store.put(avatar);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async getAvatars(): Promise<AvatarPersona[]> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('avatars', 'readonly');
      const store = tx.objectStore('avatars');
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  async deleteAvatar(id: string): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('avatars', 'readwrite');
      const store = tx.objectStore('avatars');
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  // --- POSTS / FEED CREATIONS ---
  async savePost(post: FeedPost): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('posts', 'readwrite');
      const store = tx.objectStore('posts');
      const req = store.put(post);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async getPosts(): Promise<FeedPost[]> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('posts', 'readonly');
      const store = tx.objectStore('posts');
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  async deletePost(id: string): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('posts', 'readwrite');
      const store = tx.objectStore('posts');
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  // --- LOCAL ACTIVITY INSPECTOR LOGS ---
  async logActivity(log: Omit<LocalActivityLog, 'id'>): Promise<LocalActivityLog> {
    const db = await this.openDB();
    const entry: LocalActivityLog = {
      ...log,
      id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      telemetrySent: '0 bytes • None',
      storageLocation: 'IndexedDB (Local)',
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction('activityLogs', 'readwrite');
      const store = tx.objectStore('activityLogs');
      const req = store.put(entry);
      req.onsuccess = () => {
        // Dispatch window event so inspector updates live
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('local-activity-logged', { detail: entry }));
        }
        resolve(entry);
      };
      req.onerror = () => reject(req.error);
    });
  }

  async getActivityLogs(limit = 100): Promise<LocalActivityLog[]> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('activityLogs', 'readonly');
      const store = tx.objectStore('activityLogs');
      const req = store.getAll();
      req.onsuccess = () => {
        const logs: LocalActivityLog[] = req.result || [];
        logs.sort((a, b) => b.timestamp - a.timestamp);
        resolve(logs.slice(0, limit));
      };
      req.onerror = () => reject(req.error);
    });
  }

  async clearActivityLogs(): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('activityLogs', 'readwrite');
      const store = tx.objectStore('activityLogs');
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  // --- STORAGE STATS & WIPE ---
  async getStorageStats(): Promise<StorageStats> {
    const db = await this.openDB();
    const countStore = (storeName: string): Promise<number> => {
      return new Promise((res) => {
        try {
          const tx = db.transaction(storeName, 'readonly');
          const store = tx.objectStore(storeName);
          const req = store.count();
          req.onsuccess = () => res(req.result || 0);
          req.onerror = () => res(0);
        } catch {
          res(0);
        }
      });
    };

    const [pCount, aCount, postCount, lCount] = await Promise.all([
      countStore('projects'),
      countStore('avatars'),
      countStore('posts'),
      countStore('activityLogs'),
    ]);

    let quota: number | undefined;
    let usage: number | undefined;

    if (navigator.storage && navigator.storage.estimate) {
      try {
        const estimate = await navigator.storage.estimate();
        quota = estimate.quota;
        usage = estimate.usage;
      } catch (err) {
        console.warn("Storage estimate not available", err);
      }
    }

    return {
      projectsCount: pCount,
      avatarsCount: aCount,
      postsCount: postCount,
      activityLogsCount: lCount,
      estimatedSizeBytes: usage || (pCount * 50000 + aCount * 150000 + postCount * 200000),
      quotaBytes: quota,
      usageBytes: usage,
    };
  }

  async wipeAllLocalData(): Promise<void> {
    const db = await this.openDB();
    const storeNames = ['projects', 'avatars', 'posts', 'mediaBlobs', 'activityLogs', 'scripts'];
    const tx = db.transaction(storeNames, 'readwrite');
    storeNames.forEach((s) => {
      try {
        tx.objectStore(s).clear();
      } catch (e) {
        console.warn(`Error clearing store ${s}`, e);
      }
    });

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
}

export const localDB = new LocalDatabase();
