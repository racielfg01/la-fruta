---
author: Raciel Ferrin
branch: main
status: in-progress
---

# Métodos de pago desde /admin/configuracion

## Intent

Hoy los métodos de pago del checkout están repartidos en dos pestañas de
`/admin/configuracion`:

- **General**: los interruptores de «Efectivo» y «Transferencias y pagos
  digitales», escondidos entre la marca, los colores y la tipografía.
- **Bancos**: los bancos y las **cuentas** a las que se transfiere (moneda,
  límite, veces usadas, activa).

Para gestionarlos hay que saltar entre pestañas y, lo peor, los interruptores
forman parte del mismo formulario que se guarda con el botón «Guardar
cambios» de General: moverlos y luego ir a otra pestaña sin guardar los
deja sin aplicar. Y nada avisa cuando la configuración está mal (por
ejemplo, transferencia activa sin ninguna cuenta utilizable).

La solución reúne todo en una pestaña **«Métodos de pago»**, con los
interruptores solos (que guardan al instante) y avisos que se recalculan con
los datos reales.

## Scope

**Dentro**
- `app/admin/configuracion/tabs/metodos-pago-tab.tsx` (nuevo): la pestaña.
  Tres partes:
  1. Card «Métodos de pago del checkout»: los dos interruptores, cada uno
     con su nombre y una línea de contexto. Cada interruptor guarda solo
     (`updateSettingsAction`) y muestra un aviso de éxito.
  2. Avisos, calculados con `lib/payment-methods.ts::paymentMethodWarnings`
     a partir de los interruptores, las cuentas y las monedas:
     - transferencia activa sin ninguna cuenta utilizable → el cliente no
       pagará por ese método.
     - cuentas configuradas con la transferencia oculta → están ocultas
       para el cliente.
     - efectivo activo sin CUP ni USD activadas → el checkout no mostrará
       efectivo.
  3. Sección «Cuentas para transferencias»: los bancos y las cuentas, con
     su sub-pestaña (Bancos | Cuentas bancarias) — lo que ya existía en la
     pestaña «Bancos».
- `lib/payment-methods.ts`: `paymentMethodWarnings` (pura) +
  `PaymentMethodWarningCode`, junto con `usableAccounts` (cuentas activas
  y sin límite alcanzado, sin importar la moneda).
- `app/admin/configuracion/tabs/general-tab.tsx`: se quita la card de
  «Métodos de pago del checkout».
- `app/admin/configuracion/tabs/bancos-tab.tsx`: recibe un prop
  `onChanged` que se llama después de cualquier modificación (banco o
  cuenta, al crear, editar o eliminar), para que los avisos de la pestaña
  padre se recalculen sin recargar la página. Su título se convierte en el
  de la sección.
- `app/admin/configuracion/page.tsx`: la pestaña «Bancos» se reemplaza por
  «Métodos de pago» (valor `metodos`), en el mismo lugar del listado.

**Fuera (explícito)**
- No se toca el checkout, ni los precios, ni el carrito, ni el modelo de
  datos: los mismos campos (`payment_cash_enabled` /
  `payment_transfer_enabled`) y las mismas cuentas.
- No se añade ningún método de pago nuevo (siguen siendo `cash` y
  `transfer`).
- No se cambia la lógica de límites de las cuentas ni cómo se
  desactivan.

## Checklist

- [x] `paymentMethodWarnings` decide los tres avisos y recheca los casos
      trampa — prueba: `lib/payment-methods.test.ts` (9 tests nuevos).
- [x] Suite, tipos, lint y build en verde — prueba: `npx vitest run`,
      `npx tsc --noEmit`, `npx eslint .`, `npx next build`.
- [x] La pestaña «Bancos» sustituida por «Métodos de pago» (valor
      `metodos`) con el mismo formato de URL — prueba: lista de pestañas.
- [ ] Interruptores guardan solos y el aviso de éxito aparece —
      pendiente: recorrido en navegador (producción).
- [ ] Los avisos aparecen y desaparecen cuando cambian las cuentas /
      los interruptores — pendiente: recorrido en navegador (producción).
- [ ] Los bancos y las cuentas siguen gestionables desde la nueva
      pestaña — pendiente: recorrido en navegador (producción).
- [ ] La pestaña «General» ya no tiene los interruptores de pago —
      pendiente: revisión en navegador (producción).

## Evidence

- 268 tests verdes (32 archivos), incluidos 9 nuevos de `paymentMethodWarnings`.
- `npx tsc --noEmit` sin errores.
- `npx eslint .` sin errores.
- `npx next build` compilado (ruta `/ofertas` intacta).
- Interruptores implementados en `metodos-pago-tab.tsx` (guardan solos vía
  `updateSettingsAction`).
- Tab «metodos» registrado en `app/admin/configuracion/page.tsx`; card de
  pago eliminada de `general-tab.tsx`; cuentas viven dentro del nuevo tab.

## Next

- Revisión en navegador de los interruptores y avisos (producción).