import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';
import { verifySession, isInvalidSession } from '@/lib/verify-session';

export const dynamic = 'force-dynamic';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']);
const MAX_SIZE = 5 * 1024 * 1024;

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    // El token se valida contra PocketBase: decodificarlo no prueba nada,
    // porque `decodePocketBaseToken` no comprueba la firma.
    try {
      await verifySession(token);
    } catch (error) {
      // Un fallo de PocketBase (red, 5xx) no dice que el token sea inválido:
      // se rechaza la subida, pero no se trata como una sesión caducada.
      const invalid = isInvalidSession(error);
      return NextResponse.json(
        { error: invalid ? 'No autorizado' : 'No se pudo validar la sesión' },
        { status: invalid ? 401 : 503 },
      );
    }

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

    return NextResponse.json({ success: true, url: `/api/files/${filename}` });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Error al subir el archivo' }, { status: 500 });
  }
}