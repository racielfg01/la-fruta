---
author: OpenCode
branch: main
status: in-progress
---
# Proveedores y compras

## Intent

El panel de administración permite gestionar proveedores, registrar sus compras con precios y aplicar el stock de una compra al catálogo general. El precio que ve el admin por proveedor y producto se deriva de la compra más reciente, sin editar precios a mano.

## Scope

**Dentro**
- Alta, edición y borrado de proveedores (nombre y teléfono) en `/admin/proveedores`, con permiso `products`.
- Precios derivados: para cada proveedor, el `unit_price` de la compra más reciente de ese producto.
- Histórico de compras con notas, fecha, líneas de producto, cantidad y precio unitario. Crear una compra no modifica el stock.
- Botón “Agregar stock” por compra: suma las cantidades a `products.stock` y marca `in_stock: true`; es idempotente por compra (`stock_applied_at`).

**Fuera**
- Stock por zona (`product_locations`): el botón solo toca el stock general.
- Edición de compras ya creadas (solo alta y borrado).
- Emails o notificaciones a proveedores.

## Checklist

- [x] Dominio y validaciones en `lib/suppliers.ts`, con pruebas (`lib/suppliers.test.ts`).
- [x] Colecciones PocketBase en `scripts/setup-collections-extra.cjs` y esta ficha FTD.
- [ ] Entrada de “Proveedores” en la navegación del admin con permiso `products`.
- [ ] Acciones admin sobre PocketBase con `requirePermission(token, "products")`.
- [ ] Alta/edición de proveedores y vista de detalle en `/admin/proveedores`.
- [ ] Tabla de precios derivados e histórico de compras con notas.
- [ ] Botón “Agregar stock” con confirmación, aviso de productos ausentes y doble clic bloqueado.
- [ ] Verificación: vitest, `tsc --noEmit`, lint y smoke manual con PocketBase.

## PocketBase: colecciones y campos

El script idempotente crea las tres colecciones con reglas por defecto (`null` = solo administradores):

- `suppliers`: `name` (text, requerido), `phone` (text, requerido), `created`, `updated` (autodate).
- `purchases`: `supplier` (relation a `suppliers`, requerida, 1..1), `notes` (text), `created_by` (text), `purchased_at` y `stock_applied_at` (date, opcionales), `created`, `updated` (autodate).
- `purchase_items`: `purchase` (relation a `purchases`, requerida, 1..1), `product` (relation a `products`, requerida, 1..1), `product_name` (text), `quantity` y `unit_price` (number, requeridos), `created`, `updated` (autodate).

Las relaciones se definen explícitamente en el script porque el helper `T.relation` deja `required: false` y `minSelect: 0`.

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

- `node --check scripts/setup-collections-extra.cjs` → sin errores de sintaxis.
- Commits de implementación: `94497a5` (dominio y pruebas).

## Next

- Completar navegación, acciones y UI de `/admin/proveedores` según el plan.
- Ejecutar smoke manual: crear proveedor y compra, comprobar precio derivado, pulsar “Agregar stock” una vez y verificar que el stock global sube solo una vez y que el botón desaparece.
