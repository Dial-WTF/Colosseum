"use client";

import { useState, useEffect } from "react";
import { AlertCircle, HardDrive, Trash2, X } from "lucide-react";
import { formatBytes, getStorageInfo, type StorageInfo } from "@/lib/storage-monitor";

export function StorageWarning() {
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    checkStorage();
    
    // Check every 30 seconds
    const interval = setInterval(checkStorage, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkStorage = async () => {
    const info = await getStorageInfo();
    setStorageInfo(info);
    
    // Show warning if storage is above 80% and not dismissed
    if ((info.status === 'warning' || info.status === 'critical') && !isDismissed) {
      setIsVisible(true);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    setIsVisible(false);
  };

  const handleManageStorage = () => {
    window.location.href = '/dashboard/collection';
  };

  if (!isVisible || !storageInfo) return null;

  const percentage = Math.round(storageInfo.localStorage.percentage * 100);
  const isCritical = storageInfo.status === 'critical';

  return (
    <div
      className={`fixed top-20 right-4 z-50 w-96 rounded-lg border p-4 shadow-lg backdrop-blur-sm ${
        isCritical
          ? 'border-red-500/50 bg-red-950/90'
          : 'border-yellow-500/50 bg-yellow-950/90'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 ${isCritical ? 'text-red-400' : 'text-yellow-400'}`}>
          <AlertCircle className="h-5 w-5" />
        </div>
        
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-white">
              {isCritical ? '🔴 Storage Critical' : '⚠️ Storage Low'}
            </h3>
            <button
              onClick={handleDismiss}
              className="text-gray-400 hover:text-white transition-colors"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <p className="text-sm text-gray-300 mb-3">
            {isCritical
              ? 'Storage is critically full. Auto-save may fail.'
              : 'Storage is running low. Consider freeing up space.'}
          </p>

          <div className="space-y-2 mb-3">
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>Storage Used</span>
              <span>{percentage}%</span>
            </div>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  isCritical
                    ? 'bg-gradient-to-r from-red-600 to-red-500'
                    : 'bg-gradient-to-r from-yellow-600 to-yellow-500'
                }`}
                style={{ width: `${Math.min(percentage, 100)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>
                {formatBytes(storageInfo.localStorage.used)} / {formatBytes(storageInfo.localStorage.max)}
              </span>
              <span>{storageInfo.total.projectCount} projects</span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleManageStorage}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium text-white transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              Manage Projects
            </button>
            <button
              onClick={handleDismiss}
              className="px-3 py-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Compact storage indicator for showing in headers/toolbars
 */
export function StorageIndicator() {
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);

  useEffect(() => {
    checkStorage();
    const interval = setInterval(checkStorage, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkStorage = async () => {
    const info = await getStorageInfo();
    setStorageInfo(info);
  };

  if (!storageInfo || storageInfo.status === 'ok') return null;

  const percentage = Math.round(storageInfo.localStorage.percentage * 100);
  const isCritical = storageInfo.status === 'critical';

  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
        isCritical
          ? 'bg-red-950/50 text-red-400 border border-red-500/30'
          : 'bg-yellow-950/50 text-yellow-400 border border-yellow-500/30'
      }`}
      title={`Storage ${percentage}% full`}
    >
      <HardDrive className="h-3.5 w-3.5" />
      <span>{percentage}%</span>
    </div>
  );
}

