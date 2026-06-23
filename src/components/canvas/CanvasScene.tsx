'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/lib/store';
import { useLocalImages } from '@/hooks/useLocalImages';

const variants = {
  enter: (dir: number) => ({ x: dir > 0 ? '100%' : '-100%', opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir < 0 ? '100%' : '-100%', opacity: 0 }),
};

function getThumbSrc(src: string): string {
  try {
    const url = new URL(src, 'http://localhost');
    const file = url.searchParams.get('file');
    if (file) return `/api/thumbnail?src=${encodeURIComponent(file)}`;
  } catch {}
  const filename = src.split('/').pop() || src;
  return `/api/thumbnail?src=${encodeURIComponent(filename)}`;
}

function CanvasSceneInner() {
  const openModal = useStore((s) => s.openModal);
  const modalOpen = useStore((s) => s.modal.isOpen);
  const { artworks, isLoading } = useLocalImages();
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState(0);
  const [loaded, setLoaded] = useState<Set<number>>(new Set());
  const locked = useRef(false);

  const goTo = useCallback((next: number) => {
    if (locked.current || artworks.length === 0) return;
    locked.current = true;
    const delta = next - index;
    const wrapped =
      next < 0 ? artworks.length - 1
      : next >= artworks.length ? 0
      : next;
    setDir(delta > 0 || (delta < 0 && index === artworks.length - 1 && wrapped === 0) ? 1 : -1);
    setIndex(wrapped);
    setTimeout(() => { locked.current = false; }, 400);
  }, [index, artworks.length]);

  const handleWheel = useCallback((e: WheelEvent) => {
    if (modalOpen) return;
    e.preventDefault();
    const delta = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
    if (delta > 5) goTo(index + 1);
    else if (delta < -5) goTo(index - 1);
  }, [goTo, index, modalOpen]);

  useEffect(() => {
    if (artworks.length === 0) return;
    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [handleWheel, artworks.length]);

  const handleKey = useCallback((e: KeyboardEvent) => {
    if (modalOpen) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') goTo(index + 1);
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') goTo(index - 1);
  }, [goTo, index, modalOpen]);

  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  const handleClick = useCallback(() => {
    if (artworks[index]) openModal(artworks[index]);
  }, [openModal, artworks, index]);

  useEffect(() => {
    if (artworks.length === 0) return;
    const img = new window.Image();
    img.src = artworks[index].src;
    img.onload = () => {
      setLoaded((prev) => new Set(prev).add(index));
    };
  }, [index, artworks]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 overflow-hidden bg-background-light dark:bg-background-dark flex items-center justify-center transition-colors duration-700">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-foreground-light dark:border-foreground-dark border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-muted font-mono">Loading gallery...</p>
        </div>
      </div>
    );
  }

  if (artworks.length === 0) {
    return (
      <div className="fixed inset-0 overflow-hidden bg-background-light dark:bg-background-dark flex items-center justify-center transition-colors duration-700">
        <p className="text-sm text-muted font-mono">No images found.</p>
      </div>
    );
  }

  const artwork = artworks[index];
  const showFull = loaded.has(index);

  return (
    <div className="fixed inset-0 overflow-hidden bg-background-light dark:bg-background-dark transition-colors duration-700 touch-none select-none">
      <div
        className="absolute inset-0 cursor-pointer"
        onClick={handleClick}
        onContextMenu={(e) => e.preventDefault()}
      >
        <AnimatePresence initial={false} custom={dir} mode="wait">
          <motion.div
            key={index}
            custom={dir}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0 flex items-center justify-center pt-20 md:pt-24 pb-24 md:pb-28"
          >
            {showFull ? (
              <img
                src={artwork.src}
                alt={artwork.title}
                className="max-w-[92%] md:max-w-[85%] lg:max-w-[75%] max-h-[65vh] md:max-h-[75vh] object-contain pointer-events-none select-none"
                draggable={false}
                onContextMenu={(e) => e.preventDefault()}
              />
            ) : (
              <div
                className="max-w-[92%] md:max-w-[85%] lg:max-w-[75%] max-h-[65vh] md:max-h-[75vh] w-full h-full bg-border-light/50 dark:bg-border-dark/50 rounded-sm animate-pulse"
              />
            )}
          </motion.div>
        </AnimatePresence>

        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none">
          <p className="text-white font-display text-display-sm">{artwork.title}</p>
          <p className="text-white/60 font-mono text-sm mt-1">
            {artwork.artist} &middot; {artwork.year}
          </p>
        </div>
      </div>
    </div>
  );
}

export function CanvasScene() {
  return <CanvasSceneInner />;
}
