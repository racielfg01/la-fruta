import { createUploadthing } from "uploadthing/next";
import type { FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { verifySession, isInvalidSession } from "@/lib/verify-session";
import { RECEIPT_MAX_BYTES } from "@/lib/receipt";

const f = createUploadthing();

/**
 * Autenticación real del subida: el token se valida contra PocketBase.
 *
 * Antes bastaba con que el token *existiera*: `decodePocketBaseToken` solo
 * deserializa el payload y no comprueba la firma, así que un token inventado
 * permitía subir imágenes de producto, categoría, banner, oferta y banco.
 *
 * El permiso por sección no se exige aquí a propósito: este endpoint solo
 * produce un archivo; quien lo adjunta a un producto, una categoría o un
 * banner es la server action de ese apartado, que ya exige su permiso
 * (`requirePermission`). Exigirlo también aquí duplicaría la puerta.
 */
async function authedUser(req: Request) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) {
    throw new UploadThingError({
      code: "FORBIDDEN",
      message: "No autorizado",
    });
  }
  try {
    return await verifySession(token);
  } catch (error) {
    // Un fallo de PocketBase no dice que el token sea inválido: se rechaza
    // la subida, pero no se trata como un token caducado.
    throw new UploadThingError({
      code: isInvalidSession(error) ? "FORBIDDEN" : "INTERNAL_SERVER_ERROR",
      message: isInvalidSession(error)
        ? "No autorizado"
        : "No se pudo validar la sesión",
    });
  }
}

export const ourFileRouter = {
  productImage: f({ image: { maxFileSize: "2MB" } })
    .middleware(async ({ req }) => {
      const session = await authedUser(req);
      return { userId: session.userId };
    })
    .onUploadComplete(({ file }) => ({ url: file.url })),

  categoryImage: f({ image: { maxFileSize: "2MB" } })
    .middleware(async ({ req }) => {
      const session = await authedUser(req);
      return { userId: session.userId };
    })
    .onUploadComplete(({ file }) => ({ url: file.url })),

  bannerImage: f({ image: { maxFileSize: "4MB" } })
    .middleware(async ({ req }) => {
      const session = await authedUser(req);
      return { userId: session.userId };
    })
    .onUploadComplete(({ file }) => ({ url: file.url })),

  offerImage: f({ image: { maxFileSize: "4MB" } })
    .middleware(async ({ req }) => {
      const session = await authedUser(req);
      return { userId: session.userId };
    })
    .onUploadComplete(({ file }) => ({ url: file.url })),

  bankLogo: f({ image: { maxFileSize: "2MB" } })
    .middleware(async ({ req }) => {
      const session = await authedUser(req);
      return { userId: session.userId };
    })
    .onUploadComplete(({ file }) => ({ url: file.url })),

  receipt: f({
    "image/jpeg": { maxFileSize: "8MB", maxFileCount: 1 },
    "image/png": { maxFileSize: "8MB", maxFileCount: 1 },
    "image/webp": { maxFileSize: "8MB", maxFileCount: 1 },
    "image/gif": { maxFileSize: "8MB", maxFileCount: 1 },
    "application/pdf": { maxFileSize: "8MB", maxFileCount: 1 },
  })
    .middleware(async ({ req, files }) => {
      const session = await authedUser(req);
      if (files.some((file) => file.size > RECEIPT_MAX_BYTES)) {
        throw new UploadThingError({
          code: "BAD_REQUEST",
          message: "El archivo supera los 5 MB",
        });
      }
      return { userId: session.userId };
    })
    .onUploadComplete(({ file }) => ({ url: file.ufsUrl })),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
