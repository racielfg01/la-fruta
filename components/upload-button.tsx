"use client";

import "@uploadthing/react/styles.css";
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
      className="ut-button:bg-primary ut-button:text-primary-foreground ut-button:h-10 ut-button:px-4 ut-button:rounded-md ut-button:text-sm ut-button:font-medium ut-button:hover:bg-primary/90 ut-allowed-content:text-muted-foreground ut-allowed-content:text-xs ut-label:text-muted-foreground"
      {...(disabled ? { "data-disabled": true } : {})}
    />
  );
}
