/**
 * Profile Photo Editor Component
 * Allows users to upload or generate profile photos
 */

'use client';

import { useState, useRef } from 'react';
import { Camera, Sparkles, Upload, Loader2 } from 'lucide-react';
import Image from 'next/image';

interface ProfilePhotoEditorProps {
  currentPhotoUrl?: string;
  onPhotoChange: (url: string) => void;
  address: string;
  type?: 'avatar' | 'banner';
  className?: string;
}

export function ProfilePhotoEditor({
  currentPhotoUrl,
  onPhotoChange,
  address,
  type = 'avatar',
  className = '',
}: ProfilePhotoEditorProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generatePrompt, setGeneratePrompt] = useState('');
  const [generateStyle, setGenerateStyle] = useState('avatar');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('address', address);
      formData.append('type', type);

      const response = await fetch('/api/users/profile/upload-photo', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to upload photo');
      }

      const data = await response.json();
      onPhotoChange(data.url);
    } catch (error: any) {
      console.error('Error uploading photo:', error);
      alert(error.message || 'Failed to upload photo');
    } finally {
      setIsUploading(false);
    }
  };

  const handleGenerate = async () => {
    if (!generatePrompt.trim()) {
      alert('Please enter a description for your profile photo');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/users/profile/generate-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: generatePrompt,
          style: generateStyle,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate photo');
      }

      const data = await response.json();
      onPhotoChange(data.imageUrl);
      setShowGenerateModal(false);
      setGeneratePrompt('');
    } catch (error: any) {
      console.error('Error generating photo:', error);
      alert(error.message || 'Failed to generate photo');
    } finally {
      setIsGenerating(false);
    }
  };

  const isAvatar = type === 'avatar';
  const sizeClass = isAvatar ? 'w-32 h-32' : 'w-full h-48';
  const roundedClass = isAvatar ? 'rounded-full' : 'rounded-lg';

  return (
    <div className={className}>
      {/* Photo Preview */}
      <div className={`${sizeClass} ${roundedClass} bg-secondary/30 border-2 border-dashed border-border overflow-hidden relative group`}>
        {currentPhotoUrl ? (
          <Image
            src={currentPhotoUrl}
            alt={`${type} photo`}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Camera className="text-muted-foreground" size={isAvatar ? 40 : 60} />
          </div>
        )}

        {/* Overlay buttons on hover */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="p-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors disabled:opacity-50"
            title="Upload photo"
          >
            {isUploading ? <Loader2 size={20} className="animate-spin" /> : <Upload size={20} />}
          </button>
          <button
            onClick={() => setShowGenerateModal(true)}
            disabled={isGenerating}
            className="p-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors disabled:opacity-50"
            title="Generate with AI"
          >
            <Sparkles size={20} />
          </button>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Action Buttons */}
      <div className="mt-4 flex gap-2">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-secondary text-foreground rounded-lg hover:bg-secondary/80 transition-colors disabled:opacity-50"
        >
          {isUploading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span className="text-sm">Uploading...</span>
            </>
          ) : (
            <>
              <Upload size={16} />
              <span className="text-sm">Upload</span>
            </>
          )}
        </button>
        <button
          onClick={() => setShowGenerateModal(true)}
          disabled={isGenerating}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          <Sparkles size={16} />
          <span className="text-sm">Generate</span>
        </button>
      </div>

      {/* Generate Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Generate Profile Photo</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Describe your desired photo
                </label>
                <textarea
                  value={generatePrompt}
                  onChange={(e) => setGeneratePrompt(e.target.value)}
                  placeholder="e.g., A cyberpunk portrait with neon lights, or a fantasy warrior..."
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Style</label>
                <select
                  value={generateStyle}
                  onChange={(e) => setGenerateStyle(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="avatar">Professional Avatar</option>
                  <option value="artistic">Artistic</option>
                  <option value="anime">Anime</option>
                  <option value="pixel">Pixel Art</option>
                  <option value="cyberpunk">Cyberpunk</option>
                  <option value="cartoon">Cartoon</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex gap-2">
              <button
                onClick={() => setShowGenerateModal(false)}
                disabled={isGenerating}
                className="flex-1 px-4 py-2 bg-secondary text-foreground rounded-lg hover:bg-secondary/80 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !generatePrompt.trim()}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>Generate</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

