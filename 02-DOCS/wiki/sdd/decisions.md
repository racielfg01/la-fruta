# Decisiones SDD

Registro append-only de decisiones tomadas mientras se construye.

## 2026-10-27 — notificaciones-push

- Destinatarios: pedido nuevo y usuario nuevo avisan a los administradores;
  productos nuevos avisan a los clientes.
- Productos nuevos: envío manual desde el panel (1a), no automático.
- Clientes: solo cuentas registradas pueden activar los avisos (2b).
- Infraestructura: el agente crea la colección de suscripciones y genera las claves
  VAPID; el usuario las pega en Vercel (3a).
- La constitución del proyecto sigue en borrador. Se acepta como riesgo para no
  frenar esta función; se ratifica en una fase posterior.
- Se escribió `02-DOCS/wiki/sdd/config.yaml` (sdd-init) con vitest como runner y
  `npx tsc --noEmit` + `npm run build` como verificación.

## 2026-11-05 — pagos-cuadricula

- Una sola cuadrícula de opciones de pago (4 columnas en escritorio, 2 en
  móvil); la moneda la define cada tile y se elimina el selector de moneda.
- Los tiles salen de monedas activas y de Bancos y cuentas: efectivo solo en
  CUP/USD; un tile por banco activo con moneda activa. Sin cuentas usables, el
  tile se muestra deshabilitado con el motivo.
- Efectivo se configura en General; bancos, cuentas, moneda, logo, Tipo y
  switches en Bancos y cuentas. Sin colecciones ni campos nuevos.
- La cuenta de transferencia se valida también en el servidor antes de crear
  el pedido: activa, banco activo, misma moneda y con cupo.
- El switch «Transferencia bancaria» pasa a llamarse «Transferencias y pagos
  digitales».

## 2026-11-10 — bug: roles no cargan al editar usuario  (ruta /admin/usuarios)

- Repro — en `/admin/usuarios`, al abrir «Editar Usuario», el selector de rol
  solo ofrece Cliente/Administrador literales; ignora los roles configurados en
  Configuración → Roles (colección `roles` de PocketBase).
- Causa — el sistema de roles (commit `2d78c3c`) nunca se cableó a esta página.
  Tres capas colapsaban el rol a un binario: el diálogo con dos `SelectItem`
  literales, `getAdminData` reduciendo el rol de cada usuario a `role_id` 1/2,
  y `editUserAction`/`addUserAction` mapeando cualquier rol a 'admin'/'client'
  por nombre.
- Fix — `lib/user-roles.ts` (test en `lib/user-roles.test.ts`): el usuario
  carga ahora su rol real (`User.roleId`, id de la relación PB) en
  `getAdminData`; el diálogo, el filtro y los badges se alimentan de
  `roles` del store; las actions guardan el id real (`resolveRoleForSave`),
  con fallback al mapeo legado 1/2 para datos viejos y guard de no borrar la
  relación cuando la resolución falla.
- Por qué se escapó — la feature de roles se añadió como pestaña de
  configuración sin tocar el CRUD de usuarios existente; ningún test cubría la
  unión usuarios↔roles.

