'use client';

import { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/lib/store';
import { SITE_CONFIG } from '@/lib/constants';

export function AboutPanel() {
  const aboutPanel = useStore((s) => s.aboutPanel);
  const toggleAboutPanel = useStore((s) => s.toggleAboutPanel);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && aboutPanel.isOpen) toggleAboutPanel();
  }, [aboutPanel.isOpen, toggleAboutPanel]);

  useEffect(() => {
    if (aboutPanel.isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [aboutPanel.isOpen, handleKeyDown]);

  return (
    <AnimatePresence>
      {aboutPanel.isOpen && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          onClick={toggleAboutPanel}
        >
          <motion.div
            className="absolute inset-0 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          <motion.div
            className="relative max-w-2xl w-full mx-6 p-8 md:p-12 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark"
            initial={{ opacity: 0, y: 30, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.98 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={toggleAboutPanel}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center font-mono text-sm text-muted hover:text-foreground-light dark:hover:text-foreground-dark transition-colors"
              data-hoverable
              aria-label="Close"
            >
              ✕
            </button>

            <h2 className="font-display text-display-sm text-foreground-light dark:text-foreground-dark">
              {SITE_CONFIG.aboutContent.title}
            </h2>

            <p className="text-muted font-mono text-sm leading-relaxed mt-6">
              {SITE_CONFIG.aboutContent.body}
            </p>

            <div className="mt-8 pt-8 border-t border-border-light dark:border-border-dark">
              <p className="font-mono text-[10px] text-muted uppercase tracking-widest mb-4">
                Featured Artists
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
                {SITE_CONFIG.aboutContent.artists.map((artist) => (
                  <div key={artist.name} className="group cursor-default">
                    <p className="font-mono text-sm text-foreground-light dark:text-foreground-dark group-hover:text-muted transition-colors">
                      {artist.name}
                    </p>
                    <p className="font-mono text-[10px] text-muted mt-0.5">
                      {artist.role}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-8 border-t border-border-light dark:border-border-dark">
              <p className="font-mono text-[10px] text-muted uppercase tracking-widest mb-4">
                Contact
              </p>
              <div className="space-y-3">
                <a
                  href="mailto:phakhinnongthong@hotmail.com"
                  className="flex items-center gap-3 font-mono text-sm text-foreground-light dark:text-foreground-dark hover:text-muted transition-colors group"
                  data-hoverable
                >
                  <span className="w-4 text-center text-muted text-xs">✉</span>
                  phakhinnongthong@hotmail.com
                </a>
                <a
                  href="https://instagram.com/_phxknn.m"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 font-mono text-sm text-foreground-light dark:text-foreground-dark hover:text-muted transition-colors group"
                  data-hoverable
                >
                  <span className="w-4 text-center text-muted text-xs">◎</span>
                  @_phxknn.m
                </a>
                <a
                  href="https://github.com/Ph4kh1n"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 font-mono text-sm text-foreground-light dark:text-foreground-dark hover:text-muted transition-colors group"
                  data-hoverable
                >
                  <span className="w-4 text-center text-muted text-xs">⌘</span>
                  github.com/Ph4kh1n
                </a>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}