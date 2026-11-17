import { describe, expect, it, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const SW_PATH = path.resolve(process.cwd(), "public/sw.js");
const ORIGIN = "https://mercatoma.vercel.app";
const OLD_CACHE = "la-fruta-v5";

type MockResponse = {
  status: number;
  ok: boolean;
  clone: () => MockResponse;
};

type FetchImpl = (request: unknown) => Promise<MockResponse>;

type SwEvent = {
  request?: unknown;
  respondWith?: (promise: Promise<MockResponse>) => void;
  waitUntil?: (promise: Promise<unknown>) => void;
};

type Handler = (event: SwEvent) => void;

function makeResponse(status = 200): MockResponse {
  return {
    status,
    ok: status >= 200 && status < 300,
    clone() {
      return makeResponse(status);
    },
  };
}

function currentCacheName(): string {
  const source = fs.readFileSync(SW_PATH, "utf8");
  const match = source.match(/const CACHE = "([^"]+)"/);
  if (!match) throw new Error("No se encontró la constante CACHE en sw.js");
  return match[1];
}

function keyOf(request: unknown): string {
  if (typeof request === "string") return new URL(request, ORIGIN).href;
  return (request as { url: string }).url;
}

function createCaches(fetchImpl: FetchImpl) {
  const stores = new Map<string, Map<string, MockResponse>>();

  const api = {
    stores,
    async open(name: string) {
      if (!stores.has(name)) stores.set(name, new Map());
      const store = stores.get(name)!;
      return {
        async put(request: unknown, response: MockResponse) {
          store.set(keyOf(request), response);
        },
        async match(request: unknown) {
          return store.get(keyOf(request));
        },
        // Emula Cache.addAll: es atómico, si una respuesta no es ok no guarda nada.
        async addAll(requests: string[]) {
          const resolved = await Promise.all(
            requests.map(async (request) => [request, await fetchImpl(request)] as const)
          );
          if (resolved.some(([, response]) => !response.ok)) {
            throw new TypeError("addAll: respuesta con error");
          }
          for (const [request, response] of resolved) {
            store.set(keyOf(request), response);
          }
        },
      };
    },
    async keys() {
      return [...stores.keys()];
    },
    async delete(name: string) {
      return stores.delete(name);
    },
    async match(request: unknown) {
      const key = keyOf(request);
      for (const store of stores.values()) {
        const found = store.get(key);
        if (found) return found;
      }
      return undefined;
    },
  };

  return api;
}

function loadSw(fetchImpl: FetchImpl) {
  const handlers: Record<string, Handler> = {};
  const caches = createCaches(fetchImpl);

  const selfMock = {
    location: { origin: ORIGIN },
    addEventListener(type: string, handler: Handler) {
      handlers[type] = handler;
    },
    skipWaiting() {},
    clients: {
      claim() {},
      matchAll: async () => [],
      openWindow: undefined,
    },
    registration: {
      showNotification: async () => {},
    },
  };

  class ResponseMock implements MockResponse {
    status: number;
    ok: boolean;
    constructor(_body: unknown, init: { status?: number } = {}) {
      this.status = init.status ?? 200;
      this.ok = this.status >= 200 && this.status < 300;
    }
    clone() {
      return new ResponseMock(null, { status: this.status });
    }
  }

  const context = vm.createContext({
    self: selfMock,
    caches,
    fetch: fetchImpl,
    Response: ResponseMock,
    URL,
  });
  vm.runInContext(fs.readFileSync(SW_PATH, "utf8"), context, { filename: "sw.js" });

  return { handlers, caches };
}

type Sw = ReturnType<typeof loadSw>;

function makeRequest(url: string, mode = "no-cors") {
  return { method: "GET", url, mode };
}

async function dispatchFetch(sw: Sw, request: unknown): Promise<MockResponse> {
  let pending: Promise<MockResponse> | undefined;
  sw.handlers.fetch({
    request,
    respondWith(promise: Promise<MockResponse>) {
      pending = promise;
    },
    waitUntil() {},
  });
  return await pending!;
}

async function dispatchInstall(sw: Sw): Promise<void> {
  let pending: Promise<unknown> | undefined;
  sw.handlers.install({
    waitUntil(promise: Promise<unknown>) {
      pending = promise;
    },
  });
  await pending;
}

async function dispatchActivate(sw: Sw): Promise<void> {
  let pending: Promise<unknown> | undefined;
  sw.handlers.activate({
    waitUntil(promise: Promise<unknown>) {
      pending = promise;
    },
  });
  await pending;
}

function cachedAnywhere(sw: Sw, url: string): MockResponse | undefined {
  for (const store of sw.caches.stores.values()) {
    const found = store.get(url);
    if (found) return found;
  }
  return undefined;
}

function seed(sw: Sw, url: string, response: MockResponse): void {
  const name = currentCacheName();
  if (!sw.caches.stores.has(name)) sw.caches.stores.set(name, new Map());
  sw.caches.stores.get(name)!.set(url, response);
}

describe("service worker: robustez de caché en redes lentas", () => {
  it("no guarda en caché una respuesta con error de un asset sin hash", async () => {
    const fetchMock = vi.fn(async () => makeResponse(404));
    const sw = loadSw(fetchMock);
    const url = `${ORIGIN}/onboarding/paso1.webp`;

    await dispatchFetch(sw, makeRequest(url));

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(cachedAnywhere(sw, url)).toBeUndefined();
  });

  it("sirve desde la red un asset sin hash aunque exista una copia cacheada", async () => {
    const fresh = makeResponse(200);
    const fetchMock = vi.fn(async () => fresh);
    const sw = loadSw(fetchMock);
    const url = `${ORIGIN}/onboarding/paso1.webp`;
    seed(sw, url, makeResponse(200));

    const result = await dispatchFetch(sw, makeRequest(url));

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result).toBe(fresh);
  });

  it("descarta entradas malas de la versión anterior de caché al activarse", async () => {
    const sw = loadSw(async () => makeResponse(200));
    sw.caches.stores.set(
      OLD_CACHE,
      new Map([[`${ORIGIN}/onboarding/roto.webp`, makeResponse(500)]])
    );

    await dispatchActivate(sw);

    expect(sw.caches.stores.has(OLD_CACHE)).toBe(false);
  });

  it("no precarga en caché los assets estáticos que responden con error", async () => {
    const fetchMock = vi.fn(async (request: unknown) =>
      typeof request === "string" && request.includes("icon") ? makeResponse(500) : makeResponse(200)
    );
    const sw = loadSw(fetchMock);

    await dispatchInstall(sw);

    expect(cachedAnywhere(sw, `${ORIGIN}/icon-192x192.png`)).toBeUndefined();
    expect(cachedAnywhere(sw, `${ORIGIN}/`)).toBeDefined();
  });

  it("sigue sirviendo desde caché los assets con hash sin llamar a la red", async () => {
    const fetchMock = vi.fn(async () => makeResponse(200));
    const sw = loadSw(fetchMock);
    const url = `${ORIGIN}/_next/static/chunk-abc.js`;
    const cached = makeResponse(200);
    seed(sw, url, cached);

    const result = await dispatchFetch(sw, makeRequest(url));

    expect(result).toBe(cached);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
