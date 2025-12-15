// Note frequencies for reference (A4 = 440Hz)
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export interface PitchResult {
  frequency: number;
  note: string;
  octave: number;
  cents: number;
}

// Convert frequency to note name
export function frequencyToNote(frequency: number): PitchResult | null {
  if (frequency <= 0 || !isFinite(frequency)) return null;

  // Calculate the number of semitones from A4 (440Hz)
  const semitones = 12 * Math.log2(frequency / 440);
  const roundedSemitones = Math.round(semitones);
  const cents = Math.round((semitones - roundedSemitones) * 100);

  // A4 is the 49th note on a piano (0-indexed: 48)
  const noteIndex = (roundedSemitones + 9) % 12;
  const octave = Math.floor((roundedSemitones + 9) / 12) + 4;

  const noteName = NOTE_NAMES[noteIndex >= 0 ? noteIndex : noteIndex + 12];

  return {
    frequency,
    note: noteName,
    octave,
    cents,
  };
}

// Note to frequency conversion
export function noteToFrequency(note: string, octave: number): number {
  const noteIndex = NOTE_NAMES.indexOf(note);
  if (noteIndex === -1) return 0;

  const semitones = noteIndex - 9 + (octave - 4) * 12;
  return 440 * Math.pow(2, semitones / 12);
}

// YIN pitch detection algorithm
export function detectPitchYIN(
  buffer: Float32Array<ArrayBuffer>,
  sampleRate: number,
  threshold: number = 0.1
): number | null {
  const bufferSize = buffer.length;
  const yinBuffer = new Float32Array(Math.floor(bufferSize / 2));

  // Step 1: Calculate the difference function
  for (let tau = 0; tau < yinBuffer.length; tau++) {
    yinBuffer[tau] = 0;
    for (let i = 0; i < yinBuffer.length; i++) {
      const delta = buffer[i] - buffer[i + tau];
      yinBuffer[tau] += delta * delta;
    }
  }

  // Step 2: Calculate the cumulative mean normalized difference function
  yinBuffer[0] = 1;
  let runningSum = 0;
  for (let tau = 1; tau < yinBuffer.length; tau++) {
    runningSum += yinBuffer[tau];
    yinBuffer[tau] *= tau / runningSum;
  }

  // Step 3: Find the first tau where the value is below threshold
  let tauEstimate = -1;
  for (let tau = 2; tau < yinBuffer.length; tau++) {
    if (yinBuffer[tau] < threshold) {
      while (tau + 1 < yinBuffer.length && yinBuffer[tau + 1] < yinBuffer[tau]) {
        tau++;
      }
      tauEstimate = tau;
      break;
    }
  }

  if (tauEstimate === -1) return null;

  // Step 4: Parabolic interpolation
  let betterTau: number;
  const x0 = tauEstimate < 1 ? tauEstimate : tauEstimate - 1;
  const x2 = tauEstimate + 1 < yinBuffer.length ? tauEstimate + 1 : tauEstimate;

  if (x0 === tauEstimate) {
    betterTau = yinBuffer[tauEstimate] <= yinBuffer[x2] ? tauEstimate : x2;
  } else if (x2 === tauEstimate) {
    betterTau = yinBuffer[tauEstimate] <= yinBuffer[x0] ? tauEstimate : x0;
  } else {
    const s0 = yinBuffer[x0];
    const s1 = yinBuffer[tauEstimate];
    const s2 = yinBuffer[x2];
    betterTau = tauEstimate + (s2 - s0) / (2 * (2 * s1 - s2 - s0));
  }

  return sampleRate / betterTau;
}

// Autocorrelation pitch detection (simpler alternative)
export function detectPitchAutocorrelation(
  buffer: Float32Array,
  sampleRate: number,
  minFreq: number = 80,
  maxFreq: number = 1000
): number | null {
  const bufferSize = buffer.length;
  const minPeriod = Math.floor(sampleRate / maxFreq);
  const maxPeriod = Math.floor(sampleRate / minFreq);

  let bestCorrelation = 0;
  let bestPeriod = 0;

  for (let period = minPeriod; period <= maxPeriod && period < bufferSize / 2; period++) {
    let correlation = 0;
    for (let i = 0; i < bufferSize - period; i++) {
      correlation += buffer[i] * buffer[i + period];
    }
    correlation /= bufferSize - period;

    if (correlation > bestCorrelation) {
      bestCorrelation = correlation;
      bestPeriod = period;
    }
  }

  if (bestPeriod === 0 || bestCorrelation < 0.01) return null;

  return sampleRate / bestPeriod;
}

// Get all piano note frequencies
export function getPianoNotes(): { note: string; octave: number; frequency: number }[] {
  const notes: { note: string; octave: number; frequency: number }[] = [];

  // Standard piano range: A0 (27.5Hz) to C8 (4186Hz)
  for (let octave = 0; octave <= 8; octave++) {
    for (let noteIndex = 0; noteIndex < 12; noteIndex++) {
      // Skip notes before A0
      if (octave === 0 && noteIndex < 9) continue;
      // Skip notes after C8
      if (octave === 8 && noteIndex > 0) continue;

      const note = NOTE_NAMES[noteIndex];
      const frequency = noteToFrequency(note, octave);

      notes.push({ note, octave, frequency });
    }
  }

  return notes;
}

// Get frequency band for common instruments
export interface InstrumentBand {
  name: string;
  minFreq: number;
  maxFreq: number;
  color: string;
}

export const INSTRUMENT_BANDS: InstrumentBand[] = [
  { name: 'Sub Bass', minFreq: 20, maxFreq: 60, color: '#4a1942' },
  { name: 'Bass', minFreq: 60, maxFreq: 250, color: '#6b21a8' },
  { name: 'Low Mid', minFreq: 250, maxFreq: 500, color: '#7c3aed' },
  { name: 'Mid', minFreq: 500, maxFreq: 2000, color: '#8b5cf6' },
  { name: 'High Mid', minFreq: 2000, maxFreq: 4000, color: '#a78bfa' },
  { name: 'Presence', minFreq: 4000, maxFreq: 6000, color: '#c4b5fd' },
  { name: 'Brilliance', minFreq: 6000, maxFreq: 20000, color: '#e9d5ff' },
];

// Find which instrument band a frequency belongs to
export function getInstrumentBand(frequency: number): InstrumentBand | null {
  for (const band of INSTRUMENT_BANDS) {
    if (frequency >= band.minFreq && frequency < band.maxFreq) {
      return band;
    }
  }
  return null;
}
