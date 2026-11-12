---
author: Raciel Ferrin
branch: main
status: done
---
# Verificación real de la sesión (el token no autenticaba a nadie)

## Intent

`decodePocketBaseToken()` (lib/auth.ts) deserializa el payload del JWT de
PocketBase y comprueba la caducidad. **No comprueba la firma.** Cuatro puertas
se apoyaban solo en eso, así que un token escrito a mano —con la firma
inventada y el `id` de otra persona— pasaba el filtro y el backend obedecía.

Objetivo: que ninguna puerta acepte una identidad que el servidor no ha
validado, sin castigar al usuario cuando PocketBase simplemente no responde.

## Scope

**Dentro**
- `lib/verify-session.ts` (nuevo): `verifySession(token)` valida el token
  **contra PocketBase** (`getOne` con el token como credencial) y devuelve la
  identidad del **registro**, no la del token. Distingue dos fallos:
  `invalid_session` (PocketBase rechazó la petición: 400/401/403/404 → la
  sesión se cierra) y `unavailable` (red caída o 5xx → no dice nada del token,
  la sesión sobrevive).
- `app/actions/saved.ts`: las 9 acciones de direcciones y beneficiarios sacan
  el titular de `verifySession` en vez del token.
- `app/actions/orders.ts`: `createOrderAction` (el `userId` del pedido ya no
  se compara contra lo que afirma el token ni contra lo que envía el cliente),
  `getUserOrders` y `updateUserProfile`.
- `app/api/upload/route.ts`: valida la sesión antes de escribir el fichero.
- `app/api/uploadthing/core.ts`: los 6 routers validan la sesión.
- `lib/auth.ts`: `decodePocketBaseToken` documentado como **lo que no es**
  (no autentica), con pointer a `verifySession`.

**Fuera (explícito)**
- El uploader **no** exige el permiso por sección: el endpoint solo produce un
  archivo; quien lo adjunta a un producto, una categoría o un banner es la
  server action de ese apartado, que ya exige su permiso (`requirePermission`).
- No se cambia la regla de la colección `users` ni la de `roles`.
- No se toca `lib/admin-auth.ts`, `lib/push/authz.ts`,
  `app/actions/referrals.ts` ni `refreshUserAction`: ya validaban contra
  PocketBase (usan `getTokenPB` + `getOne`).

## Checklist

- [x] `verifySession` devuelve el id del **registro**, no el que afirma el
      token — prueba: `lib/verify-session.test.ts` (8 tests).
- [x] Un token que PocketBase rechaza no abre sesión — prueba: mismo test
      (PB devuelve 404 → `invalid_session`).
- [x] Una caída de red **no** invalida la sesión — prueba: mismo test
      (status 0 y 500 → `unavailable`).
- [x] `saved.ts`, `orders.ts`, `/api/upload` y UploadThing usan `verifySession`
      — prueba: lectura del diff + `grep decodePocketBaseToken` (los usos que
      quedan validan contra PocketBase después).
- [x] Suite completa, tipos y build en verde — prueba: `npx vitest run`
      (30 archivos, 243 tests), `npx tsc --noEmit` (exit 0), `npx next build`
      (Compiled successfully).

## Evidence

**Reproducción contra producción (11 nov 2026, antes del arreglo).** Con un
token forjado (`alg: HS256`, firma inventada, `id` de una usuaria real):

| Prueba | Antes | Después |
| --- | --- | --- |
| `POST /api/upload` sin token | `401` | `401` |
| `POST /api/upload` con token forjado | **`200`, escribe el fichero** | **`401`** |
| `getUserAddressesAction` con token forjado | **devuelve la dirección de otra persona** | **`rechazado`** |

El caso de las direcciones se comprobó con un usuario y una dirección de
prueba creados alEffecto y **borrados después** (0 usuarios y 0 direcciones de
prueba restantes).

**Por qué PocketBase sí sirve de verificador:** con la firma inválida devuelve
`404` (lo trata como petición no autenticada y la regla `id = @request.auth.id`
no encaja), y con la firma buena devuelve `200` el registro del titular. Por
eso `getOne` con el token como credencial es la comprobación: valida la firma
y, de paso, impide leer el registro de otro usuario.

**El detalle que faltaba:** la primera versión de `verifySession` trataba
**cualquier** error de PocketBase como «sesión inválida», lo que devolvía el
problema que se acababa de corregir en `refreshUserAction` (cerrar la sesión
por un fallo puntual). Por eso el error va con código: `invalid_session` vs
`unavailable`, y las dos rutas de subida contestan `401` y `503`
respectivamente.

## Next

- Exigir el permiso por sección en el uploader si algún día se mueve la
  validación desde la server action al endpoint de subida.
- `lib/auth.ts` aún expone `decodePocketBaseToken`: los usos que quedan son
  seguros porque validan contra PocketBase después, pero el nombre invita al
  error. Renombrarlo (p. ej. `decodeUnverifiedToken`) reduciría el riesgo.
- Revisar el resto de endpoints que reciben `Authorization` a mano
  (`app/api/files/[...path]`, `app/api/img`).
