import { useCallback, useState, useRef } from 'react';
import { useAudioContext } from '../hooks/useAudioContext';

export function FileUpload() {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { loadAudioFile } = useAudioContext();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('audio/')) {
        setError('Please upload an audio file (MP3, WAV, etc.)');
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        await loadAudioFile(file);
      } catch {
        setError('Failed to load audio file. Please try another file.');
      } finally {
        setIsLoading(false);
      }
    },
    [loadAudioFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        onChange={handleFileInput}
        className="hidden"
        disabled={isLoading}
      />
      <div
        onClick={handleClick}
        className={`
          relative flex flex-col items-center justify-center
          w-full h-32 border-2 border-dashed rounded-xl
          cursor-pointer transition-all duration-300
          ${isDragging
            ? 'border-purple-500 bg-purple-500/20'
            : 'border-gray-600 hover:border-purple-400 hover:bg-purple-500/10'
          }
          ${isLoading ? 'opacity-50 cursor-wait' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >

        {isLoading ? (
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            <span className="mt-2 text-sm text-gray-400">Loading audio...</span>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <svg
              className={`w-10 h-10 mb-2 ${isDragging ? 'text-purple-400' : 'text-gray-500'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
              />
            </svg>
            <span className="text-sm text-gray-400">
              Drop an audio file here or click to browse
            </span>
            <span className="text-xs text-gray-500 mt-1">
              Supports MP3, WAV, OGG, FLAC
            </span>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-2 p-2 bg-red-500/20 border border-red-500/50 rounded-lg">
          <span className="text-sm text-red-400">{error}</span>
        </div>
      )}
    </div>
  );
}
