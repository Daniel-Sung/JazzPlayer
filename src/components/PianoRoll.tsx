import { useEffect, useRef } from 'react';
import { useAudioStore } from '../store/audioStore';
import { frequencyToNote } from '../utils/pitchDetection';

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const WHITE_KEYS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const BLACK_KEYS = ['C#', 'D#', 'F#', 'G#', 'A#'];

// Note history for trail effect
interface NoteHistoryItem {
  note: string;
  octave: number;
  frequency: number;
  timestamp: number;
  intensity: number;
}

const noteHistory: NoteHistoryItem[] = [];
const MAX_HISTORY = 100;

export function PianoRoll() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { frequencyData, detectedPitch, detectedNote, isPlaying, analyserNode, audioContext } = useAudioStore();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    // Clear canvas
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, width, height);

    // Piano section (left side)
    const pianoWidth = 60;
    const rollWidth = width - pianoWidth;

    // Draw piano keys
    const octaveStart = 2;
    const octaveEnd = 6;
    const totalOctaves = octaveEnd - octaveStart;
    const whiteKeyHeight = height / (totalOctaves * 7);
    const blackKeyHeight = whiteKeyHeight * 0.6;

    // Draw white keys
    let keyIndex = 0;
    for (let octave = octaveEnd - 1; octave >= octaveStart; octave--) {
      for (let i = WHITE_KEYS.length - 1; i >= 0; i--) {
        const note = WHITE_KEYS[i];
        const y = keyIndex * whiteKeyHeight;
        const isActive = detectedNote === `${note}${octave}`;

        // Key background
        ctx.fillStyle = isActive ? '#8b5cf6' : '#e5e7eb';
        ctx.fillRect(0, y, pianoWidth - 2, whiteKeyHeight - 1);

        // Key border
        ctx.strokeStyle = '#9ca3af';
        ctx.strokeRect(0, y, pianoWidth - 2, whiteKeyHeight - 1);

        // Note label
        if (note === 'C') {
          ctx.fillStyle = isActive ? '#fff' : '#374151';
          ctx.font = '10px system-ui';
          ctx.textAlign = 'left';
          ctx.fillText(`C${octave}`, 4, y + whiteKeyHeight / 2 + 3);
        }

        keyIndex++;
      }
    }

    // Draw black keys
    keyIndex = 0;
    for (let octave = octaveEnd - 1; octave >= octaveStart; octave--) {
      for (let i = WHITE_KEYS.length - 1; i >= 0; i--) {
        const whiteNote = WHITE_KEYS[i];
        const y = keyIndex * whiteKeyHeight;

        // Check if there's a black key above this white key
        const noteIndex = NOTE_NAMES.indexOf(whiteNote);
        const nextNote = NOTE_NAMES[(noteIndex + 1) % 12];

        if (BLACK_KEYS.includes(nextNote)) {
          const blackY = y - blackKeyHeight / 2;
          const isActive = detectedNote === `${nextNote}${nextNote === 'A#' || nextNote === 'G#' ? octave : octave + (i === WHITE_KEYS.length - 1 ? 1 : 0)}`;

          ctx.fillStyle = isActive ? '#7c3aed' : '#1f2937';
          ctx.fillRect(0, blackY, pianoWidth * 0.6, blackKeyHeight);
        }

        keyIndex++;
      }
    }

    // Draw roll section (grid)
    ctx.fillStyle = '#111827';
    ctx.fillRect(pianoWidth, 0, rollWidth, height);

    // Draw horizontal grid lines (note rows)
    keyIndex = 0;
    for (let octave = octaveEnd - 1; octave >= octaveStart; octave--) {
      for (let i = WHITE_KEYS.length - 1; i >= 0; i--) {
        const y = keyIndex * whiteKeyHeight;
        ctx.strokeStyle = 'rgba(75, 85, 99, 0.3)';
        ctx.beginPath();
        ctx.moveTo(pianoWidth, y);
        ctx.lineTo(width, y);
        ctx.stroke();
        keyIndex++;
      }
    }

    // Draw vertical grid lines (time divisions)
    const timeDiv = rollWidth / 16;
    for (let i = 0; i <= 16; i++) {
      const x = pianoWidth + i * timeDiv;
      ctx.strokeStyle = i % 4 === 0 ? 'rgba(75, 85, 99, 0.5)' : 'rgba(75, 85, 99, 0.2)';
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Add current pitch to history
    if (isPlaying && detectedPitch && frequencyData) {
      const noteInfo = frequencyToNote(detectedPitch);
      if (noteInfo && noteInfo.octave >= octaveStart && noteInfo.octave < octaveEnd) {
        // Calculate intensity from frequency data
        const intensity = Math.min(1, frequencyData.reduce((a, b) => a + b, 0) / (frequencyData.length * 128));

        noteHistory.push({
          note: noteInfo.note,
          octave: noteInfo.octave,
          frequency: detectedPitch,
          timestamp: Date.now(),
          intensity,
        });

        // Limit history size
        while (noteHistory.length > MAX_HISTORY) {
          noteHistory.shift();
        }
      }
    }

    // Draw note history (trail effect)
    const now = Date.now();
    const trailDuration = 3000; // 3 seconds

    noteHistory.forEach((item) => {
      const age = now - item.timestamp;
      if (age > trailDuration) return;

      const alpha = Math.max(0, 1 - age / trailDuration);
      const x = pianoWidth + rollWidth * (1 - age / trailDuration);

      // Calculate y position
      const noteIndex = WHITE_KEYS.indexOf(item.note);
      if (noteIndex === -1) return; // Skip black keys for now

      const octaveOffset = (octaveEnd - 1 - item.octave) * 7;
      const keyPosition = WHITE_KEYS.length - 1 - noteIndex;
      const y = (octaveOffset + keyPosition) * whiteKeyHeight + whiteKeyHeight / 2;

      // Draw note block
      const blockWidth = Math.max(4, rollWidth / MAX_HISTORY);
      const blockHeight = whiteKeyHeight * 0.8;

      const gradient = ctx.createLinearGradient(x, y - blockHeight / 2, x + blockWidth, y + blockHeight / 2);
      gradient.addColorStop(0, `rgba(139, 92, 246, ${alpha * item.intensity})`);
      gradient.addColorStop(1, `rgba(6, 182, 212, ${alpha * item.intensity})`);

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.roundRect(x, y - blockHeight / 2, blockWidth, blockHeight, 2);
      ctx.fill();

      // Glow effect
      if (alpha > 0.7) {
        ctx.shadowColor = '#8b5cf6';
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    });

    // Draw current note indicator
    if (isPlaying && detectedPitch && detectedNote) {
      const noteInfo = frequencyToNote(detectedPitch);
      if (noteInfo && noteInfo.octave >= octaveStart && noteInfo.octave < octaveEnd) {
        const noteIndex = WHITE_KEYS.indexOf(noteInfo.note);
        if (noteIndex !== -1) {
          const octaveOffset = (octaveEnd - 1 - noteInfo.octave) * 7;
          const keyPosition = WHITE_KEYS.length - 1 - noteIndex;
          const y = (octaveOffset + keyPosition) * whiteKeyHeight + whiteKeyHeight / 2;

          // Draw active note marker
          ctx.fillStyle = '#22d3ee';
          ctx.beginPath();
          ctx.arc(width - 20, y, 6, 0, Math.PI * 2);
          ctx.fill();

          ctx.shadowColor = '#22d3ee';
          ctx.shadowBlur = 15;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }
    }

    // Draw detected note display
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(width - 80, 10, 70, 35);
    ctx.strokeStyle = 'rgba(139, 92, 246, 0.5)';
    ctx.strokeRect(width - 80, 10, 70, 35);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(detectedNote || '--', width - 45, 32);

    if (detectedPitch) {
      ctx.fillStyle = '#9ca3af';
      ctx.font = '10px system-ui';
      ctx.fillText(`${Math.round(detectedPitch)}Hz`, width - 45, 42);
    }
  }, [frequencyData, detectedPitch, detectedNote, isPlaying, analyserNode, audioContext]);

  return (
    <div className="relative w-full h-64 bg-gray-900/50 rounded-xl overflow-hidden border border-gray-800">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ display: 'block' }}
      />
      <div className="absolute top-2 left-3 text-xs text-gray-500 font-medium">
        PIANO ROLL
      </div>
    </div>
  );
}
