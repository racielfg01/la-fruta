---
author: Raciel Ferrin
branch: main
status: done
---
# Aviso visible cuando el admin no tiene dispositivos activos

## Intent

Que sea evidente por qué no llegan los avisos de pedidos y clientes nuevos
cuando el admin aún no ha activado un dispositivo.

## Scope

**Dentro**
- Alerta en `/admin/notificaciones` cuando no hay suscripciones de admin
  activas, con botón para activar el dispositivo allí mismo.
- La alerta solo aparece si PocketBase y las claves VAPID están listos y el
  navegador admite push, para no duplicar avisos más concretos.

**Fuera**
- Envío de avisos: `notifyNewUser` y el ajuste «Usuario nuevo» ya existían y
  están activos.

## Evidencia

Comprobado en PocketBase: `notify_new_user` en `true`, claves VAPID presentes y
**0 suscripciones de admin activas**. Esa era la causa de no recibir nada.

`lib/push/notices.test.ts`: 4 pruebas escritas antes del código. `pnpm verify`:
294 pruebas, 0 errores. Alerta revisada a 390 px con la condición forzada;
se deshizo el valor forzado antes de compilar. `pnpm build`: correcto.

## Siguiente

1. Activar el dispositivo en `/admin/notificaciones` y enviar una prueba.
2. Confirmar que llega un aviso al registrarse un cliente nuevo.
