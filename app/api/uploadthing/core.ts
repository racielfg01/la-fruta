import { createUploadthing } from "uploadthing/next";
import type { FileRouter } from "uploadthing/next";

const f = createUploadthing();

export const ourFileRouter = {
  productImage: f({ image: { maxFileSize: "2MB" } })
    .middleware(() => ({ userId: "admin" }))
    .onUploadComplete(({ file }) => ({ url: file.url })),

  categoryImage: f({ image: { maxFileSize: "2MB" } })
    .middleware(() => ({ userId: "admin" }))
    .onUploadComplete(({ file }) => ({ url: file.url })),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
