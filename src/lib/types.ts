export interface Artwork {
  id: string;
  src: string;
  title: string;
  artist: string;
  year: string;
  description: string;
  width: number;
  height: number;
  category: string;
  tags: string[];
  exif?: ExifData;
}

export interface ExifData {
  dateTaken?: string;
  cameraMake?: string;
  cameraModel?: string;
  lensModel?: string;
  focalLength?: number;
  focalLengthIn35mm?: number;
  aperture?: number;
  shutterSpeed?: string;
  iso?: number;
  exposureProgram?: string;
  meteringMode?: string;
  software?: string;
}

export interface Position {
  x: number;
  y: number;
}

export interface Dimensions {
  width: number;
  height: number;
}

export interface CameraState {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  zoom: number;
  targetZoom: number;
  velocity: number;
  isDragging: boolean;
  isAnimating: boolean;
}

export interface LayoutItem {
  artwork: Artwork;
  position: Position;
  scale: number;
  rotation: number;
  zIndex: number;
  parallaxDepth: number;
  opacity: number;
}

export interface Chunk {
  id: string;
  x: number;
  y: number;
  items: LayoutItem[];
  loaded: boolean;
}

export interface ViewportState {
  width: number;
  height: number;
  centerX: number;
  centerY: number;
  visibleBounds: {
    left: number;
    right: number;
    top: number;
    bottom: number;
  };
}

export type NavigationMode = 'free' | 'drag' | 'scroll' | 'auto';

export type ThemeMode = 'light' | 'dark';

export interface ModalState {
  isOpen: boolean;
  artwork: Artwork | null;
}

export interface AboutPanelState {
  isOpen: boolean;
}

export interface TouchState {
  startX: number;
  startY: number;
  lastX: number;
  lastY: number;
  velocityX: number;
  velocityY: number;
  isActive: boolean;
}