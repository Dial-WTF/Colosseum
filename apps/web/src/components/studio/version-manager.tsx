'use client';

import { useState } from 'react';
import type { Project, ProjectVersion } from '@dial/types';
import {
  Save,
  GitBranch,
  Clock,
  Check,
  X,
  Edit2,
  Trash2,
  Plus,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface VersionManagerProps {
  project: Project;
  currentVersion: ProjectVersion | null;
  onSaveVersion: (name: string, notes?: string) => Promise<void>;
  onLoadVersion: (versionId: string) => Promise<void>;
  onDeleteVersion: (versionId: string) => Promise<void>;
  onRenameVersion: (versionId: string, newName: string) => Promise<void>;
  isSaving?: boolean;
}

export function VersionManager({
  project,
  currentVersion,
  onSaveVersion,
  onLoadVersion,
  onDeleteVersion,
  onRenameVersion,
  isSaving = false,
}: VersionManagerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [versionName, setVersionName] = useState('');
  const [versionNotes, setVersionNotes] = useState('');
  const [editingVersionId, setEditingVersionId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const handleSaveNewVersion = async () => {
    if (!versionName.trim()) {
      alert('Please enter a version name');
      return;
    }

    try {
      await onSaveVersion(versionName.trim(), versionNotes.trim() || undefined);
      setShowSaveDialog(false);
      setVersionName('');
      setVersionNotes('');
    } catch (error) {
      console.error('Failed to save version:', error);
      alert('Failed to save version');
    }
  };

  const handleRenameVersion = async (versionId: string) => {
    if (!editName.trim()) {
      alert('Please enter a version name');
      return;
    }

    try {
      await onRenameVersion(versionId, editName.trim());
      setEditingVersionId(null);
      setEditName('');
    } catch (error) {
      console.error('Failed to rename version:', error);
      alert('Failed to rename version');
    }
  };

  const startEditing = (version: ProjectVersion) => {
    setEditingVersionId(version.id);
    setEditName(version.name);
  };

  const cancelEditing = () => {
    setEditingVersionId(null);
    setEditName('');
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const sortedVersions = [...project.versions].sort((a, b) => b.versionNumber - a.versionNumber);

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <GitBranch size={20} className="text-primary" />
          <div>
            <h3 className="font-semibold text-foreground">Version History</h3>
            <p className="text-xs text-muted-foreground">
              {project.versions.length} version{project.versions.length !== 1 ? 's' : ''}
              {currentVersion && ` • Current: v${currentVersion.versionNumber}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSaveDialog(true)}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 text-sm font-medium"
          >
            <Save size={16} />
            {isSaving ? 'Saving...' : 'Save Version'}
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 hover:bg-muted rounded transition-colors"
          >
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>
      </div>

      {/* Version List */}
      {isExpanded && (
        <div className="max-h-96 overflow-y-auto">
          {sortedVersions.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <GitBranch size={32} className="mx-auto mb-2 opacity-50" />
              <p>No versions saved yet</p>
              <p className="text-xs mt-1">Save your first version to start tracking changes</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {sortedVersions.map((version) => (
                <div
                  key={version.id}
                  className={`p-4 hover:bg-muted/50 transition-colors ${
                    version.id === currentVersion?.id ? 'bg-primary/5' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {editingVersionId === version.id ? (
                        <div className="flex items-center gap-2 mb-2">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="flex-1 px-2 py-1 bg-background border border-input rounded text-sm"
                            autoFocus
                          />
                          <button
                            onClick={() => handleRenameVersion(version.id)}
                            className="p-1 bg-primary text-primary-foreground rounded hover:bg-primary/90"
                          >
                            <Check size={16} />
                          </button>
                          <button
                            onClick={cancelEditing}
                            className="p-1 bg-muted text-muted-foreground rounded hover:bg-muted/80"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-foreground truncate">
                            v{version.versionNumber}: {version.name}
                          </h4>
                          {version.id === currentVersion?.id && (
                            <span className="px-2 py-0.5 bg-primary/20 text-primary text-xs rounded font-medium">
                              Current
                            </span>
                          )}
                        </div>
                      )}
                      
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {formatDate(version.createdAt)}
                        </span>
                      </div>

                      {version.notes && (
                        <p className="text-sm text-muted-foreground mt-2">{version.notes}</p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      {version.id !== currentVersion?.id && (
                        <button
                          onClick={() => onLoadVersion(version.id)}
                          className="p-2 text-primary hover:bg-primary/10 rounded transition-colors"
                          title="Load this version"
                        >
                          <GitBranch size={16} />
                        </button>
                      )}
                      <button
                        onClick={() => startEditing(version)}
                        className="p-2 text-muted-foreground hover:bg-muted rounded transition-colors"
                        title="Rename"
                      >
                        <Edit2 size={16} />
                      </button>
                      {project.versions.length > 1 && (
                        <button
                          onClick={() => {
                            if (confirm('Delete this version? This cannot be undone.')) {
                              onDeleteVersion(version.id);
                            }
                          }}
                          className="p-2 text-destructive hover:bg-destructive/10 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Save Version Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Save size={24} className="text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Save New Version</h3>
                  <p className="text-sm text-muted-foreground">
                    Version {project.versions.length + 1}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Version Name *
                  </label>
                  <input
                    type="text"
                    value={versionName}
                    onChange={(e) => setVersionName(e.target.value)}
                    placeholder="e.g., Final draft, With background music, etc."
                    className="w-full px-3 py-2 bg-background border border-input rounded-md text-foreground"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Notes (optional)
                  </label>
                  <textarea
                    value={versionNotes}
                    onChange={(e) => setVersionNotes(e.target.value)}
                    placeholder="Add any notes about this version..."
                    rows={3}
                    className="w-full px-3 py-2 bg-background border border-input rounded-md text-foreground resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowSaveDialog(false);
                    setVersionName('');
                    setVersionNotes('');
                  }}
                  className="flex-1 px-4 py-2 bg-muted text-muted-foreground rounded-md hover:bg-muted/80 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveNewVersion}
                  disabled={!versionName.trim()}
                  className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  Save Version
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

