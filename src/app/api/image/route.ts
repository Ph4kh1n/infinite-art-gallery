import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const IMAGES_DIR = path.join(process.cwd(), 'private', 'images');

export async function GET(req: NextRequest) {
  const filename = req.nextUrl.searchParams.get('file');
  if (!filename) {
    return new NextResponse('Missing file param', { status: 400 });
  }

  const safeName = path.basename(filename);
  const fullPath = path.join(IMAGES_DIR, safeName);

  if (!fullPath.startsWith(IMAGES_DIR)) {
    return new NextResponse('Invalid path', { status: 403 });
  }

  if (!fs.existsSync(fullPath)) {
    return new NextResponse('Not found', { status: 404 });
  }

  const ext = path.extname(safeName).toLowerCase();
  const mimeMap: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
  };
  const contentType = mimeMap[ext] || 'application/octet-stream';

  const buffer = fs.readFileSync(fullPath);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': 'inline',
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'public, max-age=86400, immutable',
    },
  });
}
