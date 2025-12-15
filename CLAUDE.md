# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

JazzPlayer is a music visualization web app that provides real-time audio analysis with waveform, spectrum, and piano roll visualizations. It supports both local MP3 files and YouTube audio extraction.

## Development Commands

### Frontend (React + Vite)
```bash
npm run dev      # Start dev server (http://localhost:5173)
npm run build    # TypeScript compile + Vite build
npm run lint     # ESLint
npm run preview  # Preview production build
```

### Backend Server (Express)
```bash
cd server
npm run dev      # Start with --watch (http://localhost:3001)
npm run start    # Production start
```

**Prerequisite for YouTube extraction**: `pip install yt-dlp`

## Architecture

### State Management
- **Zustand store** (`src/store/audioStore.ts`): Central state for all audio data including AudioContext, AnalyserNode, playback state, and analysis results
- Components read from store; mutations happen through `useAudioContext` hook

### Audio Pipeline
```
Audio Source (File/YouTube URL)
    ↓
useAudioContext.loadAudioFile() / loadAudioUrl()
    ↓
AudioContext → GainNode → AnalyserNode → destination
    ↓
useAudioAnalyzer (requestAnimationFrame loop)
    ↓
frequencyData / timeDomainData → Zustand store
    ↓
Visualization components (Canvas rendering)
```

### Key Hooks
- `useAudioContext`: Manages Web Audio API lifecycle (load, play, pause, seek, volume)
- `useAudioAnalyzer`: Continuous analysis loop extracting FFT data and running pitch detection

### Pitch Detection
- **YIN algorithm** (`src/utils/pitchDetection.ts`): Primary pitch detection with parabolic interpolation
- **Autocorrelation**: Simpler fallback method
- Frequency bands defined in `INSTRUMENT_BANDS` for instrument estimation

### Backend API (server/index.js)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/youtube/extract` | POST | Extract audio via yt-dlp, returns MP3 URL |
| `/api/lyrics/search` | GET | Search lrclib.net for synced/plain lyrics |
| `/api/health` | GET | Health check |

Temporary audio files stored in `server/temp/`, auto-cleaned after 1 hour.

## Environment Variables

Frontend uses `VITE_API_URL` to point to backend (defaults to `http://localhost:3001`).

For production: Set `VITE_API_URL` in Vercel to the Render backend URL.

## Deployment

- **Frontend**: Vercel (auto-deploys from GitHub)
- **Backend**: Render.com (configured via `server/render.yaml`)
