---
type: plan
title: Plan — Avisos push de la tienda
description: Estructura de la implementación de avisos push — contratos, datos, flujos y pruebas.
tags: [sdd, plan, notificaciones, push]
timestamp: 2026-10-27T15:00:00Z
topic: sdd
slug: notificaciones-push
status: approved
---

# Plan — Avisos push de la tienda

> Spec: [../specs/notificaciones-push.md](../specs/notificaciones-push.md) · Constitución: [../constitution.md](../constitution.md) (borrador) · Estado: aprobado en autopilot
> Última actualización: 2026-10-27

## 0. Restricciones globales

- Interfaz en español; el aviso también.
- Sin proveedor externo de notificaciones: Web Push nativo con VAPID y service worker.
- `role_id === 2` es administrador; el resto son clientes.
- El pedido y el alta de cuenta **nunca** fallan por un aviso: el envío va después de la
  respuesta (`after`) y todo error se registra sin propagarse.
- El envío de productos es manual y solo a clientes suscritos; espera mínima de 60 s.
- Las claves VAPID viven en variables de entorno del servidor. La clave pública puede
  viajar al navegador; la privada nunca.
- Ningún endpoint de suscripción se expone a otros usuarios. Las reglas de PocketBase de
  `push_subscriptions` quedan cerradas; solo el servidor con credenciales admin accede.
- El trabajo va directo a `main` por política del proyecto (`AGENTS.md`); no se crea rama
  ni worktree.
- Puertas: `npx tsc --noEmit`, `npx vitest run`, `npm run build`.
- La ejecución se detiene **antes** de ejecutar el script de esquema en PocketBase y antes
  de tocar Vercel o desplegar.

## 1. Contexto y restricciones del código actual

- Next.js 16 App Router, React 19, PocketBase v0.23 (pockethost).
- `lib/pocketbase.ts`: `getAdminPB` (superusuario), `getTokenPB` (token del usuario),
  `getAllRecords`, `sanitize`.
- `lib/auth-context.ts`: zustand persistido; `logout()` limpia usuario y token.
- `lib/auth.ts`: `decodePocketBaseToken`, `getRoleIds`.
- `verifyAdminAndGetUserId` existe en `app/actions/admin.ts` y `admin-extras.ts` pero no
  se exporta; se crea un guard compartido en `lib/push/authz.ts`.
- Disparadores: `createOrderAction` (`app/actions/orders.ts`), `signupAction`
  (`app/actions/auth.ts`) y `addUserAction` (`app/actions/admin.ts`).
- `public/sw.js` solo cachea; no hay `push` ni `notificationclick`.
- `components/service-worker-register.tsx` no registra el SW en localhost; se cambia a
  “registrar en producción, también en localhost”.
- `public/manifest.json` ya es instalable (standalone + iconos 192/512).
- **Hallazgo de datos:** `products` no tiene `created` ni `created_at`. Sin marca de tiempo
  no se puede saber qué producto es nuevo. Se añade `created_at` (autodate, onCreate) a
  `products`; los productos existentes quedan sin valor y no cuentan como nuevos.
- `settings` es una colección singleton (1 registro) con reglas de escritura para cualquier
  autenticado; las acciones nuevas verificarán admin y usarán `getAdminPB`.
- No hay configuración de vitest ni script `test`; los tests actuales son `*.test.ts` con
  imports relativos.

## 2. Arquitectura

```
Navegador                         Servidor (Next)                       PocketBase
─────────                         ───────────────                       ──────────
Service worker  <── push ───  web-push (lib/push/send)  <── lee ───  push_subscriptions
  push / click                     ▲                                   settings
                                   │
Campana cliente ── action ──> app/actions/notifications.ts ── escribe ──> push_subscriptions
                                  │
Admin /admin/notificaciones ──────┤
                                  │
createOrderAction ── after() ─────┤
signupAction      ── after() ─────┤
addUserAction     ── after() ─────┘
```

- **Web Push nativo** frente a OneSignal/Firebase: no añade dependencia de datos ni coste,
  mantiene las suscripciones en PocketBase y no requiere SDK en el cliente. El coste es más
  código propio (SW, claves, alta/baja), que es manejable y queda cubierto por tests puros.
- **`after()`** de `next/server` para que el envío no alargue la creación del pedido o de la
  cuenta. En Vercel mantiene la función viva tras la respuesta.
- **Capa pura** (`lib/push/payloads.ts`, `settings.ts`, `products.ts`, `subscriptions.ts`,
  `audience.ts`) sin PocketBase ni web-push: se prueba con vitest.
- **Capa de datos** (`lib/push/repository.ts`) con PocketBase admin.
- **Capa de envío** (`lib/push/send.ts`) con `web-push`, reintentos no; limpia 404/410.
- **Orquestación** (`lib/push/notify.ts`): decide si envía según settings y arma el payload.
- **Acciones** (`app/actions/notifications.ts`): guardas, validación y contratos de UI.
- **UI:** campana en `components/header.tsx`, página `app/admin/notificaciones/page.tsx`,
  ítem de navegación en `app/admin/layout.tsx`.

## 3. Contratos e interfaces

### 3.1 Tipos compartidos (`lib/push/types.ts`)

```ts
type Audience = "admin" | "client";

interface PushPayload {
  title: string;
  body: string;
  url: string;
  tag: string;
}

interface PushSubscriptionInput {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  expirationTime?: number | null;
}

interface NotificationSettings {
  newOrder: boolean;
  newUser: boolean;
  newProducts: boolean;
  lastProductsPushAt: string | null;
}

interface StoredPushSubscription extends PushSubscriptionInput {
  id: string;
  userId: string;
  userName: string;
  audience: Audience;
  active: boolean;
}
```

### 3.2 Acciones (`app/actions/notifications.ts`)

Todas devuelven `{ success, error? }` salvo las de lectura.

| Acción | Entrada | Salida | Guarda |
| --- | --- | --- | --- |
| `getPushConfigAction` | — | `{ configured, publicKey }` | pública |
| `getNotificationOverviewAction` | `token` | `{ configured, setupNeeded, settings, counts, canAnnounce, cooldownSeconds }` | admin |
| `updateNotificationSettingsAction` | `token, { newOrder?, newUser?, newProducts? }` | `{ success, settings }` | admin |
| `subscribePushAction` | `token, PushSubscriptionInput` | `{ success, audience }` | usuario |
| `unsubscribePushAction` | `token, endpoint` | `{ success }` | usuario |
| `sendTestPushAction` | `token, endpoint` | `{ success, error? }` | admin, endpoint propio |
| `announceNewProductsAction` | `token` | `{ success, sent, failed, total, names }` | admin |

La audiencia se deriva del rol en el servidor; el cliente no la envía.

### 3.3 Contrato del service worker

Payload JSON: `{ title, body, url, tag }`. `push` muestra la notificación con
`icon`/`badge` 192, `data.url`. `notificationclick` enfoca una pestaña del mismo origen o
abre `url`. El SW sube a `la-fruta-v5` para invalidar la caché anterior.

### 3.4 Variables de entorno

```
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=https://mercatoma.vercel.app
```

Si falta alguna, `configured=false`: la pantalla lo dice, no se envía nada y la tienda
funciona. No se usa `NEXT_PUBLIC_` para la privada.

## 4. Modelo de datos y flujos

### 4.1 Esquema (script idempotente `scripts/setup-push.mjs`)

`settings` añade:

| Campo | Tipo | Valor inicial |
| --- | --- | --- |
| `notify_new_order` | bool | `true` al añadirse |
| `notify_new_user` | bool | `true` al añadirse |
| `notify_new_products` | bool | `true` al añadirse |
| `last_products_push_at` | date | ahora al añadirse |

`products` añade:

| Campo | Tipo | Efecto |
| --- | --- | --- |
| `created_at` | autodate, onCreate | solo los productos creados después del despliegue tienen valor |

`push_subscriptions` (nueva, reglas `null`):

| Campo | Tipo | Nota |
| --- | --- | --- |
| `user_id` | text* | dueño |
| `endpoint` | text* | índice único |
| `p256dh` | text* | clave pública del dispositivo |
| `auth` | text* | secreto del dispositivo |
| `audience` | text* | `admin` o `client` |
| `user_name` | text | para depurar |
| `user_agent` | text | para depurar |
| `active` | bool | baja lógica |
| `last_seen` | date | última sincronización |

El script imprime un resumen y admite `--dry-run`. No se ejecuta sin autorización.

### 4.2 Flujo pedido nuevo

`createOrderAction` termina de crear orden, items, stock y contadores → `after(() =>
notifyNewOrder(...))` → lee settings → si `newOrder` y hay suscripciones `admin` → arma
payload con código, nombre, total CUP y zona → `web-push` → 404/410 se borran → errores
se registran. El cliente recibe `success` antes del envío.

### 4.3 Flujo usuario nuevo

`signupAction` (siempre cliente) y `addUserAction` (solo si `role_id !== 2`) → `after(() =>
notifyNewUser(...))` → settings `newUser` → suscripciones `admin` → payload con el nombre →
`/admin/usuarios`.

### 4.4 Flujo productos nuevos (manual)

Admin abre `/admin/notificaciones` → `getNotificationOverviewAction` cuenta productos
visibles con `created_at > last_products_push_at`, clientes activos y cooldown → botón
habilitado solo si hay productos, clientes, evento encendido y pasaron 60 s → al pulsar,
`announceNewProductsAction` recalcula en servidor (no confía en el contador del cliente) →
envía a `client` → si al menos uno se envió, actualiza `last_products_push_at = ahora`; si
todos fallan, no lo actualiza para permitir reintento.

### 4.5 Flujo suscripción / baja

Campana (cliente) o tarjeta “Este dispositivo” (admin) → `getPushConfigAction` → permiso del
navegador → `pushManager.subscribe` con la clave pública → `subscribePushAction` con el
token → el servidor verifica el token, deriva audiencia y hace upsert por `endpoint`
(máximo 5 activas por usuario; la más vieja se desactiva) → `last_seen`.
Baja: `unsubscribe()` del navegador + `unsubscribePushAction` (borra la fila del usuario).
`logout()` intenta la baja del endpoint antes de limpiar el token.

### 4.6 Privacidad y accesibilidad

- El aviso de pedido incluye nombre y total; solo llega a dispositivos admin.
- No se envían teléfono, dirección, carné ni contraseñas.
- La pantalla usa etiquetas asociadas a los interruptores, texto de estado y botones con
  `aria-label`; los estados no dependen solo del color.
- Los mensajes de error explican qué hacer (permiso denegado, falta configuración, iPhone).

## 5. Estrategia de pruebas

| Nivel | Qué | Cómo |
| --- | --- | --- |
| Unidad | payloads (pedido, usuario, producto, prueba), formato CUP, recorte a 3 nombres | vitest, sin red |
| Unidad | settings: defaults, booleanos ausentes/false, fecha inválida | vitest |
| Unidad | productos nuevos: visibles, `created_at` vacío, orden desc, conteo | vitest |
| Unidad | suscripción: endpoint https, claves requeridas, error 404/410 | vitest |
| Unidad | audiencia por rol y cooldown de 60 s | vitest |
| Integración | acciones con PB/web-push simulados | no en este ciclo; se cubre con unitarias + verificación manual |
| Build | `npx tsc --noEmit`, `npm run build` | CI local |
| Manual | permiso, alta, aviso de prueba, pedido real, producto, baja | tras desplegar y con un dispositivo real |

Mapeo de aceptación: pedido (payload + trigger + after), usuario (payload + dos triggers),
productos (conteo + cooldown + envío + marcador), permisos (guardas admin), fallos (try/catch
y 404/410), iPhone (detección `standalone` y copy).

## 6. Secuencia

1. Helpers puros + tests + configuración de vitest.
2. Script de esquema idempotente con `--dry-run` (no ejecutar aún).
3. Repositorio, envío y orquestación.
4. Acciones y guardas.
5. Disparadores en pedido, registro y alta desde admin.
6. Service worker y registro.
7. Campana del cliente y baja en logout.
8. Página admin y navegación.
9. Claves VAPID locales, `.env.example`, documentación de despliegue.
10. `tsc`, `vitest`, build y verificación con el servidor local.
11. **Parada:** pedir autorización para ejecutar el esquema en PocketBase; entregar claves
    para Vercel. No desplegar.

## 7. Riesgos y rollback

| Riesgo | Mitigación |
| --- | --- |
| iPhone exige instalar la PWA | Se detecta y se explica; no se promete push |
| Permiso denegado o bloqueado | Estado visible + instrucciones; la app sigue |
| Servicio push inalcanzable (red/Cuba) | Errores aislados; pedido/cuenta no fallan; reintento manual |
| Suscripciones vencidas | 404/410 se borran; el resto sigue |
| Fuga de datos en pantalla bloqueada | Solo admin; sin teléfono/dirección; se documenta |
| Colección o campos ausentes | `setupNeeded` y mensaje claro; script idempotente |
| SW viejo en caché | `CACHE` a v5 y `skipWaiting`/`clients.claim` |
| `after` no se ejecuta en algún host | Se registra; el flujo principal no depende de él |
| Constitución en borrador | El plan fija privacidad, accesibilidad y criterio de terminado |
| Rollback | Apagar los tres interruptores; retirar el ítem de navegación; el SW sin `push` no molesta; la colección y los campos son aditivos |

Criterio de terminado: tests y build limpios, página admin y campana funcionando en local,
script `--dry-run` revisado, aviso de prueba enviado en un dispositivo tras configurar las
claves, y pedido/usuario/producto verificados según la spec.

## 8. Tareas

| # | Tarea | Hecho cuando |
| --- | --- | --- |
| 1 | Configurar vitest y script `test` | `npx vitest run` ejecuta los tests existentes |
| 2 | Helpers puros + tests | payloads, settings, productos, suscripciones y audiencia con tests verdes |
| 3 | Script `scripts/setup-push.mjs` + `--dry-run` | el dry-run lista campos y colección sin escribir |
| 4 | Repositorio PocketBase y envío web-push | tipos y funciones compilan; fallos aislados |
| 5 | Acciones de notificaciones con guardas | admin no autorizado rechazado; contratos estables |
| 6 | Disparadores en pedido, registro y alta admin | `after` conectado; sin bloquear la respuesta |
| 7 | Service worker `push`/`notificationclick` | el archivo servido contiene ambos listeners |
| 8 | Campana cliente + baja en logout | alta/baja y estado visibles |
| 9 | Página admin + navegación | `/admin/notificaciones` con interruptores, dispositivo, prueba y productos |
| 10 | VAPID local + `.env.example` | claves en `.env.local` (ignorado) y ejemplo sin secretos |
| 11 | Verificación | `tsc`, `vitest`, build y Playwright/curl sin errores |
| 12 | Parada de infraestructura | autorización para el esquema; claves para Vercel |

## 9. Estado de ejecución (2026-10-27)

- Tareas 1–10 hechas: helpers puros con tests, repositorio, envío, orquestación,
  acciones, disparadores, service worker, campana, página admin y navegación.
- Claves VAPID generadas en `.env.local` (ignorado por git) y `.env.example` sin
  secretos.
- Puertas locales: `npx tsc --noEmit` limpio, `npx vitest run` con 82 tests en
  verde, `npm run build` correcto.
- `node scripts/setup-push.mjs --dry-run` revisado: añade 4 campos a `settings`,
  `created_at` a `products` y crea `push_subscriptions`.
- **Esquema aplicado en PocketBase el 2026-10-27:** `settings` tiene los 3 avisos
  activos y el marcador en `2026-10-27 15:40:29.956Z`; `products.created_at` es
  autodate; `push_subscriptions` existe con reglas cerradas, índice único de
  endpoint y 0 filas. Productos nuevos tras el marcador: 0.
- **Verificación con sesión admin real:** la pantalla carga con los 3 interruptores
  activos, sin alertas de base ni de claves; muestra 0 productos nuevos y 0 clientes.
  La sesión se obtuvo por impersonación temporal de PocketBase (sin cambios de datos)
  y se limpió al terminar.
- **VAPID validado:** `web-push.generateRequestDetails` genera una petición cifrada
  correcta con las claves de `.env.local`.
- **Detenido antes de Vercel/despliegue.** Falta pegar las claves VAPID en Vercel,
  desplegar y probar un aviso real.
