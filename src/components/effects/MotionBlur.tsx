'use client';

import { useEffect, useRef } from 'react';
import { useStore } from '@/lib/store';
import { CANVAS_CONFIG } from '@/lib/constants';

export function MotionBlur() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const velocity = useStore((s) => s.camera.velocity);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = 0;
    let h = 0;

    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas!.width = w;
      canvas!.height = h;
    };

    resize();
    window.addEventListener('resize', resize);

    let opacity = 0;

    const render = () => {
      if (!ctx || !canvas) return;

      const targetOpacity = Math.min(
        (velocity / CANVAS_CONFIG.MAX_SCROLL_SPEED) * CANVAS_CONFIG.MOTION_BLUR_FACTOR,
        0.6
      );

      opacity += (targetOpacity - opacity) * 0.1;

      if (opacity > 0.01) {
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = `rgba(0, 0, 0, ${opacity * 0.3})`;
        ctx.fillRect(0, 0, w, h);
      } else {
        ctx.clearRect(0, 0, w, h);
      }

      requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
    };
  }, [velocity]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-40"
      aria-hidden="true"
    />
  );
}