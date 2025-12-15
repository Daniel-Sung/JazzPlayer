import { useEffect, useState, useRef, useCallback } from 'react';
import { useAudioStore } from '../store/audioStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface LyricLine {
  time: number; // in seconds
  text: string;
}

interface LyricsData {
  success: boolean;
  trackName?: string;
  artistName?: string;
  plainLyrics?: string;
  syncedLyrics?: string;
  error?: string;
}

// Parse LRC format lyrics to array of {time, text}
function parseLRC(lrc: string): LyricLine[] {
  const lines: LyricLine[] = [];
  const regex = /\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/;

  lrc.split('\n').forEach(line => {
    const match = line.match(regex);
    if (match) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const milliseconds = parseInt(match[3].padEnd(3, '0'), 10);
      const time = minutes * 60 + seconds + milliseconds / 1000;
      const text = match[4].trim();
      if (text) {
        lines.push({ time, text });
      }
    }
  });

  return lines.sort((a, b) => a.time - b.time);
}

export function LyricsDisplay() {
  const { fileName, currentTime, isPlaying } = useAudioStore();
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [plainLyrics, setPlainLyrics] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trackInfo, setTrackInfo] = useState<{ track: string; artist: string } | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLDivElement>(null);

  // Find current line index based on playback time
  const currentLineIndex = lyrics.findIndex((line, index) => {
    const nextLine = lyrics[index + 1];
    return currentTime >= line.time && (!nextLine || currentTime < nextLine.time);
  });

  // Fetch lyrics when file name changes
  const fetchLyrics = useCallback(async () => {
    if (!fileName) {
      setLyrics([]);
      setPlainLyrics('');
      setError(null);
      setTrackInfo(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_URL}/api/lyrics/search?title=${encodeURIComponent(fileName)}`
      );
      const data: LyricsData = await response.json();

      if (data.success) {
        setTrackInfo({
          track: data.trackName || fileName,
          artist: data.artistName || ''
        });

        if (data.syncedLyrics) {
          const parsed = parseLRC(data.syncedLyrics);
          setLyrics(parsed);
          setPlainLyrics('');
        } else if (data.plainLyrics) {
          setLyrics([]);
          setPlainLyrics(data.plainLyrics);
        } else {
          setLyrics([]);
          setPlainLyrics('');
          setError('No lyrics content available');
        }
      } else {
        setLyrics([]);
        setPlainLyrics('');
        setError(data.error || 'Lyrics not found');
      }
    } catch (err) {
      console.error('Failed to fetch lyrics:', err);
      setError('Failed to connect to lyrics server');
      setLyrics([]);
      setPlainLyrics('');
    } finally {
      setIsLoading(false);
    }
  }, [fileName]);

  useEffect(() => {
    fetchLyrics();
  }, [fetchLyrics]);

  // Auto-scroll to active line
  useEffect(() => {
    if (activeLineRef.current && containerRef.current && isExpanded) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [currentLineIndex, isExpanded]);

  // Don't show if no file is loaded
  if (!fileName) return null;

  const hasSyncedLyrics = lyrics.length > 0;
  const hasPlainLyrics = plainLyrics.length > 0;
  const hasAnyLyrics = hasSyncedLyrics || hasPlainLyrics;

  return (
    <div className="w-full bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-800/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 flex items-center justify-center bg-purple-600/20 rounded-lg">
            <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
          </div>
          <div className="text-left">
            <h3 className="text-sm font-medium text-gray-300">LYRICS</h3>
            {trackInfo && (
              <p className="text-xs text-gray-500 truncate max-w-[200px]">
                {trackInfo.artist ? `${trackInfo.artist} - ${trackInfo.track}` : trackInfo.track}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isLoading && (
            <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          )}
          {!isLoading && hasAnyLyrics && (
            <span className="text-xs text-green-400 bg-green-400/10 px-2 py-0.5 rounded">
              {hasSyncedLyrics ? 'Synced' : 'Plain'}
            </span>
          )}
          {!isLoading && !hasAnyLyrics && error && (
            <span className="text-xs text-gray-500">Not found</span>
          )}
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Lyrics Content */}
      {isExpanded && (
        <div
          ref={containerRef}
          className="max-h-64 overflow-y-auto p-4 pt-0 scroll-smooth"
        >
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
              <span className="ml-2 text-sm text-gray-400">Searching lyrics...</span>
            </div>
          )}

          {!isLoading && error && !hasAnyLyrics && (
            <div className="text-center py-8">
              <p className="text-gray-500 text-sm">{error}</p>
              <button
                onClick={fetchLyrics}
                className="mt-2 text-xs text-purple-400 hover:text-purple-300"
              >
                Try again
              </button>
            </div>
          )}

          {/* Synced Lyrics */}
          {!isLoading && hasSyncedLyrics && (
            <div className="space-y-2">
              {lyrics.map((line, index) => {
                const isActive = index === currentLineIndex;
                const isPast = index < currentLineIndex;

                return (
                  <div
                    key={`${line.time}-${index}`}
                    ref={isActive ? activeLineRef : null}
                    className={`
                      py-1 px-2 rounded transition-all duration-300
                      ${isActive
                        ? 'text-white text-lg font-medium bg-purple-600/20 scale-105'
                        : isPast
                          ? 'text-gray-500 text-sm'
                          : 'text-gray-400 text-sm'
                      }
                    `}
                  >
                    {line.text}
                  </div>
                );
              })}
            </div>
          )}

          {/* Plain Lyrics */}
          {!isLoading && hasPlainLyrics && !hasSyncedLyrics && (
            <div className="text-gray-300 text-sm whitespace-pre-wrap leading-relaxed">
              {plainLyrics}
            </div>
          )}
        </div>
      )}

      {/* Current Line Preview (when collapsed) */}
      {!isExpanded && hasSyncedLyrics && currentLineIndex >= 0 && isPlaying && (
        <div className="px-4 pb-3">
          <div className="text-sm text-purple-300 truncate animate-pulse">
            {lyrics[currentLineIndex]?.text}
          </div>
        </div>
      )}
    </div>
  );
}
