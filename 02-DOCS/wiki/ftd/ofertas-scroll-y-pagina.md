---
author: Raciel Ferrin
branch: main
status: in-progress
---
# Ofertas con scroll horizontal y página de ofertas

## Intent

La sección de ofertas de la portada es hoy una rejilla de tres columnas. Con
varias ofertas vivas, la rejilla se hace larga y empuja el resto de la tienda
hacia abajo: el cliente ve las ofertas o ve la tienda, no las dos cosas.

Pasarla a un listado con scroll horizontal deja las ofertas siempre a la
vista, y un enlace «Ver más» da la salida a un listado completo donde leer
cada oferta entera antes de comprar.

## Scope

**Dentro**
- `components/offers-section.tsx`: la sección de la portada pasa a carrusel
  horizontal (el de `@/components/ui/carousel`, el mismo que mueve los
  banners), con «Agregar» y un enlace «Ver más» por oferta.
- `components/offer-card.tsx` (nuevo): la tarjeta de oferta, compartida por
  la portada y la página de ofertas.
- `components/offers-list.tsx` (nuevo): el listado en rejilla de la página
  `/ofertas`, con la descripción entera.
- `app/ofertas/page.tsx` (nuevo): página pública con las ofertas vigentes,
  con metadatos (título, descripción, canonical, Open Graph).
- `lib/offers-view.ts` (nuevo): lo que las dos superficies comparten —
  qué ofertas se ven y cuál está vencida — en funciones puras.
- `app/sitemap.ts`: entrada para `/ofertas`.

**Fuera (explícito)**
- No se cambian los precios: el de una oferta es final, sin margen.
- No se cambia el contador descendente ni cómo se filtra lo vigente.
- No se toca la lógica del carrito, el checkout ni el panel de admin.
- No se crean rutas por oferta: `/ofertas` es el único destino nuevo.
- No se muestran las ofertas ya vencidas: no se pueden agregar y ensucian.

## Checklist

- [ ] `visibleOffers` e `isOfferExpired` deciden igual que antes qué se ve y
      qué está vencido — prueba: `lib/offers-view.test.ts` (6 tests).
- [ ] La sección de la portada usa el carrusel horizontal y cada oferta
      lleva su enlace «Ver más» a `/ofertas` — prueba: test de cableado en
      `lib/offers.test.ts`.
- [ ] La página `/ofertas` existe, con metadatos y con el listado de
      ofertas — prueba: test de cableado en `lib/offers.test.ts`.
- [ ] La oferta se sigue pudiendo agregar al carrito desde la portada y desde
      `/ofertas` — prueba: recorrido en navegador (producción).
- [ ] El scroll responde a flechas y a arrastre — prueba: recorrido en
      navegador (producción).
- [ ] Suite, tipos, lint y build en verde — prueba: `npx vitest run`,
      `npx tsc --noEmit`, `npx eslint .`, `npx next build`.

## Evidence

_(pendiente)_

## Next

- Revisar en móvil que el arrastre del carrusel no choca con el scroll
  vertical de la página.
