'use client';

import { useState, useEffect, useCallback } from 'react';
import { useStore } from '@/lib/store';
import { Artwork, ExifData } from '@/lib/types';

interface RawExifInfo {
  dateTaken: string | null;
  cameraMake: string | null;
  cameraModel: string | null;
  lensModel: string | null;
  focalLength: number | null;
  focalLengthIn35mm: number | null;
  aperture: number | null;
  shutterSpeed: string | null;
  iso: number | null;
  exposureProgram: string | null;
  meteringMode: string | null;
  software: string | null;
}

interface RawImageInfo {
  src: string;
  width: number;
  height: number;
  ext: string;
  size: number;
  exif: RawExifInfo;
}

function filenameToTitle(filename: string): string {
  const name = filename.replace(/\.[^/.]+$/, '');
  return name
    .replace(/[_-]/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

const CATEGORIES = ['Abstract', 'Landscape', 'Portrait', 'Architecture', 'Still Life', 'Street', 'Nature', 'Minimal'];

function extractYear(dateTaken: string | null): string {
  if (!dateTaken) return 'Unknown';
  try {
    return new Date(dateTaken).getFullYear().toString();
  } catch {
    return 'Unknown';
  }
}

function extractDescription(img: RawImageInfo): string {
  const parts: string[] = [];
  if (img.exif.dateTaken) {
    try {
      parts.push(`Captured on ${new Date(img.exif.dateTaken).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`);
    } catch { /* ignore */ }
  }
  if (img.exif.cameraMake && img.exif.cameraModel) {
    parts.push(`Shot on ${img.exif.cameraMake} ${img.exif.cameraModel}`);
  }
  if (img.exif.lensModel) {
    parts.push(`with ${img.exif.lensModel}`);
  }
  return parts.length > 0 ? parts.join(' ') : `A photography piece.`;
}

function buildExifData(raw: RawExifInfo): ExifData {
  return {
    dateTaken: raw.dateTaken ?? undefined,
    cameraMake: raw.cameraMake ?? undefined,
    cameraModel: raw.cameraModel ?? undefined,
    lensModel: raw.lensModel ?? undefined,
    focalLength: raw.focalLength ?? undefined,
    focalLengthIn35mm: raw.focalLengthIn35mm ?? undefined,
    aperture: raw.aperture ?? undefined,
    shutterSpeed: raw.shutterSpeed ?? undefined,
    iso: raw.iso ?? undefined,
    exposureProgram: raw.exposureProgram ?? undefined,
    meteringMode: raw.meteringMode ?? undefined,
    software: raw.software ?? undefined,
  };
}

function filenameFromSrc(src: string): string {
  try {
    const url = new URL(src, 'http://localhost');
    const file = url.searchParams.get('file');
    if (file) return file;
  } catch {}
  return src.split('/').pop() || src;
}

function generateArtworkFromImage(img: RawImageInfo, index: number): Artwork {
  return {
    id: `local-${index}`,
    src: img.src,
    title: filenameToTitle(filenameFromSrc(img.src)),
    artist: '@_phxknn.m',
    year: extractYear(img.exif.dateTaken),
    description: extractDescription(img),
    width: img.width,
    height: img.height,
    category: 'Street',
    tags: ['street', 'photography', img.ext.replace('.', '')],
    exif: buildExifData(img.exif),
  };
}

export function useLocalImages(): { artworks: Artwork[]; isLoading: boolean } {
  const [isLoading, setIsLoading] = useState(true);
  const storedArtworks = useStore((s) => s.artworks);
  const setArtworks = useStore((s) => s.setArtworks);

  const fetchImages = useCallback(async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    try {
      const res = await fetch('/api/images', { signal: controller.signal });
      if (!res.ok) throw new Error('Failed to fetch images');

      const data = await res.json();
      const images = data?.images as RawImageInfo[] | undefined;

      if (!images || images.length === 0) {
        setArtworks([]);
        return;
      }

      const generated = images.map((img, i) => generateArtworkFromImage(img, i));
      setArtworks(generated);
    } catch {
      setArtworks([]);
    } finally {
      clearTimeout(timeout);
      setIsLoading(false);
    }
  }, [setArtworks]);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  return { artworks: storedArtworks, isLoading };
}