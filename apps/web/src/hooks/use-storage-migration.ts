/**
 * Hook to automatically run storage migration on app startup
 */

import { useEffect, useState } from 'react';
import { autoMigrate, isMigrationCompleted } from '@/lib/storage-migration';

export function useStorageMigration() {
  const [isComplete, setIsComplete] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (isMigrationCompleted()) {
      setIsComplete(true);
      return;
    }

    const runMigration = async () => {
      setIsRunning(true);
      try {
        await autoMigrate();
        setIsComplete(true);
      } catch (error) {
        console.error('Migration failed:', error);
      } finally {
        setIsRunning(false);
      }
    };

    runMigration();
  }, []);

  return { isComplete, isRunning };
}

