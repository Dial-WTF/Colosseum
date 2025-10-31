'use client';

import { useState } from 'react';
import { Wand2, Loader2 } from 'lucide-react';

interface AIGeneratorPanelProps {
  type: 'image' | 'audio';
  onGenerate: (result: { url: string; prompt: string }) => void;
}

export function AIGeneratorPanel({ type, onGenerate }: AIGeneratorPanelProps) {
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState(type === 'image' ? 'meme' : 'ringtone');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  const imageStyles = [
    { value: 'meme', label: '😂 Meme' },
    { value: 'sticker', label: '🎨 Sticker' },
    { value: 'pepe', label: '🐸 Pepe' },
    { value: 'wojak', label: '😐 Wojak' },
    { value: 'anime', label: '✨ Anime' },
  ];

  const audioTypes = [
    { value: 'ringtone', label: '📱 Ringtone (10s)' },
    { value: 'sound-effect', label: '🔊 Sound Effect (5s)' },
  ];

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      const endpoint = type === 'image' ? '/api/generate/image' : '/api/generate/audio';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          ...(type === 'image' ? { style } : { type: style }),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Generation failed');
      }

      const url = type === 'image' ? data.imageUrl : data.audioData;
      onGenerate({ url, prompt: data.prompt });
    } catch (err: any) {
      console.error('Generation error:', err);
      setError(err.message || 'Failed to generate. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const examples = type === 'image' 
    ? [
        'Pepe the frog looking excited and pointing up',
        'Doge meme with sunglasses looking cool',
        'Wojak character crying with hands on face',
        'Cute anime girl making peace sign',
      ]
    : [
        'Upbeat electronic notification sound',
        'Retro arcade game power up sound',
        'Calm zen meditation bell chime',
        'Energetic techno alarm beep',
      ];

  return (
    <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Wand2 className="text-primary" size={24} />
        <h3 className="text-lg font-bold text-card-foreground">
          AI {type === 'image' ? 'Image' : 'Audio'} Generator
        </h3>
      </div>

      {/* Prompt Input */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-foreground mb-2">
          Describe what you want to create:
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={`E.g., "${examples[0]}"`}
          className="w-full px-4 py-3 bg-background border border-input rounded-md focus:ring-2 focus:ring-ring focus:border-transparent resize-none text-foreground placeholder:text-muted-foreground"
          rows={3}
          disabled={isGenerating}
        />
      </div>

      {/* Style/Type Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-foreground mb-2">
          {type === 'image' ? 'Style:' : 'Type:'}
        </label>
        <div className="flex flex-wrap gap-2">
          {(type === 'image' ? imageStyles : audioTypes).map((option) => (
            <button
              key={option.value}
              onClick={() => setStyle(option.value)}
              disabled={isGenerating}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                style === option.value
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={isGenerating || !prompt.trim()}
        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        {isGenerating ? (
          <>
            <Loader2 className="animate-spin" size={20} />
            Generating...
          </>
        ) : (
          <>
            <Wand2 size={20} />
            Generate with AI
          </>
        )}
      </button>

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
          <p className="text-sm text-destructive">⚠️ {error}</p>
        </div>
      )}

      {/* Example Prompts */}
      <div className="mt-4 pt-4 border-t border-border">
        <p className="text-xs font-medium text-muted-foreground mb-2">Example prompts:</p>
        <div className="space-y-1">
          {examples.slice(0, 3).map((example, i) => (
            <button
              key={i}
              onClick={() => setPrompt(example)}
              disabled={isGenerating}
              className="block w-full text-left text-xs text-primary hover:text-primary/80 hover:underline disabled:opacity-50"
            >
              • {example}
            </button>
          ))}
        </div>
      </div>

      {/* API Key Warning */}
      {type === 'image' && !process.env.NEXT_PUBLIC_REPLICATE_CONFIGURED && (
        <div className="mt-4 p-3 bg-muted border border-border rounded-md">
          <p className="text-xs text-muted-foreground">
            💡 Set <code className="bg-muted-foreground/10 px-1 rounded text-foreground">REPLICATE_API_TOKEN</code> in your environment to enable image generation.
          </p>
        </div>
      )}
      {type === 'audio' && !process.env.NEXT_PUBLIC_ELEVENLABS_CONFIGURED && (
        <div className="mt-4 p-3 bg-muted border border-border rounded-md">
          <p className="text-xs text-muted-foreground">
            💡 Set <code className="bg-muted-foreground/10 px-1 rounded text-foreground">ELEVENLABS_API_KEY</code> in your environment to enable audio generation.
          </p>
        </div>
      )}
    </div>
  );
}

