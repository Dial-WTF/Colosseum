'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ProjectGridItem } from '@dial/types';
import { getProjectsForGrid, deleteProject, projectStorage } from '@/lib/project-storage';
import {
  Image as ImageIcon,
  Music,
  Plus,
  Trash2,
  Edit,
  Copy,
  FileDown,
  FolderOpen,
  Grid3x3,
  Clock,
  Tag,
} from 'lucide-react';

export default function StudioDashboard() {
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectGridItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'image' | 'audio'>('all');
  const [stats, setStats] = useState({ projectCount: 0, totalVersions: 0, storageSize: 0 });

  useEffect(() => {
    loadProjects();
    loadStats();
  }, []);

  const loadProjects = async () => {
    setIsLoading(true);
    try {
      const data = await getProjectsForGrid();
      setProjects(data);
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    const stats = await projectStorage.getStorageStats();
    setStats(stats);
  };

  const handleCreateProject = (type: 'image' | 'audio') => {
    router.push(`/dashboard/create/${type}?mode=project`);
  };

  const handleOpenProject = (id: string, type: 'image' | 'audio') => {
    router.push(`/dashboard/create/${type}?projectId=${id}`);
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteProject(id);
      await loadProjects();
      await loadStats();
    } catch (error) {
      console.error('Failed to delete project:', error);
      alert('Failed to delete project');
    }
  };

  const handleDuplicateProject = async (id: string) => {
    try {
      await projectStorage.duplicateProject(id);
      await loadProjects();
      await loadStats();
    } catch (error) {
      console.error('Failed to duplicate project:', error);
      alert('Failed to duplicate project');
    }
  };

  const handleExportProject = async (id: string) => {
    try {
      const json = await projectStorage.exportProject(id);
      if (!json) return;

      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `project-${id}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export project:', error);
      alert('Failed to export project');
    }
  };

  const filteredProjects = projects.filter(
    (p) => filter === 'all' || p.type === filter
  );

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'archived': return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
      default: return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-6"></div>
          <p className="text-foreground font-medium text-lg">Loading Projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">Studio Projects</h1>
              <p className="text-muted-foreground">Create, manage, and version your creative works</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => handleCreateProject('image')}
                className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
              >
                <ImageIcon size={20} />
                New Image Project
              </button>
              <button
                onClick={() => handleCreateProject('audio')}
                className="flex items-center gap-2 px-6 py-3 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors font-medium"
              >
                <Music size={20} />
                New Audio Project
              </button>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-muted/50 rounded-lg p-4 border border-border">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <FolderOpen size={24} className="text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Projects</p>
                  <p className="text-2xl font-bold text-foreground">{stats.projectCount}</p>
                </div>
              </div>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 border border-border">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-secondary/10 rounded-lg">
                  <Grid3x3 size={24} className="text-secondary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Versions</p>
                  <p className="text-2xl font-bold text-foreground">{stats.totalVersions}</p>
                </div>
              </div>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 border border-border">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-accent/10 rounded-lg">
                  <FileDown size={24} className="text-accent-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Storage Used</p>
                  <p className="text-2xl font-bold text-foreground">{formatBytes(stats.storageSize)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-2 mt-6">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              All ({projects.length})
            </button>
            <button
              onClick={() => setFilter('image')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'image'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              <ImageIcon size={16} className="inline mr-2" />
              Images ({projects.filter(p => p.type === 'image').length})
            </button>
            <button
              onClick={() => setFilter('audio')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'audio'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              <Music size={16} className="inline mr-2" />
              Audio ({projects.filter(p => p.type === 'audio').length})
            </button>
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="container mx-auto px-6 py-8">
        {filteredProjects.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-6">
              <FolderOpen size={40} className="text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">No projects yet</h3>
            <p className="text-muted-foreground mb-6">Create your first project to get started</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => handleCreateProject('image')}
                className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                <ImageIcon size={20} />
                New Image Project
              </button>
              <button
                onClick={() => handleCreateProject('audio')}
                className="flex items-center gap-2 px-6 py-3 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors"
              >
                <Music size={20} />
                New Audio Project
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                className="group bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg transition-all duration-200 hover:border-primary/50"
              >
                {/* Thumbnail */}
                <div
                  onClick={() => handleOpenProject(project.id, project.type)}
                  className="relative aspect-video bg-muted cursor-pointer overflow-hidden"
                >
                  {project.thumbnail ? (
                    <img
                      src={project.thumbnail}
                      alt={project.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      {project.type === 'image' ? (
                        <ImageIcon size={48} className="text-muted-foreground" />
                      ) : (
                        <Music size={48} className="text-muted-foreground" />
                      )}
                    </div>
                  )}
                  
                  {/* Type Badge */}
                  <div className="absolute top-2 right-2 px-2 py-1 bg-background/90 backdrop-blur-sm rounded text-xs font-medium border border-border">
                    {project.type === 'image' ? (
                      <><ImageIcon size={12} className="inline mr-1" />Image</>
                    ) : (
                      <><Music size={12} className="inline mr-1" />Audio</>
                    )}
                  </div>

                  {/* Status Badge */}
                  <div className={`absolute top-2 left-2 px-2 py-1 rounded text-xs font-medium border ${getStatusColor(project.status)}`}>
                    {project.status}
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-semibold text-foreground mb-2 truncate">{project.name}</h3>
                  
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                    <div className="flex items-center gap-1">
                      <Grid3x3 size={14} />
                      {project.versionCount} version{project.versionCount !== 1 ? 's' : ''}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock size={14} />
                      {formatDate(project.lastModified)}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenProject(project.id, project.type)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors text-sm font-medium"
                    >
                      <Edit size={14} />
                      Open
                    </button>
                    <button
                      onClick={() => handleDuplicateProject(project.id)}
                      className="p-2 bg-secondary text-secondary-foreground rounded hover:bg-secondary/80 transition-colors"
                      title="Duplicate"
                    >
                      <Copy size={14} />
                    </button>
                    <button
                      onClick={() => handleExportProject(project.id)}
                      className="p-2 bg-muted text-muted-foreground rounded hover:bg-muted/80 transition-colors"
                      title="Export"
                    >
                      <FileDown size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteProject(project.id)}
                      className="p-2 bg-destructive text-destructive-foreground rounded hover:bg-destructive/90 transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

