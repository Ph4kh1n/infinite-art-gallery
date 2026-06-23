import { create } from 'zustand';
import { CameraState, ModalState, AboutPanelState, ThemeMode, NavigationMode, ViewportState, TouchState, Artwork } from './types';

const STORAGE_KEY = 'theme';

function getStoredTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'light';
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'dark' || stored === 'light') return stored;
  } catch {}
  return 'light';
}

interface AppState {
  artworks: Artwork[];
  camera: CameraState;
  modal: ModalState;
  aboutPanel: AboutPanelState;
  archivePanel: { isOpen: boolean };
  theme: ThemeMode;
  navigationMode: NavigationMode;
  viewport: ViewportState;
  touch: TouchState;
  isLoading: boolean;
  dragStart: { x: number; y: number } | null;

  setArtworks: (artworks: Artwork[]) => void;
  setCamera: (camera: Partial<CameraState>) => void;
  setModal: (modal: Partial<ModalState>) => void;
  setAboutPanel: (panel: Partial<AboutPanelState>) => void;
  toggleArchivePanel: () => void;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  setNavigationMode: (mode: NavigationMode) => void;
  setViewport: (viewport: Partial<ViewportState>) => void;
  setTouch: (touch: Partial<TouchState>) => void;
  setLoading: (loading: boolean) => void;
  setDragStart: (pos: { x: number; y: number } | null) => void;
  openModal: (artwork: Artwork) => void;
  closeModal: () => void;
  toggleAboutPanel: () => void;
  resetCamera: () => void;
}

const initialCamera: CameraState = {
  x: 0,
  y: 0,
  targetX: 0,
  targetY: 0,
  zoom: 1,
  targetZoom: 1,
  velocity: 0,
  isDragging: false,
  isAnimating: false,
};

const initialViewport: ViewportState = {
  width: typeof window !== 'undefined' ? window.innerWidth : 1920,
  height: typeof window !== 'undefined' ? window.innerHeight : 1080,
  centerX: 0,
  centerY: 0,
  visibleBounds: { left: 0, right: 0, top: 0, bottom: 0 },
};

export const useStore = create<AppState>((set) => ({
  artworks: [],
  camera: initialCamera,
  modal: { isOpen: false, artwork: null },
  aboutPanel: { isOpen: false },
  archivePanel: { isOpen: false },
  theme: getStoredTheme(),
  navigationMode: 'free',
  viewport: initialViewport,
  touch: {
    startX: 0, startY: 0,
    lastX: 0, lastY: 0,
    velocityX: 0, velocityY: 0,
    isActive: false,
  },
  isLoading: true,
  dragStart: null,

  setArtworks: (artworks) => set({ artworks }),

  setCamera: (camera) => set((state) => ({
    camera: { ...state.camera, ...camera },
  })),

  setModal: (modal) => set((state) => ({
    modal: { ...state.modal, ...modal },
  })),

  setAboutPanel: (panel) => set((state) => ({
    aboutPanel: { ...state.aboutPanel, ...panel },
  })),

  setTheme: (theme) => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', theme === 'dark');
    }
    try { localStorage.setItem(STORAGE_KEY, theme); } catch {}
    set({ theme });
  },

  toggleTheme: () => set((state) => {
    const newTheme = state.theme === 'light' ? 'dark' : 'light';
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', newTheme === 'dark');
    }
    try { localStorage.setItem(STORAGE_KEY, newTheme); } catch {}
    return { theme: newTheme };
  }),

  setNavigationMode: (mode) => set({ navigationMode: mode }),
  setViewport: (viewport) => set((state) => ({
    viewport: { ...state.viewport, ...viewport },
  })),
  setTouch: (touch) => set((state) => ({
    touch: { ...state.touch, ...touch },
  })),
  setLoading: (isLoading) => set({ isLoading }),

  setDragStart: (dragStart) => set({ dragStart }),

  openModal: (artwork) => set({
    modal: { isOpen: true, artwork },
  }),

  closeModal: () => set({
    modal: { isOpen: false, artwork: null },
  }),

  toggleAboutPanel: () => set((state) => ({
    aboutPanel: { isOpen: !state.aboutPanel.isOpen },
  })),

  toggleArchivePanel: () => set((state) => ({
    archivePanel: { isOpen: !state.archivePanel.isOpen },
  })),

  resetCamera: () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('camera:reset'));
    }
    set({
      camera: {
        ...initialCamera,
        isAnimating: true,
      },
    });
  },
}));