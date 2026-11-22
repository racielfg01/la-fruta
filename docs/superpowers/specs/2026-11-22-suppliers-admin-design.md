# Diseño: sección de Proveedores en el admin

- **Fecha:** 2026-11-22
- **Estado:** propuesto (pendiente de aprobación)
- **Alcance:** proyecto (esquema de datos, acciones, UI de admin y pruebas)

## 1. Intención y por qué

Hoy el control de compras se lleva de memoria. El usuario necesita saber qué proveedor tiene, cómo contactarlo, qué productos le compra y a qué precio, y conservar un histórico de compras. La sección debe vivir en el panel de administración de MercaToma y usar el catálogo de productos existente (`products`), no una lista paralela.

Objetivo: crear `/admin/proveedores` con alta de proveedores (nombre y teléfono), detalle con precios derivados de compras, registro de compras con notas e histórico consultable, y una acción explícita para aplicar el stock de una compra cuando corresponda.

## 2. Objetivos, no objetivos y antiobjetivos

### Objetivos
- Registrar proveedores con nombre y teléfono.
- En la ficha de un proveedor: ver sus productos con el último precio pagado, y su histórico de compras.
- Registrar compras con fecha, proveedor, líneas de producto del catálogo (cantidad y precio unitario) y notas.
- Mostrar el precio de cada producto como el último precio pagado por ese proveedor, sin mantener un precio manual.
- Aplicar el stock de una compra mediante un botón “Agregar stock”, de forma explícita e idempotente.
- Degradar con gracia si las colecciones nuevas no existen aún en PocketBase.

### No objetivos
- No modificar stock al crear una compra (decisión explícita del usuario).
- No modificar el stock por zona de entrega: “Agregar stock” solo suma al stock general, aunque el producto tenga zonas configuradas (decisión explícita del usuario).
- No programar compras, ni reportes de proveedor, ni comparador de precios entre proveedores.
- No enviar notificaciones ni email relacionado con compras.
- No segmentar ni cambiar los roles de acceso: solo administradores.

### Antiobjetivos (sería un fallo aunque “funcione”)
- Duplicar productos: toda línea de compra debe apuntar a un producto del catálogo (`products`).
- Perder el histórico: el precio de una compra no debe cambiar cuando cambie el precio del catálogo o se edite un producto.
- Aplicar stock dos veces por error.
- Romper el panel si aún no se crearon las colecciones nuevas.

## 3. Decisiones acordadas con el usuario

- **Contacto:** nombre y teléfono.
- **Productos:** son los del catálogo de la tienda, no una lista propia.
- **Precios:** el bloque de precios de la ficha del proveedor muestra el último precio pagado por ese producto (a ese proveedor). No se edita un precio aparte.
- **Compra:** lleva fecha, proveedor, producto(s), cantidad, precio unitario y notas. Eso es todo por ahora.
- **Stock:** crear una compra no modifica el stock. El usuario pulsa “Agregar stock” en la compra para sumar las cantidades al stock general de los productos (`products.stock`); no se toca el stock por zona de entrega.
- **Diseño visual:** se elige la maqueta **C** — lista de proveedores a la izquierda; a la derecha, el detalle del proveedor seleccionado con contacto, precios y compras.

## 4. Decisiones que tomo yo (marcadas como tales)

- **Colecciones nuevas:** `suppliers`, `purchases`, `purchase_items`, con reglas de acceso solo admin (lectura/escritura mediante server actions, siguiendo el patrón de otras colecciones administradas del repo).
- **Snapshot del producto:** guardar también el nombre del producto en cada línea de compra. Es para que el histórico siga siendo legible si el producto se renombra o se elimina del catálogo.
- **Edición/borrado:** alta y edición de proveedores. Borrar proveedor solo si no tiene compras. Las compras se pueden crear y consultar; borrar una compra solo si no tiene stock aplicado. Sin edición de líneas ya registradas en esta versión.
- **Idempotencia de stock:** el botón “Agregar stock” ejecuta una sola vez por compra. Se guarda `stock_applied_at` y el botón desaparece o se deshabilita después. Usar `pb.createBatch()` (disponible en el SDK instalado) para aplicar todas las líneas y la marca en una sola operación; si no está disponible, guardar una marca por línea para poder reintentar sin duplicar.
- **Aplicación de stock:** actualizar solo `products.stock` (y `in_stock: true` cuando corresponda), sin tocar `product_locations`. Si un producto ya no existe al aplicar, omitir esa línea, avisar al admin en el resultado y dejar la compra como aplicada, igual que hace `restoreOrderStock()`.
- **Moneda y formato:** usar el formateo de dinero ya existente en la app; `unit_price` se guarda como número.
- **Totales:** el total de la compra se calcula (suma de cantidad × precio unitario), no se pide por separado.
- **Orden de precios:** el “último precio” se resuelve por fecha de compra y, como desempate, por registro más reciente.

## 5. Diseño propuesto

### 5.1 Modelo de datos (PocketBase)

**`suppliers`** (nueva)
- `name` (text, requerido)
- `phone` (text, requerido)
- `created`, `updated` (automáticos)

**`purchases`** (nueva)
- `supplier` (relation a `suppliers`, requerida)
- `purchased_at` (date; por defecto ahora, editable)
- `notes` (text, opcional)
- `stock_applied_at` (date nullable; marca de stock aplicado)
- `created_by` (text, id de usuario admin, opcional)
- `created`, `updated`

**`purchase_items`** (nueva)
- `purchase` (relation a `purchases`, requerida)
- `product` (relation a `products`, requerida)
- `product_name` (text; snapshot del nombre)
- `quantity` (number, > 0)
- `unit_price` (number, >= 0)
- `created`, `updated`

**Setup:** script idempotente para crear colecciones/campos y reglas (siguiendo `scripts/setup-collections-extra.cjs` / `scripts/setup-push.mjs`). Documentar su ejecución en la ficha FTD correspondiente.

### 5.2 Cálculo del bloque “Precios”

No hay campo de precio editable. Para el proveedor seleccionado:
1. Obtener sus compras y todas sus líneas.
2. Agrupar por producto.
3. Para cada producto, tomar el `unit_price` de la compra más reciente.
4. Mostrar nombre del producto (snapshot o catálogo), precio y unidad del catálogo si aplica.

Esto se implementa como helper puro para poder probarlo (elección del último precio, desempates, producto repetido).

### 5.3 UI de `/admin/proveedores`

- **Columna izquierda:** encabezado “Proveedores”, botón “+ Proveedor” y lista de proveedores (nombre + teléfono abreviado). El seleccionado queda resaltado.
- **Panel derecho:**
  - Encabezado con nombre del proveedor, teléfono y acción de editar.
  - Bloque “Precios”: tabla compacta producto / precio / unidad, derivada del último precio pagado.
  - Bloque “Compras”: botón “+ Nueva compra” y listado histórico con fecha, cantidad de productos, total y notas. Cada compra muestra “Agregar stock” mientras `stock_applied_at` esté vacío.
- **Alta de proveedor:** formulario simple (nombre, teléfono). Edición reutiliza el mismo formulario.
- **Nueva compra:** formulario con fecha (default hoy), proveedor preseleccionado, filas dinámicas de producto del catálogo + cantidad + precio unitario, campo de notas y total calculado. Guardar crea la compra y sus líneas.
- **Agregar stock:** confirmación breve; al confirmar se suman las cantidades de cada línea al stock general del producto y se marca la compra como aplicada. Aviso en el resultado si alguna línea no se pudo aplicar.
- Navegación: enlace en el menú del admin hacia `/admin/proveedores`.
- Si faltan colecciones: aviso tipo “Falta preparar PocketBase para proveedores” con la pista del script, sin romper la página.

### 5.4 Acciones y permisos

Todas las acciones requieren `requireAdmin` y viven siguiendo el patrón de `app/actions/`:
- proveedores: listar, crear, actualizar, eliminar (solo sin compras);
- compras: listar por proveedor, crear (con líneas), eliminar (solo sin stock aplicado);
- stock: `applyPurchaseStockAction` (idempotente, valida que el admin tenga permisos);
- catálogo: listado de productos para el selector (reutilizar acción/helper existente si hay).

Acciones de solo lectura para la ficha: Detalle derivado (precios + histórico) puede calcularse en servidor y pasar como props al componente cliente.

### 5.5 Seguridad y consistencia

- Validar que toda línea apunte a un producto existente del catálogo antes de guardar.
- Validar cantidad > 0 y precio >= 0; sanitizar notas (texto plano, sin HTML).
- Creación de compra + líneas: preferir `pb.createBatch()` para guardar todo junto; si falla o no está disponible, limpiar lo creado y reportar el error.
- Aplicar stock: recalcular dentro de la acción y marcar `stock_applied_at` al final; si una actualización de producto falla, no marcar como aplicada y permitir reintento sin duplicar.

### 5.6 Pruebas

- Helpers puros con vitest: último precio por producto, total de compra, validación de líneas, decisión de si el botón de stock aplica.
- Acciones con mocks siguiendo el patrón del repo donde sea práctico.
- Verificación manual: alta de proveedor, alta de compra con 2 productos, ver precios derivados, aplicar stock, comprobar que el botón ya no aparece y que stock subió una sola vez.

## 6. Suposiciones que el usuario puede corregir antes de implementar

- Los precios son **por proveedor** (último precio pagado a ese proveedor), no el último precio pagado en la tienda a cualquier proveedor.
- El teléfono es obligatorio; no se agregó email ni dirección.
- No se edita el precio directamente: siempre sale de compras.
- Las compras no se editan; solo se consultan y se pueden borrar si no aplicaron stock.
- No hay alertas de stock bajo ni reposición automática.
- “Agregar stock” suma solo al stock general; no elige zona de entrega.

## 7. Verificación esperada

- El enlace “Proveedores” aparece en el menú admin y abre `/admin/proveedores`.
- Se puede crear y editar un proveedor; se puede borrar si no tiene compras.
- Al crear una compra se eligen productos del catálogo; el total se calcula; se guardan notas.
- La ficha del proveedor muestra el último precio pagado por cada producto.
- El histórico muestra fecha, productos, total y notas.
- “Agregar stock” suma una sola vez y luego desaparece; crédito de stock correcto en `products`.
- Con colecciones ausentes, la página muestra un aviso y no se rompe.
- `tsc`, lint y vitest sin errores nuevos en archivos tocados.
