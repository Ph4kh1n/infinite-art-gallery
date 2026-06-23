'use client';

import { useEffect, useCallback } from 'react';
import { useStore } from '@/lib/store';
import { useCameraContext } from '@/lib/CameraContext';
import { CANVAS_CONFIG } from '@/lib/constants';

export function useKeyboardNavigation() {
  const { cameraRef } = useCameraContext();
  const zoom = cameraRef.current.zoom;

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const cam = cameraRef.current;
    const factor = CANVAS_CONFIG.KEYBOARD_FACTOR / cam.zoom;
    let dx = 0;
    let dy = 0;

    switch (e.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        dy = factor;
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        dy = -factor;
        break;
      case 'ArrowLeft':
      case 'a':
      case 'A':
        dx = factor;
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        dx = -factor;
        break;
      case 'Escape':
        useStore.getState().closeModal();
        useStore.getState().setAboutPanel({ isOpen: false });
        break;
      case 'f':
      case 'F':
        useStore.getState().toggleAboutPanel();
        break;
      // case 't':
      // case 'T':
      //   useStore.getState().toggleTheme();
      //   break;
      default:
        return;
    }

    if (dx !== 0 || dy !== 0) {
      e.preventDefault();
      cam.x += dx;
      cam.y += dy;
    }
  }, [cameraRef]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
