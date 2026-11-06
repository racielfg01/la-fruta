---
author: Raciel Ferrin
branch: main
status: done
---
# Checkout: miniatura y subida del comprobante

## Intent

Al subir un comprobante de transferencia, el checkout solo confirmaba el
nombre del archivo. No había forma de comprobar de un vistazo que la imagen
era la correcta. Ahora la caja de confirmación muestra una miniatura clicable
del comprobante; si el archivo es un PDF, muestra un icono con la etiqueta
«PDF». El detalle de la orden también muestra esa miniatura.

La miniatura destapó el fallo de producción: `/api/upload` escribía en
`public/uploads`, pero el sistema de archivos de Vercel no es persistente y la
subida devolvía 500. Las subidas nuevas usan el endpoint `receipt` de
UploadThing; los comprobantes antiguos conservan `/api/files` y el rewrite de
`/uploads/:path*`.

## Scope

**Dentro**
- Miniatura de 56×56 px (`object-contain`) dentro de la caja verde de
  confirmación; enlace a una pestaña nueva para abrir el comprobante completo.
- PDF: icono `FileText` y la etiqueta «PDF», sin `<img>`.
- El detalle de la orden muestra una miniatura de 56×56 px junto a «Ver
  comprobante»; si la URL no carga como imagen (por ejemplo, un PDF), muestra
  un icono de archivo con la etiqueta «Archivo».
- La imagen se detecta por el MIME que devuelve UploadThing (`uploaded.type`),
  no por la extensión de la URL: las URLs de UploadThing pueden no terminar en
  `.png` o `.jpg`.
- Subida con `useUploadThing("receipt")`, autenticada con el token de
  PocketBase.
- Tipos permitidos: JPG, PNG, WEBP, GIF y PDF. Límite efectivo: 5 MB.
- El cliente valida tipo y tamaño antes de subir. El middleware del endpoint
  vuelve a rechazar cualquier archivo de más de 5 MB; UploadThing se configura
  con `8MB` porque su tipo `FileSize` solo admite potencias de dos.
- Error de subida inline dentro del campo, con `role="alert"`, causa concreta
  cuando se conoce y acción «Elegir otro archivo». El toast queda para el
  éxito.
- Se conservan `/api/upload` como endpoint local legado, `/api/files` y el
  rewrite de `/uploads/:path*` para comprobantes antiguos.

**Fuera**
- No cambian el selector de moneda, los totales, la confirmación del pedido ni
  el flujo de pago.
- No se migran ni se borran los comprobantes existentes.
- No se genera una miniatura en el servidor: el navegador escala la imagen
  original.
- No se toca PocketBase ni la configuración de producción sin confirmación.
- No se versionan los archivos sueltos de `public/uploads` que no estén ya en
  el repositorio.

## Checklist

- [x] El endpoint `receipt` existe en `/api/uploadthing` y exige token.
- [x] Una imagen JPG/PNG/WEBP/GIF y un PDF se suben y devuelven una URL
      `ufsUrl`.
- [x] Un archivo de más de 5 MB se rechaza antes de generar la URL
      prefirmada.
- [x] Un archivo sin token recibe 403 y el mensaje «No autorizado».
- [x] El checkout muestra miniatura para imágenes y placeholder para PDF.
- [x] El detalle de la orden muestra la miniatura o el icono de archivo.
- [x] El error de subida es visible, accionable y no reemplaza el error de
      validación del formulario.
- [x] `tsc`, pruebas, build y detector de UI sin errores.
- [x] Verificar la subida real en `https://mercatoma.vercel.app` tras el
      despliegue.
- [x] Revisar los comprobantes antiguos de producción: hay 1 pedido y 0 URLs
      de comprobante; `/api/files` y el rewrite se conservan.

## Evidence

Verificado primero sobre el build de producción local (`next start -p 3001`) y
después sobre `https://mercatoma.vercel.app`, contra el endpoint real de
UploadThing y con un token de administrador de PocketBase. Los archivos de
prueba se borraron al terminar con `UTApi`; no se tocaron los uploads del
usuario.

**Producción**
- `GET /api/uploadthing` incluye los endpoints `productImage`,
  `categoryImage`, `bannerImage`, `bankLogo` y `receipt`.
- Imagen PNG subida: URL `https://….ufs.sh/f/…`; `HEAD` devuelve
  `200 image/png`.
- PDF subido: URL `https://….ufs.sh/f/…`; `HEAD` devuelve
  `200 application/pdf`.
- Archivo de 6 MB: `HTTP 400` con `{"message":"El archivo supera los 5 MB"}`;
  no se generó URL prefirmada.
- Sin token: `HTTP 403` con `{"message":"No autorizado"}`.
- `cleanup: ok (2)` tras borrar los dos objetos de prueba.
- Órdenes de producción: 1 pedido, 0 URLs de comprobante; no hay
  comprobantes antiguos que migrar.

**Gates**
- `npx tsc --noEmit`: sin salida.
- `npx vitest run`: 22 archivos, 176 pruebas aprobadas.
- `npm run build`: compilación correcta, 28 rutas.
- Detector de UI sobre `app/checkout/page.tsx` y
  `components/order-detail-dialog.tsx`: `[]`.

La ficha anterior afirmaba que `/api/files` servía los archivos nuevos en
producción, pero esa prueba se hizo con `next start` local y no demuestra el
comportamiento del sistema de archivos de Vercel. La ruta se conserva para
comprobantes antiguos que ya formen parte del despliegue.

## Decisión

Se usa UploadThing para las subidas nuevas porque Vercel no conserva los
archivos escritos en `public/uploads` entre peticiones ni despliegues. El
límite de 5 MB se valida en el cliente y en el middleware; la configuración de
UploadThing queda en `8MB` por la restricción de su tipo `FileSize`, no porque
se acepten 8 MB.

La imagen se detecta por MIME porque las URLs de UploadThing pueden no tener
extensión. El error se muestra inline porque el usuario necesita saber qué
pasó y cómo recuperarse sin perder el contexto del formulario. `/api/upload`,
`/api/files` y el rewrite se mantienen para no romper comprobantes antiguos;
no se borra ni se migra nada sin seguimiento.

## Next

- No hay comprobantes antiguos en las órdenes de producción; conservar
  `/api/files` y el rewrite por si aparecen.
- Decidir con el usuario qué hacer con los archivos no versionados de
  `public/uploads`; no se borraron. Si son comprobantes reales, migrarlos con
  seguimiento.
