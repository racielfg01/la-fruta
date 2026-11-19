# FTD — Sesión no verificable al cargar pedidos

## Intención

Eliminar el error de consola `No se pudo validar la sesión` en `/perfil` cuando PocketBase no responde, sin cerrar la sesión del usuario ni fingir que no hay pedidos.

## Alcance

- `lib/verify-session.ts`: el error `unavailable` conserva la causa original (status/error de PocketBase) para diagnóstico; se añade `isUnavailableSession`.
- `app/actions/orders.ts`: `getUserOrders` devuelve `{ ok: false, reason: "unavailable" }` en vez de lanzar cuando la validación no es verificable. `invalid_session` sigue lanzándose.
- `app/perfil/page.tsx`: muestra aviso de reintento sin `console.error`; el estado «sin pedidos» queda reservado para cuando realmente no hay pedidos.
- `app/actions/orders.test.ts`: regresión roja→verde del contrato anterior.

## Checklist (evidencia)

- [x] RED: 2 pruebas fallaban (`orders.test.ts`) antes del cambio.
- [x] GREEN: 3/3 pruebas pasan; `unavailable` resuelve, `invalid_session` se propaga, sesión válida devuelve pedidos.
- [x] `pnpm verify`: 348/348 pruebas, 0 errores de lint, `tsc` limpio.
- [x] `pnpm build`: exit 0, 40 páginas generadas.
- [x] E2E con PocketBase caído: no ejecutado en vivo (la petición ocurre en el servidor y no es reproducible con intercepción de navegador). Cubierto por prueba de acción y por diagnóstico: el error `unavailable` conserva la `cause` para revisarla en logs del servidor si reaparece.

## Siguiente paso

Si vuelve a aparecer, revisar en los logs del servidor la `cause` adjunta al error `unavailable` (incluye el estado/error real devuelto por PocketBase) para identificar la causa de la indisponibilidad.
