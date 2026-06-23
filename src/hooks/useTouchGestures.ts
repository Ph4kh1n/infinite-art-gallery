'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useStore } from '@/lib/store';
import { useCameraContext } from '@/lib/CameraContext';
import { CANVAS_CONFIG } from '@/lib/constants';
import { clamp } from '@/lib/utils';

export function useTouchGestures() {
  const { cameraRef, targetZoomRef } = useCameraContext();
  const setTouch = useStore((s) => s.setTouch);

  const lastTouchTime = useRef(0);
  const touchPositions = useRef<{ x: number; y: number; time: number }[]>([]);
  const pinchStartDist = useRef(0);
  const pinchStartZoom = useRef(1);

  const getTouchDistance = useCallback((touches: TouchList): number => {
    if (touches.length < 2) return 0;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (e.touches.length === 1) {
      const touchX = e.touches[0].clientX;
      const touchY = e.touches[0].clientY;

      setTouch({
        startX: touchX,
        startY: touchY,
        lastX: touchX,
        lastY: touchY,
        velocityX: 0,
        velocityY: 0,
        isActive: true,
      });

      touchPositions.current = [{ x: touchX, y: touchY, time: Date.now() }];
      lastTouchTime.current = Date.now();
    } else if (e.touches.length === 2) {
      pinchStartDist.current = getTouchDistance(e.touches);
      pinchStartZoom.current = cameraRef.current.zoom;
    }
  }, [setTouch, cameraRef, getTouchDistance]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    e.preventDefault();

    if (e.touches.length === 2) {
      const dist = getTouchDistance(e.touches);
      const scale = dist / pinchStartDist.current;
      const newZoom = clamp(
        pinchStartZoom.current * scale,
        CANVAS_CONFIG.ZOOM_MIN,
        CANVAS_CONFIG.ZOOM_MAX
      );
      targetZoomRef.current = newZoom;
      return;
    }

    if (e.touches.length !== 1) return;

    const touchX = e.touches[0].clientX;
    const touchY = e.touches[0].clientY;
    const now = Date.now();

    const touchState = useStore.getState().touch;
    const dx = touchX - touchState.lastX;
    const dy = touchY - touchState.lastY;

    const dt = now - lastTouchTime.current;
    const vx = dt > 0 ? dx / dt : 0;
    const vy = dt > 0 ? dy / dt : 0;

    setTouch({
      lastX: touchX,
      lastY: touchY,
      velocityX: vx,
      velocityY: vy,
    });

    const cam = cameraRef.current;
    cam.x -= dx * CANVAS_CONFIG.TOUCH_FACTOR / cam.zoom;
    cam.y -= dy * CANVAS_CONFIG.TOUCH_FACTOR / cam.zoom;

    touchPositions.current.push({ x: touchX, y: touchY, time: now });
    if (touchPositions.current.length > 10) touchPositions.current.shift();

    lastTouchTime.current = now;
  }, [cameraRef, targetZoomRef, setTouch, getTouchDistance]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (e.touches.length > 0) return;

    if (touchPositions.current.length > 2) {
      const recent = touchPositions.current.slice(-5);
      const first = recent[0];
      const last = recent[recent.length - 1];
      const duration = (last.time - first.time) || 16;

      const vx = ((last.x - first.x) / duration) * CANVAS_CONFIG.TOUCH_FACTOR * 2;
      const vy = ((last.y - first.y) / duration) * CANVAS_CONFIG.TOUCH_FACTOR * 2;

      const cam = cameraRef.current;
      cam.x -= vx / cam.zoom;
      cam.y -= vy / cam.zoom;
    }

    setTouch({ isActive: false });
    touchPositions.current = [];
  }, [cameraRef, setTouch]);

  useEffect(() => {
    const opts = { passive: false };

    document.addEventListener('touchstart', handleTouchStart, opts);
    document.addEventListener('touchmove', handleTouchMove, opts);
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);
}
