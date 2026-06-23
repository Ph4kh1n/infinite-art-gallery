'use client';

import { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/lib/store';
import { useLocalImages } from '@/hooks/useLocalImages';
import { Artwork } from '@/lib/types';

export function ArchivePanel() {
  const archivePanel = useStore((s) => s.archivePanel);
  const toggleArchivePanel = useStore((s) => s.toggleArchivePanel);
  const openModal = useStore((s) => s.openModal);
  const closeModal = useStore((s) => s.closeModal);
  const { artworks } = useLocalImages();

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && archivePanel.isOpen) toggleArchivePanel();
  }, [archivePanel.isOpen, toggleArchivePanel]);

  useEffect(() => {
    if (archivePanel.isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [archivePanel.isOpen, handleKeyDown]);

  const handleArtworkClick = useCallback((artwork: Artwork) => {
    openModal(artwork);
  }, [openModal]);

  return (
    <AnimatePresence>
      {archivePanel.isOpen && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          onClick={toggleArchivePanel}
        >
          <motion.div
            className="absolute inset-0 bg-background-light/85 dark:bg-background-dark/85 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          <motion.div
            className="relative w-full h-full max-w-6xl mx-auto p-6 md:p-12 overflow-y-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-8 md:mb-12">
              <h2 className="font-display text-display-sm text-foreground-light dark:text-foreground-dark">
                Archive
              </h2>
              <button
                onClick={toggleArchivePanel}
                className="w-10 h-10 flex items-center justify-center font-mono text-sm text-muted hover:text-foreground-light dark:hover:text-foreground-dark transition-colors"
                data-hoverable
                aria-label="Close archive"
              >
                ✕
              </button>
            </div>

            {artworks.length === 0 && (
              <p className="font-mono text-sm text-muted">No artworks loaded.</p>
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {artworks.map((artwork, i) => (
                <motion.button
                  key={artwork.id}
                  className="group relative aspect-[4/3] overflow-hidden bg-border-light dark:bg-border-dark rounded-sm"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  onClick={() => handleArtworkClick(artwork)}
                  data-hoverable
                >
                  <img
                    src={artwork.src}
                    alt={artwork.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <p className="text-white text-xs font-mono tracking-wider uppercase text-left">
                        {artwork.title}
                      </p>
                      <p className="text-white/60 text-[10px] font-mono mt-0.5 text-left">
                        {artwork.artist}
                      </p>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}