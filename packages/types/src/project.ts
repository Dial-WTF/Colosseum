// Studio Project Types

export type ProjectType = 'image' | 'audio';

export type ProjectStatus = 'draft' | 'published' | 'archived';

export interface ProjectVersion {
  id: string;
  name: string;
  versionNumber: number;
  data: ImageProjectData | AudioProjectData;
  thumbnail?: string;
  createdAt: number;
  updatedAt: number;
  notes?: string;
}

export interface Project {
  id: string;
  name: string;
  type: ProjectType;
  description?: string;
  status: ProjectStatus;
  thumbnail?: string;
  currentVersionId?: string;
  versions: ProjectVersion[];
  createdAt: number;
  updatedAt: number;
  tags?: string[];
}

// Image Project Data (Fabric.js canvas state)
export interface ImageProjectData {
  type: 'image';
  canvasState: string; // JSON serialized Fabric.js canvas
  width: number;
  height: number;
  backgroundColor: string;
  exportUrl?: string; // Data URL of exported image
}

// Audio Project Data (WaveSurfer state)
export interface AudioProjectData {
  type: 'audio';
  audioUrl: string; // Data URL or blob URL of audio
  duration: number;
  waveformData?: number[]; // Optional waveform peaks data
  regions?: AudioRegion[];
  volume: number;
  exportUrl?: string; // Data URL of exported audio
}

export interface AudioRegion {
  id: string;
  start: number;
  end: number;
  color?: string;
  label?: string;
}

// API/Service interfaces
export interface CreateProjectInput {
  name: string;
  type: ProjectType;
  description?: string;
  tags?: string[];
}

export interface CreateVersionInput {
  projectId: string;
  name: string;
  data: ImageProjectData | AudioProjectData;
  thumbnail?: string;
  notes?: string;
}

export interface UpdateProjectInput {
  name?: string;
  description?: string;
  status?: ProjectStatus;
  tags?: string[];
  thumbnail?: string;
}

// Grid view display
export interface ProjectGridItem {
  id: string;
  name: string;
  type: ProjectType;
  thumbnail?: string;
  versionCount: number;
  lastModified: number;
  status: ProjectStatus;
}

