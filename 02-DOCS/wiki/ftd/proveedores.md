---
author: OpenCode
branch: feat/proveedores-admin
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
- Botón “Agregar stock” por compra: suma las cantidades a `products.stock` y marca `in_stock: true`; es idempotente por compra mediante un reclamo único en `stock_applications`, creado antes de las escrituras y con compensación si falla alguna.
- Detección de setup incompleto: la vista se degrada con aviso si falta alguna de las colecciones que usa, incluidas `purchases`, `purchase_items` y `stock_applications`.
- Paginado inferior de la lista lateral: máximo 10 proveedores por página, con primera/anterior/siguiente/última y reseteo a la página 1 al buscar, crear o borrar.

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
- [x] Paginado inferior con 10 por página, límites deshabilitados y reseteo al buscar o cambiar la lista.
- [x] Verificación automática: vitest, `tsc --noEmit`, lint y `node --check`.
- [x] Smoke real en PocketBase: crear proveedor y compra, aplicar stock una sola vez y limpiar los datos temporales.

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
- Commit de endurecimiento: `fix(proveedores): harden stock idempotency and setup degradation` (idempotencia del stock, degradación completa del setup y correcciones menores).
- Commit de corrección en producción: `77da72d` (reemplaza `/api/batch`, deshabilitado en la instancia, por escrituras secuenciales con limpieza y compensación).
- Commit de paginado (este cambio): helper con pruebas, controles inferiores y documentación actualizada.
- `pnpm verify` → 56 archivos, 398 pruebas, 0 fallos; `tsc --noEmit` limpio; lint con 0 errores y 264 avisos preexistentes.
- `pnpm exec tsc --noEmit` → sin errores de tipos.
- `pnpm lint` → 0 errores, 264 avisos preexistentes en el repositorio (4 `no-explicit-any` en `lib/suppliers.ts` y 1 `react-hooks/set-state-in-effect` en `app/admin/proveedores/page.tsx`, entre otros archivos no tocados).
- `node --check scripts/setup-collections-extra.cjs` → sintaxis correcta.
- Smoke de paginado en navegador: 13 proveedores → página 1 con 10 (`1–10 de 13 · Página 1 de 2`), página 2 con 3 (`11–13 de 13 · Página 2 de 2`), botones de límites deshabilitados según corresponda, búsqueda y sin resultados vuelven a la página 1. Datos temporales eliminados.

## Next

- Hacer `push` de `feat/proveedores-admin` y abrir el Pull Request contra `main`: GitHub HTTPS respondió `502` y luego `401`; no hay `gh`, `GITHUB_TOKEN` ni credenciales guardadas en esta sesión.
