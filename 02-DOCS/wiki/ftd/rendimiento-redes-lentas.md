---
author: Raciel Ferrin
branch: main
status: in-progress
---
# Rendimiento en redes lentas

## Intent

La tienda está pensada para clientes que compran desde el móvil con datos
móviles caros y lentos. La portada tardaba **7,5 s** en pintar el contenido
principal (LCP) y descargaba **2 MB** por visita: casi todo eran fotos de
producto a tamaño completo (150-200 KB cada una) y dos fuentes TTF.

Objetivo: bajar el peso y el tiempo de la primera visita sin cambiar precios,
carrito, checkout ni el diseño.

## Qué estaba pasando (medido, no supuesto)

Línea base con Lighthouse 13, móvil simulado, contra producción:

| Métrica | Antes |
|---|---|
| LCP | 7,5 s |
| TBT | 970 ms |
| FCP | 1,3 s |
| Speed Index | 5,5 s |
| Peso total | 2.018 KB |
| Peticiones | 104 |

Causas encontradas:

1. **`/api/img` no optimizaba en producción.** La ruta depende de `sharp`; en el
   runtime de Vercel no estaba disponible y caía al camino de respaldo: 302 al
   original. `<Image>` además tenía `unoptimized: true`, así que cada foto de
   producto viajaba a tamaño completo (184 KB, 165 KB…). 20 imágenes de
   `utfs.io` = 1,1 MB.
2. **El LCP era la bienvenida.** La tarjeta de primera visita se monta después
   de la hidratación (`mounted`), así que su imagen se descubría ~2,1 s tarde:
   fases del LCP = TTFB 512 ms + espera 2.103 ms + carga 1.386 ms.
3. **Logo y favicon.** El logo del header es `/icon-512x512.png` (147 KB) a
   40×40 px; la pestaña descargaba el PNG de 192 px (33 KB).
4. **Fuentes TTF**: Playfair Bold 93 KB + Poppins Bold 70 KB.

## Scope

**Dentro**
- `next.config.mjs`: optimización de imágenes activada (AVIF/WebP + `srcset`),
  `images.unsplash.com` en `remotePatterns`, caché de transformaciones 31 días.
- `lib/image.ts`: `optimizedImageUrl` deja de construir `/api/img` y devuelve la
  URL original; el ancho y la calidad los decide el `sizes` de cada `<Image>`.
- Bienvenida: cuatro WebP locales (800×450, ~40 KB) en lugar de Unsplash, y
  `<link rel="preload">` para la primera.
- Primer banner con `priority`; tarjetas de producto sin `priority`.
- Iconos de pestaña a 48/96 px (el manifest conserva 192/512).
- Fuentes a WOFF2 autoalojadas (subconjunto latino + latino extendido):
  Playfair variable y Poppins 400/500/600/700.

**Fuera**
- Cambios de diseño, precios, carrito o checkout.
- Reestructurar la hidratación de la portada (ver «Siguiente»).
- Borrar `/api/img` y la dependencia `sharp` (queda sin uso, ver «Deuda»).

## Evidencia

Misma máquina, mismo comando, mediana de 4 pasadas (hay mucha varianza entre
pasadas; los extremos van entre paréntesis):

| Métrica | Antes | Después |
|---|---|---|
| LCP | 7,5 s | **3,3 s** (3,0–3,8) |
| TBT | 970 ms | **672 ms** (426–1.368) |
| FCP | 1,3 s | **1,13 s** |
| Speed Index | 5,5 s | **2,9 s** |
| Peso total | 2.018 KB | **~724 KB** (710–842) |
| Peticiones | 104 | 98 |

Comprobaciones puntuales en producción:

- Foto de producto: 184 KB PNG/JPEG → **18 KB AVIF** a 640 px; las miniaturas
  de la grilla piden 256 px.
- Logo del header: 147 KB → **1,6 KB AVIF** (96 px).
- Playfair: 93 KB TTF → **38 KB WOFF2** (variable, todos los pesos).
- Las 252 URLs `/_next/image` del HTML responden 200 (sin hosts fuera de
  `remotePatterns`).
- Consola del navegador en producción: 0 errores.
- Service worker (`public/sw.js`, ahora `la-fruta-v6`): deja de guardar
  respuestas con error en instalación, navegación y assets; `/onboarding/*`
  pasa a network-first con caché como respaldo; los assets con hash conservan
  cache-first. El cambio de versión descarta las entradas 404/500 que v5
  pudiera haber fijado. Cubierto por `lib/sw.test.ts`: 5 pruebas, 4 fallaron
  antes del cambio y las 259 de la suite pasan después. Sin medir aún en
  producción.

Las visitas recurrentes no ven la bienvenida: su LCP es el banner (con
`priority`), no la tarjeta de primera visita.

## Deuda y siguientes pasos

1. **El LCP de la primera visita sigue atado a la hidratación** (~3 s): la
   bienvenida solo existe tras montar React. Para bajarlo a ~1,5 s hay que
   renderizarla en el HTML y ocultarla antes del primer pintado con un script
   inline + `localStorage` (decisión de producto, no solo técnica).
2. **TBT**: el chunk de framework (react-dom, 71 KB) evalúa ~1,2 s en CPU 4×
   lenta. Partir `StoreView` o reducir el DOM inicial es el siguiente trabajo.
3. `/api/img` y `sharp` quedan sin uso; se pueden eliminar (y actualizar
   `robots.ts` y la ficha `banners-portada.md`).
4. Medir usuarios reales (CrUX / Vercel Speed Insights) antes de dar la mejora
   por cerrada.
