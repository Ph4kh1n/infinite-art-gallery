import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
  const adminSecret = process.env.ADMIN_SECRET;

  return NextResponse.json({
    blob_configured: !!blobToken,
    blob_prefix: blobToken ? blobToken.substring(0, 20) + '...' : null,
    admin_configured: !!adminSecret,
  });
}
