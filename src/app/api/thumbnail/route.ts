import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  if (!url) {
    return new NextResponse('Missing url param', { status: 400 });
  }

  try {
    const res = await fetch(url);
    if (!res.ok) return new NextResponse('Failed to fetch', { status: 502 });
    const buffer = Buffer.from(await res.arrayBuffer());

    const resized = await sharp(buffer)
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
