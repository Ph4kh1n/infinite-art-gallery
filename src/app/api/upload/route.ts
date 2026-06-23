import { NextRequest, NextResponse } from 'next/server';
import {
  uploadImage,
  getMetadata,
  saveMetadata,
  deleteImageBlob,
  isBlobConfigured,
  ImageMeta,
} from '@/lib/blob-storage';

export async function GET() {
  if (!isBlobConfigured()) {
    return NextResponse.json({ error: 'Blob storage not configured. Set BLOB_READ_WRITE_TOKEN.' }, { status: 500 });
  }
  const meta = await getMetadata();
  return NextResponse.json({ images: meta });
}

export async function POST(req: NextRequest) {
  if (!isBlobConfigured()) {
    return NextResponse.json({ error: 'Blob storage not configured. Set BLOB_READ_WRITE_TOKEN.' }, { status: 500 });
  }

  if (!process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'ADMIN_SECRET not set on server' }, { status: 500 });
  }

  const form = await req.formData();
  if (form.get('token') !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const files = form.getAll('file') as File[];
  if (files.length === 0) {
    return NextResponse.json({ error: 'No files provided' }, { status: 400 });
  }

  const results: { filename: string; status: string; error?: string }[] = [];
  const newMetas: ImageMeta[] = [];
  const MAX_SIZE = 4 * 1024 * 1024;

  for (const file of files) {
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!['.jpg', '.jpeg', '.png', '.gif'].includes(ext)) {
      results.push({ filename: file.name, status: 'skipped', error: `Invalid extension ${ext}` });
      continue;
    }
    if (file.size > MAX_SIZE) {
      results.push({ filename: file.name, status: 'skipped', error: 'File too large (max 4MB)' });
      continue;
    }

    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      const meta = await uploadImage(file.name, buffer);
      if (meta) {
        newMetas.push(meta);
        results.push({ filename: file.name, status: 'uploaded' });
      } else {
        results.push({ filename: file.name, status: 'error', error: 'Upload failed' });
      }
    } catch (err) {
      results.push({ filename: file.name, status: 'error', error: String(err) });
    }
  }

  if (newMetas.length > 0) {
    const existing = await getMetadata();
    await saveMetadata([...existing, ...newMetas]);
  }

  return NextResponse.json({ results });
}

export async function DELETE(req: NextRequest) {
  if (!isBlobConfigured()) {
    return NextResponse.json({ error: 'Blob storage not configured' }, { status: 500 });
  }

  const token = req.nextUrl.searchParams.get('token');
  if (!process.env.ADMIN_SECRET || token !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const filename = req.nextUrl.searchParams.get('file');
  if (!filename) {
    return NextResponse.json({ error: 'Missing file param' }, { status: 400 });
  }

  await deleteImageBlob(filename);

  const existing = await getMetadata();
  await saveMetadata(existing.filter((m) => {
    const stored = m.src.split('/').pop();
    return stored !== filename;
  }));

  return NextResponse.json({ status: 'deleted' });
}
