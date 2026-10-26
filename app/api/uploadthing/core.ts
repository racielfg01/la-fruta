import { createUploadthing } from "uploadthing/next";
import type { FileRouter } from "uploadthing/next";
import { decodePocketBaseToken } from "@/lib/auth";

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
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
