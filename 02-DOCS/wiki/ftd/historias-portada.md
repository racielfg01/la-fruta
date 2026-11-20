---
author: OpenCode
branch: main
status: done
---
# Historias en la portada

## Intent

La portada puede destacar novedades y promociones con un formato tipo historias: tarjetas verticales en una tira horizontal que, al tocarlas, abren un visor a pantalla completa con avance automático, CTA opcional y reacciones. La gestión se hace desde admin sin tocar código.

## Scope

**Dentro**
- Tira horizontal de historias activas en la portada (`/`), con tarjetas verticales y nombre visible.
- Visor a pantalla completa: imagen, nombre abajo a la izquierda, barra de progreso por historia, avance automático según duración (5 s por defecto), pausa al mantener pulsado, navegación anterior/siguiente, cierre y CTA opcional.
- CTA por historia: `none` (sin enlace), `product` (lleva a `/product/{id}`) o `offer` (lleva a `/ofertas`).
- Reacciones por usuario autenticado: 👍 `like`, ❤️ `love`, 😐 `whatever`, 👎 `dislike`; se pueden cambiar y se guardan por usuario+historia. Usuario no autenticado ve aviso para iniciar sesión y no se escribe nada.
- Admin > Configuración > Banners: subtabs **Banners** e **Historias**. Historias permite crear, editar, activar/desactivar, ordenar y eliminar (imagen, nombre, duración, enlace/CTA, orden, activo).

**Fuera**
- Analítica/agregados públicos de reacciones.
- Programación por fechas, stickers, texto sobre imagen, múltiples medios por historia.
- Cambios de esquema PocketBase aplicados automáticamente por código (las colecciones/reglas deben existir en el entorno).

## Checklist

- [x] Tipos y validaciones de historias (`lib/stories.ts`, `lib/story-viewer.ts`) con pruebas.
- [x] Carga pública de historias activas con degradación si falta la colección (`app/actions/public-stories.ts`, integración en `app/page.tsx` / `components/home-experience.tsx` / `components/store-view.tsx`).
- [x] Acciones admin de historias con validación y permisos (`app/actions/admin-extras.ts`).
- [x] Tira y visor en portada (`components/home-stories.tsx`).
- [x] Reacciones autenticadas por usuario (`app/actions/story-reactions.ts`, UI en `components/home-stories.tsx`).
- [x] Subtab de administración de historias en Configuración > Banners (`app/admin/configuracion/tabs/*`).
- [x] Verificación automática enfocada: vitest, eslint y `tsc --noEmit` sin errores nuevos.

## Comportamiento y ubicación

- **Portada**: si existen historias activas, se muestran en la región superior de la portada con prioridad sobre el carrusel/hero habitual; si no hay historias activas o la colección no existe, la portada mantiene el comportamiento anterior sin romper.
- **Admin**: `/admin/configuracion` → pestaña **Banners** → subtab **Historias**.

## PocketBase: colecciones y campos requeridos

Para habilitar la funcionalidad completa en un entorno, deben existir:

### `stories`
Campos esperados (snake_case en PB):
- `name` (text, requerido): nombre visible en tarjeta y visor.
- `image` (text/url o campo de archivo según convención del proyecto; la UI guarda URL/string), requerido.
- `duration` (number, entero >= 1, por defecto 5): segundos por historia.
- `link_type` (select/text): `none` | `product` | `offer`.
- `product_id` (text, opcional): id de producto cuando `link_type = product`.
- `offer_id` (text, opcional): id de oferta cuando `link_type = offer`.
- `active` (bool, por defecto true).
- `sort` (number): orden ascendente.
- Timestamps estándar si aplica.

Reglas sugeridas: lectura pública/listado de historias activas para la portada; creación/edición/borrado solo para administradores con permiso de configuración.

### `story_reactions`
Campos esperados:
- `story` (relación o text id de `stories`, requerido).
- `user` (relación o text id de usuario, requerido).
- `reaction` (select/text): `like` | `love` | `whatever` | `dislike`.

Reglas sugeridas: cada usuario autenticado solo puede listar/crear/actualizar sus propias reacciones (privacidad por usuario); no exponer reacciones de terceros. Conviene unicidad lógica `(user, story)`.

> Nota: el código degrada con gracia si faltan colecciones (portada sin crash, lectura de reacciones vacía), pero crear/guardar historias o reacciones requiere esquema y reglas correctos en PocketBase.

## Evidence

- Automatizado (2026-11-20): `pnpm exec vitest run lib/stories.test.ts lib/story-viewer.test.ts app/actions/public-stories.test.ts app/actions/admin-stories-actions.test.ts app/actions/story-reactions.test.ts` → 15 tests en 5 archivos, PASS.
- `pnpm exec tsc --noEmit` → sin errores.
- `pnpm exec eslint` en archivos tocados de historias/admin → 0 errores (warnings preexistentes en archivos ajenos a la feature, p. ej. `components/store-view.tsx`).
- Commits de implementación: `61716af`, `3dc6e32`, `5fe5603`, `00054dd`, `da846f0`, `f90dca1`.

### Smoke manual (pendiente de ejecutar en entorno con PB preparado)
- [ ] Sin colección/campo de historias o sin historias activas: portada carga normal y mantiene fallback.
- [ ] Admin > Configuración > Banners > Historias: crear/editar/activar/ordenar/eliminar con PB listo.
- [ ] Portada con historias activas: tira horizontal, visor fullscreen, autoavance por duración, pausa, prev/next, cierre y CTA.
- [ ] Usuario autenticado: reaccionar y cambiar reacción persistida; usuario no autenticado: aviso sin escritura.

## Next

- Ejecutar smoke manual en un entorno con colecciones `stories` y `story_reactions` y reglas aplicadas.
- Si se requiere analítica, agregar agregados de reacciones sin exponer identidades de terceros.
- Evaluar enlace directo a oferta específica cuando exista ruta de detalle.
