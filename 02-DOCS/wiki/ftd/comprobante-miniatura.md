---
author: Raciel Ferrin
branch: main
status: in-progress
---
# Checkout: miniatura del comprobante

## Intent

Al subir un comprobante de transferencia, el checkout solo confirmaba el
nombre del archivo. No había forma de comprobar de un vistazo que la imagen
era la correcta. Ahora la caja de confirmación muestra una miniatura clicable
del comprobante; si el archivo es un PDF, muestra un icono con la etiqueta
«PDF».

La miniatura también destapó un fallo de producción: `next start` no servía
los archivos añadidos a `public/uploads` después del build, así que la imagen
quedaba rota. Las subidas nuevas pasan a servirse por `/api/files` y las URLs
antiguas `/uploads/...` se redirigen a esa ruta.

## Scope

**Dentro**
- Miniatura de 56×56 px (`object-contain`) dentro de la caja verde de
  confirmación; enlace a una pestaña nueva para abrir el comprobante completo.
- Imagen de 54×54 px dentro del marco, sin recortar el documento; el `alt` es
  decorativo porque el enlace tiene `aria-label="Abrir comprobante"`.
- PDF: icono `FileText` y la etiqueta «PDF», sin `<img>`.
- La caja se apila en móvil (nombre arriba, «Ver» y quitar abajo) y vuelve a
  una fila en escritorio.
- El botón de quitar mide 32×32 px y conserva su etiqueta accesible.
- `/api/upload` devuelve `/api/files/<uuid>` en lugar de `/uploads/<uuid>`.
- Rewrite de `/uploads/:path*` a `/api/files/:path*` para que los comprobantes
  ya guardados en órdenes sigan abriendo con `next start`.

**Fuera**
- No cambian el selector de moneda, los totales, la confirmación del pedido ni
  el detalle de la orden.
- No se genera una miniatura en el servidor: el navegador escala la imagen
  original; el archivo completo sigue siendo el que se abre.
- No se cambian los límites de 5 MB ni los tipos permitidos (jpg, png, webp,
  gif y PDF).
- No se persiste la vista previa: el estado vive en el checkout hasta enviar
  el pedido.
- No se toca PocketBase ni la configuración de producción.

## Checklist

- [x] Un comprobante de imagen muestra miniatura, nombre, «Ver» y quitar.
- [x] La miniatura abre el comprobante en una pestaña nueva.
- [x] Un comprobante PDF muestra «PDF» y no renderiza un `<img>`.
- [x] La caja no desborda a 320, 360, 390, 414 ni 1280 px.
- [x] Quitar el comprobante devuelve al selector y permite subir otro.
- [x] Las subidas nuevas se sirven con 200 en producción mediante
      `/api/files/<uuid>`.
- [x] Las URLs antiguas `/uploads/<uuid>` también responden 200 mediante el
      rewrite.
- [x] `tsc`, pruebas, build y detector de UI sin errores.

## Evidence

Verificado sobre el build de producción (`next start -p 3001`), con un usuario
temporal de QA, un carrito de prueba y una imagen de 240×160 px generada para
la prueba. El usuario y los seis archivos de prueba se borraron al terminar;
no se tocaron los uploads del usuario.

**Imagen a 390 px**
- Documento 375/375, panel 274/274, caja del comprobante 274/274.
- Miniatura 56×56; imagen 54×54; natural 240×160; `object-fit: contain`.
- `href` y `src`: `/api/files/b63ee60c-…png`; la imagen carga con
  `complete: true`.

**Anchos**
- 320: documento 305/305, panel 204/204, caja 204/204; miniatura 56×56.
- 360 y 414: documento, panel y caja sin diferencia entre `scrollWidth` y
  `clientWidth`.
- 1280: misma miniatura de 56×56 y sin desbordamiento en la caja ni en la
  página.

**PDF**
- `href` `/api/files/93fdd…pdf`; texto de la caja «PDF receipt-test.pdf Ver»;
  0 elementos `<img>`; miniatura de 56 px.

**Quitar y volver a subir**
- «Quitar comprobante» elimina la caja y devuelve el selector de archivo.
- Una segunda subida vuelve a mostrar la miniatura y el nombre.

**Servido en producción**
- `GET /uploads/c4f1c419-…png` → `200 image/png` (rewrite).
- `GET /api/files/c4f1c419-…png` → `200 image/png`.
- `GET /uploads/437df0b2-…pdf` → `200 application/pdf`.
- `GET /api/files/437df0b2-…pdf` → `200 application/pdf`.
- Antes del cambio, esos mismos archivos añadidos después del build
  respondían `404`.

**Gates**
- `npx tsc --noEmit`: sin salida.
- `npx vitest run`: 21 archivos, 163 pruebas aprobadas.
- `npm run build`: compilación correcta, 28 rutas.
- Detector de UI sobre `app/checkout/page.tsx`: `[]`.
- Los errores de consola observados son externos: imágenes de `utfs.io` sin
  proxy y el script de Vercel Analytics ausente en local.

**Capturas**
- `.playwright-mcp/receipt-image-final-390.png`
- `.playwright-mcp/receipt-image-final-1280.png`

## Decisión

Se usa `object-contain` para que la miniatura muestre el comprobante completo
en vez de recortarlo. La miniatura es un enlace además del texto «Ver»: el
texto sigue siendo explícito y la miniatura da un objetivo táctil grande.

Las subidas nuevas apuntan directamente a `/api/files`; el rewrite conserva
las URLs `/uploads` que ya estén guardadas en órdenes y sirve los archivos
estáticos existentes. La ruta lee de `public/uploads` en cada petición, así
que no depende del manifiesto del build.

## Next

- Decidir si se publican en `origin/main` los commits locales pendientes.
- Si los comprobantes pasan a almacenamiento externo, sustituir la lectura
  local de `/api/files` por la URL del proveedor.
