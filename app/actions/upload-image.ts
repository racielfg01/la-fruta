// app/actions/upload-image.ts
'use server';

import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

export async function uploadImage(formData: FormData): Promise<{ success: boolean; url?: string; error?: string }> {
  const file = formData.get('file') as File | null;
  if (!file) {
    return { success: false, error: 'No se envió ningún archivo' };
  }

  // Validar tipo de archivo
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  if (!allowedTypes.includes(file.type)) {
    return { success: false, error: 'Formato no soportado. Use JPG, PNG o WEBP.' };
  }

  // Validar tamaño máximo (2MB)
  const maxSize = 2 * 1024 * 1024;
  if (file.size > maxSize) {
    return { success: false, error: 'La imagen no puede superar los 2MB.' };
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Generar nombre único
  const ext = path.extname(file.name);
  const filename = `${randomUUID()}${ext}`;
  const uploadDir = path.join(process.cwd(), 'public', 'uploads');
  const filePath = path.join(uploadDir, filename);
  const publicUrl = `/uploads/${filename}`;

  try {
    // Asegurar que el directorio existe
    await mkdir(uploadDir, { recursive: true });
    await writeFile(filePath, buffer);
    return { success: true, url: publicUrl };
  } catch (error) {
    console.error('Error guardando imagen:', error);
    return { success: false, error: 'Error al guardar la imagen en el servidor' };
  }
}