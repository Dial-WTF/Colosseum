/**
 * Project Service
 * Wraps the worm ProjectRepository with user context from Solana Wallet
 * Falls back to localStorage when Storj is not configured
 */

import { ProjectRepository } from '@dial/worm';
import type {
  Project,
  ProjectVersion,
  CreateProjectInput,
  CreateVersionInput,
  UpdateProjectInput,
  ProjectGridItem,
} from '@dial/types';

// Import the old localStorage service as fallback
import { projectStorage as localStorageService } from './project-storage';

/**
 * Get the current user's wallet address
 * This should be called from components that have access to the wallet
 */
let currentUserAddress: string | null = null;

// Check if Storj is configured
const isStorjConfigured = () => {
  if (typeof window === 'undefined') {
    // Server-side: check for env vars
    return !!(
      process.env.STORJ_ENDPOINT &&
      process.env.STORJ_BUCKET &&
      process.env.STORJ_ACCESS_KEY &&
      process.env.STORJ_SECRET_KEY
    );
  }
  // Client-side: check for public env vars
  return !!(
    process.env.NEXT_PUBLIC_STORJ_ENDPOINT &&
    process.env.NEXT_PUBLIC_STORJ_BUCKET &&
    process.env.NEXT_PUBLIC_STORJ_ACCESS_KEY &&
    process.env.NEXT_PUBLIC_STORJ_SECRET_KEY
  );
};

// Use localStorage fallback for now
const USE_STORJ = false; // Set to true when Storj is configured

export function setCurrentUserAddress(address: string | null) {
  currentUserAddress = address;
  // Sync address with localStorage service for user-scoped storage
  localStorageService.setUserAddress(address);
}

export function getCurrentUserAddress(): string | null {
  return currentUserAddress;
}

/**
 * Get or throw if no user is logged in (only needed for Storj mode)
 */
function requireUserAddress(): string {
  if (!currentUserAddress) {
    // In localStorage mode, we don't need an address
    if (!USE_STORJ) {
      return 'local-user';
    }
    throw new Error('User must be logged in to access projects');
  }
  return currentUserAddress;
}

/**
 * Get the project repository instance
 */
async function getProjectRepository(): Promise<ProjectRepository | null> {
  if (!USE_STORJ) {
    return null; // Use localStorage fallback
  }
  
  try {
    const { getWormClient } = await import('@dial/worm');
    const worm = getWormClient();
    return new ProjectRepository(worm);
  } catch (error) {
    console.warn('Failed to initialize Storj client, falling back to localStorage:', error);
    return null;
  }
}

/**
 * Create new project
 */
export async function createProject(
  input: CreateProjectInput
): Promise<Project> {
  const repo = await getProjectRepository();
  if (!repo) {
    return localStorageService.createProject(input);
  }
  const address = requireUserAddress();
  return repo.createProject(address, input);
}

/**
 * Get project by ID
 */
export async function getProject(id: string): Promise<Project | null> {
  const repo = await getProjectRepository();
  if (!repo) {
    return localStorageService.getProject(id);
  }
  const address = requireUserAddress();
  return repo.getProject(address, id);
}

/**
 * Get all projects
 */
export async function getAllProjects(): Promise<Project[]> {
  const repo = await getProjectRepository();
  if (!repo) {
    return localStorageService.getAllProjects();
  }
  const address = requireUserAddress();
  return repo.getAllProjects(address);
}

/**
 * Get projects formatted for grid view
 */
export async function getProjectsForGrid(): Promise<ProjectGridItem[]> {
  const repo = await getProjectRepository();
  if (!repo) {
    return localStorageService.getProjectsForGrid();
  }
  const address = requireUserAddress();
  return repo.getProjectsForGrid(address);
}

/**
 * Update project metadata
 */
export async function updateProject(
  id: string,
  input: UpdateProjectInput
): Promise<Project | null> {
  const repo = await getProjectRepository();
  if (!repo) {
    return localStorageService.updateProject(id, input);
  }
  const address = requireUserAddress();
  return repo.updateProject(address, id, input);
}

/**
 * Delete project
 */
export async function deleteProject(id: string): Promise<boolean> {
  const repo = await getProjectRepository();
  if (!repo) {
    return localStorageService.deleteProject(id);
  }
  const address = requireUserAddress();
  return repo.deleteProject(address, id);
}

/**
 * Create new version for project
 */
export async function createVersion(
  input: CreateVersionInput
): Promise<ProjectVersion> {
  const repo = await getProjectRepository();
  if (!repo) {
    return localStorageService.createVersion(input);
  }
  const address = requireUserAddress();
  return repo.createVersion(address, input);
}

/**
 * Get version by ID
 */
export async function getVersion(
  projectId: string,
  versionId: string
): Promise<ProjectVersion | null> {
  const repo = await getProjectRepository();
  if (!repo) {
    return localStorageService.getVersion(projectId, versionId);
  }
  const address = requireUserAddress();
  return repo.getVersion(address, projectId, versionId);
}

/**
 * Update version
 */
export async function updateVersion(
  projectId: string,
  versionId: string,
  data: Partial<Pick<ProjectVersion, 'name' | 'notes' | 'data' | 'thumbnail'>>
): Promise<ProjectVersion | null> {
  const repo = await getProjectRepository();
  if (!repo) {
    return localStorageService.updateVersion(projectId, versionId, data);
  }
  const address = requireUserAddress();
  return repo.updateVersion(address, projectId, versionId, data);
}

/**
 * Delete version
 */
export async function deleteVersion(
  projectId: string,
  versionId: string
): Promise<boolean> {
  const repo = await getProjectRepository();
  if (!repo) {
    return localStorageService.deleteVersion(projectId, versionId);
  }
  const address = requireUserAddress();
  return repo.deleteVersion(address, projectId, versionId);
}

/**
 * Set current version for project
 */
export async function setCurrentVersion(
  projectId: string,
  versionId: string
): Promise<Project | null> {
  const repo = await getProjectRepository();
  if (!repo) {
    return localStorageService.setCurrentVersion(projectId, versionId);
  }
  const address = requireUserAddress();
  return repo.setCurrentVersion(address, projectId, versionId);
}

/**
 * Duplicate project with all versions
 */
export async function duplicateProject(id: string): Promise<Project | null> {
  const repo = await getProjectRepository();
  if (!repo) {
    return localStorageService.duplicateProject(id);
  }
  const address = requireUserAddress();
  return repo.duplicateProject(address, id);
}

/**
 * Export project as JSON
 */
export async function exportProject(id: string): Promise<string | null> {
  const repo = await getProjectRepository();
  if (!repo) {
    return localStorageService.exportProject(id);
  }
  const address = requireUserAddress();
  return repo.exportProject(address, id);
}

/**
 * Import project from JSON
 */
export async function importProject(json: string): Promise<Project> {
  const repo = await getProjectRepository();
  if (!repo) {
    return localStorageService.importProject(json);
  }
  const address = requireUserAddress();
  return repo.importProject(address, json);
}

/**
 * Get storage statistics
 */
export async function getStorageStats(): Promise<{
  projectCount: number;
  totalVersions: number;
}> {
  const repo = await getProjectRepository();
  if (!repo) {
    const stats = await localStorageService.getStorageStats();
    return {
      projectCount: stats.projectCount,
      totalVersions: stats.totalVersions,
    };
  }
  const address = requireUserAddress();
  return repo.getStorageStats(address);
}

/**
 * Legacy projectStorage object for compatibility
 * Provides the same interface as the old localStorage-based service
 */
export const projectStorage = {
  setCurrentVersion,
  getStorageStats,
  duplicateProject: localStorageService.duplicateProject,
  exportProject: localStorageService.exportProject,
};

