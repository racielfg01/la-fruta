"use client";

import { UploadButton } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";

type Endpoint = keyof OurFileRouter;

export function ImageUpload({
  endpoint,
  onUploadComplete,
  onUploadError,
  disabled,
}: {
  endpoint: Endpoint;
  onUploadComplete: (url: string) => void;
  onUploadError?: (error: Error) => void;
  disabled?: boolean;
}) {
  return (
    <UploadButton<OurFileRouter, Endpoint>
      endpoint={endpoint}
      onClientUploadComplete={(res) => {
        if (res?.[0]) onUploadComplete(res[0].url);
      }}
      onUploadError={onUploadError || (() => {})}
      {...(disabled ? { "data-disabled": true } : {})}
    />
  );
}
