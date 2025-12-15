import { useEffect, useState } from 'react';
import { useAudioStore } from '../store/audioStore';
import { calculateBandEnergies } from '../utils/audioAnalysis';
import type { BandEnergy } from '../utils/audioAnalysis';

interface Instrument {
  id: string;
  name: string;
  nameKo: string;
  icon: string;
  bands: (keyof BandEnergy)[];
  color: string;
  description: string;
}

const INSTRUMENTS: Instrument[] = [
  {
    id: 'kick',
    name: 'Kick Drum',
    nameKo: 'Kick',
    icon: '🥁',
    bands: ['subBass', 'bass'],
    color: '#ef4444',
    description: 'Low thumping drum sound',
  },
  {
    id: 'bass',
    name: 'Bass',
    nameKo: 'Bass',
    icon: '🎸',
    bands: ['bass', 'lowMid'],
    color: '#f97316',
    description: 'Low frequency bass guitar/synth',
  },
  {
    id: 'guitar',
    name: 'Guitar',
    nameKo: 'Guitar',
    icon: '🎸',
    bands: ['lowMid', 'mid'],
    color: '#eab308',
    description: 'Melody guitar',
  },
  {
    id: 'piano',
    name: 'Piano/Keys',
    nameKo: 'Piano',
    icon: '🎹',
    bands: ['lowMid', 'mid', 'highMid'],
    color: '#22c55e',
    description: 'Keyboard instruments',
  },
  {
    id: 'saxophone',
    name: 'Saxophone',
    nameKo: 'Sax',
    icon: '🎷',
    bands: ['mid', 'highMid'],
    color: '#d97706',
    description: 'Jazz woodwind instrument',
  },
  {
    id: 'trumpet',
    name: 'Trumpet',
    nameKo: 'Trumpet',
    icon: '🎺',
    bands: ['highMid', 'presence'],
    color: '#dc2626',
    description: 'Bright brass instrument',
  },
  {
    id: 'vocal',
    name: 'Vocal',
    nameKo: 'Vocal',
    icon: '🎤',
    bands: ['mid', 'highMid'],
    color: '#3b82f6',
    description: 'Human voice',
  },
  {
    id: 'strings',
    name: 'Strings',
    nameKo: 'Strings',
    icon: '🎻',
    bands: ['mid', 'highMid', 'presence'],
    color: '#8b5cf6',
    description: 'Violin, cello, etc.',
  },
  {
    id: 'hihat',
    name: 'Hi-Hat/Cymbal',
    nameKo: 'Cymbal',
    icon: '🥇',
    bands: ['presence', 'brilliance'],
    color: '#ec4899',
    description: 'Metallic shimmer sound',
  },
];

export function InstrumentIndicator() {
  const { frequencyData, isPlaying, analyserNode, audioContext } = useAudioStore();
  const [instrumentLevels, setInstrumentLevels] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!frequencyData || !isPlaying || !analyserNode || !audioContext) {
      // Reset levels when not playing
      const resetLevels: Record<string, number> = {};
      INSTRUMENTS.forEach(inst => {
        resetLevels[inst.id] = 0;
      });
      setInstrumentLevels(resetLevels);
      return;
    }

    // Calculate band energies
    const bandEnergies = calculateBandEnergies(
      frequencyData,
      audioContext.sampleRate,
      analyserNode.fftSize
    );

    // Calculate instrument levels based on their frequency bands
    const levels: Record<string, number> = {};

    INSTRUMENTS.forEach(instrument => {
      let totalEnergy = 0;
      instrument.bands.forEach(band => {
        totalEnergy += bandEnergies[band];
      });
      // Normalize to 0-1 range
      const avgEnergy = totalEnergy / instrument.bands.length;
      levels[instrument.id] = Math.min(1, avgEnergy / 180); // 180 is approx max value
    });

    setInstrumentLevels(levels);
  }, [frequencyData, isPlaying, analyserNode, audioContext]);

  return (
    <div className="w-full bg-gray-900/50 backdrop-blur-sm rounded-xl p-4 border border-gray-800">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-400">INSTRUMENTS PLAYING</h3>
        <span className="text-xs text-gray-500">Frequency-based estimation</span>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-3">
        {INSTRUMENTS.map(instrument => {
          const level = instrumentLevels[instrument.id] || 0;
          const isActive = level > 0.15;
          const intensity = Math.min(1, level * 1.5);

          return (
            <div
              key={instrument.id}
              className={`
                relative flex flex-col items-center p-3 rounded-xl
                transition-all duration-150 cursor-default
                ${isActive
                  ? 'bg-gray-800/80 scale-105 shadow-lg'
                  : 'bg-gray-800/30'
                }
              `}
              style={{
                boxShadow: isActive ? `0 0 20px ${instrument.color}40` : 'none',
              }}
              title={instrument.description}
            >
              {/* Icon */}
              <div
                className="text-3xl mb-1 transition-all duration-150"
                style={{
                  filter: isActive ? 'none' : 'grayscale(100%)',
                  opacity: isActive ? 1 : 0.4,
                  transform: isActive ? `scale(${1 + intensity * 0.2})` : 'scale(1)',
                }}
              >
                {instrument.icon}
              </div>

              {/* Name */}
              <span
                className={`text-xs font-medium text-center transition-colors duration-150 ${
                  isActive ? 'text-white' : 'text-gray-500'
                }`}
              >
                {instrument.nameKo}
              </span>

              {/* Level bar */}
              <div className="w-full h-1.5 bg-gray-700 rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-100"
                  style={{
                    width: `${level * 100}%`,
                    backgroundColor: instrument.color,
                    boxShadow: isActive ? `0 0 8px ${instrument.color}` : 'none',
                  }}
                />
              </div>

              {/* Active indicator dot */}
              {isActive && (
                <div
                  className="absolute -top-1 -right-1 w-3 h-3 rounded-full animate-pulse"
                  style={{ backgroundColor: instrument.color }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 pt-3 border-t border-gray-800">
        <div className="flex flex-wrap gap-4 justify-center text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-red-500/50" />
            <span>Low (Bass/Drums)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-green-500/50" />
            <span>Mid (Melody/Vocal)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-amber-500/50" />
            <span>Brass (Sax/Trumpet)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-purple-500/50" />
            <span>High (Cymbals/Air)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
