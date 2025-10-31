'use client';

import { useState } from 'react';
import { Music2, Loader2, Sparkles, Play, Sliders } from 'lucide-react';

interface SunoFlowJockeyProps {
  onGenerate: (result: { url: string; prompt: string; metadata: any }) => void;
}

export function SunoFlowJockey({ onGenerate }: SunoFlowJockeyProps) {
  const [prompt, setPrompt] = useState('');
  const [genre, setGenre] = useState('electronic');
  const [mood, setMood] = useState('energetic');
  const [duration, setDuration] = useState(30);
  const [bpm, setBpm] = useState(120);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const genres = [
    { value: 'electronic', label: '🎹 Electronic', emoji: '⚡' },
    { value: 'hip-hop', label: '🎤 Hip Hop', emoji: '🔥' },
    { value: 'rock', label: '🎸 Rock', emoji: '🤘' },
    { value: 'jazz', label: '🎷 Jazz', emoji: '🎺' },
    { value: 'ambient', label: '🌊 Ambient', emoji: '✨' },
    { value: 'techno', label: '🔊 Techno', emoji: '💎' },
    { value: 'house', label: '🏠 House', emoji: '🎵' },
    { value: 'trap', label: '🎵 Trap', emoji: '💰' },
  ];

  const moods = [
    { value: 'energetic', label: '⚡ Energetic' },
    { value: 'chill', label: '😌 Chill' },
    { value: 'dark', label: '🌑 Dark' },
    { value: 'uplifting', label: '🌟 Uplifting' },
    { value: 'melancholic', label: '💙 Melancholic' },
    { value: 'aggressive', label: '🔥 Aggressive' },
    { value: 'dreamy', label: '☁️ Dreamy' },
    { value: 'funky', label: '🕺 Funky' },
  ];

  const durations = [
    { value: 15, label: '15s' },
    { value: 30, label: '30s' },
    { value: 60, label: '1m' },
    { value: 90, label: '1.5m' },
  ];

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please describe the vibe you want');
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      // Build enhanced prompt with music parameters
      const enhancedPrompt = `${genre} music, ${mood} mood, ${prompt}. BPM: ${bpm}, Duration: ${duration}s`;

      const response = await fetch('/api/generate/audio/suno', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: enhancedPrompt,
          genre,
          mood,
          duration,
          bpm,
          rawPrompt: prompt.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Music generation failed');
      }

      onGenerate({
        url: data.audioUrl,
        prompt: enhancedPrompt,
        metadata: {
          genre,
          mood,
          duration,
          bpm,
          rawPrompt: prompt,
        },
      });
      
      // Reset form
      setPrompt('');
    } catch (err: any) {
      console.error('Suno generation error:', err);
      setError(err.message || 'Failed to generate music. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const examplePrompts = [
    'Late night drive through the city',
    'Underground rave energy',
    'Smooth jazz club vibes',
    'Sunrise beach meditation',
    'Gym workout hype',
    'Lo-fi study session beats',
  ];

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-purple-900/20 to-background">
      {/* Header */}
      <div className="p-6 border-b border-border bg-gradient-to-r from-purple-600/10 to-pink-600/10">
        <div className="flex items-center gap-3 mb-2">
          <Music2 className="text-purple-500" size={28} />
          <h3 className="text-xl font-bold text-foreground">
            Flow Jockey
          </h3>
          <Sparkles className="text-pink-500 animate-pulse" size={20} />
        </div>
        <p className="text-sm text-muted-foreground">
          Generate AI-powered music tracks with Suno
        </p>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Vibe Description */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            🎵 Describe the vibe:
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="E.g., Late night drive through the city..."
            className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-foreground placeholder:text-muted-foreground"
            rows={3}
            disabled={isGenerating}
          />
        </div>

        {/* Genre Selection */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-3">
            🎹 Genre:
          </label>
          <div className="grid grid-cols-2 gap-2">
            {genres.map((g) => (
              <button
                key={g.value}
                onClick={() => setGenre(g.value)}
                disabled={isGenerating}
                className={`p-3 rounded-lg text-sm font-medium transition-all ${
                  genre === g.value
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/30'
                    : 'bg-card border border-border text-foreground hover:border-purple-500/50'
                }`}
              >
                <span className="mr-2">{g.emoji}</span>
                {g.value.charAt(0).toUpperCase() + g.value.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Mood Selection */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-3">
            😌 Mood:
          </label>
          <div className="grid grid-cols-2 gap-2">
            {moods.map((m) => (
              <button
                key={m.value}
                onClick={() => setMood(m.value)}
                disabled={isGenerating}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  mood === m.value
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Duration */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-3">
            ⏱️ Duration:
          </label>
          <div className="flex gap-2">
            {durations.map((d) => (
              <button
                key={d.value}
                onClick={() => setDuration(d.value)}
                disabled={isGenerating}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  duration === d.value
                    ? 'bg-pink-600 text-white shadow-md'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Advanced Settings Toggle */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 text-sm text-purple-500 hover:text-purple-400 transition-colors"
        >
          <Sliders size={16} />
          {showAdvanced ? 'Hide' : 'Show'} Advanced Settings
        </button>

        {/* Advanced Settings */}
        {showAdvanced && (
          <div className="p-4 bg-card border border-border rounded-lg space-y-4">
            {/* BPM Control */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                🎼 BPM: <span className="text-purple-500 font-bold">{bpm}</span>
              </label>
              <input
                type="range"
                min="60"
                max="180"
                step="5"
                value={bpm}
                onChange={(e) => setBpm(Number(e.target.value))}
                disabled={isGenerating}
                className="w-full accent-purple-600"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>60 (Slow)</span>
                <span>120 (Mid)</span>
                <span>180 (Fast)</span>
              </div>
            </div>
          </div>
        )}

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={isGenerating || !prompt.trim()}
          className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-bold text-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50"
        >
          {isGenerating ? (
            <>
              <Loader2 className="animate-spin" size={24} />
              Cooking your track...
            </>
          ) : (
            <>
              <Play size={24} />
              Generate Music
            </>
          )}
        </button>

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-sm text-red-500">⚠️ {error}</p>
          </div>
        )}

        {/* Example Prompts */}
        <div className="pt-4 border-t border-border">
          <p className="text-xs font-medium text-muted-foreground mb-3">
            💡 Try these vibes:
          </p>
          <div className="space-y-2">
            {examplePrompts.slice(0, 4).map((example, i) => (
              <button
                key={i}
                onClick={() => setPrompt(example)}
                disabled={isGenerating}
                className="block w-full text-left px-3 py-2 text-sm text-foreground bg-card hover:bg-accent rounded-md transition-colors disabled:opacity-50 border border-border hover:border-purple-500/50"
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

