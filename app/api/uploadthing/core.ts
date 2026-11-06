import { createUploadthing } from "uploadthing/next";
import type { FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { decodePocketBaseToken } from "@/lib/auth";
import { RECEIPT_MAX_BYTES } from "@/lib/receipt";

const f = createUploadthing();

export const ourFileRouter = {
  productImage: f({ image: { maxFileSize: "2MB" } })
    .middleware(({ req }) => {
      const token = req.headers.get("authorization")?.replace("Bearer ", "");
      if (!token || !decodePocketBaseToken(token)) throw new Error("No autorizado");
      return { userId: decodePocketBaseToken(token)!.userId };
    })
    .onUploadComplete(({ file }) => ({ url: file.url })),

  categoryImage: f({ image: { maxFileSize: "2MB" } })
    .middleware(({ req }) => {
      const token = req.headers.get("authorization")?.replace("Bearer ", "");
      if (!token || !decodePocketBaseToken(token)) throw new Error("No autorizado");
      return { userId: decodePocketBaseToken(token)!.userId };
    })
    .onUploadComplete(({ file }) => ({ url: file.url })),

  bannerImage: f({ image: { maxFileSize: "4MB" } })
    .middleware(({ req }) => {
      const token = req.headers.get("authorization")?.replace("Bearer ", "");
      if (!token || !decodePocketBaseToken(token)) throw new Error("No autorizado");
      return { userId: decodePocketBaseToken(token)!.userId };
    })
    .onUploadComplete(({ file }) => ({ url: file.url })),

  bankLogo: f({ image: { maxFileSize: "2MB" } })
    .middleware(({ req }) => {
      const token = req.headers.get("authorization")?.replace("Bearer ", "");
      if (!token || !decodePocketBaseToken(token)) throw new Error("No autorizado");
      return { userId: decodePocketBaseToken(token)!.userId };
    })
    .onUploadComplete(({ file }) => ({ url: file.url })),

  receipt: f({
    "image/jpeg": { maxFileSize: "8MB", maxFileCount: 1 },
    "image/png": { maxFileSize: "8MB", maxFileCount: 1 },
    "image/webp": { maxFileSize: "8MB", maxFileCount: 1 },
    "image/gif": { maxFileSize: "8MB", maxFileCount: 1 },
    "application/pdf": { maxFileSize: "8MB", maxFileCount: 1 },
  })
    .middleware(({ req, files }) => {
      const token = req.headers.get("authorization")?.replace("Bearer ", "");
      if (!token || !decodePocketBaseToken(token)) {
        throw new UploadThingError({
          code: "FORBIDDEN",
          message: "No autorizado",
        });
      }
      if (files.some((file) => file.size > RECEIPT_MAX_BYTES)) {
        throw new UploadThingError({
          code: "BAD_REQUEST",
          message: "El archivo supera los 5 MB",
        });
      }
      return { userId: decodePocketBaseToken(token)!.userId };
    })
    .onUploadComplete(({ file }) => ({ url: file.ufsUrl })),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
