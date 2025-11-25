# 🎵 Suno Flow Jockey Integration

## Overview

The **Suno Flow Jockey** is a comprehensive music generation interface integrated into the Audio Studio. It provides DJ-style controls for generating AI-powered music tracks with precise control over genre, mood, tempo (BPM), and duration.

## 🎹 Features

### Music Generation Controls

- **Genre Selection**: 8 music genres including Electronic, Hip Hop, Rock, Jazz, Ambient, Techno, House, and Trap
- **Mood Settings**: 8 moods including Energetic, Chill, Dark, Uplifting, Melancholic, Aggressive, Dreamy, and Funky
- **Duration Options**: 15s, 30s, 60s, 90s track lengths
- **BPM Control**: Adjustable tempo from 60-180 BPM (Beats Per Minute)
- **Custom Prompts**: Describe the vibe you want in natural language

### UI/UX

- Beautiful gradient design with purple/pink theme
- Collapsible advanced settings panel
- Real-time generation progress
- Example prompts for inspiration
- Smooth animations and transitions

## 🔧 How It Works

### Architecture

```
User Input → Flow Jockey UI → API Route (/api/generate/audio/suno) → Music Generation → WaveSurfer Player
```

### Components

1. **SunoFlowJockey Component** (`suno-flow-jockey.tsx`)
   - Main UI component with all music controls
   - Handles user input and sends to API
   - Returns generated audio URL and metadata

2. **API Route** (`/api/generate/audio/suno/route.ts`)
   - Receives music generation parameters
   - Uses Suno API from sunoapi.org for full song generation
   - Returns audio data and metadata with automatic polling

3. **Audio Studio Integration** (`audio-studio.tsx`, `audio-studio-project.tsx`)
   - Replaces standard AI panel with Flow Jockey
   - Loads generated tracks into WaveSurfer for editing
   - Supports track metadata logging

## 🚀 Usage

### In the Audio Studio

1. Open the Audio Studio (`/dashboard/create/audio`)
2. The Flow Jockey panel is on the left side
3. Describe your desired vibe (e.g., "Late night drive through the city")
4. Select genre (e.g., Electronic)
5. Choose mood (e.g., Energetic)
6. Pick duration (e.g., 30s)
7. Optionally adjust BPM in advanced settings
8. Click "Generate Music"
9. Track loads automatically into the editor

### Generated Track Metadata

Each generated track includes:
```typescript
{
  url: string;          // Audio data URL
  prompt: string;       // Enhanced prompt used
  metadata: {
    genre: string;      // Selected genre
    mood: string;       // Selected mood
    duration: number;   // Track length in seconds
    bpm: number;        // Beats per minute
    rawPrompt: string;  // Original user prompt
  }
}
```

## 🔌 API Integration

### Current Implementation

Now uses **Suno API** from `sunoapi.org` as the backend:

```typescript
// apps/web/src/app/api/generate/audio/suno/route.ts
const response = await fetch(`${SUNO_API_BASE}/generate`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.SUNO_API_KEY}`,
  },
  body: JSON.stringify({
    prompt: musicPrompt,
    make_instrumental: false,
    wait_audio: true,
    tags: `${genre}, ${mood}, ${bpm} BPM`,
    model: 'V4', // V3_5, V4, V4_5, V4_5PLUS or V5
  }),
});
```

### Features

- ✅ **Full song generation** with vocals (up to 4 minutes)
- ✅ **Genre-aware** music creation
- ✅ **Mood customization** for emotional tone
- ✅ **BPM control** for tempo precision
- ✅ **Automatic polling** for audio when generation takes time
- ✅ **Track metadata** including title, tags, and duration

## 🎨 Customization

### Adding New Genres

Edit `suno-flow-jockey.tsx`:

```typescript
const genres = [
  // ... existing genres
  { value: 'lofi', label: '🎧 Lo-Fi', emoji: '☕' },
  { value: 'dubstep', label: '🔊 Dubstep', emoji: '💥' },
];
```

### Adding New Moods

```typescript
const moods = [
  // ... existing moods
  { value: 'mysterious', label: '🔮 Mysterious' },
  { value: 'epic', label: '⚔️ Epic' },
];
```

### Adjusting Duration Options

```typescript
const durations = [
  { value: 10, label: '10s' },
  { value: 20, label: '20s' },
  // ... etc
];
```

## 🎯 Example Prompts

The Flow Jockey includes pre-built example prompts:

- "Late night drive through the city"
- "Underground rave energy"
- "Smooth jazz club vibes"
- "Sunrise beach meditation"
- "Gym workout hype"
- "Lo-fi study session beats"

## 🔑 Environment Variables

Required:
```bash
SUNO_API_KEY=your_sunoapi_org_key_here
```

Get your API key from: https://sunoapi.org

## 🎵 Integration with Audio Editor

Once a track is generated:

1. **Auto-loads** into WaveSurfer waveform editor
2. **Editable** with all standard tools (trim, volume, effects)
3. **Saveable** as project versions
4. **Exportable** as WAV files
5. **Burnable** to "CD" with CD Burner feature

## 🚀 Next Steps

### Completed
- ✅ Flow Jockey UI created
- ✅ API route established
- ✅ Integration with Audio Studio complete
- ✅ Metadata support added
- ✅ Suno API integrated (sunoapi.org)
- ✅ Full song generation with vocals
- ✅ Automatic audio polling for async generation

### Future Enhancements
- [ ] Add stem separation controls
- [ ] Implement real-time BPM detection
- [ ] Add key/scale selection
- [ ] Include instrument selection
- [ ] Enable remix/variation generation
- [ ] Add track preview before loading
- [ ] Implement batch generation queue

## 📚 Files Modified

- ✨ **Created**: `apps/web/src/components/studio/suno-flow-jockey.tsx`
- ✨ **Created**: `apps/web/src/app/api/generate/audio/suno/route.ts`
- 🔧 **Modified**: `apps/web/src/components/studio/audio-studio.tsx`
- 🔧 **Modified**: `apps/web/src/components/studio/audio-studio-project.tsx`

## 🎉 Result

You now have a **professional music generation interface** in your Audio Studio that rivals standalone music AI tools! 🔥

The Flow Jockey provides:
- 🎹 8 genres
- 😌 8 moods
- ⏱️ 4 duration options
- 🎼 Full BPM control (60-180)
- ✨ Custom prompt support
- 💜 Beautiful UI
- 🎵 Seamless editor integration

Ready to create some fire tracks! 🚀

