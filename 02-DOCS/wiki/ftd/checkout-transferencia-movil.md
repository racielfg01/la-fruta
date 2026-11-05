---
author: Raciel Ferrin
branch: main
status: in-progress
---
# Checkout móvil: panel de transferencia y titular

## Intent

Al elegir Zelle o USDT en el checkout, los datos de la cuenta se salían del
panel en el móvil. Además, el nombre del titular quedaba a la derecha del
rótulo y no se podía copiar. Ahora el panel se adapta al ancho, el nombre se
lee debajo de «Titular» y se copia con un botón, igual que el número de cuenta.

## Scope

**Dentro**
- El formulario del checkout puede encoger (`min-w-0`) y el selector de cuenta
  trunca su texto.
- La fila del número de cuenta se apila en móvil; número y wallet usan
  `break-all`.
- El nombre del titular va debajo del rótulo «Titular», alineado a la
  izquierda, con botón para copiarlo.
- Botones de copiar de 44×44 px en móvil y compactos en escritorio.
- El encabezado global no genera scroll horizontal a 320 px: el botón de
  notificaciones push se oculta por debajo de 360 px.

**Fuera**
- No cambian el selector de moneda, los totales, la confirmación ni el detalle
  de la orden.
- No se tocan los datos de las cuentas ni la configuración de producción.
- No se cambia el backend de pagos ni la validación del comprobante.

## Checklist

- [x] El panel de transferencia no desborda a 320, 360, 390 ni 414 px.
- [x] La página no tiene scroll horizontal a 320 px (incluido el encabezado).
- [x] Copiar el número de cuenta escribe el valor y muestra su aviso.
- [x] Copiar el nombre del titular escribe el valor y muestra su aviso.
- [x] El nombre aparece debajo de «Titular» y alineado a su izquierda en móvil
  y escritorio.
- [x] Los botones de copiar miden 44×44 px en móvil y 36×28 px en escritorio.
- [x] `tsc`, pruebas, build y detector de UI sin errores.

## Evidence

Verificado sobre el build de producción (`next start -p 3001`), con un usuario
temporal de QA y un carrito de prueba. El usuario temporal y sus datos se
borraron al terminar.

**Anchos, Zelle y USDT**
- 320: documento 305/305, panel 204/204.
- 360: documento 345/345, panel 244/244.
- 390: documento 375/375, panel 274/274.
- 414: documento 399/399, panel 298/298.
- Escritorio: cuadrícula `728px 360px`; panel 651/651.

**Titular**
- En 320, 360, 390, 414 y 1280 el nombre empieza debajo del rótulo
  (`top >= bottom`) y comparte su borde izquierdo.
- USDT «Mercatoma» ocupa una línea. Zelle ocupa dos líneas a 320 y 360, y una
  desde 390; el nombre completo es «Orlando Antonio Prado Elias».
- El botón de titular está a la derecha del nombre.

**Copiar**
- Titular: el portapapeles recibe el nombre y aparece «Nombre del titular
  copiado».
- Cuenta: el portapapeles recibe la wallet USDT y aparece «Número de cuenta
  copiado».

**Encabezado a 320**
- Sin el botón de notificaciones, el contenedor derecho mide 88 px y el
  documento queda en 305/305.
- A 360 el botón vuelve a mostrarse (36 px), el contenedor derecho mide 132 px
  y el documento sigue en 345/345.

**Gates**
- `npx tsc --noEmit`: sin salida.
- `npx vitest run`: 21 archivos, 163 pruebas aprobadas.
- `npm run build`: compilación correcta, 28 rutas.
- Detector de UI sobre `app/checkout/page.tsx` y `components/header.tsx`: `[]`.
- Los errores de consola observados son externos: imágenes de `utfs.io` sin
  proxy y el script de Vercel Analytics ausente en local.

## Decisión

A 320 px se oculta el botón de notificaciones push en vez de truncar la marca.
Así el encabezado cabe sin perder el nombre del negocio y el botón vuelve a
aparecer desde 360 px, donde ya hay espacio.

## Next

Decidir si se publica en `origin/main`; quedan 19 commits locales pendientes de
subir.
