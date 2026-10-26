---
author: Raciel Ferrin
branch: main
status: done
---
# Banners de la portada

## Intent

La portada (`/`) arranca hoy con un hero fijo («Nuestra Tienda» + número de
productos) y no hay forma de destacar nada: ni una promoción de temporada, ni un
producto concreto, ni un aviso («envío gratis los martes»). Cambiar el mensaje
del día obliga a tocar código y recompilar.

El objetivo es una pestaña **Banners** en `/admin/configuracion` donde el
administrador crea franjas con imagen, texto opcional y —si quiere— un destino
al que llevar al tocar. En la portada se muestran como un carrusel debajo del
hero. Si no hay banners activos, la portada queda exactamente como está hoy.

## Scope

**Dentro**
- Nueva colección PB `banners` (`title`, `subtitle`, `image`, `link_type`,
  `product_id`, `url`, `active`, `sort`) con lectura pública y escritura solo
  admin.
- Acciones de admin: `getBannersAction`, `createBannerAction`,
  `updateBannerAction`, `deleteBannerAction` (verifican rol admin como el resto
  de `admin-extras`).
- Acción pública `getPublicBanners()`: solo activos, ordenados por `sort`.
- Pestaña `banners-tab.tsx`: tabla con miniatura, tipo de enlace, activo y
  orden; diálogo con subida de imagen (UploadThing, endpoint `bannerImage`) o
  URL pegada, título/subtítulo, tipo de enlace y destino.
- Tipos de enlace:
  - `none` — **informativo**: la franja no es un enlace.
  - `product` — el administrador elige un producto del catálogo; la franja
    lleva a su ficha.
  - `url` — URL libre (interna tipo `/ofertas` o externa `https://…`). Es la
    puerta para una futura página de ofertas sin tocar el modelo.
- Carrusel en la portada (`components/banner-carousel.tsx`), solo si hay
  banners activos: una franja por vista, flechas en escritorio, puntos y swipe
  en móvil.
- El hero («Nuestra Tienda», 12 productos…) **solo** se muestra cuando no hay
  banners activos: si los hay, el carrusel ocupa su lugar. La página conserva un
  `<h1>` solo para lectores de pantalla y buscadores.

**Fuera**
- No se crea una página ni un concepto de «oferta»: no existe en el código y
  el tipo `url` deja el hueco preparado.
- Sin programación por fechas (inicio/fin). Se activa y desactiva a mano.
- Sin variante de imagen para móvil: una sola imagen, recortada con
  `object-cover`.
- Sin autoplay: el carrusel no rota solo (evita movimiento no pedido y es más
  predecible para verificar).

## Checklist

- [x] Colección `banners` creada en PocketBase con lectura pública.
- [x] Endpoint `bannerImage` en UploadThing para subir la imagen.
- [x] Acciones de admin con validación de tipo, destino y URL segura
      (solo `http(s)://` o rutas que empiezan por `/`).
- [x] Pestaña Banners visible en `/admin/configuracion` y operativa
      (crear, editar, activar, ordenar, borrar).
- [x] Carrusel en `/` con banners activos; informativo no clickeable.
- [x] Sin banners activos, la portada no cambia (hero visible, sin carrusel).
- [x] Con banners activos, el hero se oculta y el carrusel queda arriba.
- [x] Verificado en navegador (escritorio y móvil) y `tsc --noEmit` limpio.

## Evidence

Verificado en el navegador contra el servidor de desarrollo (`localhost:3000`)
con datos reales de PocketBase.

**Pestaña Banners** (`/admin/configuracion` → Banners)
- La tabla lista los banners con miniatura, destino, orden y estado.
- Crear: diálogo «Nuevo Banner» → guardado, toast «Banner creado», la fila
  aparece al final con el orden propuesto (máximo + 1).
- Editar: el diálogo precarga imagen, título, subtítulo y orden; al guardar,
  toast «Banner actualizado» y la fila cambia en la tabla.
- Activar/desactivar: el interruptor se mueve en el mismo frame (actualización
  optimista) y se deshabilita mientras guarda; si falla, vuelve a su sitio.
- Borrar: pide confirmación (`¿Eliminar el banner "…"?`), desaparece la fila.
- Destino: «No lleva a ningún lado (informativo)», «Abrir un producto» (lista
  los 12 productos del catálogo) y «Abrir una URL».
- URL peligrosa: guardar `javascript:alert(1)` deja el diálogo abierto y avisa
  «La URL debe empezar por http(s):// o por /».

**Portada con banners** (2 activos: informativo + producto)
- Escritorio 1280: 2 franjas, 1233×411 (3:1), flechas dentro del marco, puntos.
- La franja informativa es un `div` (no clickeable); la de producto es un `<a>`
  a `/product/1780349898731`; una de prueba con URL `/` fue un `<a href="/">`.
- Móvil 390: franja 343×215 (16:10), flechas ocultas, puntos de 8 px, sin
  desbordamiento horizontal (`scrollWidth == innerWidth`).
- El hero no aparece; el `<h1>` «Nuestra Tienda» queda `sr-only`.
- Imágenes servidas por el proxy `/api/img` (`optimizedImageUrl`).

**Portada sin banners activos**
- Sin carrusel, el hero vuelve tal cual: «Nuestra Tienda», «Frutas frescas y
  productos agrícolas seleccionados del día.», «12 productos», «Envío por
  zona», «Garantía de frescura», `<h1>` visible a 113 px del borde superior.

**Estático**
- `npx tsc --noEmit` sin errores.

## Next

- Si aparece la página de ofertas, añadir el tipo `offer` al `link_type` en
  lugar de reutilizar `url`.
- Valorar programación por fechas (`starts_at` / `ends_at`) para campañas.
