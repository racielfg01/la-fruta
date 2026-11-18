import Image from "next/image";
import { cn } from "@/lib/utils";

interface BrandMarkProps {
  storeName?: string;
  logo?: string;
  compact?: boolean;
  className?: string;
}

/**
 * Marca compartida por la cabecera pública y el sidebar del panel.
 * Con el nombre por defecto se conserva el wordmark partido; con un nombre
 * configurado se muestra completo en el color primario.
 */
export function BrandMark({
  storeName,
  logo,
  compact = false,
  className,
}: BrandMarkProps) {
  const name = storeName?.trim();
  const isDefaultBrand =
    !name || name.toLowerCase().replace(/\s+/g, "") === "mercatoma";
  const size = compact ? 36 : 40;

  return (
    <span className={cn("flex items-center gap-2", className)}>
      <span
        className={cn(
          "relative shrink-0 overflow-hidden rounded-full",
          compact ? "h-9 w-9" : "h-10 w-10"
        )}
      >
        <Image
          className="object-cover"
          src={logo || "/icon-512x512.png"}
          alt={name || "logo"}
          width={size}
          height={size}
          priority
        />
      </span>
      <span
        className={cn(
          "font-[family-name:var(--font-playfair)] font-bold",
          compact ? "text-lg" : "text-2xl"
        )}
      >
        {isDefaultBrand ? (
          <>
            <span className="text-primary">Merca</span>
            <span className="text-destructive">Toma</span>
          </>
        ) : (
          <span className="text-primary">{name}</span>
        )}
      </span>
    </span>
  );
}
