/**
 * Project Service
 * Uses STORJ via worm ProjectRepository with user context from Solana Wallet
 */

import { ProjectRepository, getWormClient } from '@dial/worm';
import type {
  Project,
  ProjectVersion,
  CreateProjectInput,
  CreateVersionInput,
  UpdateProjectInput,
  ProjectGridItem,
} from '@dial/types';

/**
 * Get the current user's wallet address
 * This should be called from components that have access to the wallet
 */
let currentUserAddress: string | null = null;

export function setCurrentUserAddress(address: string | null) {
  currentUserAddress = address;
}

export function getCurrentUserAddress(): string | null {
  return currentUserAddress;
}

/**
 * Get or throw if no user is logged in
 */
function requireUserAddress(): string {
  if (!currentUserAddress) {
    throw new Error('User must be logged in to access projects');
  }
  return currentUserAddress;
}

/**
 * Get the project repository instance (always uses STORJ via worm)
 */
function getProjectRepository(): ProjectRepository {
  const worm = getWormClient();
  return new ProjectRepository(worm);
}

/**
 * Create new project
 */
export async function createProject(
  input: CreateProjectInput
): Promise<Project> {
  const repo = getProjectRepository();
  const address = requireUserAddress();
  return repo.createProject(address, input);
}

/**
 * Get project by ID
 */
export async function getProject(id: string): Promise<Project | null> {
  const repo = getProjectRepository();
  const address = requireUserAddress();
  return repo.getProject(address, id);
}

/**
 * Get all projects
 */
export async function getAllProjects(): Promise<Project[]> {
  const repo = getProjectRepository();
  const address = requireUserAddress();
  return repo.getAllProjects(address);
}

/**
 * Get projects formatted for grid view
 */
export async function getProjectsForGrid(): Promise<ProjectGridItem[]> {
  const repo = getProjectRepository();
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
  const repo = getProjectRepository();
  const address = requireUserAddress();
  return repo.updateProject(address, id, input);
}

/**
 * Delete project
 */
export async function deleteProject(id: string): Promise<boolean> {
  const repo = getProjectRepository();
  const address = requireUserAddress();
  return repo.deleteProject(address, id);
}

/**
 * Create new version for project
 */
export async function createVersion(
  input: CreateVersionInput
): Promise<ProjectVersion> {
  const repo = getProjectRepository();
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
  const repo = getProjectRepository();
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
  const repo = getProjectRepository();
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
  const repo = getProjectRepository();
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
  const repo = getProjectRepository();
  const address = requireUserAddress();
  return repo.setCurrentVersion(address, projectId, versionId);
}

/**
 * Duplicate project with all versions
 */
export async function duplicateProject(id: string): Promise<Project | null> {
  const repo = getProjectRepository();
  const address = requireUserAddress();
  return repo.duplicateProject(address, id);
}

/**
 * Export project as JSON
 */
export async function exportProject(id: string): Promise<string | null> {
  const repo = getProjectRepository();
  const address = requireUserAddress();
  return repo.exportProject(address, id);
}

/**
 * Import project from JSON
 */
export async function importProject(json: string): Promise<Project> {
  const repo = getProjectRepository();
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
  const repo = getProjectRepository();
  const address = requireUserAddress();
  return repo.getStorageStats(address);
}

/**
 * Get project with data (alias for getProject - data is already in STORJ)
 */
export async function getProjectWithData(id: string): Promise<Project | null> {
  return getProject(id);
}

/**
 * Legacy projectStorage object for compatibility
 */
export const projectStorage = {
  setCurrentVersion,
  getStorageStats,
  duplicateProject,
  exportProject,
};

