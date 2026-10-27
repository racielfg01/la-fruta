---
author: Raciel Ferrin
branch: main
status: done
---

# SEO: verduras a domicilio en Santiago de Cuba

## Intent

Que quien busque «verduras a domicilio en Santiago de Cuba» encuentre MercaToma y
pueda entrar a un producto concreto desde Google.

Hoy la tienda es invisible para un buscador: los metadatos están en inglés y son de
plantilla, no hay `robots.txt` ni `sitemap.xml`, y la portada y las fichas se pintan en
el cliente. El HTML que recibe Google no tiene ni un producto: solo un spinner y el
título «MercaToma - Fresh Farm Products Delivered».

Dominio público: `https://mercatoma.vercel.app`.

## Scope

**Dentro**

- Metadatos base en español: título, descripción, canónico, Open Graph y Twitter.
- `robots.txt` con las rutas privadas fuera y el `sitemap.xml` enlazado.
- `sitemap.xml` con la portada, las páginas legales y los 12 productos visibles.
- Portada renderizada en servidor, con los productos y un `h1` con la frase objetivo.
- Fichas de producto renderizadas en servidor, con título y descripción propios,
  canónico, imagen para compartir y datos estructurados `Product` + `Offer` +
  `BreadcrumbList`.
- `Organization` y `WebSite` en la portada, con la zona servida y el WhatsApp.
- Imagen Open Graph de 1200×630 generada por la app.
- Títulos de las páginas existentes sin duplicar «| MercaToma»; canónicos en las
  legales; `noindex` en acceso y fuera de línea.
- La bienvenida de primera visita pasa a ser una capa sobre la tienda, para que el
  HTML de la portada nunca quede tapado por ella.

**Fuera**

- Reescribir las descripciones de producto (hoy son de una línea: «Frescos y limpios»).
  Queda anotado como el siguiente trabajo de contenido.
- URLs con nombre (`/product/boniato`) en lugar del id numérico.
- Google Search Console, verificación de propiedad y envío manual del sitemap: necesita
  la cuenta del dueño.
- Enlaces externos, reseñas, prensa y campañas. Sin autoridad externa no hay primera
  posición, y eso no se resuelve con código.
- Métricas de Core Web Vitals de campo (CrUX): el dominio aún no tiene tráfico
  suficiente para que Google publique datos p75.

## Checklist

- [x] Metadatos base en español y `metadataBase` al dominio real — `curl /` muestra
      título y descripción en español, `og:url` y canónico absolutos.
- [x] `robots.txt` con privadas fuera, `/api/img` permitido y sitemap enlazado —
      `curl /robots.txt` responde 200 con esas reglas.
- [x] `sitemap.xml` con portada, legales y 12 productos — `curl /sitemap.xml` responde
      200 y contiene las 12 URLs `/product/…`.
- [x] Portada en servidor con productos y un solo `h1` con la frase objetivo —
      `curl /` contiene nombres de producto y un único `<h1>`; sin JavaScript.
- [x] Fichas en servidor con metadatos y JSON-LD — `curl /product/<id>` trae nombre,
      precio y `application/ld+json` válido con `Product`, `Offer` y `BreadcrumbList`.
- [x] `Organization` + `WebSite` en la portada — JSON-LD válido con nombre, dominio,
      zona servida y teléfono.
- [x] Imagen Open Graph 1200×630 — `curl -I /opengraph-image` responde `image/png`.
- [x] Legales con canónico y títulos sin marca duplicada; acceso y fuera de línea con
      `noindex` — comprobado en el HTML de cada ruta.
- [x] Sin regresiones en la tienda — bienvenida de primera visita, filtros, ficha y
      carrito siguen funcionando; `npx tsc --noEmit` y `npm run build` limpios.

## Evidence

Verificado el 27 de octubre de 2026 sobre `next start` en `localhost:3100` (build de
producción).

- **Metadatos de portada.** `curl /` → 200. `<title>` «Verduras y viandas a domicilio
  en Santiago de Cuba» (50 caracteres), descripción de 136, canónico
  `https://mercatoma.vercel.app`, `og:title`, `og:description`, `og:url`,
  `twitter:card`. Un solo `<h1>`.
- **Portada en servidor.** El HTML de `/` (111 KB, sin ejecutar JavaScript) contiene
  los 12 enlaces `/product/…` y el bloque local con el `h2` «Entrega de verduras y
  viandas a domicilio en Santiago de Cuba».
- **Datos estructurados de portada.** Un `<script type="application/ld+json">` válido
  con `Organization` (MercaToma, `areaServed` Santiago de Cuba, teléfono
  +5352013998) y `WebSite`.
- **Ficha de producto.** `/product/1780349898731` → 200; título «Boniato a domicilio en
  Santiago de Cuba», descripción propia, canónico propio, `og:image` del producto,
  `h1` «Boniato». JSON-LD válido: `Product` con `Offer` 0.10 USD, `InStock` y
  `BreadcrumbList` de 2 elementos. `/product/1780432857721` → 0.77 USD.
- **Robots y sitemap.** `/robots.txt` → 200: permite `/` y `/api/img`, cierra admin,
  perfil, carrito, checkout, auth, offline y las APIs de subida; enlaza el sitemap.
  `/sitemap.xml` → 200 con 16 URLs: portada, contacto, términos, privacidad y los 12
  productos.
- **Imagen social.** `/opengraph-image` → 200 `image/png`, 93 839 bytes, 1200×630.
- **Legales y privadas.** Contacto, términos y privacidad responden con canónico propio
  y título sin marca duplicada. `/auth/login` y `/offline` llevan
  `noindex, nofollow`. Un producto inexistente responde 404 real con `noindex`.
- **Regresión de tienda (Playwright).** Primera visita: la bienvenida aparece como capa
  fija sobre la tienda; al omitirla se abre el diálogo de zona. 12 productos, un `h1`,
  «Agregar» deja 1 artículo (Ajo) y el carrito muestra $0.77 USD. Sin errores de
  hidratación en consola (solo el 404 de Vercel Insights en local).
- **Compilación.** `npx tsc --noEmit` limpio y `npm run build` completa 25 páginas sin
  errores.

Límites observados, sin maquillar:

- El HTML inicial de las tarjetas muestra el precio base en CUP sin etiqueta de moneda
  ($80.00) y se corrige a USD al hidratar; el JSON-LD ya declara el precio final (USD).
  Google ejecuta JavaScript, así que ve el valor hidratado.
- Con dos banners activos el `h1` de la portada es `sr-only`; la frase objetivo también
  está visible en el `h2` de la sección local.
- No hay estadísticas ni fuentes citables para GEO; el contenido local se limita a lo
  que la tienda puede afirmar (productos, zona, pago).

## Next

Escribir una descripción real de cada producto (qué es, cómo se usa, procedencia) y
valorar URLs con nombre. Sin contenido propio, los datos estructurados no bastan para
competir por la frase objetivo.
