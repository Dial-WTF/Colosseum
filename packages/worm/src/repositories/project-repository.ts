/**
 * Project Repository
 * Manages project data in S3/Storj storage
 */

import type { S3Worm } from '@decoperations/s3worm';
import { UserProjects } from '../entities/user-project';
import type {
  Project,
  ProjectVersion,
  CreateProjectInput,
  CreateVersionInput,
  UpdateProjectInput,
  ProjectGridItem,
} from '@dial/types';

/**
 * Helper to convert string to Uint8Array
 */
function stringToUint8Array(str: string): Uint8Array {
  const encoder = new TextEncoder();
  return encoder.encode(str);
}

/**
 * Helper to convert Uint8Array to string
 */
function uint8ArrayToString(arr: Uint8Array): string {
  const decoder = new TextDecoder();
  return decoder.decode(arr);
}

/**
 * Generate unique ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export class ProjectRepository {
  constructor(private worm: S3Worm) {}

  /**
   * Get user projects entity
   * Creates new entity if it doesn't exist
   */
  async getProjects(address: string): Promise<UserProjects> {
    const entity = new UserProjects(address);
    const path = entity.getPath();

    try {
      // Note: S3Worm API compatibility - using any cast for getBytes
      const data = await (this.worm as any).getBytes?.(path);
      if (!data) return entity;
      const json = uint8ArrayToString(new Uint8Array(data));
      const parsed = JSON.parse(json);

      // Hydrate entity
      Object.assign(entity, parsed);
      return entity;
    } catch (error) {
      // Entity doesn't exist yet, return new empty entity
      return entity;
    }
  }

  /**
   * Save projects entity
   */
  async saveProjects(projects: UserProjects): Promise<void> {
    const path = projects.getPath();
    const json = JSON.stringify(projects, null, 2);
    const data = stringToUint8Array(json);
    await this.worm.putBytes(path, data, 'application/json');
  }

  /**
   * Create new project
   */
  async createProject(
    address: string,
    input: CreateProjectInput
  ): Promise<Project> {
    const projects = await this.getProjects(address);

    const now = Date.now();
    const project: Project = {
      id: generateId(),
      name: input.name,
      type: input.type,
      description: input.description,
      status: 'draft',
      versions: [],
      createdAt: now,
      updatedAt: now,
      tags: input.tags || [],
    };

    projects.addProject(project);
    await this.saveProjects(projects);

    return project;
  }

  /**
   * Get project by ID
   */
  async getProject(address: string, id: string): Promise<Project | null> {
    const projects = await this.getProjects(address);
    return projects.getProject(id) || null;
  }

  /**
   * Get all projects
   */
  async getAllProjects(address: string): Promise<Project[]> {
    const projects = await this.getProjects(address);
    return projects.getAllProjectsSorted();
  }

  /**
   * Get projects formatted for grid view
   */
  async getProjectsForGrid(address: string): Promise<ProjectGridItem[]> {
    const allProjects = await this.getAllProjects(address);
    return allProjects.map((project) => ({
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
   * Update project
   */
  async updateProject(
    address: string,
    id: string,
    input: UpdateProjectInput
  ): Promise<Project | null> {
    const projects = await this.getProjects(address);
    const success = projects.updateProject(id, input);
    
    if (!success) return null;

    await this.saveProjects(projects);
    return projects.getProject(id) || null;
  }

  /**
   * Delete project
   */
  async deleteProject(address: string, id: string): Promise<boolean> {
    const projects = await this.getProjects(address);
    const success = projects.deleteProject(id);
    
    if (!success) return false;

    await this.saveProjects(projects);
    return true;
  }

  /**
   * Create new version for project
   */
  async createVersion(
    address: string,
    input: CreateVersionInput
  ): Promise<ProjectVersion> {
    const projects = await this.getProjects(address);
    const project = projects.getProject(input.projectId);
    
    if (!project) {
      throw new Error('Project not found');
    }

    const now = Date.now();
    const versionNumber = project.versions.length + 1;

    const version: ProjectVersion = {
      id: generateId(),
      name: input.name,
      versionNumber,
      data: input.data,
      thumbnail: input.thumbnail,
      createdAt: now,
      updatedAt: now,
      notes: input.notes,
    };

    projects.addVersion(input.projectId, version);
    await this.saveProjects(projects);

    return version;
  }

  /**
   * Update version
   */
  async updateVersion(
    address: string,
    projectId: string,
    versionId: string,
    data: Partial<Pick<ProjectVersion, 'name' | 'notes' | 'data' | 'thumbnail'>>
  ): Promise<ProjectVersion | null> {
    const projects = await this.getProjects(address);
    const success = projects.updateVersion(projectId, versionId, data);
    
    if (!success) return null;

    await this.saveProjects(projects);
    return projects.getVersion(projectId, versionId) || null;
  }

  /**
   * Delete version
   */
  async deleteVersion(
    address: string,
    projectId: string,
    versionId: string
  ): Promise<boolean> {
    const projects = await this.getProjects(address);
    const success = projects.deleteVersion(projectId, versionId);
    
    if (!success) return false;

    await this.saveProjects(projects);
    return true;
  }

  /**
   * Get version by ID
   */
  async getVersion(
    address: string,
    projectId: string,
    versionId: string
  ): Promise<ProjectVersion | null> {
    const projects = await this.getProjects(address);
    return projects.getVersion(projectId, versionId) || null;
  }

  /**
   * Set current version for project
   */
  async setCurrentVersion(
    address: string,
    projectId: string,
    versionId: string
  ): Promise<Project | null> {
    const projects = await this.getProjects(address);
    const success = projects.setCurrentVersion(projectId, versionId);
    
    if (!success) return null;

    await this.saveProjects(projects);
    return projects.getProject(projectId) || null;
  }

  /**
   * Duplicate project with all versions
   */
  async duplicateProject(
    address: string,
    id: string
  ): Promise<Project | null> {
    const projects = await this.getProjects(address);
    const original = projects.getProject(id);
    
    if (!original) return null;

    const now = Date.now();
    const duplicate: Project = {
      ...original,
      id: generateId(),
      name: `${original.name} (Copy)`,
      createdAt: now,
      updatedAt: now,
      versions: original.versions.map((v: ProjectVersion) => ({
        ...v,
        id: generateId(),
      })),
    };

    projects.addProject(duplicate);
    await this.saveProjects(projects);

    return duplicate;
  }

  /**
   * Export project as JSON
   */
  async exportProject(address: string, id: string): Promise<string | null> {
    const projects = await this.getProjects(address);
    const project = projects.getProject(id);
    
    if (!project) return null;

    return JSON.stringify(project, null, 2);
  }

  /**
   * Import project from JSON
   */
  async importProject(address: string, json: string): Promise<Project> {
    const projects = await this.getProjects(address);
    const project = JSON.parse(json) as Project;

    // Generate new IDs to avoid conflicts
    const newProject: Project = {
      ...project,
      id: generateId(),
      versions: project.versions.map((v: ProjectVersion) => ({
        ...v,
        id: generateId(),
      })),
    };

    projects.addProject(newProject);
    await this.saveProjects(projects);

    return newProject;
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(address: string): Promise<{
    projectCount: number;
    totalVersions: number;
  }> {
    const projects = await this.getProjects(address);
    const totalVersions = projects.projects.reduce(
      (sum, p) => sum + p.versions.length,
      0
    );

    return {
      projectCount: projects.totalCount,
      totalVersions,
    };
  }
}

