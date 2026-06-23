'use client';

import { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/lib/store';

export function Lightbox() {
  const modal = useStore((s) => s.modal);
  const closeModal = useStore((s) => s.closeModal);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') closeModal();
  }, [closeModal]);

  useEffect(() => {
    if (modal.isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [modal.isOpen, handleKeyDown]);

  return (
    <AnimatePresence>
      {modal.isOpen && modal.artwork && (
        <motion.div
          className="fixed inset-0 z-[90] overflow-y-auto bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          onClick={closeModal}
          role="dialog"
          aria-modal="true"
          aria-label={modal.artwork.title}
        >
          <div className="min-h-screen flex items-center justify-center p-4 md:p-8">
            <motion.div
              className="relative w-full max-w-4xl"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="absolute -top-10 right-0 md:top-0 md:-right-10 z-10 w-10 h-10 flex items-center justify-center font-mono text-sm text-foreground-light dark:text-foreground-dark hover:text-muted transition-colors"
                onClick={closeModal}
                data-hoverable
                aria-label="Close"
              >
                ✕
              </button>

              <div className="relative overflow-hidden bg-border-light/50 dark:bg-border-dark/50 rounded-sm">
                <img
                  src={modal.artwork.src}
                  alt={modal.artwork.title}
                  className="w-full h-auto max-h-[75vh] object-contain"
                  draggable={false}
                  onContextMenu={(e) => e.preventDefault()}
                />
              </div>

              <motion.div
                className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 pb-8"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                <div className="md:col-span-2">
                  <h2 className="font-display text-display-sm text-foreground-light dark:text-foreground-dark leading-tight">
                    {modal.artwork.title}
                  </h2>
                  <p className="text-muted font-mono text-sm mt-3 leading-relaxed">
                    {modal.artwork.description}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-4">
                    {modal.artwork.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 bg-border-light dark:bg-border-dark font-mono text-[10px] text-muted uppercase tracking-wider rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="md:text-right">
                  <p className="font-mono text-xs text-muted uppercase tracking-wider">
                    Artist
                  </p>
                  <p className="font-mono text-sm text-foreground-light dark:text-foreground-dark mt-1">
                    {modal.artwork.artist}
                  </p>

                  <p className="font-mono text-xs text-muted uppercase tracking-wider mt-4">
                    Category
                  </p>
                  <p className="font-mono text-sm text-foreground-light dark:text-foreground-dark mt-1">
                    {modal.artwork.category}
                  </p>

                  {(modal.artwork.exif?.dateTaken || modal.artwork.year) && (
                    <>
                      <p className="font-mono text-xs text-muted uppercase tracking-wider mt-4">
                        Date
                      </p>
                      <p className="font-mono text-sm text-foreground-light dark:text-foreground-dark mt-1">
                        {modal.artwork.exif?.dateTaken
                          ? new Date(modal.artwork.exif.dateTaken).toLocaleDateString('en-US', {
                              year: 'numeric', month: 'long', day: 'numeric'
                            })
                          : modal.artwork.year}
                      </p>
                    </>
                  )}

                  {(modal.artwork.exif?.cameraMake || modal.artwork.exif?.cameraModel) && (
                    <>
                      <p className="font-mono text-xs text-muted uppercase tracking-wider mt-4">
                        Camera
                      </p>
                      <p className="font-mono text-sm text-foreground-light dark:text-foreground-dark mt-1">
                        {[modal.artwork.exif.cameraMake, modal.artwork.exif.cameraModel]
                          .filter(Boolean).join(' ')}
                      </p>
                    </>
                  )}

                  {modal.artwork.exif?.lensModel && (
                    <>
                      <p className="font-mono text-xs text-muted uppercase tracking-wider mt-4">
                        Lens
                      </p>
                      <p className="font-mono text-sm text-foreground-light dark:text-foreground-dark mt-1">
                        {modal.artwork.exif.lensModel}
                      </p>
                    </>
                  )}

                  {(modal.artwork.exif?.focalLength || modal.artwork.exif?.aperture || modal.artwork.exif?.shutterSpeed || modal.artwork.exif?.iso) && (
                    <>
                      <p className="font-mono text-xs text-muted uppercase tracking-wider mt-4">
                        Settings
                      </p>
                      <p className="font-mono text-sm text-foreground-light dark:text-foreground-dark mt-1">
                        {[
                          modal.artwork.exif.focalLength && `${modal.artwork.exif.focalLength}mm`,
                          modal.artwork.exif.aperture && `f/${modal.artwork.exif.aperture}`,
                          modal.artwork.exif.shutterSpeed,
                          modal.artwork.exif.iso && `ISO ${modal.artwork.exif.iso}`,
                        ].filter(Boolean).join(' · ')}
                      </p>
                    </>
                  )}

                  {modal.artwork.exif?.software && (
                    <>
                      <p className="font-mono text-xs text-muted uppercase tracking-wider mt-4">
                        Processed with
                      </p>
                      <p className="font-mono text-sm text-foreground-light dark:text-foreground-dark mt-1">
                        {modal.artwork.exif.software}
                      </p>
                    </>
                  )}
                </div>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
