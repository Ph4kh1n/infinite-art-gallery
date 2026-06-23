'use client';

import { useState, useCallback, useRef } from 'react';
import { preloadImage } from '@/lib/utils';
import { CANVAS_CONFIG } from '@/lib/constants';

interface AssetCacheEntry {
  image: HTMLImageElement;
  loaded: boolean;
  error: boolean;
  timestamp: number;
}

export function useAssetManager() {
  const [cache] = useState(() => new Map<string, AssetCacheEntry>());
  const [loadingAssets, setLoadingAssets] = useState<Set<string>>(new Set());
  const [loadedCount, setLoadedCount] = useState(0);
  const [totalToLoad, setTotalToLoad] = useState(0);
  const loadQueue = useRef<string[]>([]);
  const isProcessing = useRef(false);

  const loadImage = useCallback(async (src: string): Promise<HTMLImageElement | null> => {
    const cached = cache.get(src);
    if (cached && cached.loaded) return cached.image;
    if (cached && cached.error) return null;

    setLoadingAssets((prev) => new Set(prev).add(src));

    try {
      const image = await preloadImage(src);
      cache.set(src, { image, loaded: true, error: false, timestamp: Date.now() });
      setLoadedCount((c) => c + 1);
      return image;
    } catch {
      cache.set(src, { image: new Image(), loaded: false, error: true, timestamp: Date.now() });
      return null;
    } finally {
      setLoadingAssets((prev) => {
        const next = new Set(prev);
        next.delete(src);
        return next;
      });
    }
  }, [cache]);

  const processQueue = useCallback(async () => {
    if (isProcessing.current || loadQueue.current.length === 0) return;
    isProcessing.current = true;

    while (loadQueue.current.length > 0) {
      const src = loadQueue.current.shift();
      if (src) {
        await loadImage(src);
      }
    }

    isProcessing.current = false;
  }, [loadImage]);

  const queueLoad = useCallback((src: string) => {
    if (cache.has(src)) return;
    loadQueue.current.push(src);
    setTotalToLoad((t) => t + 1);
    processQueue();
  }, [cache, processQueue]);

  const preloadMultiple = useCallback(async (sources: string[]) => {
    const unique = [...new Set(sources.filter((s) => !cache.has(s)))];
    setTotalToLoad((t) => t + unique.length);

    const batchSize = 4;
    for (let i = 0; i < unique.length; i += batchSize) {
      const batch = unique.slice(i, i + batchSize);
      await Promise.allSettled(batch.map((src) => loadImage(src)));
    }
  }, [cache, loadImage]);

  const getCached = useCallback((src: string): HTMLImageElement | null => {
    const entry = cache.get(src);
    return entry?.loaded ? entry.image : null;
  }, [cache]);

  const clearCache = useCallback(() => {
    cache.clear();
    setLoadedCount(0);
    setTotalToLoad(0);
    loadQueue.current = [];
  }, [cache]);

  const getProgress = useCallback(() => {
    if (totalToLoad === 0) return 1;
    return Math.min(loadedCount / totalToLoad, 1);
  }, [loadedCount, totalToLoad]);

  return {
    loadImage,
    queueLoad,
    preloadMultiple,
    getCached,
    clearCache,
    getProgress,
    isLoading: loadingAssets.size > 0,
    loadedCount,
    totalToLoad,
  };
}