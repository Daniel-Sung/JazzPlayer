import { useCallback, useState } from 'react';
import { useAudioContext } from '../hooks/useAudioContext';

const API_URL = 'http://localhost:3001';

export function YouTubeInput() {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('');
  const { loadAudioUrl } = useAudioContext();

  const extractVideoId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /^([a-zA-Z0-9_-]{11})$/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      const videoId = extractVideoId(url);
      if (!videoId) {
        setError('Invalid YouTube URL. Please enter a valid YouTube video URL.');
        return;
      }

      setIsLoading(true);
      setError(null);
      setStatus('Connecting to server...');

      try {
        // Request audio extraction from backend
        setStatus('Extracting audio from YouTube...');
        const response = await fetch(`${API_URL}/api/youtube/extract`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url: `https://www.youtube.com/watch?v=${videoId}` }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to extract audio');
        }

        const data = await response.json();
        setStatus('Loading audio...');

        // Load the extracted audio
        await loadAudioUrl(`${API_URL}${data.audioUrl}`, data.title);
        setStatus('');
        setUrl('');
      } catch (err) {
        console.error('YouTube extraction error:', err);
        if (err instanceof TypeError && err.message.includes('fetch')) {
          setError('Cannot connect to server. Make sure the backend is running on port 3001.');
        } else {
          setError(err instanceof Error ? err.message : 'Failed to extract audio from YouTube');
        }
        setStatus('');
      } finally {
        setIsLoading(false);
      }
    },
    [url, loadAudioUrl]
  );

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
          </div>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste YouTube URL here..."
            disabled={isLoading}
            className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors disabled:opacity-50"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading || !url}
          className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 disabled:from-gray-600 disabled:to-gray-700 text-white font-medium rounded-xl transition-all duration-300 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Loading</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>Load</span>
            </>
          )}
        </button>
      </form>

      {status && (
        <div className="mt-2 p-2 bg-blue-500/20 border border-blue-500/50 rounded-lg">
          <span className="text-sm text-blue-400 flex items-center gap-2">
            <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            {status}
          </span>
        </div>
      )}

      {error && (
        <div className="mt-2 p-2 bg-red-500/20 border border-red-500/50 rounded-lg">
          <span className="text-sm text-red-400">{error}</span>
        </div>
      )}
    </div>
  );
}
