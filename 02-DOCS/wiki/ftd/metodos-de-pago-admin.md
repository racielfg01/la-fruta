---
author: Raciel Ferrin
branch: main
status: in-progress
---

# Métodos de pago desde /admin/configuracion

## Intent

Antes el pago se configuraba en dos sitios y con dos modelos mentales:

- **General**: dos interruptores («Efectivo» y «Transferencias y pagos
  digitales») dentro del mismo formulario que la marca y los colores.
- **Bancos**: bancos y **cuentas** por separado, cada una con su moneda,
  su límite y su contador.

El admin no podía crear «un método de pago»: podía encender dos categorías
fijas y añadir cuentas sueltas colgadas de un banco. El cliente veía un tile
por moneda en efectivo y un tile por banco con un selector de cuenta cuando
había varias.

La solución simplifica el modelo: **el método de pago es la única entidad**.
Se crea, se edita y se activa desde `/admin/configuracion?tab=metodos`. Cada
método es un tile del checkout y lleva dentro todo lo que el cliente
necesita: nombre, imagen, tipo (efectivo o transferencia), moneda y —si es
transferencia— número de cuenta, titular, instrucciones, límite, contador y
si pide comprobante.

## Scope

**Dentro**
- Colección nueva `payment_methods` (una sola). Campos: `name`, `type`
  (`cash` | `transfer`), `image`, `currency`, `account_number`,
  `account_type`, `owner`, `requires_receipt`, `instructions`,
  `transfer_limit`, `transfer_count`, `active`, `sort`.
- Migración `scripts/setup-payment-methods.cjs`: crea la colección (lectura
  pública, escritura solo admin) y, si está vacía, siembra cuatro métodos
  con los datos actuales: Efectivo CUP, Efectivo USD, Zelle y USDT.
- `app/admin/configuracion/tabs/metodos-pago-tab.tsx`: listado con imagen,
  nombre, tipo, moneda, comprobante y activo; interruptor que guarda solo;
  diálogo de crear/editar con los campos del tipo elegido; eliminar.
- `app/admin/configuracion/tabs/metodos-pago-tab.tsx`: buscador por nombre,
  cuenta, titular, moneda y tipo, y paginación inferior con `PaginationBar`
  (10 por página, ajustable a 5/10/20/50).
- `lib/payment-options.ts`: un tile por método activo y con moneda activa;
  una transferencia sin cupo se muestra deshabilitada con su motivo.
- `lib/payment-methods.ts`: `validatePaymentMethod` (activo, tipo, moneda,
  cupo) y `requiresReceiptError`; el servidor los usa al crear el pedido.
- `app/actions/orders.ts`: el pedido se valida contra el método guardado y
  se deriva `payment_method` (`cash`/`transfer`). Se guarda la instantánea
  en `bank_name` (nombre del método) y `account_number`. El contador y el
  cupo se mueven en `payment_methods`.
- `app/checkout/page.tsx`: pago construido desde los métodos; los datos de
  la cuenta se muestran en el tile elegido; el comprobante solo se pide si
  el método lo exige.
- `app/api/uploadthing/core.ts`: endpoint `paymentMethodLogo` para la
  imagen del método.
- `components/order-detail-dialog.tsx`: la fila del pago dice «Método» en
  vez de «Banco».

**Fuera (explícito)**
- Precios, carrito, margen, costo operativo, stock y flujo de estados del
  pedido no cambian.
- `orders.payment_method` sigue siendo `cash` | `transfer`: así el
  redondeo de efectivo, el contador y el resto de la lógica no se tocan.
- Las colecciones `banks` y `bank_accounts` quedan dormidas: no se leen ni
  se borran. `showPaymentCash` / `showPaymentTransfer` dejan de mandar,
  pero sus campos siguen en la base.
- No hay fallback automático si el admin desactiva todos los métodos: el
  checkout muestra «Contacta con la tienda» y el listado avisa en ámbar.

## Decisión de datos

- **Una cuenta por método.** El caso de un banco con varias cuentas se
  resuelve creando dos métodos (p. ej. «Zelle — Orlando» y «Zelle —
  Mercatoma»). Es el precio de tener una sola entidad.
- **Instantánea en el pedido.** `bank_name` guarda el nombre del método y
  `account_number` la cuenta usada. Si el admin edita o borra el método,
  el pedido conserva lo que se pagó. No se añaden campos nuevos a `orders`.
- **El tipo lo pone el servidor.** El cliente manda `paymentMethodId`; el
  servidor lee el método y decide si es efectivo o transferencia. Lo que
  afirme el cliente sobre el tipo solo se usa como comprobación cruzada.

## Checklist

- [x] Lógica pura de validación y comprobante con pruebas —
      `lib/payment-methods.test.ts`, `lib/payment-options.test.ts`.
- [x] Servidor valida el método y guarda la instantánea del pedido —
      `app/actions/orders.ts`.
- [x] Contador y límite viven en el método y se actualizan al transferir.
- [x] Pestaña «Métodos de pago» con listado, interruptor, crear, editar y
      eliminar — `app/admin/configuracion/tabs/metodos-pago-tab.tsx`.
- [x] Buscador y paginación inferior en el listado — mismo archivo; gates en
      verde (`tsc`, `vitest`, `eslint`, `next build`).
- [x] El checkout arma los tiles desde los métodos y pide comprobante solo
      cuando corresponde — `app/checkout/page.tsx`.
- [x] Se elimina la pestaña Bancos y sus acciones; queda
      `paymentMethodLogo` como endpoint de imagen.
- [x] Gates en verde: `npx vitest run`, `npx tsc --noEmit`,
      `npx eslint app lib components`, `npx next build`.
- [x] Ejecutar `node scripts/setup-payment-methods.cjs` en producción
      **antes** de desplegar el código nuevo.
- [ ] Recorrido en navegador (producción): crear/editar/desactivar un
      método; probar el buscador y la paginación; pagar en efectivo; pagar
      por transferencia con comprobante; comprobar que el pedido muestra el
      nombre y la cuenta usados.

## Evidence

- Migración ejecutada en producción: la colección `payment_methods` existe
  con los cuatro métodos sembrados (Zelle con su logo, teléfono y titular;
  USDT con su wallet y titular).
- `npx vitest run`: 254 tests en 32 archivos, en verde.
- `npx tsc --noEmit`: sin errores (`next.config.mjs` ignora los tipos en
  el build; este comando es la puerta real).
- `npx eslint app lib components`: 0 errores.
- `npx next build`: compila; `/checkout`, `/order-confirmation` y
  `/admin/configuracion` presentes.
- Desplegado en `https://mercatoma.vercel.app` (commit `2441c4e`): el
  checkout servido ya trae el código nuevo y la API pública devuelve los
  cuatro métodos.
- La migración siembra la colección solo si está vacía; el script es
  idempotente y no borra nada.

## Next

1. Recorrer el admin y el checkout en producción con una sesión real.
2. Cuando el recorrido esté verde, marcar este documento como `done`.

