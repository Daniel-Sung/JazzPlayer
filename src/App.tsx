import { useState } from 'react';
import { useAudioStore } from './store/audioStore';
import { useAudioAnalyzer } from './hooks/useAudioAnalyzer';
import { FileUpload } from './components/FileUpload';
import { YouTubeInput } from './components/YouTubeInput';
import { AudioPlayer } from './components/AudioPlayer';
import { LyricsDisplay } from './components/LyricsDisplay';
import { WaveformCanvas } from './components/WaveformCanvas';
import { SpectrumCanvas } from './components/SpectrumCanvas';
import { PianoRoll } from './components/PianoRoll';
import { InstrumentIndicator } from './components/InstrumentIndicator';

type SourceTab = 'file' | 'youtube';

function App() {
  const [sourceTab, setSourceTab] = useState<SourceTab>('file');
  const { fileName, isPlaying } = useAudioStore();

  // Initialize audio analyzer
  useAudioAnalyzer();

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent mb-2">
            JazzPlayer
          </h1>
          <p className="text-gray-400 text-sm">
            Visualize music with real-time waveform, spectrum & piano roll
          </p>
        </header>

        {/* Source Selection Tabs */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex bg-gray-800/50 rounded-xl p-1 border border-gray-700">
            <button
              onClick={() => setSourceTab('file')}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                sourceTab === 'file'
                  ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
                MP3 File
              </span>
            </button>
            <button
              onClick={() => setSourceTab('youtube')}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                sourceTab === 'youtube'
                  ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
                YouTube
              </span>
            </button>
          </div>
        </div>

        {/* Source Input */}
        <div className="mb-6">
          {sourceTab === 'file' ? <FileUpload /> : <YouTubeInput />}
        </div>

        {/* Audio Player */}
        {fileName && (
          <div className="mb-6">
            <AudioPlayer />
          </div>
        )}

        {/* Lyrics Display */}
        <div className="mb-6">
          <LyricsDisplay />
        </div>

        {/* Visualizations */}
        <div className="space-y-4">
          {/* Instrument Indicator */}
          <InstrumentIndicator />

          {/* Piano Roll */}
          <PianoRoll />

          {/* Waveform & Spectrum */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <WaveformCanvas />
            <SpectrumCanvas />
          </div>
        </div>

        {/* Status Bar */}
        <div className="mt-6 flex justify-center">
          <div className="inline-flex items-center px-4 py-2 bg-gray-800/30 rounded-full border border-gray-700/50">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
              <span className="text-xs text-gray-400">
                {isPlaying ? 'Playing' : 'Stopped'}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-8 text-center text-xs text-gray-600">
          <p>Built with React + Web Audio API</p>
          <p className="mt-1 text-gray-500">by Daniel Sung</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
