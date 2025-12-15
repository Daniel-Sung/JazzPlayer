import { useCallback, useEffect, useRef } from 'react';
import { useAudioStore } from '../store/audioStore';
import { detectPitchYIN, frequencyToNote } from '../utils/pitchDetection';

export function useAudioAnalyzer() {
  const animationRef = useRef<number | null>(null);
  const timeDomainDataRef = useRef<Float32Array<ArrayBuffer> | null>(null);

  const {
    analyserNode,
    audioContext,
    isPlaying,
    setFrequencyData,
    setTimeDomainData,
    setDetectedPitch,
    setDetectedNote,
    setCurrentTime,
  } = useAudioStore();

  const startTimeRef = useRef<number>(0);
  const lastStoreTimeRef = useRef<number>(0);

  // Analyze audio frame
  const analyzeFrame = useCallback(() => {
    if (!analyserNode || !audioContext) {
      animationRef.current = requestAnimationFrame(analyzeFrame);
      return;
    }

    // Get frequency data
    const frequencyData = new Uint8Array(analyserNode.frequencyBinCount);
    analyserNode.getByteFrequencyData(frequencyData);
    setFrequencyData(frequencyData);

    // Get time domain data
    const timeDomainData = new Uint8Array(analyserNode.fftSize);
    analyserNode.getByteTimeDomainData(timeDomainData);
    setTimeDomainData(timeDomainData);

    // Get float time domain data for pitch detection
    if (!timeDomainDataRef.current || timeDomainDataRef.current.length !== analyserNode.fftSize) {
      timeDomainDataRef.current = new Float32Array(analyserNode.fftSize);
    }
    analyserNode.getFloatTimeDomainData(timeDomainDataRef.current);

    // Detect pitch using YIN algorithm
    const pitch = detectPitchYIN(timeDomainDataRef.current, audioContext.sampleRate);
    setDetectedPitch(pitch);

    if (pitch) {
      const noteInfo = frequencyToNote(pitch);
      if (noteInfo) {
        setDetectedNote(`${noteInfo.note}${noteInfo.octave}`);
      } else {
        setDetectedNote(null);
      }
    } else {
      setDetectedNote(null);
    }

    animationRef.current = requestAnimationFrame(analyzeFrame);
  }, [analyserNode, audioContext, setFrequencyData, setTimeDomainData, setDetectedPitch, setDetectedNote]);

  // Update current time during playback
  const updateCurrentTime = useCallback(() => {
    if (!audioContext || !isPlaying) return;

    const storeTime = useAudioStore.getState().currentTime;
    const calculatedTime = audioContext.currentTime - startTimeRef.current;

    // Detect if a seek happened (large difference between calculated and store time)
    const timeDiff = Math.abs(calculatedTime - storeTime);
    if (timeDiff > 0.5) {
      // Seek detected, recalculate startTimeRef
      startTimeRef.current = audioContext.currentTime - storeTime;
      lastStoreTimeRef.current = storeTime;
      return;
    }

    const newTime = audioContext.currentTime - startTimeRef.current;
    setCurrentTime(newTime);
    lastStoreTimeRef.current = newTime;
  }, [audioContext, isPlaying, setCurrentTime]);

  // Start/stop analysis based on playback state
  useEffect(() => {
    if (isPlaying) {
      if (audioContext) {
        startTimeRef.current = audioContext.currentTime - useAudioStore.getState().currentTime;
      }
      animationRef.current = requestAnimationFrame(analyzeFrame);
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [isPlaying, analyzeFrame, audioContext]);

  // Update current time periodically
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(updateCurrentTime, 50);
    return () => clearInterval(interval);
  }, [isPlaying, updateCurrentTime]);

  return {
    analyzeFrame,
  };
}
