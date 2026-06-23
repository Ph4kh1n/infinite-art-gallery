'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/lib/store';

const navItems = [
  { label: 'About', action: 'about' as const },
  { label: 'Archive', action: 'archive' as const },
  { label: 'Contact', action: 'contact' as const },
];

export function NavigationOverlay() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const resetCamera = useStore((s) => s.resetCamera);
  const toggleAboutPanel = useStore((s) => s.toggleAboutPanel);
  const toggleArchivePanel = useStore((s) => s.toggleArchivePanel);

  const handleAction = (action: string) => {
    setMobileOpen(false);
    switch (action) {
      case 'explorer':
        resetCamera();
        break;
      case 'about':
        toggleAboutPanel();
        break;
      case 'archive':
        toggleArchivePanel();
        break;
      case 'contact':
        toggleAboutPanel();
        break;
      default:
        break;
    }
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-30">
      <div className="absolute top-0 left-0 right-0 p-4 md:p-8 flex items-start justify-between">
        <motion.div
          className="pointer-events-auto"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <button
            onClick={() => handleAction('explorer')}
            className="group"
            data-hoverable
          >
            <h1 className="font-display text-2xl md:text-display-sm lg:text-display-md text-foreground-light dark:text-foreground-dark leading-none">
              Infinite
            </h1>
            <p className="font-mono text-[8px] md:text-[10px] text-muted tracking-[0.2em] uppercase mt-1">
              Digital Exhibition
            </p>
          </button>
        </motion.div>

        <motion.nav
          className="hidden md:flex items-center gap-6 lg:gap-8 pointer-events-auto"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
        >
          {navItems.map((item) => (
            <button
              key={item.label}
              onClick={() => handleAction(item.action)}
              className="font-mono text-[11px] lg:text-xs text-foreground-light dark:text-foreground-dark tracking-wider uppercase hover:text-muted transition-colors duration-300"
              data-hoverable
            >
              {item.label}
            </button>
          ))}
        </motion.nav>

        <button
          className="md:hidden pointer-events-auto flex flex-col gap-1.5 p-2"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Menu"
        >
          <span className="block w-5 h-px bg-foreground-light dark:bg-foreground-dark" />
          <span className="block w-5 h-px bg-foreground-light dark:bg-foreground-dark" />
          <span className="block w-5 h-px bg-foreground-light dark:bg-foreground-dark" />
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="absolute top-16 right-4 pointer-events-auto bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-sm shadow-lg"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {navItems.map((item) => (
              <button
                key={item.label}
                onClick={() => handleAction(item.action)}
                className="block w-full text-left px-5 py-3 font-mono text-xs text-foreground-light dark:text-foreground-dark tracking-wider uppercase hover:bg-border-light dark:hover:bg-border-dark transition-colors first:rounded-t-sm last:rounded-b-sm"
                data-hoverable
              >
                {item.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
