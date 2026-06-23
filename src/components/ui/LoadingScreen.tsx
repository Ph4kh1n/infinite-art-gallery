'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/lib/store';

export function LoadingScreen() {
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const setLoading = useStore((s) => s.setLoading);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let frame = 0;
    const totalFrames = 60;

    intervalRef.current = setInterval(() => {
      frame++;

      const easedProgress = 1 - Math.pow(1 - frame / totalFrames, 2);
      setProgress(Math.min(easedProgress * 100, 100));

      if (frame >= totalFrames) {
        if (intervalRef.current) clearInterval(intervalRef.current);

        setTimeout(() => {
          setIsComplete(true);
          setTimeout(() => setLoading(false), 800);
        }, 400);
      }
    }, 20);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [setLoading]);

  return (
    <AnimatePresence>
      {!isComplete && (
        <motion.div
          className="fixed inset-0 z-[100] bg-background-light dark:bg-background-dark flex flex-col items-center justify-center"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="relative">
            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              <h1 className="font-display text-display-md text-foreground-light dark:text-foreground-dark mb-2">
                Infinite
              </h1>
              <p className="text-muted font-mono text-xs tracking-[0.3em] uppercase">
                Digital Exhibition
              </p>
            </motion.div>

            <motion.div
              className="mt-12 flex items-center gap-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              <div className="w-32 h-[1px] bg-border-light dark:bg-border-dark relative overflow-hidden">
                <motion.div
                  className="absolute inset-y-0 left-0 bg-foreground-light dark:bg-foreground-dark"
                  style={{ width: `${progress}%` }}
                  transition={{ duration: 0.1 }}
                />
              </div>
              <span className="font-mono text-[10px] text-muted tabular-nums">
                {Math.round(progress)}%
              </span>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}