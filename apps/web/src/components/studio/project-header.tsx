'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Project } from '@dial/types';
import {
  ArrowLeft,
  Settings,
  Tag,
  FileText,
  Save,
  X,
  Check,
} from 'lucide-react';

interface ProjectHeaderProps {
  project: Project;
  onUpdateProject: (updates: { name?: string; description?: string; tags?: string[] }) => Promise<void>;
  onBack?: () => void;
}

export function ProjectHeader({ project, onUpdateProject, onBack }: ProjectHeaderProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(project.name);
  const [editDescription, setEditDescription] = useState(project.description || '');
  const [showSettings, setShowSettings] = useState(false);

  const handleSave = async () => {
    try {
      await onUpdateProject({
        name: editName.trim(),
        description: editDescription.trim() || undefined,
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update project:', error);
      alert('Failed to update project');
    }
  };

  const handleCancel = () => {
    setEditName(project.name);
    setEditDescription(project.description || '');
    setIsEditing(false);
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.push('/studio');
    }
  };

  return (
    <div className="bg-card border-b border-border">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            {/* Back Button */}
            <button
              onClick={handleBack}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
              title="Back to Dashboard"
            >
              <ArrowLeft size={20} />
            </button>

            {/* Project Info */}
            <div className="flex-1 min-w-0">
              {isEditing ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-1 bg-background border border-input rounded text-lg font-semibold"
                    autoFocus
                  />
                  <input
                    type="text"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="Add a description..."
                    className="w-full px-3 py-1 bg-background border border-input rounded text-sm"
                  />
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl font-semibold text-foreground truncate">
                      {project.name}
                    </h1>
                    <span className="px-2 py-0.5 bg-primary/20 text-primary text-xs rounded font-medium">
                      {project.type}
                    </span>
                  </div>
                  {project.description && (
                    <p className="text-sm text-muted-foreground mt-1 truncate">
                      {project.description}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  disabled={!editName.trim()}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  <Check size={16} />
                  Save
                </button>
                <button
                  onClick={handleCancel}
                  className="flex items-center gap-2 px-4 py-2 bg-muted text-muted-foreground rounded-md hover:bg-muted/80 transition-colors"
                >
                  <X size={16} />
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors"
              >
                <Settings size={16} />
                Edit Info
              </button>
            )}
          </div>
        </div>

        {/* Project Meta */}
        {!isEditing && (
          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
            <span>Created {new Date(project.createdAt).toLocaleDateString()}</span>
            <span>•</span>
            <span>Last modified {new Date(project.updatedAt).toLocaleDateString()}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <FileText size={12} />
              {project.versions.length} version{project.versions.length !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

