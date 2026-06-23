'use client';

import { useEffect, useRef } from 'react';

export function GrainOverlay() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth * 0.5;
    canvas.height = window.innerHeight * 0.5;

    let animationId: number;

    const render = () => {
      if (!ctx || !canvas) return;
      const w = canvas.width;
      const h = canvas.height;
      const imageData = ctx.createImageData(w, h);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        const noise = Math.random() * 40 - 20;
        data[i] = data[i + 1] = data[i + 2] = 128 + noise;
        data[i + 3] = 20 + Math.random() * 15;
      }

      ctx.putImageData(imageData, 0, 0);
      animationId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animationId);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50 mix-blend-overlay opacity-[0.15] dark:opacity-[0.08]"
      style={{ width: '100%', height: '100%' }}
      aria-hidden="true"
    />
  );
}