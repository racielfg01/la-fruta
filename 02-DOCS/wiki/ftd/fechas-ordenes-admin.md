---
author: Raciel Ferrin
branch: main
status: done
---
# Fechas de las órdenes en `/admin/ordenes`

## Intent

En `/admin/ordenes` todas las órdenes mostraban «Fecha no disponible», y en el
detalle la tarjeta **Fechas** salía vacía. La causa: la colección `orders` de
PocketBase no tiene los campos de sistema `created`/`updated` (se quitaron del
esquema); guarda las fechas en campos autodate propios `created_at`/`updated_at`.

`mapOrder` en `app/actions/admin.ts` leía `o.created` y `o.updated`, que llegan
`undefined`, y el `formatDate` de la página recibía una fecha vacía.

## Scope

**Dentro**
- `lib/order-dates.ts`: resuelve `createdAt`/`updatedAt` prefiriendo los campos de
  sistema y cayendo en `created_at`/`updated_at`; normaliza el espacio de las
  fechas de PB (`"YYYY-MM-DD HH:mm:ss.sssZ"`) a ISO con `T` para que todos los
  navegadores lo parseen.
- `app/actions/admin.ts` (`mapOrder`): usa el helper. Arregla lista y detalle de
  `/admin/ordenes`.
- `app/actions/orders.ts` (`getUserOrders`): el mismo helper. Arregla el historial
  de «Mis órdenes» del cliente.
- `app/perfil/page.tsx`: el historial leía `order.created_at`, que la acción nunca
  devolvía; ahora usa `order.createdAt` con respaldo «Fecha no disponible».

**Fuera (explícito)**
- No se cambia el esquema de PocketBase: los datos ya estaban bien guardados; el
  fallo era solo de lectura.
- No se toca `lib/admin-db.ts` (código sin importadores) aunque repite el mismo
  mapeo; si se revive, debe usar `orderDates`.
- Sin cambios de formato/zonas horarias: se mantiene `toLocaleDateString("es-ES")`.

## Checklist

- [x] Test de regresión para las fechas de una orden — prueba: `lib/order-dates.test.ts` (rojo antes del helper, verde después)
- [x] `mapOrder` de admin devuelve `createdAt` con datos reales de PB — prueba: script contra la colección `orders`
- [x] Historial del cliente usa la misma fuente de fecha — prueba: `getUserOrders` + `/perfil`
- [x] `tsc --noEmit` sin errores y suite vitest en verde — prueba: salida de ambos comandos

## Evidence

**Esquema real de PB:** `orders` → sin `created`/`updated`; con
`created_at:autodate` y `updated_at:autodate`. Ordenar por `-created` responde
400; por `-created_at` funciona.

**Orden real `56182101211c4fd9b347a6712ab3d9bd`:**
```
created_at: "2026-11-02 20:00:44.265Z"
antes: o.created = undefined -> "Fecha no disponible"
ahora: 2 nov 2026, 15:00  (toLocaleDateString es-ES, hora local)
```

**Comandos:** `npx tsc --noEmit` → sin salida (exit 0). `npx vitest run` → 13
archivos, 86 tests en verde.

## Next

Nada pendiente. Si otra colección pierde sus campos de sistema, reutilizar
`orderDates`/`toIsoDate` en vez de leer `.created` a mano.
