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
