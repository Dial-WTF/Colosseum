/**
 * Storage Migration Utility
 * Migrates existing projects from localStorage-only to IndexedDB hybrid storage
 */

import { projectStorage } from './project-storage';
import { indexedDBStorage } from './indexed-db-storage';
import type { Project } from '@dial/types';

const MIGRATION_KEY = 'dial_storage_migration_v1';

interface MigrationStatus {
  completed: boolean;
  migratedCount: number;
  lastMigration: number;
  version: string;
}

/**
 * Check if migration has been completed
 */
export function isMigrationCompleted(): boolean {
  const status = getMigrationStatus();
  return status.completed;
}

/**
 * Get migration status
 */
function getMigrationStatus(): MigrationStatus {
  const data = localStorage.getItem(MIGRATION_KEY);
  if (!data) {
    return {
      completed: false,
      migratedCount: 0,
      lastMigration: 0,
      version: '1.0',
    };
  }
  return JSON.parse(data);
}

/**
 * Set migration status
 */
function setMigrationStatus(status: MigrationStatus): void {
  localStorage.setItem(MIGRATION_KEY, JSON.stringify(status));
}

/**
 * Migrate all existing projects to use IndexedDB for large data
 */
export async function migrateToIndexedDB(): Promise<{
  success: boolean;
  migratedCount: number;
  errors: string[];
}> {
  console.log('🔄 Starting storage migration to IndexedDB...');

  const errors: string[] = [];
  let migratedCount = 0;

  try {
    // Initialize IndexedDB
    await indexedDBStorage.initialize();

    // Get all projects
    const projects = await projectStorage.getAllProjects();
    console.log(`Found ${projects.length} projects to check`);

    for (const project of projects) {
      try {
        let projectModified = false;

        // Check each version for large data
        for (const version of project.versions) {
          if (!version.data) continue;

          // Check audio data
          if (version.data.type === 'audio' && version.data.audioUrl) {
            const audioUrl = version.data.audioUrl as string;
            
            // Skip if already migrated
            if (audioUrl.startsWith('indexeddb://')) {
              continue;
            }

            // If audio URL is large (>1MB), migrate to IndexedDB
            if (audioUrl.length > 1024 * 1024) {
              const fileId = `audio_${project.id}_${version.id}_${Date.now()}`;
              
              await indexedDBStorage.storeFile(
                fileId,
                project.id,
                'audio',
                audioUrl,
                'audio/wav'
              );

              // Update version data to reference IndexedDB
              version.data = {
                ...version.data,
                audioUrl: `indexeddb://${fileId}`,
                _indexedDBRef: fileId,
              };

              projectModified = true;
              console.log(`✅ Migrated audio for project ${project.name} (${version.name})`);
            }
          }

          // Check image data
          if (version.data.type === 'image' && version.data.exportUrl) {
            const exportUrl = version.data.exportUrl as string;
            
            // Skip if already migrated
            if (exportUrl.startsWith('indexeddb://')) {
              continue;
            }

            // If export URL is large (>1MB), migrate to IndexedDB
            if (exportUrl.length > 1024 * 1024) {
              const fileId = `image_${project.id}_${version.id}_${Date.now()}`;
              
              await indexedDBStorage.storeFile(
                fileId,
                project.id,
                'image',
                exportUrl,
                'image/png'
              );

              // Update version data to reference IndexedDB
              version.data = {
                ...version.data,
                exportUrl: `indexeddb://${fileId}`,
                _indexedDBRef: fileId,
              };

              projectModified = true;
              console.log(`✅ Migrated image for project ${project.name} (${version.name})`);
            }
          }
        }

        // If project was modified, update it
        if (projectModified) {
          // Force update by directly modifying cache
          // This bypasses the normal update flow to avoid re-processing
          await projectStorage.updateProject(project.id, {
            versions: project.versions,
          } as any);
          
          migratedCount++;
        }
      } catch (error) {
        const errorMsg = `Failed to migrate project ${project.name}: ${error}`;
        console.error(errorMsg);
        errors.push(errorMsg);
      }
    }

    // Mark migration as completed
    setMigrationStatus({
      completed: true,
      migratedCount,
      lastMigration: Date.now(),
      version: '1.0',
    });

    console.log(`✅ Migration completed: ${migratedCount} projects migrated`);

    return {
      success: true,
      migratedCount,
      errors,
    };
  } catch (error) {
    console.error('❌ Migration failed:', error);
    return {
      success: false,
      migratedCount,
      errors: [...errors, String(error)],
    };
  }
}

/**
 * Reset migration status (for testing)
 */
export function resetMigrationStatus(): void {
  localStorage.removeItem(MIGRATION_KEY);
  console.log('🔄 Migration status reset');
}

/**
 * Auto-migrate on app startup if needed
 */
export async function autoMigrate(): Promise<void> {
  if (isMigrationCompleted()) {
    console.log('✅ Storage migration already completed');
    return;
  }

  console.log('🔄 Running automatic storage migration...');
  const result = await migrateToIndexedDB();

  if (result.success) {
    console.log(`✅ Auto-migration successful: ${result.migratedCount} projects migrated`);
  } else {
    console.warn(`⚠️ Auto-migration completed with errors:`, result.errors);
  }
}

