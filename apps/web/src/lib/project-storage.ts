import type {
  Project,
  ProjectVersion,
  CreateProjectInput,
  CreateVersionInput,
  UpdateProjectInput,
  ProjectGridItem,
  ImageProjectData,
  AudioProjectData,
} from '@dial/types';
import { indexedDBStorage } from './indexed-db-storage';

const STORAGE_KEY_PREFIX = 'dial_studio_projects';
const STORAGE_VERSION = '1.0';

// Max size for data stored in localStorage (5MB, conservative limit)
const MAX_LOCALSTORAGE_SIZE = 5 * 1024 * 1024;

// Storage metadata
interface StorageMetadata {
  version: string;
  lastSync: number;
}

interface ProjectStorage {
  metadata: StorageMetadata;
  projects: Record<string, Project>;
}

/**
 * Project Storage Service
 * Handles all project CRUD operations with localStorage
 * Supports IndexedDB fallback for large files
 * Now user-scoped for multi-wallet support
 */
class ProjectStorageService {
  private cache: Map<string, Project> = new Map();
  private initialized = false;
  private currentUserAddress: string | null = null;

  /**
   * Set the current user address for scoping storage
   */
  setUserAddress(address: string | null): void {
    if (address !== this.currentUserAddress) {
      this.currentUserAddress = address;
      this.initialized = false;
      this.cache.clear();
    }
  }

  /**
   * Get the storage key for the current user
   */
  private getStorageKey(): string {
    if (!this.currentUserAddress) {
      return `${STORAGE_KEY_PREFIX}_guest`;
    }
    return `${STORAGE_KEY_PREFIX}_${this.currentUserAddress}`;
  }

  /**
   * Initialize storage and load projects into cache
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const data = this.loadFromStorage();
      Object.values(data.projects).forEach((project) => {
        this.cache.set(project.id, project);
      });
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize project storage:', error);
      // Initialize with empty storage
      this.saveToStorage({ metadata: this.getMetadata(), projects: {} });
      this.initialized = true;
    }
  }

  /**
   * Get all projects
   */
  async getAllProjects(): Promise<Project[]> {
    await this.initialize();
    return Array.from(this.cache.values()).sort(
      (a, b) => b.updatedAt - a.updatedAt
    );
  }

  /**
   * Get projects formatted for grid view
   */
  async getProjectsForGrid(): Promise<ProjectGridItem[]> {
    const projects = await this.getAllProjects();
    return projects.map((project) => ({
      id: project.id,
      name: project.name,
      type: project.type,
      thumbnail: project.thumbnail,
      versionCount: project.versions.length,
      lastModified: project.updatedAt,
      status: project.status,
    }));
  }

  /**
   * Get project by ID
   */
  async getProject(id: string): Promise<Project | null> {
    await this.initialize();
    return this.cache.get(id) || null;
  }

  /**
   * Create new project
   */
  async createProject(input: CreateProjectInput): Promise<Project> {
    await this.initialize();

    const now = Date.now();
    const project: Project = {
      id: this.generateId(),
      name: input.name,
      type: input.type,
      description: input.description,
      status: 'draft',
      versions: [],
      createdAt: now,
      updatedAt: now,
      tags: input.tags || [],
    };

    this.cache.set(project.id, project);
    this.persist();

    return project;
  }

  /**
   * Update project metadata
   */
  async updateProject(
    id: string,
    input: UpdateProjectInput
  ): Promise<Project | null> {
    await this.initialize();

    const project = this.cache.get(id);
    if (!project) return null;

    const updated: Project = {
      ...project,
      ...input,
      updatedAt: Date.now(),
    };

    this.cache.set(id, updated);
    this.persist();

    return updated;
  }

  /**
   * Delete project
   */
  async deleteProject(id: string): Promise<boolean> {
    await this.initialize();

    const deleted = this.cache.delete(id);
    if (deleted) {
      // Clean up IndexedDB files for this project
      try {
        await indexedDBStorage.deleteProjectFiles(id);
      } catch (error) {
        console.warn('Failed to delete project files from IndexedDB:', error);
      }
      this.persist();
    }

    return deleted;
  }

  /**
   * Create new version for project
   */
  async createVersion(input: CreateVersionInput): Promise<ProjectVersion> {
    await this.initialize();

    const project = this.cache.get(input.projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    const now = Date.now();
    const versionNumber = project.versions.length + 1;

    // Handle large data (audio/image) by storing in IndexedDB
    const processedData = await this.processLargeData(input.projectId, input.data);

    const version: ProjectVersion = {
      id: this.generateId(),
      name: input.name,
      versionNumber,
      data: processedData,
      thumbnail: input.thumbnail,
      createdAt: now,
      updatedAt: now,
      notes: input.notes,
    };

    const updated: Project = {
      ...project,
      versions: [...project.versions, version],
      currentVersionId: version.id,
      updatedAt: now,
      thumbnail: input.thumbnail || project.thumbnail,
    };

    this.cache.set(project.id, updated);
    this.persist();

    return version;
  }

  /**
   * Update version
   */
  async updateVersion(
    projectId: string,
    versionId: string,
    data: Partial<Pick<ProjectVersion, 'name' | 'notes' | 'data' | 'thumbnail'>>
  ): Promise<ProjectVersion | null> {
    await this.initialize();

    const project = this.cache.get(projectId);
    if (!project) return null;

    const versionIndex = project.versions.findIndex((v) => v.id === versionId);
    if (versionIndex === -1) return null;

    // Process large data if updating data field
    const processedData = data.data 
      ? await this.processLargeData(projectId, data.data)
      : undefined;

    const updated = {
      ...project.versions[versionIndex],
      ...data,
      data: processedData !== undefined ? processedData : project.versions[versionIndex].data,
      updatedAt: Date.now(),
    };

    const newVersions = [...project.versions];
    newVersions[versionIndex] = updated;

    const updatedProject: Project = {
      ...project,
      versions: newVersions,
      updatedAt: Date.now(),
    };

    this.cache.set(projectId, updatedProject);
    this.persist();

    return updated;
  }

  /**
   * Delete version
   */
  async deleteVersion(
    projectId: string,
    versionId: string
  ): Promise<boolean> {
    await this.initialize();

    const project = this.cache.get(projectId);
    if (!project) return false;

    const newVersions = project.versions.filter((v) => v.id !== versionId);
    if (newVersions.length === project.versions.length) return false;

    // Update current version if deleted
    let currentVersionId = project.currentVersionId;
    if (currentVersionId === versionId) {
      currentVersionId = newVersions[newVersions.length - 1]?.id;
    }

    const updated: Project = {
      ...project,
      versions: newVersions,
      currentVersionId,
      updatedAt: Date.now(),
    };

    this.cache.set(projectId, updated);
    this.persist();

    return true;
  }

  /**
   * Get version by ID
   */
  async getVersion(
    projectId: string,
    versionId: string
  ): Promise<ProjectVersion | null> {
    await this.initialize();

    const project = this.cache.get(projectId);
    if (!project) return null;

    return project.versions.find((v) => v.id === versionId) || null;
  }

  /**
   * Set current version for project
   */
  async setCurrentVersion(
    projectId: string,
    versionId: string
  ): Promise<Project | null> {
    await this.initialize();

    const project = this.cache.get(projectId);
    if (!project) return null;

    const versionExists = project.versions.some((v) => v.id === versionId);
    if (!versionExists) return null;

    const updated: Project = {
      ...project,
      currentVersionId: versionId,
      updatedAt: Date.now(),
    };

    this.cache.set(projectId, updated);
    this.persist();

    return updated;
  }

  /**
   * Duplicate project with all versions
   */
  async duplicateProject(id: string): Promise<Project | null> {
    await this.initialize();

    const original = this.cache.get(id);
    if (!original) return null;

    const now = Date.now();
    const duplicate: Project = {
      ...original,
      id: this.generateId(),
      name: `${original.name} (Copy)`,
      createdAt: now,
      updatedAt: now,
      versions: original.versions.map((v) => ({
        ...v,
        id: this.generateId(),
      })),
    };

    this.cache.set(duplicate.id, duplicate);
    this.persist();

    return duplicate;
  }

  /**
   * Export project as JSON
   */
  async exportProject(id: string): Promise<string | null> {
    await this.initialize();

    const project = this.cache.get(id);
    if (!project) return null;

    return JSON.stringify(project, null, 2);
  }

  /**
   * Import project from JSON
   */
  async importProject(json: string): Promise<Project> {
    await this.initialize();

    const project = JSON.parse(json) as Project;
    
    // Generate new IDs to avoid conflicts
    const newProject: Project = {
      ...project,
      id: this.generateId(),
      versions: project.versions.map((v) => ({
        ...v,
        id: this.generateId(),
      })),
    };

    this.cache.set(newProject.id, newProject);
    this.persist();

    return newProject;
  }

  /**
   * Clear all projects (with confirmation)
   */
  async clearAll(): Promise<void> {
    this.cache.clear();
    this.saveToStorage({ metadata: this.getMetadata(), projects: {} });
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<{
    projectCount: number;
    totalVersions: number;
    storageSize: number;
  }> {
    await this.initialize();

    const projects = Array.from(this.cache.values());
    const totalVersions = projects.reduce(
      (sum, p) => sum + p.versions.length,
      0
    );

    // Estimate storage size
    const storageStr = localStorage.getItem(this.getStorageKey()) || '';
    const storageSize = new Blob([storageStr]).size;

    return {
      projectCount: projects.length,
      totalVersions,
      storageSize,
    };
  }

  // Private helper methods

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private getMetadata(): StorageMetadata {
    return {
      version: STORAGE_VERSION,
      lastSync: Date.now(),
    };
  }

  private loadFromStorage(): ProjectStorage {
    const data = localStorage.getItem(this.getStorageKey());
    if (!data) {
      return {
        metadata: this.getMetadata(),
        projects: {},
      };
    }

    return JSON.parse(data);
  }

  private saveToStorage(data: ProjectStorage): void {
    try {
      const jsonStr = JSON.stringify(data);
      localStorage.setItem(this.getStorageKey(), jsonStr);
    } catch (error) {
      console.error('❌ localStorage save failed:', error);
      throw error;
    }
  }

  private persist(): void {
    const projects: Record<string, Project> = {};
    this.cache.forEach((project, id) => {
      projects[id] = project;
    });

    this.saveToStorage({
      metadata: this.getMetadata(),
      projects,
    });
  }

  /**
   * Process large data (audio/image URLs) by storing in IndexedDB
   * Returns reference ID for IndexedDB or original data if small enough
   */
  private async processLargeData(projectId: string, data: any): Promise<any> {
    if (!data) return data;

    // Handle audio project data
    if (data.type === 'audio' && data.audioUrl) {
      const audioSize = data.audioUrl.length;
      
      // If audio URL is large (>1MB), store in IndexedDB
      if (audioSize > 1024 * 1024) {
        try {
          const fileId = `audio_${projectId}_${Date.now()}`;
          await indexedDBStorage.storeFile(
            fileId,
            projectId,
            'audio',
            data.audioUrl,
            'audio/wav'
          );
          
          return {
            ...data,
            audioUrl: `indexeddb://${fileId}`,
            _indexedDBRef: fileId,
          };
        } catch (error) {
          console.warn('Failed to store audio in IndexedDB, falling back to inline:', error);
          return data;
        }
      }
    }

    // Handle image project data
    if (data.type === 'image' && data.exportUrl) {
      const imageSize = data.exportUrl.length;
      
      // If export URL is large (>1MB), store in IndexedDB
      if (imageSize > 1024 * 1024) {
        try {
          const fileId = `image_${projectId}_${Date.now()}`;
          await indexedDBStorage.storeFile(
            fileId,
            projectId,
            'image',
            data.exportUrl,
            'image/png'
          );
          
          return {
            ...data,
            exportUrl: `indexeddb://${fileId}`,
            _indexedDBRef: fileId,
          };
        } catch (error) {
          console.warn('Failed to store image in IndexedDB, falling back to inline:', error);
          return data;
        }
      }
    }

    return data;
  }

  /**
   * Load large data from IndexedDB if it's a reference
   */
  private async loadLargeData(data: any): Promise<any> {
    if (!data) return data;

    // Handle audio data with IndexedDB reference
    if (data.type === 'audio' && data.audioUrl?.startsWith('indexeddb://')) {
      const fileId = data.audioUrl.replace('indexeddb://', '');
      try {
        const audioUrl = await indexedDBStorage.getFile(fileId);
        if (audioUrl) {
          return { ...data, audioUrl };
        }
      } catch (error) {
        console.warn('Failed to load audio from IndexedDB:', error);
      }
    }

    // Handle image data with IndexedDB reference
    if (data.type === 'image' && data.exportUrl?.startsWith('indexeddb://')) {
      const fileId = data.exportUrl.replace('indexeddb://', '');
      try {
        const exportUrl = await indexedDBStorage.getFile(fileId);
        if (exportUrl) {
          return { ...data, exportUrl };
        }
      } catch (error) {
        console.warn('Failed to load image from IndexedDB:', error);
      }
    }

    return data;
  }

  /**
   * Clean up old data to free space
   */
  private async cleanupOldData(): Promise<void> {
    const projects = Array.from(this.cache.values());
    
    // Sort by last modified (oldest first)
    projects.sort((a, b) => a.updatedAt - b.updatedAt);
    
    // Remove oldest 20% of projects
    const toRemove = Math.ceil(projects.length * 0.2);
    for (let i = 0; i < toRemove && i < projects.length; i++) {
      console.log('🗑️ Auto-removing old project to free space:', projects[i].name);
      await this.deleteProject(projects[i].id);
    }
  }

  /**
   * Get project with large data loaded from IndexedDB
   */
  async getProjectWithData(id: string): Promise<Project | null> {
    const project = await this.getProject(id);
    if (!project) return null;

    // Load large data for all versions
    const versions = await Promise.all(
      project.versions.map(async (version) => ({
        ...version,
        data: await this.loadLargeData(version.data),
      }))
    );

    return { ...project, versions };
  }
}

// Export singleton instance
export const projectStorage = new ProjectStorageService();

// Export helper functions for common operations
export const createProject = (input: CreateProjectInput) =>
  projectStorage.createProject(input);

export const getProject = (id: string) => projectStorage.getProject(id);

export const getAllProjects = () => projectStorage.getAllProjects();

export const getProjectsForGrid = () => projectStorage.getProjectsForGrid();

export const updateProject = (id: string, input: UpdateProjectInput) =>
  projectStorage.updateProject(id, input);

export const deleteProject = (id: string) => projectStorage.deleteProject(id);

export const createVersion = (input: CreateVersionInput) =>
  projectStorage.createVersion(input);

export const getVersion = (projectId: string, versionId: string) =>
  projectStorage.getVersion(projectId, versionId);

export const updateVersion = (
  projectId: string,
  versionId: string,
  data: Partial<Pick<ProjectVersion, 'name' | 'notes' | 'data' | 'thumbnail'>>
) => projectStorage.updateVersion(projectId, versionId, data);

export const deleteVersion = (projectId: string, versionId: string) =>
  projectStorage.deleteVersion(projectId, versionId);

export const setCurrentVersion = (projectId: string, versionId: string) =>
  projectStorage.setCurrentVersion(projectId, versionId);

export const getProjectWithData = (id: string) =>
  projectStorage.getProjectWithData(id);

