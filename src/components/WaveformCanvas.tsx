import { useEffect, useRef } from 'react';
import { useAudioStore } from '../store/audioStore';

export function WaveformCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { timeDomainData, isPlaying } = useAudioStore();

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

    if (!timeDomainData || !isPlaying) {
      // Draw idle state
      ctx.strokeStyle = 'rgba(139, 92, 246, 0.3)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, rect.height / 2);
      ctx.lineTo(rect.width, rect.height / 2);
      ctx.stroke();
      return;
    }

    // Draw waveform
    const sliceWidth = rect.width / timeDomainData.length;
    let x = 0;

    // Create gradient
    const gradient = ctx.createLinearGradient(0, 0, rect.width, 0);
    gradient.addColorStop(0, '#8b5cf6');
    gradient.addColorStop(0.5, '#06b6d4');
    gradient.addColorStop(1, '#8b5cf6');

    ctx.strokeStyle = gradient;
    ctx.lineWidth = 2;
    ctx.beginPath();

    for (let i = 0; i < timeDomainData.length; i++) {
      const v = timeDomainData[i] / 128.0;
      const y = (v * rect.height) / 2;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    ctx.lineTo(rect.width, rect.height / 2);
    ctx.stroke();

    // Draw glow effect
    ctx.shadowColor = '#8b5cf6';
    ctx.shadowBlur = 10;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }, [timeDomainData, isPlaying]);

  return (
    <div className="relative w-full h-32 bg-gray-900/50 rounded-xl overflow-hidden border border-gray-800">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ display: 'block' }}
      />
      <div className="absolute top-2 left-3 text-xs text-gray-500 font-medium">
        WAVEFORM
      </div>
    </div>
  );
}
