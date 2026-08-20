import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']);
const MAX_SIZE = 5 * 1024 * 1024;

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No se recibió ningún archivo' }, { status: 400 });
    }
    if (!ALLOWED_MIME.has(file.type)) {
      return NextResponse.json(
        { error: 'Solo se permiten imágenes (jpg, png, webp, gif) o PDF' },
        { status: 400 }
      );
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'El archivo excede los 5MB' }, { status: 400 });
    }

    const ext = file.type === 'application/pdf' ? 'pdf' : (file.type.split('/')[1] || 'bin');
    const filename = `${randomUUID()}.${ext}`;
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(path.join(UPLOAD_DIR, filename), buffer);

    return NextResponse.json({ success: true, url: `/uploads/${filename}` });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Error al subir el archivo' }, { status: 500 });
  }
}