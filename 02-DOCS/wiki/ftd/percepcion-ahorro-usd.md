---
author: Raciel Ferrin
branch: main
status: in-progress
---
# Percepción del ahorro al pagar en USD

## Intent

El margen de ganancia (20% por defecto) **solo se aplica a las órdenes en CUP** (`lib/price-margin.ts`: `orderItemPrice` margina únicamente `orderCurrencyCode === "CUP"`). Comprar en USD sale, por tanto, un 20% más barato que en CUP, pero hoy el cliente no lo percibe: el checkout muestra «Equivalente en otras monedas» con el total **ya marginado** convertido, o sea un número que no es el que realmente pagaría en USD.

El objetivo es que el cliente **se entere** de que le conviene pagar en USD, sin carteles ni banners: una línea discreta con **su propio número** («ahorras 140 CUP») en el momento exacto en que decide, y un clic para cambiar de moneda.

Números reales del proyecto (PB, 21-10-2026): margen global `price_margin = 20`, tasa CUP `exchange_rate = 610`, `operational_cost = 0`, ningún producto con margen propio (`price_margin = 0`).

## Scope

**Dentro**
- `lib/usd-saving.ts` + tests: cálculo puro del ahorro (margen por producto) y de los totales con/sin margen.
- `components/saving-hint.tsx`: pieza visual reutilizable (texto `text-xs`, cifra en verde) con acción opcional de un clic.
- **Checkout**: (a) el bloque de otras monedas muestra el importe **real** de cada moneda + aviso de ahorro; (b) aviso junto al método de pago con el ahorro de la orden y botón «Ver en USD»; (c) aviso bajo el selector de moneda.
- **Carrito**: una línea bajo el total con el importe en USD y el ahorro.
- **Página de producto**: una línea bajo el precio con el importe en USD y el ahorro.

**Fuera (explícito)**
- No se toca el storefront/grid de tarjetas: el aviso se repetiría por cada producto y sería ruido, no percepción.
- No se cambia la lógica de precios ni el margen: solo se hace visible lo que ya se cobra.
- Sin SMTP y sin flujo de «olvidé mi contraseña» (queda pendiente, ver commit `0e8e524`).
- No hay cupones ni descuentos: el ahorro que se comunica es el margen que ya existe.

**Arreglos colaterales (misma pantalla, afectaban la credibilidad del mensaje)**
- La tasa de cambio del checkout decía «1 CUP = 610.0000 CUP»: ahora dice «1 CUP = 0.0016 USD» o «1 USD = 610.0000 CUP» según la moneda elegida.
- El bloque se titulaba «Equivalente en otras monedas» pero mostraba el total **con** margen: ahora se titula «Precio en otras monedas» y cada cifra es lo que se paga de verdad en esa moneda (CUP con margen, resto sin margen).
- «Equivalente en CUP» (carrito y resumen del checkout) pasa a «En CUP serían»: el precio en CUP **sí** lleva margen, y decirlo así evita que parezca un error de cálculo.

## Checklist

- [x] `lib/usd-saving.ts` calcula ahorro y totales desde subtotal base, margen, envío y costo operativo — prueba: tests vitest en verde
- [x] `components/saving-hint.tsx` renderiza importe en USD + ahorro con estilo discreto — prueba: render en checkout
- [x] Checkout: bloque de otras monedas con importes reales y aviso de ahorro — prueba: captura en navegador con CUP activa
- [x] Checkout: aviso junto al método de pago con botón «Ver en USD» que cambia la moneda — prueba: clic cambia la moneda y el total
- [x] Carrito: línea de ahorro bajo el total — prueba: captura en navegador
- [x] Página de producto: línea de ahorro bajo el precio — prueba: captura en navegador
- [x] `tsc --noEmit` sin errores y suite vitest completa en verde — prueba: salida de ambos comandos

## Evidence

Producto de prueba: **Ajo**, precio base 700 CUP, 1 unidad, zona sin coste de envío.

- `npx vitest run lib/usd-saving.test.ts` → **13 passed (13)**. Suite completa `npx vitest run` → **37 passed (37)**.
- `pnpm exec tsc --noEmit` → sin salida, **exit 0**.
- Página de producto (CUP): «$840.00 CUP / por docena» + «En USD: $1.15 · ahorras 140 CUP». Sin margen: 700 × 1.20 = 840; 700 / 610 = $1.15; ahorro 140 CUP ✓.
- Carrito (CUP): «Total $840.00 CUP» + «En USD: $1.15 · ahorras 140 CUP (17%)». El 17% es sobre lo que se paga en CUP (140 de 840); el 20% es sobre el precio base ✓.
- Carrito (USD): «Total $1.15 USD» + «En CUP serían $840.00», sin aviso de ahorro (en USD no hay nada que ahorrar) ✓.
- Checkout (CUP): «1 CUP = 0.0016 USD» · «En USD: $1.15 · ahorras 140 CUP (17%) · Ver en USD» · «Pagando en USD ahorras 140 CUP (17%)» · «Precio en otras monedas: USD: $1.15» ✓.
- Checkout (USD): «1 USD = 610.0000 CUP» · «Total a pagar en efectivo $1.15 USD» · «Precio en otras monedas: CUP: $840.00» · «En CUP serían $840.00», sin avisos de ahorro ✓.
- Botón «Ver en USD»: al pulsarlo la moneda pasa a USD y el total baja de 840 CUP a $1.15 USD ✓.
- Consola del navegador: **0 errores** en `/product/[id]`, `/cart` y `/checkout` (vistas CUP y USD) ✓.
- Usuario de prueba `cliente.e2e@local.dev` creado para el flujo y **eliminado** al terminar ✓.

## Next

Revisar el diff y commitear la feature; después, decidir si el aviso se replica en las tarjetas del storefront.
