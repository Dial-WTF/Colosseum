'use client';

import { useEffect, useState, useRef, DragEvent } from 'react';
import { Upload, Trash2, Image as ImageIcon, Music, Video, File, Loader2, X } from 'lucide-react';
import { useUser } from '@/providers/user-context';

export interface Asset {
  url: string;
  filename: string;
  originalName: string;
  size: number;
  type: 'image' | 'audio' | 'video' | 'file';
  mimeType?: string;
  uploadedAt: string;
}

interface AssetBrowserProps {
  workspace?: string;
  onAssetSelect?: (asset: Asset) => void;
  filterType?: 'image' | 'audio' | 'video' | 'all';
  refreshTrigger?: number; // Add this to trigger a refresh from parent
}

export function AssetBrowser({ 
  workspace = 'default', 
  onAssetSelect,
  filterType = 'all',
  refreshTrigger
}: AssetBrowserProps) {
  const { address } = useUser();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  // Load assets on mount and when address/workspace changes
  useEffect(() => {
    if (address) {
      loadAssets();
    }
  }, [address, workspace, refreshTrigger]); // Add refreshTrigger to dependencies

  const loadAssets = async () => {
    if (!address) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/assets/list?address=${encodeURIComponent(address)}&workspace=${encodeURIComponent(workspace)}`
      );

      if (!response.ok) {
        throw new Error('Failed to load assets');
      }

      const data = await response.json();
      setAssets(data.assets || []);
    } catch (err: any) {
      console.error('Error loading assets:', err);
      setError(err.message || 'Failed to load assets');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    await uploadFiles(files);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadFiles = async (files: File[]) => {
    if (!address) {
      setError('Please connect your wallet first');
      return;
    }

    setIsUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      const uploadPromises = files.map(async (file, index) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('address', address);
        formData.append('workspace', workspace);

        const response = await fetch('/api/assets/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Upload failed');
        }

        const asset = await response.json();
        
        // Update progress
        setUploadProgress(Math.round(((index + 1) / files.length) * 100));
        
        return asset;
      });

      const uploadedAssets = await Promise.all(uploadPromises);
      
      // Add new assets to the list
      setAssets((prev) => [...uploadedAssets, ...prev]);
      setUploadProgress(100);

      // Reset progress after a delay
      setTimeout(() => {
        setUploadProgress(0);
      }, 1000);
    } catch (err: any) {
      console.error('Error uploading files:', err);
      setError(err.message || 'Failed to upload files');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (asset: Asset) => {
    if (!address) return;
    if (!confirm(`Delete ${asset.originalName}?`)) return;

    try {
      const response = await fetch(
        `/api/assets/delete?filename=${encodeURIComponent(asset.filename)}&address=${encodeURIComponent(address)}`,
        { method: 'DELETE' }
      );

      if (!response.ok) {
        throw new Error('Failed to delete asset');
      }

      // Remove from list
      setAssets((prev) => prev.filter((a) => a.filename !== asset.filename));
      
      if (selectedAsset?.filename === asset.filename) {
        setSelectedAsset(null);
      }
    } catch (err: any) {
      console.error('Error deleting asset:', err);
      setError(err.message || 'Failed to delete asset');
    }
  };

  const handleDragStart = (e: DragEvent<HTMLDivElement>, asset: Asset) => {
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('application/json', JSON.stringify(asset));
    e.dataTransfer.setData('text/uri-list', asset.url);
    e.dataTransfer.setData('text/plain', asset.url);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const getAssetIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <ImageIcon size={16} />;
      case 'audio':
        return <Music size={16} />;
      case 'video':
        return <Video size={16} />;
      default:
        return <File size={16} />;
    }
  };

  // Filter assets by type
  const filteredAssets = filterType === 'all' 
    ? assets 
    : assets.filter((asset) => asset.type === filterType);

  if (!address) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <ImageIcon size={48} className="text-muted-foreground mb-4 opacity-50" />
        <p className="text-muted-foreground mb-2">Connect your wallet to access assets</p>
        <p className="text-xs text-muted-foreground">Upload and manage workspace files</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-card">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div>
          <h3 className="font-semibold text-foreground">Workspace Assets</h3>
          <p className="text-xs text-muted-foreground mt-1">
            {filteredAssets.length} {filterType === 'all' ? 'assets' : `${filterType}(s)`}
          </p>
        </div>
        <button
          onClick={handleUploadClick}
          disabled={isUploading}
          className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          {isUploading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload size={16} />
              Upload
            </>
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={
            filterType === 'image' 
              ? 'image/*' 
              : filterType === 'audio'
              ? 'audio/*'
              : filterType === 'video'
              ? 'video/*'
              : 'image/*,audio/*,video/*'
          }
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Upload Progress */}
      {isUploading && uploadProgress > 0 && (
        <div className="px-4 py-2 bg-muted/50 border-b border-border">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>Uploading...</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="w-full bg-background rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-primary h-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mx-4 mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md flex items-start justify-between">
          <p className="text-sm text-destructive">{error}</p>
          <button
            onClick={() => setError(null)}
            className="text-destructive hover:text-destructive/80"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Assets Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full">
            <Loader2 size={32} className="animate-spin text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">Loading assets...</p>
          </div>
        ) : filteredAssets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <ImageIcon size={48} className="text-muted-foreground mb-4 opacity-50" />
            <p className="text-muted-foreground mb-2">No assets yet</p>
            <p className="text-xs text-muted-foreground mb-4">
              Upload files to use in your projects
            </p>
            <button
              onClick={handleUploadClick}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm"
            >
              <Upload size={16} />
              Upload Files
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredAssets.map((asset) => (
              <div
                key={asset.filename}
                draggable
                onDragStart={(e) => handleDragStart(e, asset)}
                onClick={() => {
                  setSelectedAsset(asset);
                  onAssetSelect?.(asset);
                }}
                className={`group relative aspect-square rounded-lg overflow-hidden border-2 transition-all cursor-move hover:border-primary hover:shadow-lg ${
                  selectedAsset?.filename === asset.filename
                    ? 'border-primary ring-2 ring-primary/20'
                    : 'border-border'
                }`}
              >
                {/* Thumbnail */}
                {asset.type === 'image' ? (
                  <img
                    src={asset.url}
                    alt={asset.originalName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-muted-foreground mb-2">
                        {getAssetIcon(asset.type)}
                      </div>
                      <p className="text-xs text-muted-foreground px-2 truncate">
                        {asset.originalName}
                      </p>
                    </div>
                  </div>
                )}

                {/* Overlay with info and actions */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-all flex flex-col justify-end p-2 opacity-0 group-hover:opacity-100">
                  <div className="text-white text-xs mb-2">
                    <p className="font-medium truncate">{asset.originalName}</p>
                    <p className="text-white/70">{formatFileSize(asset.size)}</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(asset);
                    }}
                    className="flex items-center justify-center gap-1 px-2 py-1 bg-destructive text-destructive-foreground rounded text-xs hover:bg-destructive/90 transition-colors"
                  >
                    <Trash2 size={12} />
                    Delete
                  </button>
                </div>

                {/* Drag indicator */}
                <div className="absolute top-2 right-2 bg-primary text-primary-foreground px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                  Drag me
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Tips */}
      {filteredAssets.length > 0 && (
        <div className="border-t border-border p-3 bg-muted/30">
          <p className="text-xs text-muted-foreground">
            💡 <strong>Tip:</strong> Drag assets onto the canvas to add them
          </p>
        </div>
      )}
    </div>
  );
}

