import { useEffect, useRef } from 'react';
import { useAudioStore } from '../store/audioStore';

export function SpectrumCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { frequencyData, isPlaying } = useAudioStore();

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

    // Clear canvas
    ctx.fillStyle = 'rgba(10, 10, 15, 0.3)';
    ctx.fillRect(0, 0, rect.width, rect.height);

    if (!frequencyData || !isPlaying) {
      // Draw idle bars
      const barCount = 64;
      const barWidth = rect.width / barCount - 2;

      for (let i = 0; i < barCount; i++) {
        const x = i * (barWidth + 2);
        const height = 4;
        const y = rect.height - height;

        ctx.fillStyle = 'rgba(139, 92, 246, 0.2)';
        ctx.fillRect(x, y, barWidth, height);
      }
      return;
    }

    // Draw frequency bars
    const barCount = 64;
    const step = Math.floor(frequencyData.length / barCount);
    const barWidth = rect.width / barCount - 2;

    for (let i = 0; i < barCount; i++) {
      // Average the frequency values for smoother visualization
      let sum = 0;
      for (let j = 0; j < step; j++) {
        sum += frequencyData[i * step + j];
      }
      const value = sum / step;

      const percent = value / 255;
      const height = Math.max(4, percent * rect.height * 0.9);
      const x = i * (barWidth + 2);
      const y = rect.height - height;

      // Create gradient for each bar
      const gradient = ctx.createLinearGradient(x, rect.height, x, y);
      gradient.addColorStop(0, '#6b21a8');
      gradient.addColorStop(0.5, '#8b5cf6');
      gradient.addColorStop(1, '#06b6d4');

      ctx.fillStyle = gradient;
      ctx.fillRect(x, y, barWidth, height);

      // Add glow effect for active bars
      if (percent > 0.5) {
        ctx.shadowColor = '#8b5cf6';
        ctx.shadowBlur = 10;
        ctx.fillRect(x, y, barWidth, height);
        ctx.shadowBlur = 0;
      }
    }

    // Draw frequency labels
    ctx.fillStyle = 'rgba(156, 163, 175, 0.5)';
    ctx.font = '10px system-ui';
    ctx.textAlign = 'center';

    const labels = ['60Hz', '250Hz', '1kHz', '4kHz', '16kHz'];
    const positions = [0.05, 0.15, 0.35, 0.6, 0.9];

    labels.forEach((label, index) => {
      const x = rect.width * positions[index];
      ctx.fillText(label, x, rect.height - 4);
    });
  }, [frequencyData, isPlaying]);

  return (
    <div className="relative w-full h-32 bg-gray-900/50 rounded-xl overflow-hidden border border-gray-800">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ display: 'block' }}
      />
      <div className="absolute top-2 left-3 text-xs text-gray-500 font-medium">
        SPECTRUM
      </div>
    </div>
  );
}
