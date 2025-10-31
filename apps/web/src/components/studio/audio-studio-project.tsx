"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import WaveSurfer from "wavesurfer.js";
import RegionsPlugin from "wavesurfer.js/dist/plugins/regions";
import type {
  Project,
  ProjectVersion,
  AudioProjectData,
  AudioRegion,
} from "@dial/types";
import {
  Play,
  Pause,
  Upload,
  Download,
  Scissors,
  Volume2,
  Mic,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
  Disc3,
  Package,
} from "lucide-react";
import { AIGeneratorPanel } from "./ai-generator-panel";
import { SunoFlowJockey } from "./suno-flow-jockey";
import { VersionManager } from "./version-manager";
import { ProjectHeader } from "./project-header";
import { ProjectList } from "./project-list";
import { CDBurner } from "./cd-burner";
import { MintPackager, type PackagedNFTData } from "./mint-packager";
import { AssetBrowser, type Asset } from "./asset-browser";
import { useUser } from "@/providers/user-context";
import {
  projectStorage,
  createProject,
  createVersion,
  getProject,
  updateProject as updateProjectApi,
  deleteVersion as deleteVersionApi,
  updateVersion as updateVersionApi,
} from "@/lib/project-service";

export function AudioStudioProject() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams?.get("projectId");
  const mode = searchParams?.get("mode");

  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const regionsPluginRef = useRef<RegionsPlugin | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);

  const [project, setProject] = useState<Project | null>(null);
  const [currentVersion, setCurrentVersion] = useState<ProjectVersion | null>(
    null
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [selectedRegion, setSelectedRegion] = useState<any>(null);
  const [showAIPanel, setShowAIPanel] = useState(true);
  const [showProjectList, setShowProjectList] = useState(true);
  const [showVersionPanel, setShowVersionPanel] = useState(true);
  const [showAssetBrowser, setShowAssetBrowser] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showCDBurner, setShowCDBurner] = useState(false);
  const [showMintPackager, setShowMintPackager] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { address, profile } = useUser();

  // Initialize or load project
  useEffect(() => {
    initializeProject();
  }, [projectId, mode]);

  // Auto-save when changes are detected
  useEffect(() => {
    if (!hasUnsavedChanges || !project) return;

    // Clear any existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Set up new auto-save timeout (3 seconds after last change)
    autoSaveTimeoutRef.current = setTimeout(async () => {
      setIsAutoSaving(true);
      try {
        await handleAutoSave();
      } catch (error) {
        console.error("Auto-save failed:", error);
      } finally {
        setIsAutoSaving(false);
      }
    }, 3000);

    // Cleanup on unmount
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [hasUnsavedChanges, project]);

  const initializeProject = async () => {
    try {
      if (projectId) {
        // Load existing project
        const existingProject = await getProject(projectId);
        if (existingProject) {
          setProject(existingProject);

          // Load current version
          const currentVersionId = existingProject.currentVersionId;
          if (currentVersionId) {
            const version = existingProject.versions.find(
              (v) => v.id === currentVersionId
            );
            if (version) {
              setCurrentVersion(version);
            }
          } else if (existingProject.versions.length > 0) {
            // Load latest version
            setCurrentVersion(
              existingProject.versions[existingProject.versions.length - 1]
            );
          }
        }
      } else if (mode === "project") {
        // Create new project
        const newProject = await createProject({
          name: `Untitled Audio Project`,
          type: "audio",
          description: "Created in Audio Studio",
        });
        setProject(newProject);
        // Update URL with new project ID
        router.replace(`/dashboard/create/audio?projectId=${newProject.id}`);
      }
    } catch (error) {
      console.error("Failed to initialize project:", error);
    }
  };

  const handleSelectProject = async (selectedProjectId: string) => {
    // Don't reload if already on this project
    if (project && project.id === selectedProjectId) {
      return;
    }

    // Check for unsaved changes
    if (hasUnsavedChanges) {
      if (
        !confirm(
          "You have unsaved changes. Switching projects will discard them. Continue?"
        )
      ) {
        return;
      }
    }

    try {
      // Load the selected project
      const selectedProject = await getProject(selectedProjectId);
      if (selectedProject) {
        setProject(selectedProject);

        // Load current version
        const currentVersionId = selectedProject.currentVersionId;
        if (currentVersionId) {
          const version = selectedProject.versions.find(
            (v) => v.id === currentVersionId
          );
          if (version) {
            setCurrentVersion(version);
          }
        } else if (selectedProject.versions.length > 0) {
          // Load latest version
          setCurrentVersion(
            selectedProject.versions[selectedProject.versions.length - 1]
          );
        } else {
          // No versions yet
          setCurrentVersion(null);
        }

        // Update URL without full page reload
        router.replace(
          `/dashboard/create/audio?projectId=${selectedProjectId}`
        );

        // Reset unsaved changes flag
        setHasUnsavedChanges(false);
      }
    } catch (error) {
      console.error("Failed to load project:", error);
      alert("Failed to load project");
    }
  };

  // Initialize WaveSurfer
  useEffect(() => {
    if (!waveformRef.current || wavesurferRef.current) return;

    try {
      const regionsPlugin = RegionsPlugin.create();
      regionsPluginRef.current = regionsPlugin;

      const wavesurfer = WaveSurfer.create({
        container: waveformRef.current,
        waveColor: "#3b82f6",
        progressColor: "#1e40af",
        cursorColor: "#ef4444",
        barWidth: 2,
        barRadius: 3,
        cursorWidth: 2,
        height: 150,
        barGap: 3,
        plugins: [regionsPlugin],
      });

      wavesurferRef.current = wavesurfer;

      // Event listeners
      wavesurfer.on("play", () => setIsPlaying(true));
      wavesurfer.on("pause", () => setIsPlaying(false));
      wavesurfer.on("ready", () => {
        setIsLoaded(true);
        setDuration(wavesurfer.getDuration());
      });
      wavesurfer.on("audioprocess", () => {
        setCurrentTime(wavesurfer.getCurrentTime());
      });
      wavesurfer.on("seeking", () => {
        setCurrentTime(wavesurfer.getCurrentTime());
      });
      wavesurfer.on("error", (error) => {
        console.error("WaveSurfer error:", error);
      });

      // Handle region selection
      regionsPlugin.on("region-clicked", (region, e) => {
        e.stopPropagation();
        setSelectedRegion(region);
        region.play();
      });

      // Load version if available
      if (currentVersion) {
        loadVersionToWaveSurfer(currentVersion);
      }

      return () => {
        wavesurfer.destroy();
      };
    } catch (error) {
      console.error("Failed to initialize WaveSurfer:", error);
    }
  }, []);

  // Load version data when currentVersion changes
  useEffect(() => {
    if (currentVersion && wavesurferRef.current) {
      loadVersionToWaveSurfer(currentVersion);
    }
  }, [currentVersion?.id]);

  const loadVersionToWaveSurfer = async (version: ProjectVersion) => {
    if (!wavesurferRef.current || version.data.type !== "audio") return;

    try {
      const audioData = version.data as AudioProjectData;

      // Load audio
      wavesurferRef.current.load(audioData.audioUrl);

      // Restore volume
      setVolume(audioData.volume);
      wavesurferRef.current.setVolume(audioData.volume);

      // Clear and restore regions
      regionsPluginRef.current?.clearRegions();
      if (audioData.regions) {
        // Wait for audio to be loaded before adding regions
        wavesurferRef.current.once("ready", () => {
          audioData.regions?.forEach((region) => {
            regionsPluginRef.current?.addRegion({
              start: region.start,
              end: region.end,
              color: region.color || "rgba(59, 130, 246, 0.3)",
              drag: true,
              resize: true,
            });
          });
        });
      }

      // Fetch and store audio buffer
      const response = await fetch(audioData.audioUrl);
      const arrayBuffer = await response.arrayBuffer();
      const audioContext = new AudioContext();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      audioBufferRef.current = audioBuffer;

      setHasUnsavedChanges(false);
    } catch (error) {
      console.error("Failed to load version:", error);
      alert("Failed to load version");
    }
  };

  const handleSaveVersion = async (name: string, notes?: string) => {
    if (!project || !wavesurferRef.current || !audioBufferRef.current) {
      alert("Please load an audio file before saving");
      return;
    }

    setIsSaving(true);
    try {
      // Convert audio buffer to WAV blob
      const wavBlob = await bufferToWave(
        audioBufferRef.current,
        audioBufferRef.current.length
      );

      // Convert to data URL
      const audioUrl = await blobToDataURL(wavBlob);

      // Get regions
      const regions = regionsPluginRef.current?.getRegions() || [];
      const regionData: AudioRegion[] = regions.map((region) => ({
        id: region.id,
        start: region.start,
        end: region.end,
        color: region.color,
      }));

      // Generate thumbnail (waveform snapshot)
      const canvas = document.createElement("canvas");
      canvas.width = 400;
      canvas.height = 150;
      const thumbnail = canvas.toDataURL("image/png");

      const audioData: AudioProjectData = {
        type: "audio",
        audioUrl,
        duration: wavesurferRef.current.getDuration(),
        regions: regionData,
        volume,
        exportUrl: audioUrl,
      };

      const version = await createVersion({
        projectId: project.id,
        name,
        data: audioData,
        thumbnail,
        notes,
      });

      // Reload project to get updated state
      const updatedProject = await getProject(project.id);
      if (updatedProject) {
        setProject(updatedProject);
        setCurrentVersion(version);
        setHasUnsavedChanges(false);
      }
    } catch (error) {
      console.error("Failed to save version:", error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const handleAutoSave = async () => {
    if (!project || !wavesurferRef.current || !audioBufferRef.current) return;

    try {
      // Convert audio buffer to WAV blob
      const wavBlob = await bufferToWave(
        audioBufferRef.current,
        audioBufferRef.current.length
      );

      // Convert to data URL
      const audioUrl = await blobToDataURL(wavBlob);

      // Get regions
      const regions = regionsPluginRef.current?.getRegions() || [];
      const regionData: AudioRegion[] = regions.map((region) => ({
        id: region.id,
        start: region.start,
        end: region.end,
        color: region.color,
      }));

      // Generate thumbnail (waveform snapshot)
      const canvas = document.createElement("canvas");
      canvas.width = 400;
      canvas.height = 150;
      const thumbnail = canvas.toDataURL("image/png");

      const audioData: AudioProjectData = {
        type: "audio",
        audioUrl,
        duration: wavesurferRef.current.getDuration(),
        regions: regionData,
        volume,
        exportUrl: audioUrl,
      };

      if (currentVersion) {
        // Update existing version
        await updateVersionApi(project.id, currentVersion.id, {
          data: audioData,
          thumbnail,
        });
      } else {
        // Create initial auto-save version
        const version = await createVersion({
          projectId: project.id,
          name: "Auto-save",
          data: audioData,
          thumbnail,
        });

        setCurrentVersion(version);
      }

      // Update project's updatedAt timestamp
      await updateProjectApi(project.id, {});

      // Reload project to get updated state
      const updatedProject = await getProject(project.id);
      if (updatedProject) {
        setProject(updatedProject);
        if (currentVersion) {
          const updatedCurrentVersion = updatedProject.versions.find(
            (v) => v.id === currentVersion.id
          );
          if (updatedCurrentVersion) {
            setCurrentVersion(updatedCurrentVersion);
          }
        } else if (updatedProject.versions.length > 0) {
          // Set the newly created version as current
          setCurrentVersion(
            updatedProject.versions[updatedProject.versions.length - 1]
          );
        }
        setHasUnsavedChanges(false);
      }
    } catch (error) {
      console.error("Auto-save failed:", error);
      // Don't throw - auto-save failures should be silent
    }
  };

  const handleLoadVersion = async (versionId: string) => {
    if (!project) return;

    const version = project.versions.find((v) => v.id === versionId);
    if (version) {
      if (hasUnsavedChanges) {
        if (
          !confirm(
            "You have unsaved changes. Loading another version will discard them. Continue?"
          )
        ) {
          return;
        }
      }

      setCurrentVersion(version);
      await projectStorage.setCurrentVersion(project.id, versionId);

      // Reload project
      const updatedProject = await getProject(project.id);
      if (updatedProject) {
        setProject(updatedProject);
      }
    }
  };

  const handleDeleteVersion = async (versionId: string) => {
    if (!project) return;

    try {
      await deleteVersionApi(project.id, versionId);

      // Reload project
      const updatedProject = await getProject(project.id);
      if (updatedProject) {
        setProject(updatedProject);

        // Update current version if needed
        if (currentVersion?.id === versionId) {
          const latestVersion =
            updatedProject.versions[updatedProject.versions.length - 1];
          setCurrentVersion(latestVersion || null);
        }
      }
    } catch (error) {
      console.error("Failed to delete version:", error);
      throw error;
    }
  };

  const handleRenameVersion = async (versionId: string, newName: string) => {
    if (!project) return;

    try {
      await updateVersionApi(project.id, versionId, { name: newName });

      // Reload project
      const updatedProject = await getProject(project.id);
      if (updatedProject) {
        setProject(updatedProject);

        // Update current version if it's the one being renamed
        if (currentVersion?.id === versionId) {
          const updatedVersion = updatedProject.versions.find(
            (v) => v.id === versionId
          );
          if (updatedVersion) {
            setCurrentVersion(updatedVersion);
          }
        }
      }
    } catch (error) {
      console.error("Failed to rename version:", error);
      throw error;
    }
  };

  const handleUpdateProject = async (updates: {
    name?: string;
    description?: string;
  }) => {
    if (!project) return;

    try {
      await updateProjectApi(project.id, updates);

      // Reload project
      const updatedProject = await getProject(project.id);
      if (updatedProject) {
        setProject(updatedProject);
      }
    } catch (error) {
      console.error("Failed to update project:", error);
      throw error;
    }
  };

  // Audio operations
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processAudioFile(file);
  };

  const processAudioFile = async (file: File) => {
    if (!wavesurferRef.current || !project || !address) return;

    // Validate file type
    if (!file.type.startsWith("audio/")) {
      alert("Please upload an audio file");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Step 1: Upload file to bucket (20% progress)
      setUploadProgress(10);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("address", address);
      formData.append("workspace", `project-${project.id}`);

      const uploadResponse = await fetch("/api/assets/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload audio file");
      }

      const uploadData = await uploadResponse.json();
      const uploadedUrl = uploadData.url;

      setUploadProgress(40);

      // Step 2: Load and decode audio (40% - 70% progress)
      const response = await fetch(uploadedUrl);
      const arrayBuffer = await response.arrayBuffer();

      setUploadProgress(60);

      const audioContext = new AudioContext();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      audioBufferRef.current = audioBuffer;

      setUploadProgress(80);

      // Step 3: Load into WaveSurfer
      wavesurferRef.current.load(uploadedUrl);

      // Clear any existing regions
      regionsPluginRef.current?.clearRegions();
      setSelectedRegion(null);

      setUploadProgress(100);

      // Mark as having unsaved changes to trigger auto-save
      setHasUnsavedChanges(true);

      // Reset upload state after a brief delay
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 500);
    } catch (error) {
      console.error("Error uploading audio:", error);
      alert("Failed to upload audio file. Please try again.");
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const uploadAudio = () => {
    fileInputRef.current?.click();
  };

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const audioFile = files.find((f) => f.type.startsWith("audio/"));

    if (audioFile) {
      processAudioFile(audioFile);
    } else {
      alert("Please drop an audio file");
    }
  };

  const togglePlayPause = () => {
    if (!wavesurferRef.current || !isLoaded) return;
    wavesurferRef.current.playPause();
  };

  const handleVolumeChange = (value: number) => {
    setVolume(value);
    if (wavesurferRef.current) {
      wavesurferRef.current.setVolume(value);
    }
    setHasUnsavedChanges(true);
  };

  const resetAudio = () => {
    if (!wavesurferRef.current) return;
    wavesurferRef.current.seekTo(0);
    setCurrentTime(0);
  };

  const addTrimRegion = () => {
    if (!regionsPluginRef.current || !duration) return;

    const start = duration * 0.2;
    const end = duration * 0.8;

    const region = regionsPluginRef.current.addRegion({
      start,
      end,
      color: "rgba(59, 130, 246, 0.3)",
      drag: true,
      resize: true,
    });

    setSelectedRegion(region);
    setHasUnsavedChanges(true);
  };

  const trimToRegion = async () => {
    if (!selectedRegion || !audioBufferRef.current) {
      alert("Please select a region to trim");
      return;
    }

    try {
      const audioContext = new AudioContext();
      const { start, end } = selectedRegion;
      const sampleRate = audioBufferRef.current.sampleRate;
      const numberOfChannels = audioBufferRef.current.numberOfChannels;

      const startSample = Math.floor(start * sampleRate);
      const endSample = Math.floor(end * sampleRate);
      const length = endSample - startSample;

      const trimmedBuffer = audioContext.createBuffer(
        numberOfChannels,
        length,
        sampleRate
      );

      for (let channel = 0; channel < numberOfChannels; channel++) {
        const originalData = audioBufferRef.current.getChannelData(channel);
        const trimmedData = trimmedBuffer.getChannelData(channel);

        for (let i = 0; i < length; i++) {
          trimmedData[i] = originalData[startSample + i];
        }
      }

      // Convert to WAV blob
      const wavBlob = await bufferToWave(trimmedBuffer, length);
      const url = URL.createObjectURL(wavBlob);

      // Load trimmed audio
      audioBufferRef.current = trimmedBuffer;
      wavesurferRef.current?.load(url);

      // Clear regions
      regionsPluginRef.current?.clearRegions();
      setSelectedRegion(null);

      setHasUnsavedChanges(true);
      alert("Audio trimmed successfully!");
    } catch (error) {
      console.error("Error trimming audio:", error);
      alert("Failed to trim audio");
    }
  };

  const exportAudio = async () => {
    if (!audioBufferRef.current) {
      alert("Please load an audio file first");
      return;
    }

    try {
      const wavBlob = await bufferToWave(
        audioBufferRef.current,
        audioBufferRef.current.length
      );

      const link = document.createElement("a");
      link.download = `${project?.name || "audio"}-${Date.now()}.wav`;
      link.href = URL.createObjectURL(wavBlob);
      link.click();
    } catch (error) {
      console.error("Error exporting audio:", error);
      alert("Failed to export audio");
    }
  };

  const bufferToWave = (
    audioBuffer: AudioBuffer,
    len: number
  ): Promise<Blob> => {
    return new Promise((resolve) => {
      const numberOfChannels = audioBuffer.numberOfChannels;
      const sampleRate = audioBuffer.sampleRate;
      const format = 1; // PCM
      const bitDepth = 16;

      const bytesPerSample = bitDepth / 8;
      const blockAlign = numberOfChannels * bytesPerSample;

      const dataSize = len * blockAlign;
      const buffer = new ArrayBuffer(44 + dataSize);
      const view = new DataView(buffer);

      // WAV header
      const writeString = (offset: number, string: string) => {
        for (let i = 0; i < string.length; i++) {
          view.setUint8(offset + i, string.charCodeAt(i));
        }
      };

      writeString(0, "RIFF");
      view.setUint32(4, 36 + dataSize, true);
      writeString(8, "WAVE");
      writeString(12, "fmt ");
      view.setUint32(16, 16, true);
      view.setUint16(20, format, true);
      view.setUint16(22, numberOfChannels, true);
      view.setUint32(24, sampleRate, true);
      view.setUint32(28, sampleRate * blockAlign, true);
      view.setUint16(32, blockAlign, true);
      view.setUint16(34, bitDepth, true);
      writeString(36, "data");
      view.setUint32(40, dataSize, true);

      // Write audio data
      const channels = [];
      for (let i = 0; i < numberOfChannels; i++) {
        channels.push(audioBuffer.getChannelData(i));
      }

      let offset = 44;
      for (let i = 0; i < len; i++) {
        for (let channel = 0; channel < numberOfChannels; channel++) {
          const sample = Math.max(-1, Math.min(1, channels[channel][i]));
          view.setInt16(
            offset,
            sample < 0 ? sample * 0x8000 : sample * 0x7fff,
            true
          );
          offset += 2;
        }
      }

      resolve(new Blob([buffer], { type: "audio/wav" }));
    });
  };

  const blobToDataURL = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleAIGenerate = async (result: {
    url: string;
    prompt: string;
    metadata?: any;
  }) => {
    if (!wavesurferRef.current) return;

    try {
      // Load AI-generated audio
      wavesurferRef.current.load(result.url);

      // Clear any existing regions
      regionsPluginRef.current?.clearRegions();
      setSelectedRegion(null);

      // Fetch and store audio buffer
      const response = await fetch(result.url);
      const arrayBuffer = await response.arrayBuffer();
      const audioContext = new AudioContext();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      audioBufferRef.current = audioBuffer;
      setHasUnsavedChanges(true);

      // Log metadata if available (for Suno tracks)
      if (result.metadata) {
        console.log("🎵 Loaded track metadata:", result.metadata);
      }
    } catch (error) {
      console.error("Error loading AI audio:", error);
      alert("Failed to load AI-generated audio");
    }
  };

  // Burn to CD handler
  const handleBurnToCD = () => {
    if (!isLoaded) {
      alert("Please load an audio file first");
      return;
    }
    setShowCDBurner(true);
  };

  // Package & Mint handler
  const handlePackageAndMint = () => {
    if (!isLoaded || !audioBufferRef.current) {
      alert("Please load an audio file first");
      return;
    }
    setShowMintPackager(true);
  };

  // Mint NFT handler
  const handleMintNFT = async (packagedData: PackagedNFTData) => {
    console.log("🚀 Minting NFT with data:", packagedData);

    if (!address) {
      alert("Please connect your wallet first");
      return;
    }

    try {
      // Upload cover image if it exists and is a data URL
      let coverImageUrl = packagedData.coverImage;
      if (coverImageUrl && coverImageUrl.startsWith("data:")) {
        // Convert data URL to blob
        const response = await fetch(coverImageUrl);
        const blob = await response.blob();
        const file = new File([blob], `${packagedData.name}-cover.png`, {
          type: "image/png",
        });

        // Upload to storage
        const uploadResult = await uploadAsset(file, address, "nft-covers");
        coverImageUrl = uploadResult.url;
      }

      // Import the minting client
      const { mintNFT, uploadAsset } = await import("@/lib/nft-mint-client");

      // Mint the NFT
      const result = await mintNFT(
        {
          name: packagedData.name,
          symbol: packagedData.symbol,
          description: packagedData.description,
          imageUrl: coverImageUrl || "/default-nft-cover.png",
          audioUrl: packagedData.audioUrl,
          walletAddress: address,
          nftType: packagedData.nftType,
          royaltyPercentage: packagedData.royaltyPercentage,
          bondingCurve: packagedData.bondingCurve,
          attributes: packagedData.attributes,
          tags: packagedData.tags,
        },
        (progress) => {
          console.log("Minting progress:", progress);
        }
      );

      alert(
        `🎉 NFT "${packagedData.name}" minted successfully!\n\nMint: ${result.mint}\n\nView on Solscan: ${result.explorerUrl}`
      );

      // Open explorer in new tab
      window.open(result.explorerUrl, "_blank");
    } catch (error) {
      console.error("Minting error:", error);
      throw error;
    }
  };

  if (!project) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-6"></div>
          <p className="text-foreground font-medium text-lg">
            Loading project...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Project Header */}
      <ProjectHeader project={project} onUpdateProject={handleUpdateProject} />

      <div className="flex flex-1 overflow-hidden">
        {/* Column 1: Flow Jockey */}
        <div
          className={`transition-all duration-300 border-r border-border bg-card ${
            showAIPanel ? "w-80" : "w-0"
          } overflow-hidden`}
        >
          <div className="w-80 h-full overflow-y-auto">
            <SunoFlowJockey onGenerate={handleAIGenerate} />
          </div>
        </div>

        {/* Column 2: Projects List */}
        <div
          className={`transition-all duration-300 border-r border-border bg-card ${
            showProjectList ? "w-80" : "w-0"
          } overflow-hidden`}
        >
          <div className="w-80 h-full overflow-y-auto">
            <ProjectList
              type="audio"
              onSelectProject={handleSelectProject}
              currentProjectId={project?.id}
            />
          </div>
        </div>

        {/* Column 3: Versions */}
        <div
          className={`transition-all duration-300 border-r border-border bg-card ${
            showVersionPanel ? "w-80" : "w-0"
          } overflow-hidden`}
        >
          <div className="w-80 h-full flex flex-col p-4">
            {project ? (
              <VersionManager
                project={project}
                currentVersion={currentVersion}
                onSaveVersion={handleSaveVersion}
                onLoadVersion={handleLoadVersion}
                onDeleteVersion={handleDeleteVersion}
                onRenameVersion={handleRenameVersion}
                isSaving={isSaving}
                alwaysExpanded={true}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center p-8 text-center">
                <div className="text-muted-foreground">
                  <p className="text-sm">No project selected</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Column 4: Main Editor Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Toolbar */}
          <div className="bg-card border-b border-border p-4 overflow-x-auto">
            <div className="flex flex-wrap items-center gap-4 min-w-max">
              {/* Panel Toggles */}
              <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-md">
                <button
                  onClick={() => setShowAIPanel(!showAIPanel)}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    showAIPanel
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-background"
                  }`}
                  title="Toggle Flow Jockey"
                >
                  🎵
                </button>
                <button
                  onClick={() => setShowProjectList(!showProjectList)}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    showProjectList
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-background"
                  }`}
                  title="Toggle Projects & Versions"
                >
                  📁
                </button>
              </div>

              <div className="h-8 w-px bg-border" />

              {/* Upload */}
              <button
                onClick={uploadAudio}
                disabled={isUploading || !address || !project}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title={
                  !address
                    ? "Connect wallet to upload"
                    : !project
                    ? "Create a project first"
                    : "Upload audio file"
                }
              >
                {isUploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground border-t-transparent" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload size={18} />
                    Upload Audio
                  </>
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                onChange={handleFileUpload}
                className="hidden"
              />

              {isLoaded && (
                <>
                  <div className="h-8 w-px bg-border" />

                  {/* Playback */}
                  <button
                    onClick={togglePlayPause}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                  >
                    {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                    {isPlaying ? "Pause" : "Play"}
                  </button>

                  <button
                    onClick={resetAudio}
                    className="p-2 rounded hover:bg-accent transition-colors text-foreground"
                    title="Reset"
                  >
                    <RotateCcw size={18} />
                  </button>

                  {/* Volume */}
                  <div className="flex items-center gap-2">
                    <Volume2 size={18} className="text-foreground" />
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={volume}
                      onChange={(e) =>
                        handleVolumeChange(Number(e.target.value))
                      }
                      className="w-24 accent-primary"
                    />
                    <span className="text-sm text-muted-foreground w-12">
                      {Math.round(volume * 100)}%
                    </span>
                  </div>

                  <div className="h-8 w-px bg-border" />

                  {/* Editing */}
                  <button
                    onClick={addTrimRegion}
                    className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors"
                  >
                    <Scissors size={18} />
                    Add Trim Region
                  </button>

                  {selectedRegion && (
                    <button
                      onClick={trimToRegion}
                      className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors"
                    >
                      <Scissors size={18} />
                      Apply Trim
                    </button>
                  )}

                  <div className="h-8 w-px bg-border" />

                  {/* Export */}
                  <button
                    onClick={exportAudio}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                  >
                    <Download size={18} />
                    Export WAV
                  </button>

                  <div className="h-8 w-px bg-border" />

                  {/* Burn to CD */}
                  <button
                    onClick={handleBurnToCD}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-md hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg shadow-purple-500/30"
                  >
                    <Disc3
                      size={18}
                      className="animate-spin"
                      style={{ animationDuration: "3s" }}
                    />
                    Burn to CD
                  </button>

                  <div className="h-8 w-px bg-border" />

                  {/* Package & Mint */}
                  <button
                    onClick={handlePackageAndMint}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-md hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg shadow-green-500/30 font-semibold"
                  >
                    <Package size={18} />
                    Package & Mint
                  </button>
                </>
              )}

              {isAutoSaving && (
                <span className="text-sm text-blue-500 font-medium flex items-center gap-2">
                  <span className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500"></span>
                  Auto-saving...
                </span>
              )}
              {hasUnsavedChanges && !isAutoSaving && (
                <span className="text-sm text-amber-500 font-medium">
                  • Unsaved changes
                </span>
              )}
            </div>
          </div>

          {/* Waveform */}
          <div className="flex-1 flex flex-col bg-muted/30 p-8 overflow-auto">
            <div
              className={`bg-card rounded-lg shadow-sm border-2 border-dashed p-6 transition-all ${
                isDragging ? "border-primary bg-primary/10" : "border-border"
              }`}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              {!isLoaded && !isUploading && (
                <div
                  className="flex items-center justify-center h-[150px] text-muted-foreground cursor-pointer"
                  onClick={uploadAudio}
                >
                  <div className="text-center">
                    <Upload size={48} className="mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">
                      {isDragging
                        ? "Drop your audio file here"
                        : "Upload an audio file to get started"}
                    </p>
                    <p className="text-sm opacity-75">
                      Click to browse or drag and drop
                    </p>
                    <p className="text-xs opacity-50 mt-2">
                      Supports MP3, WAV, OGG, and more
                    </p>
                  </div>
                </div>
              )}

              {isUploading && (
                <div className="flex flex-col items-center justify-center h-[150px]">
                  <div className="w-full max-w-md">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-foreground">
                        Uploading audio...
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {uploadProgress}%
                      </span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-primary h-full transition-all duration-300 ease-out"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div ref={waveformRef} className="min-h-[150px] w-full" />

              {isLoaded && (
                <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              )}
            </div>

            {selectedRegion && (
              <div className="mt-4 p-4 bg-primary/10 border border-primary/20 rounded-md">
                <p className="text-sm text-foreground">
                  <strong>Selected Region:</strong>{" "}
                  {formatTime(selectedRegion.start)} -{" "}
                  {formatTime(selectedRegion.end)}(
                  {formatTime(selectedRegion.end - selectedRegion.start)}{" "}
                  duration)
                </p>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="bg-muted/50 border-t border-border p-4">
            <p className="text-sm text-muted-foreground">
              💡 <strong className="text-foreground">Tips:</strong> Add trim
              region to select audio section • Drag region edges to adjust •
              Click region to play • Apply trim to crop audio • Save versions to
              track your progress
            </p>
          </div>
        </div>

        {/* Asset Browser Sidebar */}
        <div
          className={`transition-all duration-300 border-l border-border bg-card ${
            showAssetBrowser ? "w-80" : "w-0"
          } overflow-hidden`}
        >
          <div className="w-80 h-full">
            <AssetBrowser
              workspace="audio-studio"
              filterType="audio"
              onAssetSelect={(asset) => {
                // Load audio asset when selected
                if (wavesurferRef.current && asset.type === "audio") {
                  const loadAudioFromAsset = async () => {
                    try {
                      setIsUploading(true);
                      setUploadProgress(30);

                      // Fetch and decode audio
                      const response = await fetch(asset.url);
                      const arrayBuffer = await response.arrayBuffer();
                      setUploadProgress(60);

                      const audioContext = new AudioContext();
                      const audioBuffer = await audioContext.decodeAudioData(
                        arrayBuffer
                      );
                      audioBufferRef.current = audioBuffer;
                      setUploadProgress(90);

                      // Load into WaveSurfer
                      wavesurferRef.current?.load(asset.url);

                      // Clear regions
                      regionsPluginRef.current?.clearRegions();
                      setSelectedRegion(null);
                      setHasUnsavedChanges(true);

                      setUploadProgress(100);
                      setTimeout(() => {
                        setIsUploading(false);
                        setUploadProgress(0);
                      }, 500);
                    } catch (error) {
                      console.error("Error loading asset:", error);
                      alert("Failed to load audio asset");
                      setIsUploading(false);
                      setUploadProgress(0);
                    }
                  };
                  loadAudioFromAsset();
                }
              }}
            />
          </div>
        </div>

        {/* Toggle Asset Browser Button */}
        <button
          onClick={() => setShowAssetBrowser(!showAssetBrowser)}
          className="absolute right-0 top-1/2 -translate-y-1/2 bg-primary text-primary-foreground p-2 rounded-l-md shadow-lg hover:bg-primary/90 transition-all z-20"
          style={{ right: showAssetBrowser ? "20rem" : "0" }}
        >
          {showAssetBrowser ? (
            <ChevronRight size={20} />
          ) : (
            <ChevronLeft size={20} />
          )}
        </button>
      </div>

      {/* CD Burner Modal */}
      {showCDBurner && (
        <CDBurner
          data={{
            soundName: project?.name || `Audio ${Date.now()}`,
            artistName:
              profile?.displayName ||
              (address
                ? `${address.slice(0, 6)}...${address.slice(-4)}`
                : "Anonymous"),
            walletAddress: address || "No wallet connected",
          }}
          onClose={() => setShowCDBurner(false)}
        />
      )}

      {/* Mint Packager Modal */}
      {showMintPackager && audioBufferRef.current && (
        <MintPackager
          audioData={{
            audioUrl: wavesurferRef.current?.getMediaElement()?.src || "",
            duration: duration,
            audioBuffer: audioBufferRef.current,
          }}
          initialData={{
            soundName: project?.name || `Audio ${Date.now()}`,
            artistName:
              profile?.displayName ||
              (address
                ? `${address.slice(0, 6)}...${address.slice(-4)}`
                : "Anonymous"),
            walletAddress: address || "No wallet connected",
          }}
          onClose={() => setShowMintPackager(false)}
          onMint={handleMintNFT}
        />
      )}
    </div>
  );
}
