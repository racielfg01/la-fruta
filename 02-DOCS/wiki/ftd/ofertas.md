---
author: Raciel Ferrin
branch: main
status: done
---
# Ofertas: combos y rebajas

## Intent

La tienda solo vende productos del catálogo a su precio (con margen en CUP).
No hay forma de armar un combo («verdura surtida por 1500 CUP») ni de rebajar
un producto por tiempo limitado. Promocionar obliga a editar el producto o a
mandar mensajes manuales por WhatsApp.

El objetivo es una sección **Ofertas** en la portada con los combos y rebajas
vigentes (contador incluido), administración completa en `/admin/ofertas`, y
compra directa desde el carrito y el checkout. El precio de la oferta es
**final**: nunca se le aplica el margen de ganancia.

## Scope

**Dentro**
- Colección PB `offers` (`name`, `description`, `price`, `type`
  (`combo` | `product`), `product_id` relación a `products` solo en rebajas,
  `image`, `end_date`, `active`), lectura pública y escritura solo admin.
- Campo `offer_id` (text) en `order_items` para rastrear la línea.
- Dominio puro en `lib/offers.ts`: tipos, `isOfferActive` (activa + fecha por
  delante; fecha vacía/inútil cuenta como infinita), `toAdminOffer`,
  `toPublicOffer`, `toIsoOfferDate`, `validateOfferInput`.
- Acciones de admin en `admin.ts`: `addOfferAction`, `editOfferAction`,
  `removeOfferAction` + `offers` en `getAdminData` (orden `-created`).
- Acción pública `getPublicOffers()`: solo activas y vigentes (el filtro de
  vencimiento es en JS, no en PB).
- Página `/admin/ofertas`: tabla en escritorio y tarjetas en móvil, diálogo de
  crear/editar (tipo, producto en rebajas, precio, `datetime-local`, imagen
  por URL o subida UploadThing endpoint `offerImage` 4MB, switch activa),
  confirmación de borrado y toasts.
- Permiso `offers` en `RolePermissions` con fila «Ofertas» en el tab de roles
  y entrada «Ofertas» en el nav del admin.
- `components/offers-section.tsx`: sección en la portada bajo el carrusel,
  contador descendente en vivo (cajitas días/hrs/min/seg con tick de un
  segundo, solo en el cliente), badge Combo/Rebaja, botón Agregar. Sin
  ofertas vigentes no se renderiza nada.
- Carrito (`lib/store.ts`): línea propia por oferta con id sintético
  `offer_<idOferta>` y snapshot `CartOffer {id, type, productId, endDate,
  price}`; `addOfferItem` con tope `MAX_OFFER_QUANTITY = 99` (no hay stock que
  la respalde); `updateQuantity` usa el tope en las líneas de oferta.
- Precio final en todas las vistas: portada, carrito y checkout muestran el
  precio de la oferta convertido a la moneda sin margen (`marginPct: 0` en el
  ahorro USD).
- Enlaces del carrito: la rebaja lleva a la ficha del producto real; el combo
  vuelve al listado (`/#products`). Nunca al id sintético.
- Checkout server-side (`createOrderAction`): la línea con `offerId` se
  revalida con datos frescos (existe, activa, no vencida), el precio lo pone
  la oferta sin margen, la rebaja valida zona y stock del producto real y
  descuenta su stock; el combo guarda `product_id` vacío y no toca stock.
- Al cancelar, `restoreOrderStock` ignora los combos (`getOne('')` lanza y se
  atrapa) y repone el stock del producto rebajado.

**Fuera**
- Sin control de stock para combos: se venden sin descuento de inventario.
- Sin página dedicada de oferta: desde el carrusel/portada directo al carrito.
- Sin límite de unidades por cliente más allá del tope 99 por línea.
- Sin fecha de inicio: la oferta existe desde su creación hasta `end_date`.
- Sin ofertas automáticas (tipo «2x1») ni variantes.

## Checklist

- [x] Colección `offers` en PocketBase con lectura pública y `offer_id` en
      `order_items`.
- [x] CRUD de ofertas operativo en `/admin/ofertas` (crear, editar, activar,
      borrar) con subida de imagen `offerImage`.
- [x] Permiso `offers` en roles con fila «Ofertas» y nav «Ofertas» en el admin.
- [x] Portada: sección con solo las ofertas activas y vigentes; contador
      descendente en vivo (días/hrs/min/seg, tick de 1 s); sin ofertas no se
      renderiza la sección.
- [x] Oferta vencida o desactivada no aparece en la portada.
- [x] Precio final sin margen en portada, carrito y checkout.
- [x] Compra end-to-end: carrito → checkout → `order_items` con `offer_id`,
      stock del producto rebajado descontado y combo sin tocar stock.
- [x] Cancelación: stock del producto rebajado repuesto y combo ignorado.
- [x] `vitest run` (199/199: incluye 6 pruebas nuevas del dominio del
      contador, `isOfferActive` con instante fijo y `countdownParts`),
      `tsc --noEmit` y `pnpm build` en verde.

## Evidence

Verificado en el navegador contra `localhost:3000` y contra PocketBase
remoto con 4 ofertas sembradas («siembra de prueba» en las descripciones):
combo activo, rebaja activa del Ajo (600→420 CUP, stock 395), combo vencido
y combo desactivado.

**Portada**
- Sección «Ofertas» bajo el carrusel con 2 tarjetas: badges «Rebaja» y
  «Combo», $0.46 USD (420 CUP) y $1.63 USD (1500 CUP) convertidos sin margen,
  contadores descendentes con cajitas días/hrs/min/seg (tick de 1 s,
  `tabular-nums`).
- La vencida y la desactivada no aparecen; al vencer la rebaja del Ajo
  desapareció sola de la portada (se extendió luego la fecha para seguir
  probando).
- «Agregar» en ambas crea líneas propias en el carrito (badge del header 3).

**Carrito**
- Línea de rebaja enlaza a `/product/1780432857721` (producto real) y la de
  combo a `/#products`; chip «Oferta» en ambas; $0.46/c/u y $1.63/c/u.
- Subtotal $2.20 USD = 0.46 + 1.63 + un producto normal; cantidad del combo
  sube sin toparse con el stock del producto sintético.

**Checkout y orden real** (usuario de prueba `test-ofertas@mercatoma.test`)
- Resumen con chips «Oferta», subtotal $3.72 USD (1×420 + 2×1500 CUP).
- Orden `8ecc83e53f144b82b090b7b1e3270acb` creada: subtotal 3420 CUP sin
  margen, ítems con `offer_id` correcto, la rebaja con
  `product_id=1780432857721` y el combo con `product_id=""`.
- Stock del Ajo 395 → 394 (solo la rebaja descontó); tras la restauración
  vuelve a 395 y el combo queda ignorado (`getOne("")` lanza 404 y se atrapa).

**Admin** (`/admin/ofertas`, con rol admin asignado al usuario de prueba)
- Tabla con las 4 ofertas: tipo, producto («—» en combos), precio, fecha de
  vence y estado Vigente/Vencida/Inactiva.
- Crear «Combo CRUD de prueba» (500 CUP, vence 13 nov 12:00 local): toast
  «Oferta creada», fila nueva, registro en PB con `end_date` UTC correcto
  (17:00Z = 12:00 local) y `product_id` vacío.
- Toggle de activa desde la tabla: `active=false` persistido en PB.
- Editar el precio 500 → 450: diálogo precargado (incluida la fecha vuelta a
  `datetime-local` local) y PB actualizado sin tocar el resto.
- Borrar con confirmación: la fila desaparece y quedan las 4 sembradas.
- Tab Roles: fila «Ofertas» entre Productos y Envíos en el diálogo de rol.

**Estático**
- `pnpm vitest run` 199/199 (8 pruebas de ofertas + 6 de contador), `npx tsc --noEmit`
  sin errores, `pnpm build` compila con `/admin/ofertas` en la lista de
  rutas.

## Contador descuenta en vivo (restaurado tras la reconstrucción)

La reescritura post-reset dejó solo un tick de 30 s sin segundos. Se
restauró el diseño original (recuperado del blob inalcanzable del `.git`):
`countdownParts(endDate, now)` en `lib/offers.ts` (días, horas, minutos,
segundos, `null` si la fecha no es utilizable) + `isOfferActive` con
instante fijo (`now`), y `components/offers-section.tsx` con `OfferCountdown`
y `setInterval(..., 1000)`. Verificado en `localhost:3000`: los segundos
corren cada segundo en las ofertas de la portada y las vencidas desaparecen
sin recargar.

## Next

- Decidir el destino del usuario de prueba (`test-ofertas@mercatoma.test`,
  rol admin, 1 orden pending) y de la orden de prueba: borrar o conservar.
- Valorar `offer` como `link_type` de los banners para enlazar una franja a
  una oferta concreta (hoy `url` lleva a `/#products`).
- Valorar mostrar el precio original tachado en la rebaja (requiere resolver
  el producto en la portada).
