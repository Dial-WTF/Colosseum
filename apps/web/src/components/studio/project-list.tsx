'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Plus, 
  Clock, 
  Image as ImageIcon, 
  Music, 
  ChevronDown, 
  ChevronRight,
  Save,
  GitBranch,
  Edit2,
  Trash2,
  Check,
  X
} from 'lucide-react';
import type { ProjectGridItem, Project, ProjectVersion } from '@dial/types';
import { getProjectsForGrid } from '@/lib/project-service';

interface ProjectListProps {
  type: 'image' | 'audio';
  onSelectProject?: (projectId: string) => void;
  currentProjectId?: string;
  currentProject?: Project | null;
  currentVersion?: ProjectVersion | null;
  onSaveVersion?: (name: string, notes?: string) => Promise<void>;
  onLoadVersion?: (versionId: string) => Promise<void>;
  onDeleteVersion?: (versionId: string) => Promise<void>;
  onRenameVersion?: (versionId: string, newName: string) => Promise<void>;
  isSaving?: boolean;
}

export function ProjectList({ 
  type, 
  onSelectProject, 
  currentProjectId,
  currentProject,
  currentVersion,
  onSaveVersion,
  onLoadVersion,
  onDeleteVersion,
  onRenameVersion,
  isSaving = false
}: ProjectListProps) {
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectGridItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [versionName, setVersionName] = useState('');
  const [versionNotes, setVersionNotes] = useState('');
  const [editingVersionId, setEditingVersionId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  // Auto-expand version history when a project is selected
  useEffect(() => {
    if (currentProjectId && expandedProjectId !== currentProjectId) {
      setExpandedProjectId(currentProjectId);
    }
  }, [currentProjectId]);

  useEffect(() => {
    loadProjects();
    
    // Set up periodic refresh to keep list updated (every 5 seconds)
    const refreshInterval = setInterval(() => {
      loadProjects();
    }, 5000);

    return () => clearInterval(refreshInterval);
  }, [type]);

  const loadProjects = async () => {
    setIsLoading(true);
    try {
      const allProjects = await getProjectsForGrid();
      const filteredProjects = allProjects.filter(p => p.type === type);
      setProjects(filteredProjects);
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNew = () => {
    const basePath = type === 'image' ? '/dashboard/create/image' : '/dashboard/create/audio';
    router.push(`${basePath}?mode=project`);
  };

  const handleSelectProject = (projectId: string) => {
    if (onSelectProject) {
      onSelectProject(projectId);
    } else {
      const basePath = type === 'image' ? '/dashboard/create/image' : '/dashboard/create/audio';
      router.push(`${basePath}?projectId=${projectId}`);
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const formatFullDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const handleSaveNewVersion = async () => {
    if (!versionName.trim() || !onSaveVersion) {
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
    if (!editName.trim() || !onRenameVersion) {
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

  const toggleExpanded = (projectId: string) => {
    setExpandedProjectId(expandedProjectId === projectId ? null : projectId);
  };

  const Icon = type === 'image' ? ImageIcon : Music;

  return (
    <div className="h-full flex flex-col bg-card">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground mb-1">
          {type === 'image' ? 'Image' : 'Audio'} Projects
        </h2>
        <p className="text-sm text-muted-foreground">
          Select a project or create new
        </p>
      </div>

      {/* New Project Button */}
      <div className="p-4 border-b border-border">
        <button
          onClick={handleCreateNew}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium shadow-sm"
        >
          <Plus size={20} />
          New {type === 'image' ? 'Image' : 'Audio'} Project
        </button>
      </div>

      {/* Project List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Icon size={48} className="mx-auto mb-4 opacity-30" />
            <p className="text-sm">No projects yet</p>
            <p className="text-xs mt-1 opacity-75">Create your first project to get started</p>
          </div>
        ) : (
          <>
            {projects.map((project) => {
              const isSelected = project.id === currentProjectId;
              const isExpanded = expandedProjectId === project.id && isSelected;
              const versions = isSelected && currentProject ? [...currentProject.versions].sort((a, b) => b.versionNumber - a.versionNumber) : [];
              
              return (
                <div key={project.id} className={`rounded-lg border transition-all ${
                  isSelected
                    ? 'border-primary bg-primary/10 shadow-sm'
                    : 'border-border'
                }`}>
                  <div className="flex items-start gap-2 p-3">
                    {/* Expand/Collapse Button */}
                    {isSelected && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleExpanded(project.id);
                        }}
                        className="flex-shrink-0 p-1 hover:bg-muted rounded transition-colors mt-1"
                      >
                        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </button>
                    )}
                    
                    <button
                      onClick={() => handleSelectProject(project.id)}
                      className="flex-1 text-left group"
                    >
                      <div className="flex items-start gap-3">
                        {/* Thumbnail */}
                        <div className="flex-shrink-0 w-16 h-16 rounded-md bg-muted overflow-hidden border border-border">
                          {project.thumbnail ? (
                            <img
                              src={project.thumbnail}
                              alt={project.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Icon size={24} className="text-muted-foreground opacity-50" />
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className={`font-medium truncate transition-colors ${
                              isSelected ? 'text-primary' : 'text-foreground group-hover:text-primary'
                            }`}>
                              {project.name}
                            </h3>
                            {isSelected && (
                              <span className="flex-shrink-0 px-2 py-0.5 bg-primary text-primary-foreground text-xs rounded font-medium">
                                Active
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock size={12} />
                              {formatDate(project.lastModified)}
                            </span>
                            {project.versionCount > 0 && (
                              <span className="text-xs">
                                {project.versionCount} version{project.versionCount !== 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  </div>

                  {/* Version History - Expandable */}
                  {isExpanded && isSelected && currentProject && (
                    <div className="border-t border-border bg-card/50">
                      <div className="p-3">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                            <GitBranch size={16} className="text-primary" />
                            Version History
                          </div>
                          <button
                            onClick={() => setShowSaveDialog(true)}
                            disabled={isSaving}
                            className="flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 text-xs font-medium"
                          >
                            <Save size={14} />
                            {isSaving ? 'Saving...' : 'Save'}
                          </button>
                        </div>

                        {versions.length === 0 ? (
                          <div className="py-4 text-center text-xs text-muted-foreground">
                            <GitBranch size={20} className="mx-auto mb-1 opacity-50" />
                            <p>No versions saved yet</p>
                          </div>
                        ) : (
                          <div className="space-y-2 max-h-64 overflow-y-auto">
                            {versions.map((version) => (
                              <div
                                key={version.id}
                                className={`p-2 rounded border text-xs ${
                                  version.id === currentVersion?.id
                                    ? 'border-primary/50 bg-primary/5'
                                    : 'border-border bg-background/50'
                                }`}
                              >
                                {editingVersionId === version.id ? (
                                  <div className="flex items-center gap-1 mb-1">
                                    <input
                                      type="text"
                                      value={editName}
                                      onChange={(e) => setEditName(e.target.value)}
                                      className="flex-1 px-2 py-1 bg-background border border-input rounded text-xs"
                                      autoFocus
                                    />
                                    <button
                                      onClick={() => handleRenameVersion(version.id)}
                                      className="p-1 bg-primary text-primary-foreground rounded hover:bg-primary/90"
                                    >
                                      <Check size={12} />
                                    </button>
                                    <button
                                      onClick={cancelEditing}
                                      className="p-1 bg-muted text-muted-foreground rounded hover:bg-muted/80"
                                    >
                                      <X size={12} />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium text-foreground">
                                        v{version.versionNumber}: {version.name}
                                      </span>
                                      {version.id === currentVersion?.id && (
                                        <span className="px-1.5 py-0.5 bg-primary/20 text-primary text-[10px] rounded font-medium">
                                          Current
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-1">
                                      {version.id !== currentVersion?.id && onLoadVersion && (
                                        <button
                                          onClick={() => onLoadVersion(version.id)}
                                          className="p-1 text-primary hover:bg-primary/10 rounded transition-colors"
                                          title="Load this version"
                                        >
                                          <GitBranch size={12} />
                                        </button>
                                      )}
                                      <button
                                        onClick={() => startEditing(version)}
                                        className="p-1 text-muted-foreground hover:bg-muted rounded transition-colors"
                                        title="Rename"
                                      >
                                        <Edit2 size={12} />
                                      </button>
                                      {currentProject.versions.length > 1 && onDeleteVersion && (
                                        <button
                                          onClick={() => {
                                            if (confirm('Delete this version? This cannot be undone.')) {
                                              onDeleteVersion(version.id);
                                            }
                                          }}
                                          className="p-1 text-destructive hover:bg-destructive/10 rounded transition-colors"
                                          title="Delete"
                                        >
                                          <Trash2 size={12} />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                )}
                                <div className="text-muted-foreground flex items-center gap-1">
                                  <Clock size={10} />
                                  {formatFullDate(version.createdAt)}
                                </div>
                                {version.notes && (
                                  <p className="text-muted-foreground mt-1">{version.notes}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Footer Stats */}
      {projects.length > 0 && (
        <div className="p-4 border-t border-border bg-muted/30">
          <p className="text-xs text-muted-foreground text-center">
            {projects.length} project{projects.length !== 1 ? 's' : ''} • {' '}
            {projects.reduce((sum, p) => sum + p.versionCount, 0)} total version{projects.reduce((sum, p) => sum + p.versionCount, 0) !== 1 ? 's' : ''}
          </p>
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
                    Version {currentProject ? currentProject.versions.length + 1 : 1}
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

