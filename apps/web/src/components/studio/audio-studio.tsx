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
  ChevronLeft
} from 'lucide-react';
import { AIGeneratorPanel } from './ai-generator-panel';

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
  const [showAIPanel, setShowAIPanel] = useState(true);

  // Initialize WaveSurfer
  useEffect(() => {
    if (!waveformRef.current || wavesurferRef.current) return;

    const regionsPlugin = RegionsPlugin.create();
    regionsPluginRef.current = regionsPlugin;

    const wavesurfer = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: '#3b82f6',
      progressColor: '#1e40af',
      cursorColor: '#ef4444',
      barWidth: 2,
      barRadius: 3,
      cursorWidth: 2,
      height: 150,
      barGap: 3,
      plugins: [regionsPlugin],
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

    // Handle region selection
    regionsPlugin.on('region-clicked', (region, e) => {
      e.stopPropagation();
      setSelectedRegion(region);
      region.play();
    });

    return () => {
      wavesurfer.destroy();
    };
  }, []);

  // Upload audio file
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !wavesurferRef.current) return;

    try {
      const arrayBuffer = await file.arrayBuffer();
      const audioContext = new AudioContext();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      audioBufferRef.current = audioBuffer;

      const blob = new Blob([arrayBuffer], { type: file.type });
      const url = URL.createObjectURL(blob);
      
      wavesurferRef.current.load(url);
      
      // Clear any existing regions
      regionsPluginRef.current?.clearRegions();
      setSelectedRegion(null);
    } catch (error) {
      console.error('Error loading audio:', error);
      alert('Failed to load audio file');
    }
  };

  const uploadAudio = () => {
    fileInputRef.current?.click();
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

  // Handle AI-generated audio
  const handleAIGenerate = async (result: { url: string; prompt: string }) => {
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
    } catch (error) {
      console.error('Error loading AI audio:', error);
      alert('Failed to load AI-generated audio');
    }
  };

  return (
    <div className="flex h-full relative">
      {/* AI Generator Sidebar */}
      <div 
        className={`transition-all duration-300 border-r border-border bg-card ${
          showAIPanel ? 'w-96' : 'w-0'
        } overflow-hidden`}
      >
        <div className="w-96 h-full overflow-y-auto p-4">
          <AIGeneratorPanel type="audio" onGenerate={handleAIGenerate} />
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
            </>
          )}
        </div>
      </div>

        {/* Waveform */}
        <div className="flex-1 flex flex-col bg-muted/30 p-8">
        <div className="bg-card rounded-lg shadow-sm border border-border p-6">
          {!isLoaded && (
            <div className="flex items-center justify-center h-[150px] text-muted-foreground">
              <div className="text-center">
                <Mic size={48} className="mx-auto mb-2 opacity-50" />
                <p>Upload an audio file to get started</p>
              </div>
            </div>
          )}
          <div ref={waveformRef} />
          
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
            💡 <strong className="text-foreground">Tips:</strong> Add trim region to select audio section • Drag region edges to adjust • Click region to play • Apply trim to crop audio
          </p>
        </div>
      </div>
    </div>
  );
}

