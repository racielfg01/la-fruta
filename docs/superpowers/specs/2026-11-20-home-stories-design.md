# Historias en la portada (tipo Facebook/Instagram)

## Intent

Reemplazar el banner de la ruta inicial (`/`) por una experiencia de **historias**: tarjetas pequeñas, verticales, en una fila con desplazamiento horizontal. Al tocar una tarjeta se abre la historia en pantalla completa, se reproduce por un tiempo configurable y avanza automáticamente a la siguiente. Además de ver contenido, las personas con sesión iniciada pueden reaccionar y su reacción queda guardada por historia.

**Por qué ahora:** el banner actual destaca contenido estático; las historias permiten una presentación más dinámica y, con reacciones por usuario, recoger señal sobre qué contenido interesa.

## Goals

- Mostrar en la portada (`/`) una tira horizontal (`overflow-x-auto`) de tarjetas de historia, rectangulares y más altas que anchas, en lugar del carrusel de banners.
- Al tocar una tarjeta, abrir un visor en pantalla completa que muestre la imagen de la historia, el nombre en la esquina inferior izquierda, una duración configurable (autoavance) y un CTA en la parte inferior cuando la historia tenga enlace.
- Permitir que usuarios autenticados reaccionen con: `me_gusta`, `me_encanta`, `da_igual`, `no_me_gusta`; guardar la reacción asociada a (historia, usuario) y permitir cambiarla.
- Administrar historias desde `/admin/configuracion`, dentro de la sección/pestaña de Banners, en una **pestaña separada** de la gestión de banners existente.

## Non-goals

- No implementar historias efímeras con caducidad automática (24 h) ni programación por fechas en esta versión.
- No implementar subida de video, audio, múltiples diapositivas por historia ni texto enriquecido/caption aparte del nombre.
- No implementar analítica pública de conteos de reacciones ni panel admin de “quién reaccionó” en esta versión (los datos quedan guardados para uso futuro).
- No migrar ni eliminar automáticamente los banners existentes; conviven en admin y el toggle de visibilidad de banners sigue existiendo.

## Anti-goals

- No romper el comportamiento SEO/accesibilidad actual de la portada (la página debe seguir teniendo un `h1` accesible como hoy).
- No permitir reacciones sin autenticación ni exponer datos de reacción de otros usuarios al cliente.
- No bloquear el render de la portada si faltan colecciones/datos de historias (degradar con gracia).

## Constraints

- Stack actual: Next.js App Router, React, TypeScript, Tailwind/shadcn UI, PocketBase como backend, Zustand donde aplica, server actions en `app/actions/*`.
- Patrones existentes a seguir: banners (`banners` colección, acciones admin en `admin-extras.ts`, lectura pública en `public.ts`, UI en `app/admin/configuracion/tabs/banners-tab.tsx`, render en `components/banner-carousel.tsx` / `components/store-view.tsx` / `app/page.tsx`).
- **Entorno/PB:** la creación de colecciones/campos/reglas en PocketBase no es automatizable desde este repo; el diseño asume que se crearán las colecciones indicadas (o se entregará script/instrucciones si el entorno lo permite). El código debe manejar ausencia de colección sin tumbar la portada.
- Autenticación disponible vía `useAuthStore`/token; acciones que mutan reacción deben validar identidad del usuario autenticado.

## Decisiones del usuario (acordadas)

- Portada: tarjetas pequeñas, rectangulares, más altas que anchas, con scroll horizontal.
- Apertura: al tocar, pantalla completa; duración configurable (default 5 s mencionado) y luego salta a la siguiente.
- Contenido por historia: imagen, nombre, tiempo de duración, enlace CTA en la parte inferior.
- Destino del CTA: producto concreto u oferta concreta.
- Nombre visible en la esquina inferior izquierda en todas las pantallas (tarjeta y fullscreen).
- Admin: `/admin/configuracion`, dentro de la sección de Banners, en pestaña separada de banners.
- Reacciones en pantalla completa: “me gusta”, “me encanta”, “da igual”, “no me gusta”; se guardan asociadas a la historia y a la persona; solo usuarios con sesión iniciada; una persona puede cambiar su reacción.

## Diseño propuesto (partes y llamadas del builder)

### Modelo de datos (PocketBase)

**`stories`** (lectura pública de activas; escritura admin, `settings` permission como banners):
- `name` (text, requerido)
- `image` (text/url, requerido para publicar útilmente)
- `duration` (number, segundos, default 5, mínimo 1)
- `link_type` (`none` | `product` | `offer`)
- `product_id` (text, opcional)
- `offer_id` (text, opcional)
- `active` (bool, default true)
- `sort` (number, default 0)
- timestamps PB

**`story_reactions`** (acceso autenticado; reglas PB deben restringir a dueño para crear/actualizar su reacción y lectura según necesidad mínima):
- `story` (relation/text id a `stories`)
- `user` (relation/text id a usuario autenticado)
- `reaction` (`like` | `love` | `whatever` | `dislike`)
- unique lógico por (`story`,`user`) — al cambiar reacción se actualiza el registro existente (upsert en acción).
- timestamps PB

*Llamada del builder:* nombres de campos en snake_case/camelCase según convención PB del proyecto; tipos concretos de relación según esquema PB existente.

### Admin (`/admin/configuracion`, pestaña Banners)

- Reestructurar `banners-tab.tsx` para mostrar **subpestañas** (Tabs UI) separadas: “Banners” e “Historias”, manteniendo el toggle existente “Mostrar banners en la portada” visible en la sección de Banners (su contexto actual).
- Subpestaña Historias: listado con miniatura, nombre, duración, CTA, orden, activo; acciones crear/editar/eliminar/activar. Diálogo de formulario con: imagen (upload/URL como banners), nombre, duración (segundos), activo, orden, tipo de enlace (ninguno/producto/oferta) y selector de producto u oferta concreta según tipo.
- Validaciones: imagen y nombre requeridos; duración >= 1 entero; destino válido según tipo (producto existente/id, oferta existente/id).

*Llamada del builder:* la selección de “oferta concreta” se basa en ofertas disponibles en admin/public data (`offers`) mostrando nombre/identificador legible; si no hay selector directo reutilizable, implementar carga de opciones en el tab.

### Lectura pública y acciones

- Acción pública `getPublicStories()`: activas, ordenadas por `sort,created`, mapeadas a tipo público seguro (sin datos de reacción de terceros). Tolerar colección ausente devolviendo `[]`.
- Acciones admin de stories: `get/create/update/delete` con `requirePermission(token,'settings')`.
- Acciones de reacción (autenticadas): `getMyStoryReaction(storyId, token)` / `setStoryReaction(storyId, reaction, token)` que resuelven usuario desde token, validan story y hacen upsert; devolver estado actual del usuario. No exponer reacciones ajenas.

### Portada

- `app/page.tsx` obtiene historias públicas en paralelo. La tira de historias se muestra en la zona donde hoy aparece el carrusel de banners (`StoreView`), como reemplazo visual principal: **si hay historias activas públicas, se renderiza la tira de historias**; si no, se conserva el comportamiento actual (carrusel de banners si visible y hay banners activos, si no hero). *Llamada del builder para resolver ambigüedad banner/historias:* esto prioriza “sustituir el banner por historias” cuando hay historias configuradas, sin requerir desactivar banners manualmente; el toggle de banners sigue afectando el fallback de carrusel/banner.
- Tira: tarjetas portrait (ej. proporción ~9:16, altura fija responsive) con imagen de fondo, overlay de nombre en esquina inferior izquierda, scroll horizontal con snap suave.
- Accesibilidad/SEO: mantener `h1` sr-only cuando no se muestre el hero visible (misma lógica que hoy, extendida a “hay historias”).

### Visor de historias (fullscreen)

- Overlay/modal a pantalla completa (`fixed inset-0`, alto z-index) con fondo oscuro.
- Contenido: imagen (contain/cover según mejor encaje, sin deformar), nombre en esquina inferior izquierda, CTA en parte inferior cuando `link_type != none` (botón enlaza a `/product/[id]` o destino de oferta concreta — *llamada del builder*: usar ruta de oferta existente si hay detalle; si no, enlazar a `/ofertas` con ancla/identificador o fallback seguro y documentarlo).
- Progreso: barras superiores segmentadas por historia en la secuencia activa; la activa se llena según tiempo transcurrido.
- Autoavance: avanza al siguiente segmento tras `duration` segundos; al terminar la última historia cierra el visor. *Llamada del builder.*
- Navegación/controles (no especificados explícitamente, necesarios para usabilidad): botón cerrar (X), toque/zona derecha avanza, zona izquierda retrocede, mantener pulsado pausa la progresión. *Llamada del builder.*
- Reacciones: barra/botones de reacción visibles en el visor; al pulsar, requiere sesión (si no hay sesión, mostrar aviso/toast invitando a iniciar sesión, sin guardar). Muestra estado seleccionado del usuario actual y permite cambiarlo. Persistencia vía acción autenticada con actualización optimista.

### Ofertas concretas

- El modelo de oferta ya existe (`getPublicOffers`, admin ofertas). El CTA “oferta concreta” debe identificar una oferta por id. *Llamada del builder:* mapear id de oferta a URL navegable coherente con la app (p.ej. página/sección de ofertas resaltando o enlazando la oferta si existe ruta; en su defecto `/ofertas`).

## Riesgos y notas

- **PB schema pendiente:** sin colecciones `stories` y `story_reactions` las funciones devolverán vacío/fallarán de forma controlada; se debe documentar en el FTD/PR interno del cambio.
- **Privacidad:** reacciones por usuario son datos personales de comportamiento; limitar acceso y no exponer listados de terceros.
- **Rendimiento:** imágenes de historias deben usar `next/image` u optimización equivalente como banners; precarga razonable.
- **Alcance:** feature grande (admin + público + visor + backend reacciones). Implementar en incrementos verificables.

## Aprobación

Diseño entregado para aprobación tras incorporar la retroalimentación “nada” sobre la descripción conversacional. Llamadas del builder marcadas explícitamente donde el usuario no especificó detalle.
