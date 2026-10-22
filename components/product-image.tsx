"use client";

import Image from "next/image";
import { ImageOff } from "lucide-react";
import { optimizedImageUrl } from "@/lib/image";

interface ProductImageProps {
  image: string | null | undefined;
  alt: string | null | undefined;
  /** Ancho para el optimizador (px). Debe coincidir con el tamaño de render. */
  width?: number;
  sizes?: string;
  className?: string;
  priority?: boolean;
}

/**
 * Imagen de producto con fallback: si el producto no tiene imagen renderiza
 * un marcador neutro (evita `<Image src="">`, que dispara errores de consola
 * y re-descarga de la página).
 */
export function ProductImage({
  image,
  alt,
  width = 192,
  sizes = "96px",
  className = "object-cover",
  priority = false,
}: ProductImageProps) {
  const src = optimizedImageUrl(image, width);
  if (!src) {
    return (
      <div
        aria-label={alt || "Producto sin imagen"}
        role="img"
        className="absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground"
      >
        <ImageOff className="size-5 shrink-0" aria-hidden />
      </div>
    );
  }
  return (
    <Image
      src={src}
      alt={alt || ""}
      fill
      className={className}
      sizes={sizes}
      priority={priority}
    />
  );
}
