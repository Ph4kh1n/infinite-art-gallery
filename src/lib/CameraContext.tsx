'use client';

import { createContext, useContext, useRef, MutableRefObject } from 'react';

export interface CameraData {
  x: number;
  y: number;
  zoom: number;
  velocity: number;
}

interface CameraContextValue {
  cameraRef: MutableRefObject<CameraData>;
  viewportRef: MutableRefObject<{ width: number; height: number }>;
  targetZoomRef: MutableRefObject<number>;
}

const CameraContext = createContext<CameraContextValue | null>(null);

export function CameraProvider({ children }: { children: React.ReactNode }) {
  const cameraRef = useRef<CameraData>({ x: 0, y: 0, zoom: 1, velocity: 0 });
  const viewportRef = useRef<{ width: number; height: number }>({
    width: typeof window !== 'undefined' ? window.innerWidth : 1920,
    height: typeof window !== 'undefined' ? window.innerHeight : 1080,
  });
  const targetZoomRef = useRef(1);

  return (
    <CameraContext.Provider value={{ cameraRef, viewportRef, targetZoomRef }}>
      {children}
    </CameraContext.Provider>
  );
}

export function useCameraContext() {
  const ctx = useContext(CameraContext);
  if (!ctx) throw new Error('useCameraContext must be used within CameraProvider');
  return ctx;
}
