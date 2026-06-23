'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { LayoutItem, Chunk, Artwork } from '@/lib/types';
import { CANVAS_CONFIG } from '@/lib/constants';
import { randomBetween, calculateVisibleBounds, isInView, generateSeed } from '@/lib/utils';

interface LayoutConfig {
  minScale: number;
  maxScale: number;
  density: number;
  seed: number;
}

export function useInfiniteLayoutEngine(config: LayoutConfig = { minScale: 0.3, maxScale: 0.8, density: 0.6, seed: 42 }) {
  const [visibleItems, setVisibleItems] = useState<LayoutItem[]>([]);
  const chunksRef = useRef<Map<string, Chunk>>(new Map());
  const visibleRef = useRef<LayoutItem[]>([]);
  const camera = useStore((s) => s.camera);
  const viewport = useStore((s) => s.viewport);
  const artworksRef = useRef<Artwork[]>([]);
  const seedGen = useRef(generateSeed(config.seed));
  const artworksVersion = useRef(0);
  const [artworksKey, setArtworksKey] = useState(0);

  const setArtworks = useCallback((arts: Artwork[]) => {
    artworksRef.current = arts;
    chunksRef.current = new Map();
    artworksVersion.current += 1;
    setArtworksKey(artworksVersion.current);
  }, []);

  const getChunkId = useCallback((chunkX: number, chunkY: number): string => {
    return `${chunkX}:${chunkY}`;
  }, []);

  const generateChunk = useCallback((chunkX: number, chunkY: number): Chunk => {
    const id = getChunkId(chunkX, chunkY);
    const baseX = chunkX * CANVAS_CONFIG.CHUNK_SIZE;
    const baseY = chunkY * CANVAS_CONFIG.CHUNK_SIZE;
    const items: LayoutItem[] = [];

    const arts = artworksRef.current;
    if (arts.length === 0) return { id, x: chunkX, y: chunkY, items, loaded: true };

    const itemsPerChunk = Math.max(4, Math.floor(arts.length * config.density * 0.8));

    for (let i = 0; i < itemsPerChunk; i++) {
      const artIndex = Math.floor(seedGen.current() * arts.length);
      const artwork = arts[artIndex];
      if (!artwork) continue;

      const scale = randomBetween(config.minScale, config.maxScale);

      const x = randomBetween(baseX - CANVAS_CONFIG.CHUNK_SIZE / 2, baseX + CANVAS_CONFIG.CHUNK_SIZE / 2);
      const y = randomBetween(baseY - CANVAS_CONFIG.CHUNK_SIZE / 2, baseY + CANVAS_CONFIG.CHUNK_SIZE / 2);

      items.push({
        artwork,
        position: { x, y },
        scale,
        rotation: randomBetween(-3, 3),
        zIndex: Math.floor(randomBetween(0, 50)),
        parallaxDepth: randomBetween(0.2, 1),
        opacity: randomBetween(0.7, 1),
      });
    }

    return { id, x: chunkX, y: chunkY, items, loaded: true };
  }, [config, getChunkId]);

  const getOrCreateChunk = useCallback((chunkX: number, chunkY: number): Chunk => {
    const id = getChunkId(chunkX, chunkY);
    const map = chunksRef.current;
    const existing = map.get(id);
    if (existing) return existing;

    const chunk = generateChunk(chunkX, chunkY);
    map.set(id, chunk);
    return chunk;
  }, [generateChunk, getChunkId]);

  const updateVisibility = useCallback(() => {
    const bounds = calculateVisibleBounds(
      camera.x, camera.y,
      viewport.width, viewport.height,
      camera.zoom,
      CANVAS_CONFIG.CULLING_PADDING
    );

    const centerChunkX = Math.round(-camera.x / CANVAS_CONFIG.CHUNK_SIZE);
    const centerChunkY = Math.round(-camera.y / CANVAS_CONFIG.CHUNK_SIZE);
    const radius = CANVAS_CONFIG.PRELOAD_CHUNK_RADIUS;

    const visible: LayoutItem[] = [];

    for (let dx = -radius; dx <= radius; dx++) {
      for (let dy = -radius; dy <= radius; dy++) {
        const cx = centerChunkX + dx;
        const cy = centerChunkY + dy;
        const chunk = getOrCreateChunk(cx, cy);

        for (const item of chunk.items) {
          const displayW = item.artwork.width * item.scale;
          const displayH = item.artwork.height * item.scale;

          if (isInView(item.position.x, item.position.y, displayW, displayH, bounds)) {
            visible.push(item);
          }
        }
      }
    }

    visible.sort((a, b) => a.zIndex - b.zIndex);

    const same =
      visibleRef.current.length === visible.length &&
      visibleRef.current.every((v, i) => v.artwork.id === visible[i].artwork.id);

    if (!same) {
      visibleRef.current = visible;
      setVisibleItems(visible);
    }
  }, [camera.x, camera.y, camera.zoom, viewport.width, viewport.height, getOrCreateChunk, artworksKey]);

  useEffect(() => {
    updateVisibility();
  }, [camera.x, camera.y, camera.zoom, viewport.width, viewport.height, updateVisibility, artworksKey]);

  return {
    visibleItems,
    setArtworks,
    updateVisibility,
  };
}