/**
 * IndexedDB Storage Service
 * Handles large binary data storage (audio files, images) that exceeds localStorage limits
 * 
 * localStorage limit: ~5-10 MB
 * IndexedDB limit: 50% of available disk space (typically GBs)
 */

const DB_NAME = 'dial_studio_db';
const DB_VERSION = 1;
const STORE_NAME = 'large_files';

interface StoredFile {
  id: string;
  projectId: string;
  type: 'audio' | 'image';
  data: Blob | string; // Blob for binary, string for data URLs
  mimeType: string;
  size: number;
  createdAt: number;
}

class IndexedDBStorage {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  /**
   * Initialize IndexedDB
   */
  async initialize(): Promise<void> {
    // Return existing initialization if in progress
    if (this.initPromise) {
      return this.initPromise;
    }

    // Already initialized
    if (this.db) {
      return Promise.resolve();
    }

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('✅ IndexedDB initialized');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('projectId', 'projectId', { unique: false });
          store.createIndex('type', 'type', { unique: false });
          console.log('📦 Created IndexedDB store:', STORE_NAME);
        }
      };
    });

    return this.initPromise;
  }

  /**
   * Store a large file (audio/image data URL or blob)
   */
  async storeFile(
    id: string,
    projectId: string,
    type: 'audio' | 'image',
    data: string | Blob,
    mimeType: string = 'audio/wav'
  ): Promise<void> {
    await this.initialize();
    if (!this.db) throw new Error('IndexedDB not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      // Convert data URL to Blob for more efficient storage
      let blobData: Blob | string = data;
      let size = 0;

      if (typeof data === 'string' && data.startsWith('data:')) {
        // Convert data URL to Blob
        const [header, base64] = data.split(',');
        const mime = header.match(/:(.*?);/)?.[1] || mimeType;
        try {
          const binary = atob(base64);
          const array = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) {
            array[i] = binary.charCodeAt(i);
          }
          blobData = new Blob([array], { type: mime });
          size = blobData.size;
        } catch (error) {
          console.warn('Failed to convert data URL to Blob, storing as string:', error);
          blobData = data;
          size = data.length;
        }
      } else if (data instanceof Blob) {
        blobData = data;
        size = data.size;
      } else {
        blobData = data;
        size = (data as string).length;
      }

      const file: StoredFile = {
        id,
        projectId,
        type,
        data: blobData,
        mimeType,
        size,
        createdAt: Date.now(),
      };

      const request = store.put(file);

      request.onsuccess = () => {
        console.log(`✅ Stored ${type} file in IndexedDB (${(size / 1024 / 1024).toFixed(2)} MB):`, id);
        resolve();
      };

      request.onerror = () => {
        console.error('Failed to store file in IndexedDB:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Retrieve a file and convert it back to data URL
   */
  async getFile(id: string): Promise<string | null> {
    await this.initialize();
    if (!this.db) throw new Error('IndexedDB not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = async () => {
        const file = request.result as StoredFile | undefined;
        if (!file) {
          resolve(null);
          return;
        }

        // Convert Blob back to data URL
        if (file.data instanceof Blob) {
          const reader = new FileReader();
          reader.onload = () => {
            resolve(reader.result as string);
          };
          reader.onerror = () => {
            reject(reader.error);
          };
          reader.readAsDataURL(file.data);
        } else {
          // Already a data URL or string
          resolve(file.data);
        }
      };

      request.onerror = () => {
        console.error('Failed to retrieve file from IndexedDB:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Delete a file
   */
  async deleteFile(id: string): Promise<void> {
    await this.initialize();
    if (!this.db) throw new Error('IndexedDB not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => {
        console.log('🗑️ Deleted file from IndexedDB:', id);
        resolve();
      };

      request.onerror = () => {
        console.error('Failed to delete file from IndexedDB:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Delete all files for a project
   */
  async deleteProjectFiles(projectId: string): Promise<void> {
    await this.initialize();
    if (!this.db) throw new Error('IndexedDB not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('projectId');
      const request = index.openCursor(IDBKeyRange.only(projectId));

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          console.log('🗑️ Deleted all files for project:', projectId);
          resolve();
        }
      };

      request.onerror = () => {
        console.error('Failed to delete project files:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<{
    fileCount: number;
    totalSize: number;
    sizeByType: Record<string, number>;
  }> {
    await this.initialize();
    if (!this.db) throw new Error('IndexedDB not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const files = request.result as StoredFile[];
        const stats = {
          fileCount: files.length,
          totalSize: 0,
          sizeByType: {} as Record<string, number>,
        };

        files.forEach((file) => {
          stats.totalSize += file.size;
          stats.sizeByType[file.type] = (stats.sizeByType[file.type] || 0) + file.size;
        });

        resolve(stats);
      };

      request.onerror = () => {
        console.error('Failed to get storage stats:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Check if a file exists in IndexedDB
   */
  async fileExists(id: string): Promise<boolean> {
    await this.initialize();
    if (!this.db) throw new Error('IndexedDB not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getKey(id);

      request.onsuccess = () => {
        resolve(request.result !== undefined);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * Clear all stored files (use with caution)
   */
  async clearAll(): Promise<void> {
    await this.initialize();
    if (!this.db) throw new Error('IndexedDB not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => {
        console.log('🗑️ Cleared all files from IndexedDB');
        resolve();
      };

      request.onerror = () => {
        console.error('Failed to clear IndexedDB:', request.error);
        reject(request.error);
      };
    });
  }
}

// Export singleton instance
export const indexedDBStorage = new IndexedDBStorage();

// Helper functions for audio data specifically
export async function storeAudioData(
  projectId: string,
  audioDataUrl: string
): Promise<string> {
  const fileId = `audio_${projectId}_${Date.now()}`;
  await indexedDBStorage.storeFile(fileId, projectId, 'audio', audioDataUrl, 'audio/wav');
  return fileId;
}

export async function getAudioData(fileId: string): Promise<string | null> {
  return indexedDBStorage.getFile(fileId);
}

export async function deleteAudioData(fileId: string): Promise<void> {
  return indexedDBStorage.deleteFile(fileId);
}

// Helper functions for image data
export async function storeImageData(
  projectId: string,
  imageDataUrl: string
): Promise<string> {
  const fileId = `image_${projectId}_${Date.now()}`;
  await indexedDBStorage.storeFile(fileId, projectId, 'image', imageDataUrl, 'image/png');
  return fileId;
}

export async function getImageData(fileId: string): Promise<string | null> {
  return indexedDBStorage.getFile(fileId);
}

