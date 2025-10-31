'use client';

import { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions';
import * as Tone from 'tone';
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
  Package
} from 'lucide-react';
import { AIGeneratorPanel } from './ai-generator-panel';
import { SunoFlowJockey } from './suno-flow-jockey';
import { CDBurner } from './cd-burner';
import { ProjectList } from './project-list';
import { MintPackager, type PackagedNFTData } from './mint-packager';
import { AssetBrowser, type Asset } from './asset-browser';
import { useUser } from '@/providers/user-context';

export function AudioStudio() {
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const regionsPluginRef = useRef<RegionsPlugin | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [selectedRegion, setSelectedRegion] = useState<any>(null);
  const [showProjectList, setShowProjectList] = useState(true);
  const [showAIPanel, setShowAIPanel] = useState(true);
  const [showAssetBrowser, setShowAssetBrowser] = useState(true);
  const [showCDBurner, setShowCDBurner] = useState(false);
  const [showMintPackager, setShowMintPackager] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isDraggingAsset, setIsDraggingAsset] = useState(false);
  
  const { address, profile } = useUser();

  // Initialize WaveSurfer
  useEffect(() => {
    if (!waveformRef.current || wavesurferRef.current) return;

    // Ensure the container has dimensions
    const container = waveformRef.current;
    if (!container.offsetWidth || !container.offsetHeight) {
      console.warn('WaveSurfer container has no dimensions, waiting...');
      return;
    }

    try {
      const regionsPlugin = RegionsPlugin.create();
      regionsPluginRef.current = regionsPlugin;

      const wavesurfer = WaveSurfer.create({
        container: container,
        waveColor: '#3b82f6',
        progressColor: '#1e40af',
        cursorColor: '#ef4444',
        barWidth: 2,
        barRadius: 3,
        cursorWidth: 2,
        height: 150,
        barGap: 3,
        plugins: [regionsPlugin],
        normalize: true,
        hideScrollbar: true,
      });

      wavesurferRef.current = wavesurfer;

      // Event listeners
      wavesurfer.on('play', () => setIsPlaying(true));
      wavesurfer.on('pause', () => setIsPlaying(false));
      wavesurfer.on('ready', () => {
        setIsLoaded(true);
        setDuration(wavesurfer.getDuration());
      });
      wavesurfer.on('audioprocess', () => {
        setCurrentTime(wavesurfer.getCurrentTime());
      });
      wavesurfer.on('seeking', () => {
        setCurrentTime(wavesurfer.getCurrentTime());
      });
      wavesurfer.on('error', (error) => {
        console.error('WaveSurfer error details:', error);
        // Only show alert for meaningful errors
        if (error && Object.keys(error).length > 0) {
          alert('Error loading audio. Please try a different file.');
        }
      });

      // Handle region selection
      regionsPlugin.on('region-clicked', (region, e) => {
        e.stopPropagation();
        setSelectedRegion(region);
        region.play();
      });

      return () => {
        wavesurfer.destroy();
      };
    } catch (error) {
      console.error('Failed to initialize WaveSurfer:', error);
    }
  }, []);

  // Upload audio file
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processAudioFile(file);
  };

  const processAudioFile = async (file: File) => {
    if (!wavesurferRef.current) {
      console.error('WaveSurfer not initialized');
      alert('Audio player is not ready. Please refresh the page.');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('audio/')) {
      alert('Please upload an audio file (MP3, WAV, OGG, etc.)');
      return;
    }

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('File is too large. Please upload a file smaller than 50MB.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    let progressInterval: NodeJS.Timeout | null = null;

    try {
      // Simulate progress for file reading
      progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 100);

      // Read file as array buffer
      const arrayBuffer = await file.arrayBuffer();
      
      // Create audio context and decode
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer.slice(0));
      audioBufferRef.current = audioBuffer;

      // Create blob URL for WaveSurfer
      const blob = new Blob([arrayBuffer], { type: file.type });
      const url = URL.createObjectURL(blob);
      
      if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
      }
      setUploadProgress(95);
      
      // Load into WaveSurfer
      await wavesurferRef.current.load(url);
      
      // Clear any existing regions
      regionsPluginRef.current?.clearRegions();
      setSelectedRegion(null);

      setUploadProgress(100);
      
      // Close audio context to free resources
      await audioContext.close();

      // Create and save project with uploaded audio
      try {
        const { createProject, createVersion } = await import('@/lib/project-service');
        
        // Generate project name from file name
        const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
        const projectName = fileNameWithoutExt || `Audio Upload ${Date.now()}`;
        
        const project = await createProject({
          name: projectName,
          type: 'audio',
          description: `Uploaded audio file: ${file.name}`,
          tags: ['uploaded'],
        });
        
        // Create first version with audio data
        await createVersion({
          projectId: project.id,
          name: 'v1',
          data: {
            type: 'audio',
            audioUrl: url,
            duration: audioBuffer.duration,
            volume: 1,
          },
          notes: `Original file: ${file.name}\nFile size: ${(file.size / 1024 / 1024).toFixed(2)} MB\nDuration: ${audioBuffer.duration.toFixed(2)}s`,
        });
        
        console.log('✅ Uploaded audio project saved:', project.id);
      } catch (saveError) {
        console.error('Failed to save uploaded audio project:', saveError);
        // Don't show error to user - audio is still loaded and usable
      }

      // Reset upload state after a brief delay
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 500);
    } catch (error) {
      console.error('Error loading audio:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to load audio file: ${errorMessage}\n\nPlease try a different file or format.`);
      
      if (progressInterval) {
        clearInterval(progressInterval);
      }
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
    const audioFile = files.find((f) => f.type.startsWith('audio/'));

    if (audioFile) {
      processAudioFile(audioFile);
    } else {
      alert('Please drop an audio file');
    }
  };

  // Playback controls
  const togglePlayPause = () => {
    if (!wavesurferRef.current || !isLoaded) return;
    wavesurferRef.current.playPause();
  };

  const handleVolumeChange = (value: number) => {
    setVolume(value);
    if (wavesurferRef.current) {
      wavesurferRef.current.setVolume(value);
    }
  };

  const resetAudio = () => {
    if (!wavesurferRef.current) return;
    wavesurferRef.current.seekTo(0);
    setCurrentTime(0);
  };

  // Add trim region
  const addTrimRegion = () => {
    if (!regionsPluginRef.current || !duration) return;

    const start = duration * 0.2;
    const end = duration * 0.8;

    const region = regionsPluginRef.current.addRegion({
      start,
      end,
      color: 'rgba(59, 130, 246, 0.3)',
      drag: true,
      resize: true,
    });

    setSelectedRegion(region);
  };

  // Trim audio to selected region
  const trimToRegion = async () => {
    if (!selectedRegion || !audioBufferRef.current) {
      alert('Please select a region to trim');
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
      
      alert('Audio trimmed successfully!');
    } catch (error) {
      console.error('Error trimming audio:', error);
      alert('Failed to trim audio');
    }
  };

  // Export audio
  const exportAudio = async () => {
    if (!audioBufferRef.current) {
      alert('Please load an audio file first');
      return;
    }

    try {
      const wavBlob = await bufferToWave(audioBufferRef.current, audioBufferRef.current.length);
      
      const link = document.createElement('a');
      link.download = `ringtone-${Date.now()}.wav`;
      link.href = URL.createObjectURL(wavBlob);
      link.click();
    } catch (error) {
      console.error('Error exporting audio:', error);
      alert('Failed to export audio');
    }
  };

  // Utility: Convert AudioBuffer to WAV blob
  const bufferToWave = (audioBuffer: AudioBuffer, len: number): Promise<Blob> => {
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

      writeString(0, 'RIFF');
      view.setUint32(4, 36 + dataSize, true);
      writeString(8, 'WAVE');
      writeString(12, 'fmt ');
      view.setUint32(16, 16, true);
      view.setUint16(20, format, true);
      view.setUint16(22, numberOfChannels, true);
      view.setUint32(24, sampleRate, true);
      view.setUint32(28, sampleRate * blockAlign, true);
      view.setUint16(32, blockAlign, true);
      view.setUint16(34, bitDepth, true);
      writeString(36, 'data');
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
          view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
          offset += 2;
        }
      }

      resolve(new Blob([buffer], { type: 'audio/wav' }));
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle AI-generated audio (supports both standard and Suno format)
  const handleAIGenerate = async (result: { url: string; prompt: string; metadata?: any }) => {
    if (!wavesurferRef.current) {
      console.error('WaveSurfer not initialized');
      alert('Audio player is not ready. Please refresh the page.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Fetch and store audio buffer
      setUploadProgress(30);
      const response = await fetch(result.url);
      if (!response.ok) {
        throw new Error(`Failed to fetch audio: ${response.status} ${response.statusText}`);
      }
      
      setUploadProgress(60);
      const arrayBuffer = await response.arrayBuffer();
      
      // Create audio context and decode
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer.slice(0));
      audioBufferRef.current = audioBuffer;
      
      setUploadProgress(90);
      
      // Load AI-generated audio into WaveSurfer
      await wavesurferRef.current.load(result.url);
      
      // Clear any existing regions
      regionsPluginRef.current?.clearRegions();
      setSelectedRegion(null);

      setUploadProgress(100);
      
      // Log metadata if available (for Suno tracks)
      if (result.metadata) {
        console.log('🎵 Loaded track metadata:', result.metadata);
      }
      
      // Close audio context to free resources
      await audioContext.close();
      
      // Create and save project with generated audio
      try {
        const { createProject, createVersion } = await import('@/lib/project-service');
        
        // Generate project name from metadata
        const projectName = result.metadata?.rawPrompt 
          ? `${result.metadata.genre} - ${result.metadata.rawPrompt.slice(0, 30)}${result.metadata.rawPrompt.length > 30 ? '...' : ''}`
          : `Audio Project ${Date.now()}`;
        
        const project = await createProject({
          name: projectName,
          type: 'audio',
          description: result.prompt,
          tags: result.metadata ? [result.metadata.genre, result.metadata.mood] : [],
        });
        
        // Create first version with audio data
        await createVersion({
          projectId: project.id,
          name: 'v1',
          data: {
            type: 'audio',
            audioUrl: result.url,
            duration: audioBuffer.duration,
            volume: 1,
          },
          notes: result.metadata ? `Generated with: ${result.metadata.rawPrompt}\nBPM: ${result.metadata.bpm}\nDuration: ${result.metadata.duration}s` : undefined,
        });
        
        console.log('✅ Project saved:', project.id);
      } catch (saveError) {
        console.error('Failed to save project:', saveError);
        // Don't show error to user - audio is still loaded and usable
      }
      
      // Reset upload state after a brief delay
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 500);
    } catch (error) {
      console.error('Error loading AI audio:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to load AI-generated audio: ${errorMessage}`);
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Burn to CD handler
  const handleBurnToCD = () => {
    if (!isLoaded) {
      alert('Please load an audio file first');
      return;
    }
    setShowCDBurner(true);
  };

  // Package & Mint handler
  const handlePackageAndMint = () => {
    if (!isLoaded || !audioBufferRef.current) {
      alert('Please load an audio file first');
      return;
    }
    setShowMintPackager(true);
  };

  // Mint NFT handler
  const handleMintNFT = async (packagedData: PackagedNFTData) => {
    console.log('🚀 Minting NFT with data:', packagedData);
    
    if (!address) {
      alert('Please connect your wallet first');
      return;
    }

    try {
      // Upload cover image if it exists and is a data URL
      let coverImageUrl = packagedData.coverImage;
      if (coverImageUrl && coverImageUrl.startsWith('data:')) {
        // Convert data URL to blob
        const response = await fetch(coverImageUrl);
        const blob = await response.blob();
        const file = new File([blob], `${packagedData.name}-cover.png`, { type: 'image/png' });
        
        // Upload to storage
        const uploadResult = await uploadAsset(file, address, 'nft-covers');
        coverImageUrl = uploadResult.url;
      }

      // Import the minting client
      const { mintNFT, uploadAsset } = await import('@/lib/nft-mint-client');

      // Mint the NFT
      const result = await mintNFT(
        {
          name: packagedData.name,
          symbol: packagedData.symbol,
          description: packagedData.description,
          imageUrl: coverImageUrl || '/default-nft-cover.png',
          audioUrl: packagedData.audioUrl,
          walletAddress: address,
          nftType: packagedData.nftType,
          royaltyPercentage: packagedData.royaltyPercentage,
          bondingCurve: packagedData.bondingCurve,
          attributes: packagedData.attributes,
          tags: packagedData.tags,
        },
        (progress) => {
          console.log('Minting progress:', progress);
        }
      );

      alert(`🎉 NFT "${packagedData.name}" minted successfully!\n\nMint: ${result.mint}\n\nView on Solscan: ${result.explorerUrl}`);
      
      // Open explorer in new tab
      window.open(result.explorerUrl, '_blank');
    } catch (error) {
      console.error('Minting error:', error);
      throw error;
    }
  };

  return (
    <div className="flex h-full min-h-screen relative">
      {/* Project List Sidebar */}
      <div 
        className={`transition-all duration-300 border-r border-border bg-card ${
          showProjectList ? 'w-80' : 'w-0'
        } overflow-hidden`}
      >
        <div className="w-80 h-full">
          <ProjectList type="audio" />
        </div>
      </div>

      {/* Toggle Project List Button */}
      <button
        onClick={() => setShowProjectList(!showProjectList)}
        className="absolute left-0 top-1/2 -translate-y-1/2 bg-primary text-primary-foreground p-2 rounded-r-md shadow-lg hover:bg-primary/90 transition-all z-20"
        style={{ left: showProjectList ? '20rem' : '0' }}
      >
        {showProjectList ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
      </button>

      <div className="flex-1 flex h-full relative">
      {/* AI Generator Sidebar */}
      <div 
        className={`transition-all duration-300 border-r border-border bg-card ${
          showAIPanel ? 'w-96' : 'w-0'
        } overflow-hidden`}
      >
        <div className="w-96 h-full overflow-y-auto">
          <SunoFlowJockey onGenerate={handleAIGenerate} />
        </div>
      </div>

      {/* Toggle AI Panel Button */}
      <button
        onClick={() => setShowAIPanel(!showAIPanel)}
        className="absolute left-0 top-1/2 -translate-y-1/2 bg-primary text-primary-foreground p-2 rounded-r-md shadow-lg hover:bg-primary/90 transition-all z-10"
        style={{ left: showAIPanel ? '24rem' : '0' }}
      >
        {showAIPanel ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
      </button>

      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="bg-card border-b border-border p-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Upload */}
          <button
            onClick={uploadAudio}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            <Upload size={18} />
            Upload Audio
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
              {/* Divider */}
              <div className="h-8 w-px bg-border" />

              {/* Playback */}
              <button
                onClick={togglePlayPause}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                {isPlaying ? 'Pause' : 'Play'}
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
                  onChange={(e) => handleVolumeChange(Number(e.target.value))}
                  className="w-24 accent-primary"
                />
                <span className="text-sm text-muted-foreground w-12">
                  {Math.round(volume * 100)}%
                </span>
              </div>

              {/* Divider */}
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

              {/* Divider */}
              <div className="h-8 w-px bg-border" />

              {/* Export */}
              <button
                onClick={exportAudio}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                <Download size={18} />
                Export WAV
              </button>

              {/* Divider */}
              <div className="h-8 w-px bg-border" />

              {/* Burn to CD */}
              <button
                onClick={handleBurnToCD}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-md hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg shadow-purple-500/30"
              >
                <Disc3 size={18} className="animate-spin" style={{ animationDuration: '3s' }} />
                Burn to CD
              </button>

              {/* Divider */}
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
        </div>
      </div>

        {/* Waveform */}
        <div className="flex-1 flex flex-col bg-muted/30 p-8">
        <div 
          className={`bg-card rounded-lg shadow-sm border-2 border-dashed p-6 transition-all ${
            isDragging ? 'border-primary bg-primary/10' : 'border-border'
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
                  {isDragging ? 'Drop your audio file here' : 'Upload an audio file to get started'}
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
                  <span className="text-sm font-medium text-foreground">Uploading audio...</span>
                  <span className="text-sm text-muted-foreground">{uploadProgress}%</span>
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
          
          <div 
            ref={waveformRef} 
            className="min-h-[150px] w-full"
            style={{ visibility: isLoaded ? 'visible' : 'hidden' }}
          />
          
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
              <strong>Selected Region:</strong> {formatTime(selectedRegion.start)} - {formatTime(selectedRegion.end)} 
              ({formatTime(selectedRegion.end - selectedRegion.start)} duration)
            </p>
          </div>
        )}
        </div>

        {/* Instructions */}
        <div className="bg-muted/50 border-t border-border p-4">
          <p className="text-sm text-muted-foreground">
            💡 <strong className="text-foreground">Tips:</strong> Add trim region to select audio section • Drag region edges to adjust • Click region to play • Apply trim to crop audio • Drag assets from the sidebar
          </p>
        </div>
      </div>

      {/* Asset Browser Sidebar */}
      <div 
        className={`transition-all duration-300 border-l border-border bg-card ${
          showAssetBrowser ? 'w-80' : 'w-0'
        } overflow-hidden`}
      >
        <div className="w-80 h-full">
          <AssetBrowser 
            workspace="audio-studio" 
            filterType="audio"
            onAssetSelect={(asset) => {
              // Load audio asset when selected
              if (wavesurferRef.current && asset.type === 'audio') {
                wavesurferRef.current.load(asset.url);
              }
            }}
          />
        </div>
      </div>

      {/* Toggle Asset Browser Button */}
      <button
        onClick={() => setShowAssetBrowser(!showAssetBrowser)}
        className="absolute right-0 top-1/2 -translate-y-1/2 bg-primary text-primary-foreground p-2 rounded-l-md shadow-lg hover:bg-primary/90 transition-all z-10"
        style={{ right: showAssetBrowser ? '20rem' : '0' }}
      >
        {showAssetBrowser ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
      </button>
      </div>

      {/* CD Burner Modal */}
      {showCDBurner && (
        <CDBurner
          data={{
            soundName: `Ringtone ${Date.now()}`,
            artistName: profile?.displayName || (address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Anonymous'),
            walletAddress: address || 'No wallet connected',
          }}
          onClose={() => setShowCDBurner(false)}
        />
      )}

      {/* Mint Packager Modal */}
      {showMintPackager && audioBufferRef.current && (
        <MintPackager
          audioData={{
            audioUrl: wavesurferRef.current?.getMediaElement()?.src || '',
            duration: duration,
            audioBuffer: audioBufferRef.current,
          }}
          initialData={{
            soundName: `Ringtone ${Date.now()}`,
            artistName: profile?.displayName || (address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Anonymous'),
            walletAddress: address || 'No wallet connected',
          }}
          onClose={() => setShowMintPackager(false)}
          onMint={handleMintNFT}
        />
      )}
    </div>
  );
}

