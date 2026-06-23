import { NextRequest, NextResponse } from 'next/server';
import { readFile, writeFile, readdir, unlink, mkdir } from 'fs/promises';
import path from 'path';

const IMAGES_DIR = path.join(process.cwd(), 'private', 'images');

const ALLOWED = ['.jpg', '.jpeg', '.png', '.gif'];
const MAX_SIZE = 4 * 1024 * 1024;

function checkAuth(token: string | null): boolean {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return false;
  return token === secret;
}

function authError() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req.nextUrl.searchParams.get('token'))) return authError();

  await mkdir(IMAGES_DIR, { recursive: true });
  const files = await readdir(IMAGES_DIR);
  const imageFiles = files.filter((f) => ALLOWED.includes(path.extname(f).toLowerCase()));
  const details = await Promise.all(
    imageFiles.map(async (f) => {
      const stat = await readFile(path.join(IMAGES_DIR, f));
      return { filename: f, size: stat.length };
    })
  );
  return NextResponse.json({ images: details });
}

export async function DELETE(req: NextRequest) {
  if (!checkAuth(req.nextUrl.searchParams.get('token'))) return authError();

  const filename = req.nextUrl.searchParams.get('file');
  if (!filename) {
    return NextResponse.json({ error: 'Missing file param' }, { status: 400 });
  }

  const safeName = path.basename(filename);
  const filePath = path.join(IMAGES_DIR, safeName);

  if (!filePath.startsWith(IMAGES_DIR)) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 403 });
  }

  try {
    await unlink(filePath);
    return NextResponse.json({ status: 'deleted', filename: safeName });
  } catch {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }
}

export async function POST(req: NextRequest) {
  if (!process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'ADMIN_SECRET not set on server' }, { status: 500 });
  }

  const form = await req.formData();
  const token = form.get('token');

  if (!checkAuth(token as string | null)) return authError();

  const files = form.getAll('file') as File[];
  if (files.length === 0) {
    return NextResponse.json({ error: 'No files provided' }, { status: 400 });
  }

  await mkdir(IMAGES_DIR, { recursive: true });

  const results: { filename: string; status: string; error?: string }[] = [];

  for (const file of files) {
    const ext = path.extname(file.name).toLowerCase();
    if (!ALLOWED.includes(ext)) {
      results.push({ filename: file.name, status: 'skipped', error: `Invalid extension ${ext}` });
      continue;
    }
    if (file.size > MAX_SIZE) {
      results.push({ filename: file.name, status: 'skipped', error: 'File too large (max 20MB)' });
      continue;
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const dest = path.join(IMAGES_DIR, file.name);
    await writeFile(dest, buffer);
    results.push({ filename: file.name, status: 'uploaded' });
  }

  return NextResponse.json({ results });
}
