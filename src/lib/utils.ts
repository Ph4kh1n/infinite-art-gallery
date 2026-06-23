export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function lerp(start: number, end: number, factor: number): number {
  return start + (end - start) * factor;
}

export function normalize(value: number, min: number, max: number): number {
  return (value - min) / (max - min);
}

export function mapRange(value: number, inMin: number, inMax: number, outMin: number, outMax: number): number {
  return outMin + (outMax - outMin) * normalize(value, inMin, inMax);
}

export function distance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

export function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

export function randomInt(min: number, max: number): number {
  return Math.floor(randomBetween(min, max + 1));
}

export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function debounce<T extends (...args: any[]) => void>(fn: T, delay: number): T {
  let timeout: NodeJS.Timeout;
  return ((...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  }) as T;
}

export function throttle<T extends (...args: any[]) => void>(fn: T, limit: number): T {
  let inThrottle = false;
  return ((...args: any[]) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => { inThrottle = false; }, limit);
    }
  }) as T;
}

export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

export function easeOutQuart(t: number): number {
  return 1 - (1 - t) ** 4;
}

export function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - 2 ** (-10 * t);
}

export function formatTimestamp(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function getImageUrl(src: string, width: number): string {
  if (src.includes('unsplash')) {
    return src.replace(/w=\d+/, `w=${width}`);
  }
  return src;
}

export function preloadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export function calculateVisibleBounds(
  cameraX: number,
  cameraY: number,
  viewportWidth: number,
  viewportHeight: number,
  zoom: number,
  padding: number = 500
) {
  const halfW = (viewportWidth / 2) / zoom;
  const halfH = (viewportHeight / 2) / zoom;

  return {
    left: -cameraX - halfW - padding,
    right: -cameraX + halfW + padding,
    top: -cameraY - halfH - padding,
    bottom: -cameraY + halfH + padding,
  };
}

export function isInView(
  x: number,
  y: number,
  width: number,
  height: number,
  bounds: { left: number; right: number; top: number; bottom: number }
): boolean {
  return (
    x + width > bounds.left &&
    x < bounds.right &&
    y + height > bounds.top &&
    y < bounds.bottom
  );
}

export function generateSeed(seed: number): () => number {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}