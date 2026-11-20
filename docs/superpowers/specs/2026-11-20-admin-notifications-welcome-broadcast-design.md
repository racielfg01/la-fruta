# Diseño: bienvenida y notificaciones masivas en /admin/notificaciones

- **Fecha:** 2026-11-20
- **Estado:** propuesto (pendiente de aprobación)
- **Alcance:** proyecto (varios componentes, esquema de datos y flujos nuevos)

## 1. Intención y por qué

`/admin/notificaciones` ya permite configurar avisos push operativos (pedido nuevo, usuario nuevo para admin, y aviso manual de productos nuevos a clientes suscritos). Falta una capa de comunicación hacia los usuarios registrados: darles la bienvenida en su primera visita tras registrarse y permitir al admin enviar comunicados a toda la base de clientes, incluso cuando no tengan avisos push activados.

Objetivo: enriquecer `/admin/notificaciones` para (1) configurar una bienvenida que invite a activar notificaciones en la primera visita a la tienda después del registro, y (2) crear/enviar notificaciones a todos los usuarios registrados, con entrega por push cuando sea posible y como mensaje emergente dentro de la tienda cuando no.

## 2. Objetivos, no objetivos y antiobjetivos

### Objetivos
- Mostrar un modal de bienvenida configurable en la primera visita a la tienda de un usuario autenticado después de registrarse, pidiéndole aceptar notificaciones push.
- Permitir configurar el contenido de esa bienvenida (título, mensaje, enlace opcional) desde `/admin/notificaciones`, con un contenido predeterminado inicial.
- Permitir crear una notificación (título, mensaje, enlace opcional) para enviarla a todos los usuarios registrados desde `/admin/notificaciones`.
- Permitir guardar notificaciones como plantillas reutilizables y enviar desde plantilla.
- Entregar por push a quienes tengan avisos push activados; mostrar como mensaje emergente al entrar a la tienda a quienes no los tengan activados.
- Mostrar cada mensaje emergente en tienda solo una vez, hasta que la persona lo cierre o lo marque como visto.

### No objetivos
- No rediseñar el sistema push existente de eventos operativos (pedido/usuario nuevo/productos nuevos) salvo la integración necesaria en la misma pantalla.
- No implementar segmentación avanzada, programación diferida, campañas recurrentes, analítica de apertura/clic detallada ni A/B testing.
- No enviar email/SMS.
- No garantizar entrega push si el navegador/dispositivo no lo permite o el usuario no concede permiso.

### Antiobjetivos (sería un fallo aunque "funcione")
- Molestar: la bienvenida o los emergentes no deben reaparecer una vez vistos/cerrados según lo acordado.
- Perder privacidad/control: un usuario no debe ver notificaciones dirigidas a otros; el estado "visto" debe ser por usuario.
- Romper la tienda si faltan colecciones/campos nuevos: la funcionalidad debe degradar con gracia cuando el esquema no esté preparado.

## 3. Decisiones acordadas (usuario)

- **Bienvenida:** ocurre la primera vez que entra a la tienda luego de registrarse. Se muestra un modal pidiéndole aceptar las notificaciones. El contenido es configurable en `/admin/notificaciones` y existe un texto predeterminado. Puede aceptar (activar avisos push en su dispositivo) o cerrar sin aceptar; en cualquiera de los dos casos no vuelve a aparecer.
- **Broadcast a todos los usuarios registrados:** desde `/admin/notificaciones` se puede crear una notificación (título, mensaje, enlace opcional), enviarla en ese momento a todos los usuarios registrados y guardarla como plantilla.
- **Audiencia de broadcast:** destinatarios = usuarios registrados. **Suposición (a validar si se desea):** se refiere a cuentas de clientes (no administradores/staff del panel), coherente con la campana/notificaciones de cliente existentes.
- **Entrega:** quienes tengan avisos push activados la reciben por push; quienes no los tengan activados la ven dentro de la tienda como mensaje emergente al entrar.
- **Emergente en tienda:** se muestra solo una vez hasta que la persona lo cierre o lo marque como visto.

## 4. Diseño propuesto

### 4.1 Modelo de datos (PocketBase)

> Esquema propuesto; requiere script de migración/setup y actualización de `scripts/setup-push.mjs` o un script dedicado (p.ej. `scripts/setup-broadcast-notifications.mjs`). Todas las lecturas/escrituras deben tolerar ausencia de campos/colecciones (degradación).

**`settings` (campos nuevos, bienvenida configurable):**
- `welcome_notification_enabled` (bool, default `true`)
- `welcome_notification_title` (text)
- `welcome_notification_body` (text)
- `welcome_notification_url` (text, opcional)
- Semilla de contenido predeterminado si están vacíos al preparar esquema (p.ej. título "Bienvenido a MercaToma", mensaje invitando a activar avisos, url `/` o vacía).

**`users` (campo nuevo):**
- `welcome_notification_seen_at` (date/text nullable) o bool equivalente. Marca que la bienvenida ya se mostró/resolvió para esa cuenta (aceptada o cerrada). Al ser por cuenta, aplica en cualquier dispositivo.

**`notification_templates` (colección nueva, admin):**
- `name` (text, identificador legible de la plantilla)
- `title` (text, requerido)
- `body` (text, requerido)
- `url` (text, opcional)
- `created`, `updated`
- Reglas: acceso solo mediante server actions admin (list/view/create/update/delete restringidos a null/admin API; igual que otras colecciones administradas por servidor).

**`broadcast_notifications` (colección nueva, registro de envíos):**
- `title`, `body`, `url`
- `audience` (text, valor `registered_clients` en esta versión)
- `status` (text: `sent`/`draft` si se necesita; mínimo `sent`)
- `sent_at` (date)
- `created_by` (text user id, opcional)
- `template_id` (text/relation opcional, referencia informativa)
- `created`, `updated`
- Propósito: fuente de verdad del comunicado enviado y contenido a mostrar in-app.

**`user_notification_receipts` (colección nueva, estado por usuario):**
- `user` (relation/text id de `users`, requerido)
- `notification` (relation/text id de `broadcast_notifications`, requerido)
- `channel` (select/text: `push` | `in_app`) — cómo se entregó/mostró
- `seen_at` (date nullable)
- `dismissed_at` (date nullable) — cierre/marcado como visto en tienda
- `created`, `updated`
- Unicidad lógica `(user, notification)` para no duplicar.
- Reglas: el usuario autenticado solo puede listar/ver/actualizar sus propios receipts (marcar visto/cerrar) bajo `user = @request.auth.id`; creación/gestión masiva por server actions admin.

> **Nota de implementación (decisión de diseño):** para "todos los usuarios registrados" en el momento del envío, se crea un receipt por cada cuenta cliente destinataria. A quienes tienen al menos una suscripción push activa se les intenta enviar push y se marca `channel=push`; a quienes no, se marca `channel=in_app` (pendiente de mostrar). Esto hace explícito el estado y evita recalcular audiencia en cada carga. Si el volumen crece, se puede optimizar después (fuera de alcance).

### 4.2 Bienvenida: flujo

1. **Detección:** en el cliente (p.ej. en `HomeExperience`/layout de tienda o componente dedicado) cuando hay usuario autenticado, se consulta una acción `getMyWelcomeStatusAction` (o se incluye en estado inicial) que devuelve si debe mostrarse: usuario es cliente registrado, `welcome_notification_seen_at` vacío, y bienvenida habilitada.
2. **Modal:** componente `WelcomeNotificationModal` muestra título/mensaje/enlace configurados y dos acciones claras: **Aceptar notificaciones** y **Cerrar** (sin aceptar). Se presenta solo si corresponde (primera visita tras registro, no vista).
3. **Aceptar:** solicita permiso/crea suscripción push usando la infraestructura existente (`getPushConfigAction`, `subscribeToPush`, `subscribePushAction`) igual que la campana/notificaciones; luego marca bienvenida como vista (`markWelcomeSeenAction`). Si el navegador no soporta push, VAPID no está configurado, o iOS requiere instalación, se muestra mensaje explicativo pero igualmente se puede marcar como vista al cerrar/confirmar según UX definida (ver 4.5).
4. **Cerrar sin aceptar:** marca bienvenida como vista (`markWelcomeSeenAction`) y no vuelve a aparecer.
5. **Idempotencia:** el marcado "visto" es en servidor y una sola vez; llamadas repetidas no cambian el resultado.

**"Primera visita tras registrarse":** interpretación adoptada = primera vez que ese usuario autenticado entra a la experiencia de tienda y aún no tiene `welcome_notification_seen_at`. Esto es independiente del onboarding general de visitantes (`onboardingComplete` en store local), que aplica a cualquier visitante nuevo. El modal de bienvenida no reemplaza el onboarding existente; debe coordinarse para no superponerse de forma confusa (p.ej. mostrar bienvenida de push después de completar/omitir onboarding, o en una secuencia definida) — detalle de UI a concretar en implementación manteniendo una experiencia clara.

### 4.3 Broadcast y plantillas: flujo admin

En `/admin/notificaciones` se añaden secciones (cards/tabs) sin eliminar las existentes:

1. **Bienvenida**
   - Formulario: habilitada (switch), título, mensaje, enlace opcional.
   - Carga valores actuales (settings) y guarda vía `updateWelcomeNotificationSettingsAction` (admin).
   - Muestra/usa valores predeterminados cuando están vacíos.

2. **Plantillas**
   - Listado de `notification_templates` (nombre, título, fecha/preview).
   - Crear plantilla (nombre, título, mensaje, enlace opcional).
   - Reutilizar: cargar plantilla en el compositor de envío.
   - **Suposición razonable:** permitir eliminar plantilla (gestión básica). Edición opcional si es barata; no requerida explícitamente.

3. **Enviar a todos los usuarios registrados**
   - Compositor: título, mensaje, enlace opcional.
   - Acciones: **Guardar como plantilla** y **Enviar a todos**.
   - Al enviar:
     - valida contenido y permisos admin;
     - crea `broadcast_notifications` (sent);
     - obtiene cuentas cliente destinatarias (usuarios registrados cuyo rol/audiencia es cliente; excluye admin/staff — suposición alineada con `NotificationBell`/audiencia);
     - para cada destinatario: si tiene suscripciones push activas → intenta push y crea receipt `channel=push`; si no → crea receipt `channel=in_app` pendiente (sin `dismissed_at/seen_at`);
     - reporta resultado (total destinatarios, enviados por push, pendientes in-app, fallos).
   - Si el envío push falla parcialmente, el receipt puede mantenerse/ajustarse para no perder visibilidad in-app cuando corresponda (decisión de implementación: priorizar que el usuario reciba el mensaje por al menos un canal; detalle a definir con pruebas).

### 4.4 Entrega in-app (usuarios sin push activado)

- Al entrar a la tienda, un usuario autenticado cliente consulta sus receipts pendientes in-app no vistos/cerrados (`getMyPendingInAppNotificationsAction`), ordenados por fecha de envío.
- Se muestra un **mensaje emergente** (modal/dialog consistente con la UI) con título, mensaje y acción de enlace opcional.
- Al cerrar o marcar como visto, se llama `dismissInAppNotificationAction(receiptId/notificationId)` que setea `seen_at`/`dismissed_at`; no vuelve a aparecer.
- Se muestra **solo uno a la vez** y **solo una vez** por notificación hasta cerrar/visto. Si hay varios pendientes, tras cerrar el primero puede mostrarse el siguiente en una visita posterior (o siguiente ciclo) para no saturar — **decisión recomendada**: mostrar como máximo uno por entrada/sesión de carga; el resto queda pendiente.

### 4.5 Casos límite y degradación

- **Push no configurado/no soportado/iOS sin instalar:** la bienvenida aún puede mostrarse y configurarse; el botón aceptar informa el motivo (reutilizar mensajes existentes) y el usuario puede cerrar; la bienvenida se marca vista al resolver el modal según el flujo elegido (no bloquear eternamente).
- **Colecciones/campos faltantes:** acciones devuelven estado "no preparado" o listas vacías sin romper `/admin/notificaciones` ni la tienda; UI muestra aviso similar al existente de setup de push cuando aplique.
- **Usuario no autenticado:** no recibe bienvenida post-registro ni broadcasts in-app personalizados; puede ver onboarding general existente.
- **Permisos:** todas las acciones de configuración, plantillas y envío requieren admin; acciones de usuario requieren sesión válida y operan solo sobre su propio estado.

### 4.6 Seguridad y privacidad

- Contenido de notificaciones tratado como texto seguro (sin renderizar HTML arbitrario).
- URLs de enlace validadas/sanitizadas (permitir rutas internas `/...` y `http(s)://` seguras, coherente con patrones existentes como banners).
- Receipts y estado de bienvenida aislados por usuario.

## 5. Cambios previstos por área (implementación)

- **PB/setup:** campos en `settings` y `users`; colecciones `notification_templates`, `broadcast_notifications`, `user_notification_receipts`; script de setup idempotente y documentación.
- **Server actions (`app/actions/notifications.ts` o módulo relacionado):** lectura/guardado de bienvenida, CRUD/listado de plantillas, envío broadcast, consulta/descarga de estado de bienvenida y pendientes in-app, marcado visto/cerrado.
- **Lib push/notificaciones:** helpers de payload/construcción para bienvenida y broadcasts; reutilizar `sendPushToSubscriptions` y gestión de suscripciones activas.
- **Admin UI (`app/admin/notificaciones/page.tsx` y componentes):** secciones Bienvenida, Plantillas, Enviar a todos (compositor + guardar plantilla + historial/resumen mínimo si útil), manteniendo Eventos/Dispositivo/Productos nuevos existentes.
- **Tienda (cliente):** modal de bienvenida post-registro, consulta de pendientes in-app y modal emergente de notificaciones, con coordinación con onboarding existente.
- **Pruebas:** lógica pura (parseo settings bienvenida, selección de destinatarios/canales, reglas de "pendiente/mostrado una vez", validación de contenido/url) con vitest donde sea práctico; acciones con mocks siguiendo patrones del repo.

## 6. Suposiciones y decisiones del implementador (propuestas)

- **Audiencia "clientes":** todos los usuarios con cuenta cuyo rol no es admin/staff de panel (audiencia cliente). Excluye administradores.
- **Plantillas:** mínimo crear, listar, usar para componer/enviar y eliminar. (Edición de plantilla no solicitada explícitamente.)
- **Un emergente por carga:** si hay varios in-app pendientes, se muestra uno por entrada para evitar saturación.
- **Bienvenida y onboarding:** la bienvenida push se muestra tras el flujo de onboarding general cuando ambos apliquen, para no apilar modales al mismo tiempo.
- **Aceptación sin soporte push:** si no se puede activar push, el usuario puede cerrar el modal y la bienvenida se considera vista (no insistir), manteniendo el objetivo de "solo una vez".
- **Historial de envíos:** mostrar al menos un listado básico de broadcasts enviados recientes en admin (útil para confirmar envíos) si el costo es bajo.

Cualquier punto anterior puede ajustarse si indicas lo contrario antes de implementar.

## 7. Verificación esperada (para la fase de implementación)

- Admin puede configurar y guardar bienvenida; valores predeterminados presentes.
- Usuario nuevo (post-registro) ve modal de bienvenida en su primera visita a la tienda, puede aceptar o cerrar, y no lo vuelve a ver.
- Admin puede guardar plantilla y enviar notificación a todos los clientes registrados; suscritos reciben push (cuando el entorno push está listo) y no suscritos reciben emergente in-app al entrar.
- Emergente in-app se muestra una vez hasta cerrar/visto.
- Con esquema ausente, la tienda y `/admin/notificaciones` no se rompen.
- Pruebas automatizadas de lógica nueva y `tsc`/lint sin errores nuevos en archivos tocados.
