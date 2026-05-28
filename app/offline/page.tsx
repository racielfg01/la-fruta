import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Sin conexión - La Fruta",
};

export default function OfflinePage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center p-6 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
        <svg
          className="h-10 w-10 text-muted-foreground"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M18.364 5.636a9 9 0 010 12.728M5.636 18.364a9 9 0 010-12.728M8.464 8.464a5 5 0 010 7.072M15.536 8.464a5 5 0 010 7.072M12 12h.01"
          />
        </svg>
      </div>
      <h1 className="text-2xl font-bold mb-2">Sin conexión</h1>
      <p className="text-muted-foreground mb-6 max-w-sm">
        No tienes conexión a Internet. Algunas funciones pueden no estar
        disponibles hasta que te reconectes.
      </p>
      <Link
        href="/"
        className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        Intentar de nuevo
      </Link>
    </div>
  );
}
