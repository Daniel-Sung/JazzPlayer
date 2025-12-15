// Format time in MM:SS format
export function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return '0:00';

  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Calculate RMS (Root Mean Square) for volume level
export function calculateRMS(dataArray: Uint8Array): number {
  let sum = 0;
  for (let i = 0; i < dataArray.length; i++) {
    const normalized = (dataArray[i] - 128) / 128;
    sum += normalized * normalized;
  }
  return Math.sqrt(sum / dataArray.length);
}

// Calculate peak amplitude
export function calculatePeak(dataArray: Uint8Array): number {
  let max = 0;
  for (let i = 0; i < dataArray.length; i++) {
    const value = Math.abs(dataArray[i] - 128);
    if (value > max) max = value;
  }
  return max / 128;
}

// Get frequency from FFT bin index
export function binToFrequency(binIndex: number, sampleRate: number, fftSize: number): number {
  return (binIndex * sampleRate) / fftSize;
}

// Get FFT bin index from frequency
export function frequencyToBin(frequency: number, sampleRate: number, fftSize: number): number {
  return Math.round((frequency * fftSize) / sampleRate);
}

// Calculate dominant frequency from FFT data
export function getDominantFrequency(
  frequencyData: Uint8Array,
  sampleRate: number,
  fftSize: number,
  minFreq: number = 80,
  maxFreq: number = 4000
): number | null {
  const minBin = frequencyToBin(minFreq, sampleRate, fftSize);
  const maxBin = frequencyToBin(maxFreq, sampleRate, fftSize);

  let maxValue = 0;
  let maxIndex = 0;

  for (let i = minBin; i < maxBin && i < frequencyData.length; i++) {
    if (frequencyData[i] > maxValue) {
      maxValue = frequencyData[i];
      maxIndex = i;
    }
  }

  // Threshold check - ignore quiet signals
  if (maxValue < 100) return null;

  return binToFrequency(maxIndex, sampleRate, fftSize);
}

// Get multiple peaks from FFT data
export function getFrequencyPeaks(
  frequencyData: Uint8Array,
  sampleRate: number,
  fftSize: number,
  numPeaks: number = 5,
  minFreq: number = 80,
  maxFreq: number = 4000,
  threshold: number = 100
): { frequency: number; amplitude: number }[] {
  const minBin = frequencyToBin(minFreq, sampleRate, fftSize);
  const maxBin = frequencyToBin(maxFreq, sampleRate, fftSize);

  const peaks: { frequency: number; amplitude: number }[] = [];

  // Find local maxima
  for (let i = minBin + 1; i < maxBin - 1 && i < frequencyData.length - 1; i++) {
    if (
      frequencyData[i] > frequencyData[i - 1] &&
      frequencyData[i] > frequencyData[i + 1] &&
      frequencyData[i] > threshold
    ) {
      peaks.push({
        frequency: binToFrequency(i, sampleRate, fftSize),
        amplitude: frequencyData[i],
      });
    }
  }

  // Sort by amplitude and return top N
  peaks.sort((a, b) => b.amplitude - a.amplitude);
  return peaks.slice(0, numPeaks);
}

// Calculate spectral centroid (brightness indicator)
export function calculateSpectralCentroid(
  frequencyData: Uint8Array,
  sampleRate: number,
  fftSize: number
): number {
  let weightedSum = 0;
  let magnitudeSum = 0;

  for (let i = 0; i < frequencyData.length; i++) {
    const frequency = binToFrequency(i, sampleRate, fftSize);
    const magnitude = frequencyData[i];
    weightedSum += frequency * magnitude;
    magnitudeSum += magnitude;
  }

  return magnitudeSum > 0 ? weightedSum / magnitudeSum : 0;
}

// Beat detection using energy-based approach
export interface BeatInfo {
  isBeat: boolean;
  energy: number;
  averageEnergy: number;
}

const energyHistory: number[] = [];
const HISTORY_SIZE = 43; // ~1 second at 60fps

export function detectBeat(
  frequencyData: Uint8Array,
  sensitivity: number = 1.3
): BeatInfo {
  // Calculate current energy (focus on bass frequencies)
  let energy = 0;
  const bassRange = Math.floor(frequencyData.length * 0.1); // Bottom 10% of spectrum

  for (let i = 0; i < bassRange; i++) {
    energy += frequencyData[i] * frequencyData[i];
  }
  energy = Math.sqrt(energy / bassRange);

  // Update history
  energyHistory.push(energy);
  if (energyHistory.length > HISTORY_SIZE) {
    energyHistory.shift();
  }

  // Calculate average energy
  const averageEnergy =
    energyHistory.reduce((a, b) => a + b, 0) / energyHistory.length;

  // Detect beat
  const isBeat = energy > averageEnergy * sensitivity && energy > 50;

  return { isBeat, energy, averageEnergy };
}

// Reset beat detection history
export function resetBeatDetection(): void {
  energyHistory.length = 0;
}

// Calculate frequency band energies
export interface BandEnergy {
  subBass: number;
  bass: number;
  lowMid: number;
  mid: number;
  highMid: number;
  presence: number;
  brilliance: number;
}

export function calculateBandEnergies(
  frequencyData: Uint8Array,
  sampleRate: number,
  fftSize: number
): BandEnergy {
  const bands = {
    subBass: { min: 20, max: 60 },
    bass: { min: 60, max: 250 },
    lowMid: { min: 250, max: 500 },
    mid: { min: 500, max: 2000 },
    highMid: { min: 2000, max: 4000 },
    presence: { min: 4000, max: 6000 },
    brilliance: { min: 6000, max: 20000 },
  };

  const result: BandEnergy = {
    subBass: 0,
    bass: 0,
    lowMid: 0,
    mid: 0,
    highMid: 0,
    presence: 0,
    brilliance: 0,
  };

  for (const [bandName, range] of Object.entries(bands)) {
    const minBin = frequencyToBin(range.min, sampleRate, fftSize);
    const maxBin = frequencyToBin(range.max, sampleRate, fftSize);

    let sum = 0;
    let count = 0;
    for (let i = minBin; i < maxBin && i < frequencyData.length; i++) {
      sum += frequencyData[i];
      count++;
    }

    result[bandName as keyof BandEnergy] = count > 0 ? sum / count : 0;
  }

  return result;
}
