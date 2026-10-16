import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { createHash } from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CACHE_DIR = path.join(process.cwd(), ".next", "cache", "img");
const PUBLIC_DIR = path.resolve(process.cwd(), "public");
const MAX_WIDTH = 2000;
const FETCH_TIMEOUT_MS = 8000;

function hostAllowed(hostname: string) {
  return hostname === "utfs.io" || hostname.endsWith(".ufs.sh");
}

function isRemote(src: string) {
  return src.startsWith("http://") || src.startsWith("https://");
}

function redirectTo(src: string) {
  return NextResponse.redirect(src, 302);
}

const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".avif": "image/avif",
  ".svg": "image/svg+xml",
};

function contentTypeFor(src: string) {
  const ext = path.extname(src.split("?")[0]).toLowerCase();
  return CONTENT_TYPES[ext] || "application/octet-stream";
}

function originalResponse(src: string, buf: Buffer) {
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": contentTypeFor(src),
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}

async function readSource(src: string): Promise<Buffer> {
  if (src.startsWith("/")) {
    const rel = decodeURIComponent(src.split("?")[0]).replace(/^\/+/, "");
    const full = path.resolve(PUBLIC_DIR, rel);
    if (full !== PUBLIC_DIR && !full.startsWith(PUBLIC_DIR + path.sep)) {
      throw new Error("forbidden path");
    }
    return fs.readFile(full);
  }
  const url = new URL(src);
  if (url.protocol !== "https:" || !hostAllowed(url.hostname)) {
    throw new Error("forbidden host");
  }
  const res = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  if (!res.ok) throw new Error(`upstream ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

function webpResponse(buf: Buffer) {
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": "image/webp",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}

// sharp es nativo: no está garantizado en todos los runtimes serverless
// (p. ej. Vercel). Se carga perezosamente para que su ausencia no tumbe la
// ruta; sin él servimos la imagen original (o redirigimos a su CDN).
async function loadSharp() {
  try {
    const mod = await import("sharp");
    return mod.default ?? mod;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const sp = new URL(req.url).searchParams;
  const src = sp.get("src");
  const width = Math.min(Math.max(Number(sp.get("w")) || 0, 0), MAX_WIDTH);
  const quality = Math.min(Math.max(Number(sp.get("q")) || 72, 1), 100);

  if (!src) return new NextResponse("missing src", { status: 400 });

  const remote = isRemote(src);
  const sharp = await loadSharp();

  // Sin optimizador: no gastamos egress de servidor; el navegador va directo al
  // origen para las remotas, y para las locales servimos el archivo tal cual.
  if (!sharp) {
    if (remote) return redirectTo(src);
    try {
      return originalResponse(src, await readSource(src));
    } catch {
      return new NextResponse("not found", { status: 404 });
    }
  }

  let input: Buffer;
  try {
    input = await readSource(src);
  } catch {
    if (remote) return redirectTo(src);
    return new NextResponse("not found", { status: 404 });
  }

  const key = createHash("sha1").update(`${src}|${width}|${quality}`).digest("hex");
  const cachePath = path.join(CACHE_DIR, `${key}.webp`);

  try {
    return webpResponse(await fs.readFile(cachePath));
  } catch {
    // not cached yet
  }

  try {
    let pipeline = sharp(input, { failOn: "none" }).rotate();
    if (width) pipeline = pipeline.resize({ width, withoutEnlargement: true });
    const out = await pipeline.webp({ quality }).toBuffer();
    try {
      await fs.mkdir(CACHE_DIR, { recursive: true });
      await fs.writeFile(cachePath, out);
    } catch {
      // read-only filesystem: skip caching but still serve
    }
    return webpResponse(out);
  } catch {
    if (remote) return redirectTo(src);
    return originalResponse(src, input);
  }
}
