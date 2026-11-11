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
- `lib/use-permissions.ts`: `canAccessAdmin(user)` — única definición de la
  puerta, usada por el layout del panel y por la pestaña «Admin» del header.
- `components/header.tsx`: la pestaña «Admin» se decide por permisos.

**Fuera (explícito)**
- Sin cambios de esquema en PocketBase durante el desarrollo. Hallazgo
  posterior (ver Evidence): la colección `roles` de producción NO tenía el
  campo `permissions` — el que la propia app ya escribía — y hubo que
  añadirlo de forma aditiva para que el feature funcione en producción.
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
- [x] La pestaña «Admin» del header aparece con los permisos del rol, no por
      `role_id === 2` — prueba: `lib/use-permissions.test.ts` (7 tests) +
      `npx tsc --noEmit` + `npx next build`.
- [x] Suite completa, tipos y build en verde — prueba: `npx vitest run`
      (27 archivos, 225 tests), `npx tsc --noEmit` (exit 0), `npx next build`
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

**Límite restante:** los restos `role_id === 2` del código son espejos legados
(badges, fallbacks de rol, `resolvePermissions` del cliente) y no bloquean el
acceso.

**Bug reportado por el usuario tras la entrega (12 nov 2026):** «no se muestra
en la ruta / en el header la pestaña de admin para el rol operador cobre».
Causa raíz: `components/header.tsx` seguía con `Number(user?.role_id) === 2`,
y en el navegador el `role_id` viene colapsado a 1/2 para todo rol no admin
(`app/actions/auth.ts`), así que «operador cobre» llegaba como `role_id: 1` y
la pestaña quedaba oculta. El `user.permissions` sí viajaba (línea 263 de
`app/actions/auth.ts`), o sea que el dato para decidir sí estaba: lo que
fallaba era la condición. Arreglo: `canAccessAdmin(user)` en
`lib/use-permissions.ts` (permisos, no role_id), usada por el header y por el
layout del panel para que las dos puertas no puedan divergir. Regresión
cubierta en `lib/use-permissions.test.ts` (7 tests: operador con orders entra;
cliente no; admin sin `permissions` entra por compatibilidad; y el header y
el layout usan la misma función). Verificación: 27 archivos / 225 tests en
verde, `tsc --noEmit` exit 0, `next build` correcto.

**Verificación con datos reales:** `expand.role_id.permissions` de «operador
cobre» llega como objeto `{... orders: true ...}` (el campo `permissions` de
PocketBase es tipo json), y `permissionsFrom` lo acepta tal cual.

**Validación contra el PB real de producción (12 nov 2026, post-commit):**
roles reales: `admin` (ndv8fysea2frqj6), `cliente` (994jwbdlrk0etxa) y
`operador cobre` (rb69mios4vh1az3) — los tres SIN campo `permissions` en el
registro. Test temporal contra el PB real con tokens de impersonación (sin
contraseñas) de jenny@lafruta.com (operador cobre) y admin@lafruta.com
(admin), fetch del SDK parcheado con curl porque el sandbox solo sale por
proxy:

- `admin` (sin campo) → compatibilidad por nombre: TODO pasa en los 7
  permisos, `userId` correcto.
- `cliente` (sin campo) → NO_PERMISSIONS, sin secciones, sin entrada.
- `operador cobre` (sin campo) → NO_PERMISSIONS: rechazado en los 7 permisos,
  uno a uno y como array («permisos insuficientes»).
- Resultado: 7/7 tests en verde con datos y tokens reales; el test temporal se
  borró tras correr (no forma parte de la suite).

Conclusión: la puerta por permisos funciona; «operador cobre» necesita
permisos asignados en `/admin/configuracion?tab=roles` para que sus 2 usuarios
(josefaformigohernandez@gmail.com, jenny@lafruta.com) entren al panel.

**Deriva de esquema descubierta y corregida (12 nov 2026):** al asignar los
permisos por API, el PATCH devolvía `permissions: undefined` — la colección
`roles` de producción solo tenía id/name/description/created_at. El campo
`permissions` (json, no requerido) se añadió con PATCH de colección sobre el
array `fields` existente, preservando ids y `onCreate` del autodate. Sin ese
campo, `createRoleAction`/`updateRoleAction` habrían estado descartando
silenciosamente los permisos en producción. `scripts/setup-pocketbase.ts` es
legado y no define el campo; ninguna instancia documentada lo define.

**Asignación aplicada (decisión del dueño: solo `orders`) y re-validación:**
rol «operador cobre» (rb69mios4vh1az3) con
`{"dashboard":false,"orders":true,"products":false,"shipping":false,"users":false,"settings":false,"offers":false}`,
mismo formato que `updateRoleAction`. Re-validación end-to-end con tokens de
impersonación reales: operador + `orders` → pasa (userId correcto); operador +
cada uno de los otros 6 permisos → rechazado; array sin orders → rechazado;
array con orders → pasa; admin (regresión) → pasa todo. 7/7 tests en verde,
tabla por rol: admin TODO (SÍ panel), cliente nada (NO), operador cobre solo
orders (SÍ panel, solo sección orders). Nota: los permisos se leen del
expande en cada acción, pero el menú/puerta del cliente usa el usuario
cacheado — jenny y josefa deben recargar o re-login para ver el panel.

**Sesión en producción (11 nov 2026, tarde): «la pestaña no se ve» y «me
desloguea».** Tres hallazgos, con evidencia:

1. **La pestaña «Admin» no se veía porque el arreglo nunca llegó a producción.**
   El commit `97bd7fb` (la pestaña se decide por permisos del rol) estaba
   **solo en local**: `git branch -vv` mostraba `main [origin/main: adelante 1]`
   y `git log origin/main` terminaba en `fd6d29e`. El bundle servido en
   `mercatoma.vercel.app` todavía traía la condición vieja
   `M = ready && 2 === Number(user?.role_id)` — el `role_id` colapsado a 1/2
   hace que «operador cobre» nunca pase el filtro. Push a `origin/main` y
   despliegue: el bundle desplegado ya incluye `canAccessAdmin`.

2. **`/admin` → `/admin/ordenes` es el comportamiento correcto, no un fallo.**
   El rol «operador cobre» tiene `orders: true` y `dashboard: false`, así que el
   layout lo manda a la primera sección que su rol tiene permitida. Si el dueño
   quiere que `/admin` abra el panel en vez de las órdenes, hay que darle
   `dashboard` al rol (decisión de permisos, no de código).

3. **El cierre de sesión sí era un fallo — y no solo del «operador cobre».**
   `AuthProvider` cerraba la sesión ante **cualquier** fallo al revalidar
   (red caída, 5xx, timeout), y el layout del panel decidía «no tienes
   permisos» con el usuario **cacheado**, sin esperar a que el servidor
   confirmara la sesión. Consecuencias reproducidas en navegador: con la
   caché obsoleta (permisos asignados después del login) entrar a `/admin`
   expulsaba al usuario a la portada y no lo dejaba volver al panel; con un
   fallo de red en las Server Actions, la sesión se cerraba y el usuario
   acababa en `/auth/login`.

   Arreglo:
   - `refreshUserAction` devuelve un `code`: `invalid_session` cuando el token
     ya no vale (el servidor lo dice) y `error` cuando no se pudo saber.
   - El cliente solo cierra la sesión ante `invalid_session`
     (`lib/session-refresh.ts`); un fallo transitorio conserva la sesión.
   - El layout del panel espera a que el servidor valide la sesión antes de
     redirigir (`lib/admin-gate.ts`): `wait` mientras no ha confirmado,
     `login` sin sesión, `home` sin permisos, `allow` en otro caso.
   - El store distingue «hidratado» de «sesión validada»
     (`sessionValidated`, que ya no se persiste): tras recargar, la sesión
     cacheada está sin confirmar hasta que el servidor responde.

   Regresión: `lib/session-refresh.test.ts` (5 tests) y `lib/admin-gate.test.ts`
   (6 tests).

**Verificación en navegador contra producción** (cuenta real de rol «operador
cobre», 11 nov 2026): la pestaña «Admin» aparece en la portada; `/admin` abre
`/admin/ordenes`; con la caché obsoleta ya no expulsa a la portada; con un
fallo de red la sesión se conserva y el panel abre; con un token caducado la
sesión sí se cierra (que es lo correcto). `npx vitest run` → 29 archivos /
236 tests en verde, `npx tsc --noEmit` exit 0, `npx next build` correcto.

## Next

- **Decidir si «operador cobre» recibe `dashboard`**: con `dashboard: false`
  entrar a `/admin` abre siempre `/admin/ordenes` (comportamiento correcto,
  pero puede sorprender). Es un cambio de permisos en
  `/admin/configuracion?tab=roles`, no de código.
- `components/push/notification-bell.tsx` sigue ocultando la campana solo para
  `role_id === 2`: «operador cobre» la ve. Decidir si el personal con permisos
  (no solo el admin) también debe perderla.
- Documentar la deriva de esquema como riesgo del setup legado
  (`scripts/setup-pocketbase.ts` no refleja el esquema real; el campo
  `permissions` no está definido en ninguna fuente del repo).
- Decidir si el uploader de imágenes (`app/api/uploadthing/core.ts`) exige el
  permiso de su sección; hoy acepta a cualquier usuario autenticado.
- Revisar `app/actions/notifications.ts` con el mismo criterio.
- El dashboard muestra ceros en las secciones sin permiso (datos acotados);
  decidir si basta o se ocultan esas tarjetas.
- ESLint del repo está roto de antes (v10 sin `eslint.config.*`); arreglarlo
  es tarea aparte.
