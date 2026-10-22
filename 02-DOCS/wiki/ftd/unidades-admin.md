---
author: Raciel Ferrin
branch: main
status: in-progress
---
# Pestaña de unidades en Configuración

## Intent

Hoy las unidades de venta están escritas en el código: `lib/store.ts` declara `type Unit = "por lb" | "por kg" | "c/u" | "por pinta" | "por docena"` y el formulario de producto (`app/admin/productos/page.tsx`) pinta un `<Select>` con esas cinco opciones literales. Para agregar «por quintal» o «por litro» hay que tocar código y recompilar, y no hay forma de desactivar la que no se use.

El objetivo es una pestaña **Unidades** en `/admin/configuracion` donde el administrador administre la lista (crear, renombrar, activar/desactivar, eliminar), y que el formulario de producto beba de esa lista.

## Scope

**Dentro**
- Nueva colección PB `units` (`name` texto requerido, `active` bool) + semilla con las 5 unidades actuales, para que ningún producto cambie lo que muestra.
- Acciones de admin: `getUnitsAction` (con nº de productos por unidad), `createUnitAction`, `updateUnitAction` (propaga el renombrado a los productos que la usan), `deleteUnitAction`.
- Nueva pestaña `unidades-tab.tsx` en `/admin/configuracion`, calcada de la de Países (tabla + diálogo de alta/edición + borrado con confirmación).
- El `<Select>` de unidad del formulario de producto pasa a listar las unidades activas; si la lista está vacía usa las de por defecto, y si el producto usa una unidad que ya no está en la lista la muestra igual (para no cambiarla sin querer).
- `lib/store.ts`: `Unit` deja de ser una unión fija y pasa a `string`; `DEFAULT_UNITS` queda como respaldo y semilla.

**Fuera (explícito)**
- No hay conversión de unidades (kg→lb): la unidad es una etiqueta, no un factor.
- No se toca el storefront: se sigue mostrando «/ por kg» igual que hoy.
- Borrar una unidad no borra productos: el producto conserva su texto, y el formulario lo ofrece igual.
- Sin campo de «unidades por empaque» ni de precio por unidad: es otra feature.

## Checklist

- [x] Colección `units` creada en PB con la semilla de las 5 unidades — prueba: query a PB lista las 5
- [x] `scripts/setup-collections-extra.cjs` crea `units` y la siembra — prueba: el script la incluye
- [x] Cuatro acciones de admin para unidades — prueba: crear/editar/borrar desde la UI
- [x] Pestaña «Unidades» visible en `/admin/configuracion` — prueba: captura en navegador
- [x] Renombrar una unidad actualiza los productos que la usan — prueba: el producto muestra el nombre nuevo
- [x] El `<Select>` de unidad del producto lista las unidades configuradas — prueba: el desplegable muestra la lista
- [x] `tsc --noEmit` sin errores y suite vitest en verde — prueba: salida de ambos comandos

## Evidence

**Colección en PB** (query como superusuario):
```
- c/u | active: true
- por docena | active: true
- por kg | active: true
- por lb | active: true
- por pinta | active: true
```

**Pestaña** (`/admin/configuracion?tab=unidades`): la tabla sale con el conteo de
productos por unidad — `c/u 3 · por docena 4 · por kg 5 · por lb 13 · por pinta 0` —
que cuadra con el conteo en PB.

**Ciclo completo, en el navegador:**
1. Crear «por litro» → `Unidades (6)`, con 0 productos.
2. En `/admin/productos`, el desplegable de unidad del producto «Ajo» ya listaba
   la configuración: `c/u | por docena | por kg | por lb | por litro | por pinta`.
   Se cambió a «por litro» y se guardó (stock, precio y ubicación del producto
   intactos).
3. Renombrar «por litro» → «por litro (botella)»: en PB, `AJO unit = "por litro (botella)"`.
   La cascada funciona.
4. Desactivar y volver a activar con el interruptor de la fila.
5. Borrar con confirmación → `Unidades (5)` y «por docena» vuelve a 4 productos.

**Estado restaurado tras la prueba:** Ajo quedó con `unit: "por docena"`, stock 399,
precio 700 y su ubicación intacta; el conteo por unidad volvió al original
(`por lb 13 · por kg 5 · c/u 3 · por docena 4`); la lista volvió a las 5
unidades originales. El usuario de pruebas se borró.

**Comandos:** `pnpm exec tsc --noEmit` → sin salida (exit 0). `npx vitest run` →
6 archivos, 45 tests en verde.

## Next

Nada pendiente: la pestaña está operativa. Queda como opción (nopedido) mostrar
las unidades en el filtro de productos del panel y permitir reordenar la lista.

