---
author: Raciel Ferrin
branch: main
status: done
---
# Detalle de orden en `/admin/ordenes` y `/perfil`

## Intent

El modal de detalle mezclaba en una sola tarjeta «Cliente» los datos de la
cuenta con los de la persona que recibe el pedido, y el resto de la información
(estado, productos, entrega, pago, fechas) competía en una columna larga con
tarjetas anidadas.

Además, la semántica real de los datos estaba invertida: en el checkout,
`user_name`, `contact_phone` y `contact_carnet` son **de quien recibe**
(sección «Contacto — Datos de quien recibe el pedido»), mientras que el cliente
es la cuenta que hizo el pedido (`user_id` → colección `users`; `user_email` es
su email). El modal los presentaba juntos y con el mismo nombre.

Objetivo: un detalle escaneable en segundos, con cliente y receptor separados,
acciones siempre visibles y reglas de estado tomadas del servidor.

Después, el historial de `/perfil` reutiliza la misma plantilla en modo lectura:
el cliente ve exactamente el mismo detalle, sin acciones de administración.

## Scope

**Dentro**
- `components/order-detail-dialog.tsx` (nuevo, fuera de `admin/` porque lo usan
  admin y cliente): modal presentacional. Cabecera fija con ID + copiar, fecha,
  receptor, badges y total (con base CUP); cuerpo con scroll propio; pie fijo.
  La prop `readOnly` oculta avance, cobro y cancelación; en ese modo el pie solo
  tiene «Cerrar» y la zona de envío se omite si no se pasan zonas.
- `components/order-badges.tsx` (nuevo): `OrderStatusBadge` y
  `PaymentStatusBadge` compartidos por tabla, modal e historial del cliente.
- `lib/order-flow.ts` (nuevo): flujo lineal, etiquetas en español,
  `nextOrderStatus`, `canCancelOrder`, `paymentMethodLabel`. Tests en
  `lib/order-flow.test.ts`.
- `lib/use-order-money.ts` (nuevo): formatea importes en la moneda de la orden
  con la base CUP como apoyo; lo usan tabla y modal.
- `lib/order-dates.ts`: añade `formatOrderDate`, que nunca devuelve
  «Invalid Date». Test ampliado.
- `app/admin/ordenes/page.tsx`: pasa de 940 a 568 líneas; se elimina el modal
  duplicado, los badges locales y el diálogo de cancelación. Pasa `customer`
  resuelto desde el store de usuarios por `user_id`.
- `app/perfil/page.tsx`: el historial deja de expandir la tarjeta en línea y
  abre el mismo modal en modo lectura. La fila es un botón accesible (foco
  visible, `aria-haspopup="dialog"`), usa los badges compartidos, formatea con
  la moneda de la orden y muestra «Para: …» cuando el receptor no es la cuenta.
- `app/actions/orders.ts` (`getUserOrders`): incluye `contact_phone` y
  `contact_carnet` para que «Quién recibe» tenga los datos reales también en el
  historial del cliente.
- Separación visual:
  - **Quién recibe** (columna principal): nombre, teléfono, carnet.
  - **Entrega** (columna principal): dirección, zona, notas.
  - **Cliente** (lateral): nombre y email de la cuenta que hizo el pedido.
- Estados:
  - Progreso de 5 pasos en español; en móvil se resumen en
    «Paso N de 5 · Estado» para no cortar etiquetas a 320 px.
  - Orden cancelada: aviso con el motivo; sin acciones de avance ni cancelación.
  - Entregada: sin botón de avance.
  - Cancelación solo si el servidor la permite (`pending`, `confirmed`,
    `preparing`); confirmación con motivo obligatorio y aviso de reposición de
    stock.
- Feedback: spinner en la acción en curso, `toast.success`/`toast.error`; los
  errores del servidor ya no se pierden.

**Fuera (explícito)**
- Sin cambios de esquema en PocketBase: no existe un campo de nombre del
  receptor distinto de `user_name`.
- Sin cambios en las transiciones de pago: «Reembolsado» sigue ofreciéndose y
  el servidor lo rechaza (comportamiento previo); ahora el error se muestra.
- Sin cambios de autenticación ni de la tabla más allá de reutilizar badges.

## Checklist

- [x] Cliente y receptor separados, con la fuente correcta de cada dato —
      prueba: render con datos mock (cuenta «Marialis García», receptor
      «Daniel Pérez») y lectura del árbol de accesibilidad.
- [x] Reglas de avance/cancelación alineadas con `VALID_ORDER_TRANSITIONS` —
      prueba: `lib/order-flow.test.ts` (5 casos) y flujo real en el preview.
- [x] Cancelación con motivo obligatorio — prueba: botón deshabilitado sin
      texto; al confirmar aparece «Orden cancelada» con el motivo.
- [x] Cabecera y pie fijos; solo el cuerpo hace scroll — prueba: geometría a
      1280×900, 768×900, 390×844 y 320×844.
- [x] Sin desbordamiento horizontal en ningún breakpoint — prueba:
      `scrollWidth - clientWidth = 0` en página y cuerpo del modal.
- [x] Contraste AA en ambos temas — prueba: ratios calculados en el navegador.
- [x] El historial del cliente abre el modal sin acciones de administración —
      prueba: sesión real de `maryqp.95@gmail.com`, pie solo con «Cerrar», sin
      selector de pago ni «Confirmar pago».
- [x] La fila del historial es un botón con foco visible y abre el detalle —
      prueba: clic real sobre la orden `#56182101`.
- [x] `tsc --noEmit` y suite en verde — prueba: 14 archivos, 93 tests.

## Evidence

**Geometría (componente real con órdenes mock):**

| Viewport | Modal | Cuerpo | Notas |
| --- | --- | --- | --- |
| 1280×900 | 896×828 | scroll 796 / 655 | dos columnas 486/313 |
| 768×900 | 736 | sin overflow | dos columnas 389/251 |
| 390×844 | 358×776 | scroll 1566 / 515 | una columna; pie en dos filas |
| 320×844 | 288×776 | scroll 1586 / 489 | etiquetas del stepper ocultas, resumen «Paso 2 de 5 · Confirmado» |

**Contraste (claro / oscuro):** descripción de cabecera 4.51 / 5.71; etiquetas
muted 4.75 / 6.09; valores 15.69 / 17.03; badges 6.85 / 9.02–11.11; botón
primario 5.34 en oscuro.

**Interacciones verificadas:** avance `confirmed → preparing` (badge y stepper
actualizados), «Confirmar pago» (`pending → paid`, desaparece el botón),
cancelación con motivo (aviso y pie sin acciones), orden entregada (solo
«Cerrar»), orden sin artículos (estado vacío y total 0).

**Capturas:** `.playwright-mcp/order-detail-desktop-light.png`,
`.playwright-mcp/order-detail-desktop-dark.png`,
`.playwright-mcp/order-detail-mobile-light.png`.

**Historial del cliente con datos reales (`/perfil`):** sesión de
`maryqp.95@gmail.com` (impersonación temporal de PocketBase, sin cambios de
datos) con la orden `#56182101`:

- 1280×900: modal 896×828; cuerpo 655 visible / 739 de contenido; pie alineado a
  la derecha con solo «Cerrar»; sin selector de pago ni «Confirmar pago»; sin
  fila de zona.
- 390×844: modal 358×776; «Cerrar» a todo el ancho (317 px); cuerpo sin
  desbordamiento horizontal.
- 320×844: modal 288; cuerpo sin desbordamiento. La página de fondo desborda
  25 px por las pestañas del perfil (previo, ajeno al modal).
- «Quién recibe»: Marialis / 59088538 / 94080645391; «Cliente»: Marialis /
  maryqp.95@gmail.com; entrega con dirección y notas.
- Capturas: `.playwright-mcp/perfil-orden-desktop-light.png`,
  `.playwright-mcp/perfil-orden-desktop-dark.png`,
  `.playwright-mcp/perfil-orden-mobile-light.png`.

**Comandos:** `npx tsc --noEmit` → exit 0. `npx vitest run` → 14 archivos, 93
tests en verde. `/admin/ordenes` compila (HTTP 200).

**Límite de la verificación:** no había credenciales de admin, así que la
geometría y las interacciones de administración se midieron en una ruta
temporal `/preview-orden` con órdenes mock (ya eliminada). La vista del cliente
sí se verificó con una sesión y una orden reales. Falta abrir el modal con datos
reales desde una sesión de admin.

## Next

- Verificar con una sesión real de admin y una orden real (pendiente de
  credenciales).
- Decidir qué hacer con la opción «Reembolsado» del selector de pago: eliminarla
  o añadir la transición en `VALID_PAYMENT_TRANSITIONS`.
- Si el negocio necesita un nombre de receptor distinto de la cuenta, ya está
  cubierto: `user_name` es el receptor y el nombre de la cuenta se resuelve por
  `user_id`.
