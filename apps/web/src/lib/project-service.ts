/**
 * Project Service
 * Client-side service that communicates with backend API for project operations
 */

import type {
  Project,
  ProjectVersion,
  CreateProjectInput,
  CreateVersionInput,
  UpdateProjectInput,
  ProjectGridItem,
} from "@dial/types";

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
    throw new Error("User must be logged in to access projects");
  }
  return currentUserAddress;
}

/**
 * Helper function to handle API responses
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || `API error: ${response.status}`);
  }
  return response.json();
}

/**
 * Create new project
 */
export async function createProject(
  input: CreateProjectInput
): Promise<Project> {
  const address = requireUserAddress();
  const response = await fetch("/api/projects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address, ...input }),
  });
  return handleResponse<Project>(response);
}

/**
 * Get project by ID
 */
export async function getProject(id: string): Promise<Project | null> {
  const address = requireUserAddress();
  const response = await fetch(
    `/api/projects?address=${encodeURIComponent(
      address
    )}&id=${encodeURIComponent(id)}`
  );
  if (response.status === 404) return null;
  return handleResponse<Project>(response);
}

/**
 * Get all projects
 */
export async function getAllProjects(): Promise<Project[]> {
  const address = requireUserAddress();
  const response = await fetch(
    `/api/projects?address=${encodeURIComponent(address)}`
  );
  const data = await handleResponse<{ projects: Project[] }>(response);
  return data.projects;
}

/**
 * Get projects formatted for grid view
 */
export async function getProjectsForGrid(): Promise<ProjectGridItem[]> {
  const address = requireUserAddress();
  const response = await fetch(
    `/api/projects?address=${encodeURIComponent(address)}&format=grid`
  );
  const data = await handleResponse<{ projects: ProjectGridItem[] }>(response);
  return data.projects;
}

/**
 * Update project metadata
 */
export async function updateProject(
  id: string,
  input: UpdateProjectInput
): Promise<Project | null> {
  const address = requireUserAddress();
  const response = await fetch("/api/projects", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address, id, ...input }),
  });
  if (response.status === 404) return null;
  return handleResponse<Project>(response);
}

/**
 * Delete project
 */
export async function deleteProject(id: string): Promise<boolean> {
  const address = requireUserAddress();
  const response = await fetch(
    `/api/projects?address=${encodeURIComponent(
      address
    )}&id=${encodeURIComponent(id)}`,
    {
      method: "DELETE",
    }
  );
  if (response.status === 404) return false;
  const data = await handleResponse<{ success: boolean }>(response);
  return data.success;
}

/**
 * Create new version for project
 */
export async function createVersion(
  input: CreateVersionInput
): Promise<ProjectVersion> {
  const address = requireUserAddress();
  const response = await fetch("/api/projects/versions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address, ...input }),
  });
  return handleResponse<ProjectVersion>(response);
}

/**
 * Get version by ID
 */
export async function getVersion(
  projectId: string,
  versionId: string
): Promise<ProjectVersion | null> {
  const address = requireUserAddress();
  const response = await fetch(
    `/api/projects/versions?address=${encodeURIComponent(
      address
    )}&projectId=${encodeURIComponent(
      projectId
    )}&versionId=${encodeURIComponent(versionId)}`
  );
  if (response.status === 404) return null;
  return handleResponse<ProjectVersion>(response);
}

/**
 * Update version
 */
export async function updateVersion(
  projectId: string,
  versionId: string,
  data: Partial<Pick<ProjectVersion, "name" | "notes" | "data" | "thumbnail">>
): Promise<ProjectVersion | null> {
  const address = requireUserAddress();
  const response = await fetch("/api/projects/versions", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address, projectId, versionId, ...data }),
  });
  if (response.status === 404) return null;
  return handleResponse<ProjectVersion>(response);
}

/**
 * Delete version
 */
export async function deleteVersion(
  projectId: string,
  versionId: string
): Promise<boolean> {
  const address = requireUserAddress();
  const response = await fetch(
    `/api/projects/versions?address=${encodeURIComponent(
      address
    )}&projectId=${encodeURIComponent(
      projectId
    )}&versionId=${encodeURIComponent(versionId)}`,
    { method: "DELETE" }
  );
  if (response.status === 404) return false;
  const data = await handleResponse<{ success: boolean }>(response);
  return data.success;
}

/**
 * Set current version for project
 */
export async function setCurrentVersion(
  projectId: string,
  versionId: string
): Promise<Project | null> {
  const address = requireUserAddress();
  const response = await fetch("/api/projects/actions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "setCurrentVersion",
      address,
      projectId,
      versionId,
    }),
  });
  if (response.status === 404) return null;
  const data = await handleResponse<{ project: Project }>(response);
  return data.project;
}

/**
 * Duplicate project with all versions
 */
export async function duplicateProject(id: string): Promise<Project | null> {
  const address = requireUserAddress();
  const response = await fetch("/api/projects/actions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "duplicate", address, projectId: id }),
  });
  if (response.status === 404) return null;
  const data = await handleResponse<{ project: Project }>(response);
  return data.project;
}

/**
 * Export project as JSON
 */
export async function exportProject(id: string): Promise<string | null> {
  const address = requireUserAddress();
  const response = await fetch("/api/projects/actions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "export", address, projectId: id }),
  });
  if (response.status === 404) return null;
  const data = await handleResponse<{ json: string }>(response);
  return data.json;
}

/**
 * Import project from JSON
 */
export async function importProject(json: string): Promise<Project> {
  const address = requireUserAddress();
  const response = await fetch("/api/projects/actions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "import", address, data: json }),
  });
  const data = await handleResponse<{ project: Project }>(response);
  return data.project;
}

/**
 * Get storage statistics
 */
export async function getStorageStats(): Promise<{
  projectCount: number;
  totalVersions: number;
}> {
  const address = requireUserAddress();
  const response = await fetch(
    `/api/projects/stats?address=${encodeURIComponent(address)}`
  );
  return handleResponse<{ projectCount: number; totalVersions: number }>(
    response
  );
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
