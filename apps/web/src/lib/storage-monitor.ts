/**
 * Storage Monitor
 * Monitors storage usage and provides warnings/cleanup utilities
 */

import { getStorageStats } from './project-service';
import { indexedDBStorage } from './indexed-db-storage';

// Storage thresholds
const WARNING_THRESHOLD = 0.8; // 80% full
const CRITICAL_THRESHOLD = 0.95; // 95% full

export interface StorageInfo {
  localStorage: {
    used: number;
    max: number;
    percentage: number;
  };
  indexedDB: {
    used: number;
    fileCount: number;
  };
  total: {
    used: number;
    projectCount: number;
  };
  status: 'ok' | 'warning' | 'critical';
}

/**
 * Get current storage usage
 */
export async function getStorageInfo(): Promise<StorageInfo> {
  // Get localStorage usage
  const localStorageUsed = new Blob([
    JSON.stringify(localStorage)
  ]).size;
  
  // Most browsers limit localStorage to 5-10MB, we'll use 5MB as conservative estimate
  const localStorageMax = 5 * 1024 * 1024;
  const localStoragePercentage = localStorageUsed / localStorageMax;

  // Get IndexedDB usage
  const indexedDBStats = await indexedDBStorage.getStorageStats();

  // Get project stats
  const projectStats = await getStorageStats();

  // Determine status
  let status: 'ok' | 'warning' | 'critical' = 'ok';
  if (localStoragePercentage >= CRITICAL_THRESHOLD) {
    status = 'critical';
  } else if (localStoragePercentage >= WARNING_THRESHOLD) {
    status = 'warning';
  }

  return {
    localStorage: {
      used: localStorageUsed,
      max: localStorageMax,
      percentage: localStoragePercentage,
    },
    indexedDB: {
      used: indexedDBStats.totalSize,
      fileCount: indexedDBStats.fileCount,
    },
    total: {
      used: localStorageUsed + indexedDBStats.totalSize,
      projectCount: projectStats.projectCount,
    },
    status,
  };
}

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Get storage warning message if needed
 */
export async function getStorageWarning(): Promise<string | null> {
  const info = await getStorageInfo();

  if (info.status === 'critical') {
    return `🔴 Storage is critically full (${Math.round(info.localStorage.percentage * 100)}%)! Auto-save may fail. Please delete old projects.`;
  } else if (info.status === 'warning') {
    return `⚠️ Storage is running low (${Math.round(info.localStorage.percentage * 100)}% full). Consider deleting old projects.`;
  }

  return null;
}

/**
 * Log storage info to console
 */
export async function logStorageInfo(): Promise<void> {
  const info = await getStorageInfo();

  console.group('📊 Storage Usage');
  console.log(`localStorage: ${formatBytes(info.localStorage.used)} / ${formatBytes(info.localStorage.max)} (${Math.round(info.localStorage.percentage * 100)}%)`);
  console.log(`IndexedDB: ${formatBytes(info.indexedDB.used)} (${info.indexedDB.fileCount} files)`);
  console.log(`Total: ${formatBytes(info.total.used)} (${info.total.projectCount} projects)`);
  console.log(`Status: ${info.status.toUpperCase()}`);
  console.groupEnd();

  const warning = await getStorageWarning();
  if (warning) {
    console.warn(warning);
  }
}

/**
 * Check if there's enough space for a new file
 */
export async function hasEnoughSpace(estimatedSize: number): Promise<boolean> {
  const info = await getStorageInfo();
  const availableSpace = info.localStorage.max - info.localStorage.used;
  
  // Need at least 2x the estimated size to be safe (for JSON overhead)
  return availableSpace > estimatedSize * 2;
}

