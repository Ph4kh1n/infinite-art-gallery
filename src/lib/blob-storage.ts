import { put, list, del } from '@vercel/blob';
import exifr from 'exifr';

export interface ExifInfo {
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

export interface ImageMeta {
  src: string;
  width: number;
  height: number;
  ext: string;
  size: number;
  exif: ExifInfo;
}

const METADATA_PATH = 'metadata.json';

function formatShutterSpeed(exposureTime: number): string {
  if (exposureTime >= 1) return `${Math.round(exposureTime)}s`;
  const fraction = Math.round(1 / exposureTime);
  return `1/${fraction}`;
}

async function getMetadataUrl(): Promise<string | null> {
  try {
    const { blobs } = await list({ prefix: METADATA_PATH });
    return blobs.length > 0 ? blobs[0].url : null;
  } catch {
    return null;
  }
}

export async function getMetadata(): Promise<ImageMeta[]> {
  try {
    const url = await getMetadataUrl();
    if (!url) return [];
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function saveMetadata(meta: ImageMeta[]): Promise<void> {
  await put(METADATA_PATH, JSON.stringify(meta, null, 2), {
    contentType: 'application/json',
    access: 'public',
    addRandomSuffix: false,
    allowOverwrite: true,
  });
}

function parseJpegDimensions(buffer: Buffer): { width: number; height: number } {
  try {
    if (buffer[0] !== 0xFF || buffer[1] !== 0xD8) return { width: 800, height: 600 };
    let offset = 2;
    while (offset < buffer.length - 9) {
      if ((buffer[offset] & 0xFF) === 0xFF) {
        const marker = buffer[offset + 1];
        if (marker === 0x00) { offset += 2; continue; }
        if (marker >= 0xD0 && marker <= 0xD7) { offset += 2; continue; }
        if (marker === 0xD9 || marker === 0xDA) break;
        const segSize = buffer.readUInt16BE(offset + 2);
        if (segSize < 2) { offset += 2; continue; }
        if (marker === 0xC0 || marker === 0xC1 || marker === 0xC2) {
          const h = buffer.readUInt16BE(offset + 5);
          const w = buffer.readUInt16BE(offset + 7);
          if (w > 0 && h > 0 && w < 10000 && h < 10000) return { width: w, height: h };
        }
        offset += 2 + segSize;
      } else {
        offset += 1;
      }
    }
  } catch {}
  return { width: 800, height: 600 };
}

export async function uploadImage(
  filename: string,
  buffer: Buffer
): Promise<ImageMeta | null> {
  const ext = filename.substring(filename.lastIndexOf('.')).toLowerCase();
  if (!['.jpg', '.jpeg', '.png', '.gif'].includes(ext)) return null;

  const blob = await put(filename, buffer, {
    contentType: `image/${ext.replace('.', '')}`,
    access: 'public',
    addRandomSuffix: false,
  });

  let width = 800;
  let height = 600;

  if (ext === '.jpg' || ext === '.jpeg') {
    const dims = parseJpegDimensions(buffer);
    width = dims.width;
    height = dims.height;
  }

  let exifData: ExifInfo = {
    dateTaken: null,
    cameraMake: null,
    cameraModel: null,
    lensModel: null,
    focalLength: null,
    focalLengthIn35mm: null,
    aperture: null,
    shutterSpeed: null,
    iso: null,
    exposureProgram: null,
    meteringMode: null,
    software: null,
  };

  try {
    const tags = await exifr.parse(buffer, [
      'Make', 'Model', 'DateTimeOriginal', 'ISO', 'FNumber',
      'ExposureTime', 'FocalLength', 'FocalLengthIn35mmFormat',
      'LensModel', 'Software', 'ExposureProgram', 'MeteringMode',
    ]);

    if (tags) {
      exifData = {
        dateTaken: tags.DateTimeOriginal
          ? new Date(tags.DateTimeOriginal).toISOString()
          : null,
        cameraMake: tags.Make ?? null,
        cameraModel: tags.Model ?? null,
        lensModel: tags.LensModel ?? null,
        focalLength: tags.FocalLength ?? null,
        focalLengthIn35mm: tags.FocalLengthIn35mmFormat ?? null,
        aperture: tags.FNumber ?? null,
        shutterSpeed: tags.ExposureTime != null
          ? formatShutterSpeed(tags.ExposureTime)
          : null,
        iso: tags.ISO ?? null,
        exposureProgram: tags.ExposureProgram ?? null,
        meteringMode: tags.MeteringMode ?? null,
        software: tags.Software ?? null,
      };
    }
  } catch {}

  return {
    src: blob.url,
    width,
    height,
    ext,
    size: buffer.length,
    exif: exifData,
  };
}

export async function deleteImageBlob(filename: string): Promise<boolean> {
  try {
    await del(filename);
    return true;
  } catch {
    return false;
  }
}

export function isBlobConfigured(): boolean {
  return !!process.env.BLOB_READ_WRITE_TOKEN;
}
