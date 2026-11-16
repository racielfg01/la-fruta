/** @type {import('next').NextConfig} */
import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "date-fns", "@radix-ui/react-dialog", "@radix-ui/react-select", "@radix-ui/react-dropdown-menu", "@radix-ui/react-tabs", "@radix-ui/react-checkbox"],
  },
  images: {
    // Las fotos de producto llegan del CDN de UploadThing a tamaño completo
    // (150-200 KB cada una). El optimizador de Next las redimensiona al ancho
    // real, las convierte a WebP/AVIF y las cachea en el borde: en redes lentas
    // es la diferencia entre ~1,3 MB y ~150 KB de imágenes por visita.
    remotePatterns: [
      { protocol: "https", hostname: "utfs.io" },
      { protocol: "https", hostname: "*.ufs.sh" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 2678400,
  },
  async rewrites() {
    return [
      { source: "/uploads/:path*", destination: "/api/files/:path*" },
    ];
  },
}

export default withBundleAnalyzer(nextConfig)
