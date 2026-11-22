---
author: OpenCode
branch: main
status: done
---
# Proveedores y compras

## Intent

El panel de administración permite gestionar proveedores, registrar sus compras con precios y aplicar el stock de una compra al catálogo general. El precio que ve el admin por proveedor y producto se deriva de la compra más reciente, sin editar precios a mano.

## Scope

**Dentro**
- Alta, edición y borrado de proveedores (nombre y teléfono) en `/admin/proveedores`, con permiso `products`.
- Precios derivados: para cada proveedor, el `unit_price` de la compra más reciente de ese producto.
- Histórico de compras con notas, fecha, líneas de producto, cantidad y precio unitario. Crear una compra no modifica el stock.
- Botón “Agregar stock” por compra: suma las cantidades a `products.stock` y marca `in_stock: true`; es idempotente por compra mediante un reclamo único en `stock_applications` dentro del mismo batch.
- Detección de setup incompleto: la vista se degrada con aviso si falta alguna de las colecciones que usa, incluidas `purchases`, `purchase_items` y `stock_applications`.

**Fuera**
- Stock por zona (`product_locations`): el botón solo toca el stock general.
- Edición de compras ya creadas (solo alta y borrado).
- Emails o notificaciones a proveedores.

## Checklist

- [x] Dominio y validaciones en `lib/suppliers.ts`, con pruebas (`lib/suppliers.test.ts`).
- [x] Colecciones PocketBase en `scripts/setup-collections-extra.cjs` y esta ficha FTD, incluida `stock_applications` con índice único por compra.
- [x] Entrada de “Proveedores” en la navegación del admin con permiso `products`.
- [x] Acciones admin sobre PocketBase con `requirePermission(token, "products")`.
- [x] Alta/edición de proveedores y vista de detalle en `/admin/proveedores`.
- [x] Tabla de precios derivados e histórico de compras con notas.
- [x] Botón “Agregar stock” con confirmación, aviso de productos ausentes y doble clic bloqueado.
- [x] Verificación automática: vitest, `tsc --noEmit`, lint y `node --check`.
- [ ] Ejecutar el script de setup en PocketBase y smoke manual: pendiente, no se proporcionaron credenciales en esta sesión.

## PocketBase: colecciones y campos

El script idempotente crea cuatro colecciones con reglas por defecto (`null` = solo administradores):

- `suppliers`: `name` (text, requerido), `phone` (text, requerido), `created`, `updated` (autodate).
- `purchases`: `supplier` (relation a `suppliers`, requerida, 1..1), `notes` (text), `created_by` (text), `purchased_at` y `stock_applied_at` (date, opcionales), `created`, `updated` (autodate).
- `purchase_items`: `purchase` (relation a `purchases`, requerida, 1..1), `product` (relation a `products`, requerida, 1..1), `product_name` (text), `quantity` y `unit_price` (number, requeridos), `created`, `updated` (autodate).
- `stock_applications`: `purchase` (relation a `purchases`, requerida, 1..1), `created`, `updated` (autodate), con índice `UNIQUE` en `purchase`. Un solo reclamo por compra garantiza la idempotencia atómica de “Agregar stock”.

Las relaciones se definen explícitamente en el script porque el helper `T.relation` deja `required: false` y `minSelect: 0`. Si no se puede leer el id de una colección destino de una relación obligatoria, el script falla en lugar de crear una relación apuntando a un id vacío.

### Setup

El script lee `.env.local` si existe; también se pueden pasar las variables en el comando:

```bash
NEXT_PUBLIC_POCKETBASE_URL=https://tu-instancia.pockethost.io \
POCKETBASE_ADMIN_EMAIL=admin@ejemplo.com \
POCKETBASE_ADMIN_PASSWORD=tu-password \
node scripts/setup-collections-extra.cjs
```

Si falta alguna colección, la UI muestra el aviso de setup sin romper.

## Evidence

- Commits de implementación: `d852ea4` (plan y diseño), `94497a5` (dominio y pruebas), `6f213bd` (colecciones PocketBase), `69195d5` (navegación), `5a58aff` (acciones), `fae1084` (página y UI del admin), `a062b15` (precios, histórico y aplicación de stock).
- Commit de endurecimiento: `fix(proveedores): harden stock idempotency and setup degradation` (este cambio, HEAD al cierre de la rama; idempotencia atómica del stock, degradación completa del setup y correcciones menores).
- `pnpm vitest run lib/suppliers.test.ts lib/admin-navigation.test.ts` → 2 archivos, 19 pruebas, 0 fallos.
- `pnpm exec tsc --noEmit` → sin errores de tipos.
- `pnpm lint` → 0 errores, 264 avisos preexistentes en el repositorio (4 `no-explicit-any` en `lib/suppliers.ts` y 1 `react-hooks/set-state-in-effect` en `app/admin/proveedores/page.tsx`, entre otros archivos no tocados).
- `node --check scripts/setup-collections-extra.cjs` → sintaxis correcta.

## Next

- Sin credenciales de PocketBase en esta sesión: queda pendiente ejecutar `node scripts/setup-collections-extra.cjs` contra la instancia real y hacer el smoke manual: crear proveedor y compra, comprobar precio derivado, pulsar “Agregar stock” una vez y verificar que el stock global sube solo una vez, que el botón desaparece y que la página avisa si falta alguna colección.
