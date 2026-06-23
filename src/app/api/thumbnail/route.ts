import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

export const dynamic = 'force-dynamic';

const IMAGES_DIR = path.join(process.cwd(), 'private', 'images');

export async function GET(req: NextRequest) {
  const src = req.nextUrl.searchParams.get('src');
  if (!src) {
    return new NextResponse('Missing src param', { status: 400 });
  }

  const filename = path.basename(src);
  const fullPath = path.join(IMAGES_DIR, filename);

  if (!fullPath.startsWith(IMAGES_DIR)) {
    return new NextResponse('Invalid path', { status: 403 });
  }

  if (!fs.existsSync(fullPath)) {
    return new NextResponse('Not found', { status: 404 });
  }

  try {
    const resized = await sharp(fullPath)
      .resize(400, undefined, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 60, progressive: true })
      .toBuffer();

    return new NextResponse(new Uint8Array(resized), {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=86400, immutable',
      },
    });
  } catch {
    return new NextResponse('Processing error', { status: 500 });
  }
}
