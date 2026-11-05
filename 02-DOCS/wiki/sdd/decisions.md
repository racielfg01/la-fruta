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
