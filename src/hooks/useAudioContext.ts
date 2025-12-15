import { useCallback, useRef } from 'react';
import { useAudioStore } from '../store/audioStore';

export function useAudioContext() {
  const startTimeRef = useRef<number>(0);
  const pauseTimeRef = useRef<number>(0);

  const {
    audioBuffer,
    audioContext,
    gainNode,
    audioSource,
    isPlaying,
    volume,
    setAudioBuffer,
    setAudioContext,
    setAnalyserNode,
    setGainNode,
    setAudioSource,
    setIsPlaying,
    setCurrentTime,
    setDuration,
    setFileName,
    setSourceType,
    setAudioUrl,
    reset,
  } = useAudioStore();

  // Initialize audio context
  const initAudioContext = useCallback(() => {
    if (audioContext) return audioContext;

    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const analyser = ctx.createAnalyser();
    const gain = ctx.createGain();

    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.8;

    gain.connect(analyser);
    analyser.connect(ctx.destination);
    gain.gain.value = volume;

    setAudioContext(ctx);
    setAnalyserNode(analyser);
    setGainNode(gain);

    return ctx;
  }, [audioContext, volume, setAudioContext, setAnalyserNode, setGainNode]);

  // Load audio from file
  const loadAudioFile = useCallback(
    async (file: File) => {
      const ctx = initAudioContext();

      try {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = await ctx.decodeAudioData(arrayBuffer);

        setAudioBuffer(buffer);
        setDuration(buffer.duration);
        setFileName(file.name);
        setSourceType('file');
        setAudioUrl(null);
        setCurrentTime(0);
        pauseTimeRef.current = 0;

        return buffer;
      } catch (error) {
        console.error('Error loading audio file:', error);
        throw error;
      }
    },
    [initAudioContext, setAudioBuffer, setDuration, setFileName, setSourceType, setAudioUrl, setCurrentTime]
  );

  // Load audio from URL (for YouTube)
  const loadAudioUrl = useCallback(
    async (url: string, name: string = 'YouTube Audio') => {
      const ctx = initAudioContext();

      try {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const buffer = await ctx.decodeAudioData(arrayBuffer);

        setAudioBuffer(buffer);
        setDuration(buffer.duration);
        setFileName(name);
        setSourceType('youtube');
        setAudioUrl(url);
        setCurrentTime(0);
        pauseTimeRef.current = 0;

        return buffer;
      } catch (error) {
        console.error('Error loading audio URL:', error);
        throw error;
      }
    },
    [initAudioContext, setAudioBuffer, setDuration, setFileName, setSourceType, setAudioUrl, setCurrentTime]
  );

  // Play audio
  const play = useCallback(
    (startOffset: number = pauseTimeRef.current) => {
      if (!audioBuffer || !audioContext || !gainNode) return;

      // Stop current source if playing (remove onended handler first to prevent reset)
      if (audioSource) {
        audioSource.onended = null;
        audioSource.stop();
        audioSource.disconnect();
      }

      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(gainNode);

      const expectedEndTime = audioBuffer.duration;
      source.onended = () => {
        // Only reset if we actually reached the end (not due to seeking or stopping)
        const currentPlayTime = audioContext.currentTime - startTimeRef.current;
        if (currentPlayTime >= expectedEndTime - 0.5) {
          setIsPlaying(false);
          pauseTimeRef.current = 0;
          setCurrentTime(0);
        }
      };

      startTimeRef.current = audioContext.currentTime - startOffset;
      source.start(0, startOffset);

      setAudioSource(source);
      setIsPlaying(true);
    },
    [audioBuffer, audioContext, gainNode, audioSource, setAudioSource, setIsPlaying, setCurrentTime]
  );

  // Pause audio
  const pause = useCallback(() => {
    if (!audioSource || !audioContext) return;

    const elapsed = audioContext.currentTime - startTimeRef.current;
    pauseTimeRef.current = elapsed;

    audioSource.stop();
    audioSource.disconnect();

    setAudioSource(null);
    setIsPlaying(false);
    setCurrentTime(elapsed);
  }, [audioSource, audioContext, setAudioSource, setIsPlaying, setCurrentTime]);

  // Toggle play/pause
  const togglePlay = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);

  // Seek to position
  const seek = useCallback(
    (time: number) => {
      if (!audioBuffer) return;

      pauseTimeRef.current = Math.max(0, Math.min(time, audioBuffer.duration));
      setCurrentTime(pauseTimeRef.current);

      if (isPlaying) {
        play(pauseTimeRef.current);
      }
    },
    [audioBuffer, isPlaying, play, setCurrentTime]
  );

  // Set volume
  const setVolumeLevel = useCallback(
    (level: number) => {
      const clampedLevel = Math.max(0, Math.min(1, level));
      useAudioStore.getState().setVolume(clampedLevel);

      if (gainNode) {
        gainNode.gain.value = clampedLevel;
      }
    },
    [gainNode]
  );

  // Get current playback time
  const getCurrentTime = useCallback(() => {
    if (!audioContext || !isPlaying) {
      return pauseTimeRef.current;
    }
    return audioContext.currentTime - startTimeRef.current;
  }, [audioContext, isPlaying]);

  // Stop and reset
  const stop = useCallback(() => {
    if (audioSource) {
      audioSource.stop();
      audioSource.disconnect();
    }

    pauseTimeRef.current = 0;
    setAudioSource(null);
    setIsPlaying(false);
    setCurrentTime(0);
  }, [audioSource, setAudioSource, setIsPlaying, setCurrentTime]);

  // Full reset
  const resetAudio = useCallback(() => {
    if (audioSource) {
      audioSource.stop();
      audioSource.disconnect();
    }
    pauseTimeRef.current = 0;
    startTimeRef.current = 0;
    reset();
  }, [audioSource, reset]);

  return {
    initAudioContext,
    loadAudioFile,
    loadAudioUrl,
    play,
    pause,
    togglePlay,
    seek,
    stop,
    setVolume: setVolumeLevel,
    getCurrentTime,
    reset: resetAudio,
  };
}
