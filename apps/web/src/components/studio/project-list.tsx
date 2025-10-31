'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Clock, Image as ImageIcon, Music } from 'lucide-react';
import type { ProjectGridItem } from '@dial/types';
import { getProjectsForGrid } from '@/lib/project-service';

interface ProjectListProps {
  type: 'image' | 'audio';
  onSelectProject?: (projectId: string) => void;
}

export function ProjectList({ type, onSelectProject }: ProjectListProps) {
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectGridItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
            {projects.map((project) => (
              <button
                key={project.id}
                onClick={() => handleSelectProject(project.id)}
                className="w-full text-left p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-accent/50 transition-all group"
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
                    <h3 className="font-medium text-foreground truncate group-hover:text-primary transition-colors">
                      {project.name}
                    </h3>
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
            ))}
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
    </div>
  );
}

