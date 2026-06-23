'use client';

import { useCallback, useRef, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { clamp } from '@/lib/utils';
import { CANVAS_CONFIG } from '@/lib/constants';

export function useMotionSystem() {
  const setCamera = useStore((s) => s.setCamera);
  const setDragStart = useStore((s) => s.setDragStart);

  const isDragging = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });
  const momentum = useRef({ x: 0, y: 0 });
  const rafId = useRef<number | null>(null);
  const frameHistory = useRef<{ x: number; y: number; time: number }[]>([]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    isDragging.current = true;
    lastMousePos.current = { x: e.clientX, y: e.clientY };
    setDragStart({ x: e.clientX, y: e.clientY });
    momentum.current = { x: 0, y: 0 };
    frameHistory.current = [];

    const state = useStore.getState();
    setCamera({ isDragging: true });
  }, [setCamera, setDragStart]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return;

    const dx = e.clientX - lastMousePos.current.x;
    const dy = e.clientY - lastMousePos.current.y;

    momentum.current = { x: dx, y: dy };

    frameHistory.current.push({
      x: e.clientX,
      y: e.clientY,
      time: Date.now(),
    });

    if (frameHistory.current.length > 10) {
      frameHistory.current.shift();
    }

    const state = useStore.getState();
    const zoom = state.camera.zoom;
    setCamera({
      targetX: state.camera.targetX + dx * CANVAS_CONFIG.DRAG_FACTOR / zoom,
      targetY: state.camera.targetY + dy * CANVAS_CONFIG.DRAG_FACTOR / zoom,
    });

    lastMousePos.current = { x: e.clientX, y: e.clientY };
  }, [setCamera]);

  const applyMomentum = useCallback(() => {
    const decay = 0.95;
    const minMomentum = 0.1;

    const step = () => {
      const state = useStore.getState();
      if (state.camera.isDragging) return;

      momentum.current.x *= decay;
      momentum.current.y *= decay;

      if (
        Math.abs(momentum.current.x) < minMomentum &&
        Math.abs(momentum.current.y) < minMomentum
      ) {
        return;
      }

      setCamera({
        targetX: state.camera.targetX + momentum.current.x * CANVAS_CONFIG.DRAG_FACTOR / state.camera.zoom,
        targetY: state.camera.targetY + momentum.current.y * CANVAS_CONFIG.DRAG_FACTOR / state.camera.zoom,
      });

      rafId.current = requestAnimationFrame(step);
    };

    rafId.current = requestAnimationFrame(step);
  }, [setCamera]);

  const handlePointerUp = useCallback(() => {
    isDragging.current = false;
    const state = useStore.getState();
    setCamera({ isDragging: false });

    if (frameHistory.current.length > 2) {
      const recent = frameHistory.current.slice(-3);
      const first = recent[0];
      const last = recent[recent.length - 1];
      const dt = (last.time - first.time) || 16;
      const vx = ((last.x - first.x) / dt) * CANVAS_CONFIG.DRAG_FACTOR * 0.5;
      const vy = ((last.y - first.y) / dt) * CANVAS_CONFIG.DRAG_FACTOR * 0.5;

      momentum.current = {
        x: clamp(vx, -CANVAS_CONFIG.MAX_SCROLL_SPEED, CANVAS_CONFIG.MAX_SCROLL_SPEED),
        y: clamp(vy, -CANVAS_CONFIG.MAX_SCROLL_SPEED, CANVAS_CONFIG.MAX_SCROLL_SPEED),
      };

      applyMomentum();
    }

    setDragStart(null);
  }, [setCamera, setDragStart, applyMomentum]);

  const handleScrollVelocity = useCallback((deltaX: number, deltaY: number) => {
    const state = useStore.getState();
    const zoom = state.camera.zoom || 1;
    setCamera({
      targetX: state.camera.targetX + deltaX * CANVAS_CONFIG.WHEEL_FACTOR / zoom,
      targetY: state.camera.targetY + deltaY * CANVAS_CONFIG.WHEEL_FACTOR / zoom,
    });
  }, [setCamera]);

  useEffect(() => {
    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, []);

  return {
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleScrollVelocity,
  };
}