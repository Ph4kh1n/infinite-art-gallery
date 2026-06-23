'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useStore } from '@/lib/store';
import { useCameraContext } from '@/lib/CameraContext';
import { lerp, clamp } from '@/lib/utils';
import { CANVAS_CONFIG } from '@/lib/constants';

const IDLE_TIMEOUT = 4000;
const AUTO_SCROLL_SPEED = 0.5;
const AUTO_SCROLL_RADIUS = 400;

export function useCameraController() {
  const setCamera = useStore((s) => s.setCamera);
  const setViewport = useStore((s) => s.setViewport);
  const { cameraRef, viewportRef, targetZoomRef } = useCameraContext();

  const rafRef = useRef<number | null>(null);
  const velocityX = useRef(0);
  const velocityY = useRef(0);
  const isAnimating = useRef(false);
  const lastTime = useRef(0);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isAutoScrolling = useRef(false);
  const autoScrollTime = useRef(0);
  const autoCenterX = useRef(0);
  const autoCenterY = useRef(0);
  const lastSyncTime = useRef(0);
  const targetX = useRef(0);
  const targetY = useRef(0);
  const updateRef = useRef<(time: number) => void>(() => {});

  const isDragging = useRef(false);
  const lastPointerPos = useRef({ x: 0, y: 0 });
  const frameHistory = useRef<{ x: number; y: number; time: number }[]>([]);

  const syncToStore = useCallback(() => {
    const cam = cameraRef.current;
    setCamera({
      x: cam.x,
      y: cam.y,
      zoom: cam.zoom,
      velocity: cam.velocity,
      isAnimating: isAnimating.current || isAutoScrolling.current,
    });
  }, [setCamera, cameraRef]);

  updateRef.current = (time: number) => {
    if (!lastTime.current) lastTime.current = time;
    const dt = Math.min((time - lastTime.current) / 16.67, 3);
    lastTime.current = time;

    const cam = cameraRef.current;

    if (isAutoScrolling.current) {
      autoScrollTime.current += dt * 0.006;
      const angle = autoScrollTime.current;
      const driftX = Math.sin(angle * 0.7) * AUTO_SCROLL_RADIUS;
      const driftY = Math.cos(angle * 0.5) * AUTO_SCROLL_RADIUS * 0.6;

      targetX.current = autoCenterX.current + driftX;
      targetY.current = autoCenterY.current + driftY;

      const dx = targetX.current - cam.x;
      const dy = targetY.current - cam.y;
      cam.x += dx * AUTO_SCROLL_SPEED * dt * 0.01;
      cam.y += dy * AUTO_SCROLL_SPEED * dt * 0.01;
      cam.zoom = lerp(cam.zoom, targetZoomRef.current, CANVAS_CONFIG.INTERPOLATION_FACTOR * dt);
      cam.velocity = 0.3;

      rafRef.current = requestAnimationFrame(updateRef.current);
      return;
    }

    if (!isDragging.current) {
      velocityX.current *= CANVAS_CONFIG.FRICTION;
      velocityY.current *= CANVAS_CONFIG.FRICTION;

      if (Math.abs(velocityX.current) < CANVAS_CONFIG.MIN_VELOCITY) velocityX.current = 0;
      if (Math.abs(velocityY.current) < CANVAS_CONFIG.MIN_VELOCITY) velocityY.current = 0;

      targetX.current += velocityX.current * dt;
      targetY.current += velocityY.current * dt;

      cam.x = lerp(cam.x, targetX.current, CANVAS_CONFIG.INTERPOLATION_FACTOR * dt);
      cam.y = lerp(cam.y, targetY.current, CANVAS_CONFIG.INTERPOLATION_FACTOR * dt);
    }

    cam.zoom = clamp(
      lerp(cam.zoom, targetZoomRef.current, CANVAS_CONFIG.INTERPOLATION_FACTOR * dt),
      CANVAS_CONFIG.ZOOM_MIN,
      CANVAS_CONFIG.ZOOM_MAX
    );
    cam.velocity = Math.sqrt(velocityX.current ** 2 + velocityY.current ** 2);

    const moving = isDragging.current ||
      Math.abs(velocityX.current) > CANVAS_CONFIG.MIN_VELOCITY ||
      Math.abs(velocityY.current) > CANVAS_CONFIG.MIN_VELOCITY ||
      Math.abs(cam.zoom - targetZoomRef.current) > 0.001;

    if (!moving) {
      isAnimating.current = false;
      targetX.current = cam.x;
      targetY.current = cam.y;
      syncToStore();
      return;
    }

    if (time - lastSyncTime.current > 50) {
      lastSyncTime.current = time;
      syncToStore();
    }

    rafRef.current = requestAnimationFrame(updateRef.current);
  };

  const stopAutoScroll = useCallback(() => {
    isAutoScrolling.current = false;
    autoScrollTime.current = 0;
    if (idleTimer.current) {
      clearTimeout(idleTimer.current);
      idleTimer.current = null;
    }
  }, []);

  const startAutoScroll = useCallback(() => {
    if (isAutoScrolling.current) return;
    autoCenterX.current = cameraRef.current.x;
    autoCenterY.current = cameraRef.current.y;
    autoScrollTime.current = 0;
    isAutoScrolling.current = true;
    if (!isAnimating.current) {
      isAnimating.current = true;
      lastTime.current = 0;
      rafRef.current = requestAnimationFrame(updateRef.current);
    }
  }, [cameraRef]);

  const resetIdleTimer = useCallback(() => {
    stopAutoScroll();
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => startAutoScroll(), IDLE_TIMEOUT);
  }, [stopAutoScroll, startAutoScroll]);

  const startLoop = useCallback(() => {
    if (!isAnimating.current && !isAutoScrolling.current) {
      isAnimating.current = true;
      lastTime.current = 0;
      rafRef.current = requestAnimationFrame(updateRef.current);
    }
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    isDragging.current = true;
    lastPointerPos.current = { x: e.clientX, y: e.clientY };
    frameHistory.current = [];
    resetIdleTimer();
    targetX.current = cameraRef.current.x;
    targetY.current = cameraRef.current.y;
    velocityX.current = 0;
    velocityY.current = 0;
    startLoop();
  }, [resetIdleTimer, startLoop, cameraRef]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return;

    const dx = e.clientX - lastPointerPos.current.x;
    const dy = e.clientY - lastPointerPos.current.y;
    lastPointerPos.current = { x: e.clientX, y: e.clientY };
    const zoom = cameraRef.current.zoom;

    cameraRef.current.x -= dx * CANVAS_CONFIG.DRAG_FACTOR / zoom;
    cameraRef.current.y -= dy * CANVAS_CONFIG.DRAG_FACTOR / zoom;
    targetX.current = cameraRef.current.x;
    targetY.current = cameraRef.current.y;

    frameHistory.current.push({ x: e.clientX, y: e.clientY, time: performance.now() });
    if (frameHistory.current.length > 10) frameHistory.current.shift();
  }, [cameraRef]);

  const handlePointerUp = useCallback(() => {
    isDragging.current = false;

    if (frameHistory.current.length > 2) {
      const recent = frameHistory.current.slice(-3);
      const first = recent[0];
      const last = recent[recent.length - 1];
      const dt = (last.time - first.time) || 16;
      const vx = ((last.x - first.x) / dt) * CANVAS_CONFIG.DRAG_FACTOR * 0.5;
      const vy = ((last.y - first.y) / dt) * CANVAS_CONFIG.DRAG_FACTOR * 0.5;

      velocityX.current = clamp(-vx, -CANVAS_CONFIG.MAX_SCROLL_SPEED, CANVAS_CONFIG.MAX_SCROLL_SPEED);
      velocityY.current = clamp(-vy, -CANVAS_CONFIG.MAX_SCROLL_SPEED, CANVAS_CONFIG.MAX_SCROLL_SPEED);
    }
  }, []);

  const addVelocity = useCallback((vx: number, vy: number) => {
    resetIdleTimer();
    velocityX.current += vx * CANVAS_CONFIG.DRAG_FACTOR;
    velocityY.current += vy * CANVAS_CONFIG.DRAG_FACTOR;
    velocityX.current = clamp(velocityX.current, -CANVAS_CONFIG.MAX_SCROLL_SPEED, CANVAS_CONFIG.MAX_SCROLL_SPEED);
    velocityY.current = clamp(velocityY.current, -CANVAS_CONFIG.MAX_SCROLL_SPEED, CANVAS_CONFIG.MAX_SCROLL_SPEED);
    startLoop();
  }, [startLoop, resetIdleTimer]);

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    resetIdleTimer();
    velocityX.current += e.deltaX * CANVAS_CONFIG.WHEEL_FACTOR * 0.02;
    velocityY.current += e.deltaY * CANVAS_CONFIG.WHEEL_FACTOR * 0.02;
    velocityX.current = clamp(velocityX.current, -CANVAS_CONFIG.MAX_SCROLL_SPEED, CANVAS_CONFIG.MAX_SCROLL_SPEED);
    velocityY.current = clamp(velocityY.current, -CANVAS_CONFIG.MAX_SCROLL_SPEED, CANVAS_CONFIG.MAX_SCROLL_SPEED);
    startLoop();
  }, [startLoop, resetIdleTimer]);

  const handleResize = useCallback(() => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    viewportRef.current = { width: w, height: h };
    setViewport({
      width: w, height: h, centerX: w / 2, centerY: h / 2,
      visibleBounds: { left: 0, right: w, top: 0, bottom: h },
    });
  }, [setViewport, viewportRef]);

  const handleCameraReset = useCallback(() => {
    targetX.current = 0;
    targetY.current = 0;
    targetZoomRef.current = 1;
    velocityX.current = 0;
    velocityY.current = 0;
    resetIdleTimer();
    startLoop();
  }, [resetIdleTimer, startLoop]);

  useEffect(() => {
    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('resize', handleResize);
    window.addEventListener('keydown', resetIdleTimer);
    window.addEventListener('camera:reset', handleCameraReset);

    handleResize();
    resetIdleTimer();

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', resetIdleTimer);
      window.removeEventListener('camera:reset', handleCameraReset);
      if (idleTimer.current) clearTimeout(idleTimer.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [handleWheel, handleResize, resetIdleTimer, handleCameraReset]);

  return {
    addVelocity, startLoop, resetIdleTimer, stopAutoScroll, isAutoScrolling,
    handlePointerDown, handlePointerMove, handlePointerUp,
  };
}