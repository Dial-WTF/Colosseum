/**
 * User project entity for studio projects
 * Stored at: users/[address]/projects.json
 */

import { BaseEntity, getUserPath } from './base';
import type {
  Project,
  ProjectVersion,
  ProjectStatus,
  ProjectType,
} from '@dial/types';

export class UserProjects extends BaseEntity {
  /**
   * User's wallet address
   */
  address: string = '';

  /**
   * Array of projects
   */
  projects: Project[] = [];

  /**
   * Total count of projects
   */
  totalCount: number = 0;

  /**
   * Last project update timestamp
   */
  lastModifiedAt?: number;

  constructor(address?: string) {
    super();
    if (address) {
      this.address = address;
    }
  }

  /**
   * Get the S3 path for this entity
   */
  getPath(): string {
    return getUserPath(this.address, 'projects.json');
  }

  /**
   * Add a new project
   */
  addProject(project: Project): void {
    this.projects.push(project);
    this.totalCount = this.projects.length;
    this.lastModifiedAt = Date.now();
    this.touch();
  }

  /**
   * Get project by ID
   */
  getProject(id: string): Project | undefined {
    return this.projects.find((p) => p.id === id);
  }

  /**
   * Update project
   */
  updateProject(id: string, updates: Partial<Project>): boolean {
    const index = this.projects.findIndex((p) => p.id === id);
    if (index === -1) return false;

    this.projects[index] = {
      ...this.projects[index],
      ...updates,
      updatedAt: Date.now(),
    };
    this.lastModifiedAt = Date.now();
    this.touch();
    return true;
  }

  /**
   * Delete project
   */
  deleteProject(id: string): boolean {
    const initialLength = this.projects.length;
    this.projects = this.projects.filter((p) => p.id !== id);
    
    if (this.projects.length < initialLength) {
      this.totalCount = this.projects.length;
      this.lastModifiedAt = Date.now();
      this.touch();
      return true;
    }
    return false;
  }

  /**
   * Add version to project
   */
  addVersion(projectId: string, version: ProjectVersion): boolean {
    const project = this.getProject(projectId);
    if (!project) return false;

    project.versions.push(version);
    project.currentVersionId = version.id;
    project.updatedAt = Date.now();
    project.thumbnail = version.thumbnail || project.thumbnail;
    
    this.lastModifiedAt = Date.now();
    this.touch();
    return true;
  }

  /**
   * Update version
   */
  updateVersion(
    projectId: string,
    versionId: string,
    updates: Partial<ProjectVersion>
  ): boolean {
    const project = this.getProject(projectId);
    if (!project) return false;

    const versionIndex = project.versions.findIndex((v) => v.id === versionId);
    if (versionIndex === -1) return false;

    project.versions[versionIndex] = {
      ...project.versions[versionIndex],
      ...updates,
      updatedAt: Date.now(),
    };
    project.updatedAt = Date.now();
    
    this.lastModifiedAt = Date.now();
    this.touch();
    return true;
  }

  /**
   * Delete version
   */
  deleteVersion(projectId: string, versionId: string): boolean {
    const project = this.getProject(projectId);
    if (!project) return false;

    const initialLength = project.versions.length;
    project.versions = project.versions.filter((v: ProjectVersion) => v.id !== versionId);

    if (project.versions.length < initialLength) {
      // Update current version if deleted
      if (project.currentVersionId === versionId) {
        project.currentVersionId =
          project.versions[project.versions.length - 1]?.id;
      }
      project.updatedAt = Date.now();
      
      this.lastModifiedAt = Date.now();
      this.touch();
      return true;
    }
    return false;
  }

  /**
   * Set current version for project
   */
  setCurrentVersion(projectId: string, versionId: string): boolean {
    const project = this.getProject(projectId);
    if (!project) return false;

    const versionExists = project.versions.some((v: ProjectVersion) => v.id === versionId);
    if (!versionExists) return false;

    project.currentVersionId = versionId;
    project.updatedAt = Date.now();
    
    this.lastModifiedAt = Date.now();
    this.touch();
    return true;
  }

  /**
   * Get version by ID
   */
  getVersion(projectId: string, versionId: string): ProjectVersion | undefined {
    const project = this.getProject(projectId);
    if (!project) return undefined;

    return project.versions.find((v: ProjectVersion) => v.id === versionId);
  }

  /**
   * Get projects by type
   */
  getProjectsByType(type: ProjectType): Project[] {
    return this.projects.filter((p) => p.type === type);
  }

  /**
   * Get projects by status
   */
  getProjectsByStatus(status: ProjectStatus): Project[] {
    return this.projects.filter((p) => p.status === status);
  }

  /**
   * Get all projects sorted by update time
   */
  getAllProjectsSorted(): Project[] {
    return [...this.projects].sort((a, b) => b.updatedAt - a.updatedAt);
  }
}

