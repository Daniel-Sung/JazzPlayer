import { create } from 'zustand';

export interface AudioState {
  // Audio source
  audioBuffer: AudioBuffer | null;
  audioSource: AudioBufferSourceNode | null;
  audioContext: AudioContext | null;
  analyserNode: AnalyserNode | null;
  gainNode: GainNode | null;

  // Playback state
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;

  // Audio metadata
  fileName: string;
  sourceType: 'file' | 'youtube' | null;
  audioUrl: string | null;

  // Analysis data
  frequencyData: Uint8Array | null;
  timeDomainData: Uint8Array | null;
  detectedPitch: number | null;
  detectedNote: string | null;

  // Actions
  setAudioBuffer: (buffer: AudioBuffer | null) => void;
  setAudioSource: (source: AudioBufferSourceNode | null) => void;
  setAudioContext: (context: AudioContext | null) => void;
  setAnalyserNode: (analyser: AnalyserNode | null) => void;
  setGainNode: (gain: GainNode | null) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setVolume: (volume: number) => void;
  setFileName: (name: string) => void;
  setSourceType: (type: 'file' | 'youtube' | null) => void;
  setAudioUrl: (url: string | null) => void;
  setFrequencyData: (data: Uint8Array | null) => void;
  setTimeDomainData: (data: Uint8Array | null) => void;
  setDetectedPitch: (pitch: number | null) => void;
  setDetectedNote: (note: string | null) => void;
  reset: () => void;
}

const initialState = {
  audioBuffer: null,
  audioSource: null,
  audioContext: null,
  analyserNode: null,
  gainNode: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 0.8,
  fileName: '',
  sourceType: null as 'file' | 'youtube' | null,
  audioUrl: null as string | null,
  frequencyData: null,
  timeDomainData: null,
  detectedPitch: null,
  detectedNote: null,
};

export const useAudioStore = create<AudioState>((set) => ({
  ...initialState,

  setAudioBuffer: (buffer) => set({ audioBuffer: buffer }),
  setAudioSource: (source) => set({ audioSource: source }),
  setAudioContext: (context) => set({ audioContext: context }),
  setAnalyserNode: (analyser) => set({ analyserNode: analyser }),
  setGainNode: (gain) => set({ gainNode: gain }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setCurrentTime: (time) => set({ currentTime: time }),
  setDuration: (duration) => set({ duration }),
  setVolume: (volume) => set({ volume }),
  setFileName: (name) => set({ fileName: name }),
  setSourceType: (type) => set({ sourceType: type }),
  setAudioUrl: (url) => set({ audioUrl: url }),
  setFrequencyData: (data) => set({ frequencyData: data }),
  setTimeDomainData: (data) => set({ timeDomainData: data }),
  setDetectedPitch: (pitch) => set({ detectedPitch: pitch }),
  setDetectedNote: (note) => set({ detectedNote: note }),
  reset: () => set(initialState),
}));
