import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  try {
    const { path: segs } = await params;
    const safePath = segs.join('/').replace(/\.\./g, '').replace(/^\/+/, '');
    const fullPath = path.join(process.cwd(), 'public', 'uploads', safePath);
    const real = path.resolve(fullPath);
    if (!real.startsWith(path.join(process.cwd(), 'public', 'uploads'))) {
      return new NextResponse('Forbidden', { status: 403 });
    }
    const buf = await fs.readFile(real);
    const ext = path.extname(safePath).toLowerCase();
    const mimeMap: Record<string, string> = {
      '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
      '.webp': 'image/webp', '.gif': 'image/gif', '.pdf': 'application/pdf',
    };
    const mime = mimeMap[ext] || 'application/octet-stream';
    return new NextResponse(buf, { headers: { 'Content-Type': mime, 'Cache-Control': 'public, max-age=31536000, immutable' } });
  } catch {
    return new NextResponse('Not found', { status: 404 });
  }
}