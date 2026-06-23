import { Artwork } from '@/lib/types';
import { CANVAS_IMAGES } from '@/lib/constants';

export { CANVAS_IMAGES };

export function getArtworkById(id: string): Artwork | undefined {
  return CANVAS_IMAGES.find((art) => art.id === id);
}

export function getArtworksByCategory(category: string): Artwork[] {
  return CANVAS_IMAGES.filter((art) => art.category === category);
}

export function getArtworksByArtist(artist: string): Artwork[] {
  return CANVAS_IMAGES.filter((art) => art.artist === artist);
}

export function getAllCategories(): string[] {
  return [...new Set(CANVAS_IMAGES.map((art) => art.category))];
}

export function getAllArtists(): string[] {
  return [...new Set(CANVAS_IMAGES.map((art) => art.artist))];
}

export function getRandomArtwork(): Artwork {
  return CANVAS_IMAGES[Math.floor(Math.random() * CANVAS_IMAGES.length)];
}