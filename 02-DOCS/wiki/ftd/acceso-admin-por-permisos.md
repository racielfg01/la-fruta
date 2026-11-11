---
author: Raciel Ferrin
branch: main
status: done
---
# Acceso al panel por permisos (no solo rol admin)

## Intent

El sistema de roles de `/admin/configuracion?tab=roles` guarda permisos por
sección (dashboard, orders, products, shipping, users, settings, offers), pero
solo servía para filtrar el menú de quien ya era admin: la puerta de
`app/admin/layout.tsx` rechazaba a cualquier usuario cuyo `role_id` numérico
no fuera 2, y todas las server actions solo verificaban «¿es admin?».

Objetivo: un rol con permisos (p. ej. un «operador» con orders y offers) entra
de verdad al panel, ve solo sus secciones, y el servidor rechaza las acciones
que su rol no concede. El rol `admin` conserva acceso total.

## Scope

**Dentro**
- `lib/permissions.ts`: `PERMISSION_KEYS`, `permissionsForRole` (rol admin →
  todo; JSON de permisos parseado y completado en false; corrupto o ausente →
  nada) y `sectionsForPermissions` (qué colecciones ve cada permiso). Tests en
  `lib/permissions.test.ts`.
- `lib/admin-auth.ts` (nuevo): `requirePermission(token, permiso | permisos)`
  — carga el usuario con su rol expandido, calcula los permisos efectivos y
  lanza si ninguno se concede. Sustituye a los dos `verifyAdminAndGetUserId`
  duplicados de `admin.ts` y `admin-extras.ts`.
- `app/actions/admin.ts`: cada acción exige su permiso — products →
  productos/categorías, shipping → zonas de envío, users → usuarios, orders →
  órdenes, settings → monedas, offers → ofertas. `getAdminData` exige al menos
  un permiso y solo devuelve las colecciones permitidas: un operador de
  órdenes no recibe usuarios, roles ni monedas.
- `app/actions/admin-extras.ts`: todas las acciones (provincias, municipios,
  países, unidades, roles, bancos, cuentas bancarias, ajustes, banners)
  exigen `settings`, que es el permiso de la pestaña Configuración.
- `app/admin/layout.tsx`: la puerta pasa de `role_id !== 2` a «tiene algún
  permiso»; si la sección actual no está permitida, redirige a la primera
  sección permitida.

**Fuera (explícito)**
- Sin cambios de esquema en PocketBase ni en la UI de `/admin/configuracion`.
- El uploader (`app/api/uploadthing/core.ts`) sigue aceptando a cualquier
  usuario autenticado; no forma parte de esta pasada.
- `app/actions/notifications.ts` no se toca en esta pasada.
- Los permisos se siguen refrescando al login y en cada carga completa de
  página (`AuthProvider`); no hay invalidación en caliente al editar un rol.

## Checklist

- [x] `permissionsForRole` cubre admin legado, JSON completo, parcial,
      corrupto y ausente — prueba: `lib/permissions.test.ts` (7 tests).
- [x] `sectionsForPermissions` acota las colecciones por permiso — prueba:
      `lib/permissions.test.ts` (5 tests).
- [x] `requirePermission` deja pasar el permiso concedido y rechaza el resto;
      token inválido lanza sin tocar PocketBase — prueba:
      `lib/admin-auth.test.ts` (6 tests).
- [x] Las 24 acciones de `admin.ts` exigen su permiso correcto (23 CRUD +
      `getAdminData` con al menos uno) — prueba: lectura del diff +
      `grep requirePermission` = 23 + `tsc --noEmit`.
- [x] Las 36 acciones de `admin-extras.ts` exigen `settings` — prueba:
      `grep requirePermission` = 36, sin restos de `verifyAdminAndGetUserId`.
- [x] `getAdminData` no devuelve colecciones sin permiso — prueba:
      condicional `sections.X` en cada fetch + suite en verde.
- [x] La puerta de `layout.tsx` deja entrar a cualquier rol con permisos,
      redirige al resto y manda a la primera sección permitida — prueba:
      lectura del diff + build.
- [x] Suite completa, tipos y build en verde — prueba: `npx vitest run`
      (26 archivos, 218 tests), `npx tsc --noEmit` (exit 0), `npx next build`
      (Compiled successfully, 29/29 páginas).

## Evidence

**Comandos (12 nov 2026):**
- `npx vitest run` → 26 archivos, 218 tests en verde (19 nuevos: 13 de
  `permissions`, 6 de `admin-auth`).
- `npx tsc --noEmit` → exit 0.
- `npx next build` → Compiled successfully, 29/29 páginas estáticas.
- `grep -rn verifyAdminAndGetUserId app lib components` → solo el comentario
  de `lib/admin-auth.ts` que documenta la sustitución.

**Trazas del cambio:**
- `app/actions/admin.ts`: −17 líneas de verificador duplicado; 23 acciones
  con `requirePermission(token, '<permiso>')` según el mapa
  (products/shipping/users/orders/settings/offers); `getAdminData` carga cada
  colección solo si `sectionsForPermissions` la concede.
- `app/actions/admin-extras.ts`: −13 líneas de verificador duplicado; las 36
  acciones con `requirePermission(token, 'settings')`.
- `app/admin/layout.tsx`: puerta por `hasAnyPermission(user, PERMISSION_KEYS)`
  y redirección de sección sin permiso a la primera permitida.
- `lib/permissions.ts` + `lib/admin-auth.ts` (nuevos): +61/+39 líneas con
  los tests de ambas.

**Errores de proceso corregidos durante la implementación:** el primer script
de mapeo dejó duplicadas las verificaciones viejas junto a las nuevas
(grupo de regex mal cerrado); detectado por corrimiento de números de línea en
grep y reparado antes de seguir. La suite y tsc quedaron limpios después.

**Límite de la verificación:** no se probó contra una sesión real de un rol
«operador» en la PocketBase local (requiere crear el rol y un usuario). El
resto de los restos `role_id === 2` del código son espejos legados (badges,
fallbacks de rol, `resolvePermissions` del cliente) y no bloquean el acceso.

## Next

- Verificar con un rol «operador» real (permisos orders + offers) contra la
  PocketBase local: entrada al panel, menú acotado y rechazo de acciones
  ajenas.
- Decidir si el uploader de imágenes (`app/api/uploadthing/core.ts`) exige el
  permiso de su sección; hoy acepta a cualquier usuario autenticado.
- Revisar `app/actions/notifications.ts` con el mismo criterio.
- El dashboard muestra ceros en las secciones sin permiso (datos acotados);
  decidir si basta o se ocultan esas tarjetas.
- ESLint del repo está roto de antes (v10 sin `eslint.config.*`); arreglarlo
  es tarea aparte.
