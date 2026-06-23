import { NextRequest, NextResponse } from 'next/server';
import { getMetadata, isBlobConfigured } from '@/lib/blob-storage';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!isBlobConfigured()) {
    return NextResponse.json({ images: [] });
  }

  const images = await getMetadata();
  return NextResponse.json({ images });
}
