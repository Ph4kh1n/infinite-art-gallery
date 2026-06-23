import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import exifr from 'exifr';

interface ExifInfo {
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

interface ImageInfo {
  src: string;
  width: number;
  height: number;
  ext: string;
  size: number;
  exif: ExifInfo;
}

function getImageDimensions(filePath: string, ext: string): { width: number; height: number } {
  try {
    const fd = fs.openSync(filePath, 'r');

    if (ext === '.jpg' || ext === '.jpeg') {
      const stat = fs.fstatSync(fd);
      const readSize = Math.min(stat.size, 131072);
      const buffer = Buffer.alloc(readSize);
      const bytesRead = fs.readSync(fd, buffer, 0, readSize, 0);

      if (bytesRead < 2 || buffer[0] !== 0xFF || buffer[1] !== 0xD8) {
        fs.closeSync(fd);
        return { width: 800, height: 600 };
      }

      let offset = 2;
      while (offset < bytesRead - 9) {
        if ((buffer[offset] & 0xFF) === 0xFF) {
          const marker = buffer[offset + 1];
          if (marker === 0x00) {
            offset += 2;
            continue;
          }

          if (marker >= 0xD0 && marker <= 0xD7) {
            offset += 2;
            continue;
          }

          if (marker === 0xD9 || marker === 0xDA) break;

          const segSize = buffer.readUInt16BE(offset + 2);
          if (segSize < 2) { offset += 2; continue; }

          if (marker === 0xC0 || marker === 0xC1 || marker === 0xC2) {
            const height = buffer.readUInt16BE(offset + 5);
            const width = buffer.readUInt16BE(offset + 7);
            if (width > 0 && height > 0 && width < 10000 && height < 10000) {
              fs.closeSync(fd);
              return { width, height };
            }
          }

          offset += 2 + segSize;
        } else {
          offset += 1;
        }
      }

      fs.closeSync(fd);
      return { width: 800, height: 600 };
    }

    const buffer = Buffer.alloc(48);
    const bytesRead = fs.readSync(fd, buffer, 0, 48, 0);
    fs.closeSync(fd);

    if (bytesRead < 24) return { width: 800, height: 600 };

    if (ext === '.png') {
      if (buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
        const width = buffer.readUInt32BE(16);
        const height = buffer.readUInt32BE(20);
        if (width > 0 && height > 0 && width < 10000 && height < 10000) {
          return { width, height };
        }
      }
    }

    if (ext === '.gif') {
      if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
        const width = buffer.readUInt16LE(6);
        const height = buffer.readUInt16LE(8);
        if (width > 0 && height > 0 && width < 10000 && height < 10000) {
          return { width, height };
        }
      }
    }

    return { width: 800, height: 600 };
  } catch {
    return { width: 800, height: 600 };
  }
}

function formatShutterSpeed(exposureTime: number): string {
  if (exposureTime >= 1) return `${Math.round(exposureTime)}s`;
  const fraction = Math.round(1 / exposureTime);
  return `1/${fraction}`;
}

async function getExifData(filePath: string): Promise<ExifInfo> {
  try {
    const tags = await exifr.parse(filePath, [
      'Make', 'Model', 'DateTimeOriginal', 'ISO', 'FNumber',
      'ExposureTime', 'FocalLength', 'FocalLengthIn35mmFormat',
      'LensModel', 'Software', 'ExposureProgram', 'MeteringMode',
    ]);

    return {
      dateTaken: tags?.DateTimeOriginal
        ? new Date(tags.DateTimeOriginal).toISOString()
        : null,
      cameraMake: tags?.Make ?? null,
      cameraModel: tags?.Model ?? null,
      lensModel: tags?.LensModel ?? null,
      focalLength: tags?.FocalLength ?? null,
      focalLengthIn35mm: tags?.FocalLengthIn35mmFormat ?? null,
      aperture: tags?.FNumber ?? null,
      shutterSpeed: tags?.ExposureTime != null
        ? formatShutterSpeed(tags.ExposureTime)
        : null,
      iso: tags?.ISO ?? null,
      exposureProgram: tags?.ExposureProgram ?? null,
      meteringMode: tags?.MeteringMode ?? null,
      software: tags?.Software ?? null,
    };
  } catch {
    return {
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
  }
}

export const dynamic = 'force-dynamic';

export async function GET() {
  const imagesDir = path.join(process.cwd(), 'private', 'images');

  if (!fs.existsSync(imagesDir)) {
    return NextResponse.json({ images: [] });
  }

  const files = fs.readdirSync(imagesDir);
  const imageExtensions = /\.(jpg|jpeg|png|gif)$/i;

  const results: (ImageInfo | null)[] = await Promise.all(
    files
      .filter((f) => imageExtensions.test(f))
      .map(async (filename) => {
        const ext = path.extname(filename).toLowerCase();
        const filePath = path.join(imagesDir, filename);

        try {
          const stats = fs.statSync(filePath);
          const dims = getImageDimensions(filePath, ext);
          const exif = await getExifData(filePath);

          return {
            src: `/api/image?file=${encodeURIComponent(filename)}`,
            width: dims.width,
            height: dims.height,
            ext,
            size: stats.size,
            exif,
          };
        } catch {
          return null;
        }
      })
  );

  const validImages = results.filter((img): img is ImageInfo => img !== null);
  return NextResponse.json({ images: validImages });
}