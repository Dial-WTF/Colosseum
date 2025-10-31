# 🎨🎵 Dial.WTF Studios

## Overview

We've built two powerful creative studios for the Dial.WTF marketplace:

### 🎨 Image Studio (`/create/image`)
A full-featured meme and sticker creation tool powered by Fabric.js.

**Features:**
- ✨ **AI Image Generation** - Create images with Replicate's SDXL
- 🖼️ **Canvas Editor** - Full Fabric.js editor with drag-and-drop
- 📝 **Text Tools** - Add text with formatting (bold, italic, underline, alignment)
- 🎨 **Styling** - Custom colors, fonts, and backgrounds
- 📥 **Import Images** - Upload your own images
- 💾 **Export** - Download as PNG

**AI Styles:**
- Meme Style
- Sticker Style (die-cut with white border)
- Pepe Style
- Wojak Style
- Anime/Chibi Style

### 🎵 Audio Studio (`/create/audio`)
A professional audio editor for ringtone creation powered by WaveSurfer.js and Tone.js.

**Features:**
- ✨ **AI Audio Generation** - Generate sounds with ElevenLabs SFX API
- 🎵 **Suno Flow Jockey** - Full song generation with vocals via Suno API (up to 4 minutes)
- 🎼 **Waveform Visualization** - See your audio with WaveSurfer.js
- ✂️ **Trim & Crop** - Select regions and trim audio
- 🔊 **Volume Control** - Adjust playback volume
- 📤 **Import Audio** - Upload your own audio files
- 💾 **Export** - Download as WAV

**AI Types:**
- **Ringtones** (10 seconds) - ElevenLabs SFX
- **Sound Effects** (5 seconds) - ElevenLabs SFX
- **Full Songs** (up to 4 minutes) - Suno API with genre, mood, and BPM control

## Tech Stack

- **Image Editor**: Fabric.js 6.5.1
- **Audio Editor**: WaveSurfer.js 7.8.10 + Tone.js 15.1.3
- **AI Image**: Replicate (Stable Diffusion XL)
- **AI Audio**: 
  - ElevenLabs (Text-to-SFX) - Sound effects and ringtones
  - Suno API (sunoapi.org) - Full song generation with vocals
- **Framework**: Next.js 15 + React 18

## Setup

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Configure API Keys

Create a `.env.local` file:

```bash
# AI Image Generation (Replicate)
REPLICATE_API_TOKEN=your_token_here

# AI Audio Generation (ElevenLabs - Sound Effects)
ELEVENLABS_API_KEY=your_key_here

# AI Music Generation (Suno - Full Songs)
SUNO_API_KEY=your_sunoapi_org_key_here
```

**Get API Keys:**
- Replicate: https://replicate.com/account/api-tokens
- ElevenLabs: https://elevenlabs.io/app/settings/api-keys
- Suno API: https://sunoapi.org

### 3. Run Development Server

```bash
pnpm dev
```

Visit:
- Image Studio: http://localhost:3000/create/image
- Audio Studio: http://localhost:3000/create/audio

## API Routes

### `POST /api/generate/image`
Generate images with AI.

**Body:**
```json
{
  "prompt": "Pepe the frog looking excited",
  "style": "pepe"
}
```

**Response:**
```json
{
  "imageUrl": "https://...",
  "prompt": "Full prompt used"
}
```

### `POST /api/generate/audio`
Generate audio with AI.

**Body:**
```json
{
  "prompt": "Upbeat notification sound",
  "type": "ringtone"
}
```

**Response:**
```json
{
  "audioData": "data:audio/mpeg;base64,...",
  "prompt": "Upbeat notification sound"
}
```

## Architecture

### Image Studio Components
- `components/studio/image-studio.tsx` - Main canvas editor
- `components/studio/ai-generator-panel.tsx` - AI generation UI
- `app/api/generate/image/route.ts` - Image generation API

### Audio Studio Components
- `components/studio/audio-studio.tsx` - Main audio editor
- `components/studio/ai-generator-panel.tsx` - AI generation UI (shared)
- `app/api/generate/audio/route.ts` - Audio generation API

## User Flow

### Creating a Sticker/Meme:
1. Navigate to `/create/image`
2. (Optional) Use AI panel to generate base image
3. Add text, images, and customize
4. Export as PNG
5. Mint as NFT on `/mint`

### Creating a Ringtone:
1. Navigate to `/create/audio`
2. (Optional) Use AI panel to generate base audio
3. Upload or edit audio
4. Trim to desired length
5. Export as WAV
6. Mint as NFT on `/mint`

## Next Steps

- [ ] Connect to IPFS for decentralized storage (NFT.storage)
- [ ] Link studios directly to minting flow
- [ ] Add more AI models (DALL-E, Midjourney)
- [ ] Add audio effects (reverb, filters)
- [ ] Add image filters and effects
- [ ] Save drafts to local storage
- [ ] Community templates gallery

## Notes

- Studios are fully client-side except for AI generation
- AI features require API keys to function
- Export formats: PNG for images, WAV for audio
- Studios are mobile-responsive
- Sidebar can be toggled on/off

---

Built with ❤️ for Dial.WTF - The Solana Ringtones Marketplace

