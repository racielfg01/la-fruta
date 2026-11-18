---
author: Raciel Ferrin
branch: main
status: done
---
# Pantalla sin conexión

## Intent

Sustituir el aviso mínimo de `/offline` por una pantalla con identidad propia
que diga qué sigue funcionando y permita reintentar sin salir de ella.

## Scope

**Dentro**
- Estado de red real con `navigator.onLine` y eventos `online`/`offline`.
- Botón que comprueba la conexión con una petición `HEAD` a la portada; si
  vuelve la red, ofrece «Volver a la tienda».
- Mensaje de error cuando el reintento falla, sin culpar al usuario.
- Lista de lo que sigue disponible en el dispositivo: carrito, favoritos y
  direcciones guardadas.
- Aviso de que precios y stock se actualizan al reconectar y que no se pueden
  confirmar pedidos sin red.

**Fuera**
- Hacer pedidos en offline ni sincronizarlos después.
- Cambiar la estrategia del service worker: `/offline` ya era su respaldo.

## Evidencia

- `lib/offline.test.ts`: 2 pruebas escritas antes del código, para el texto en
  ambos estados de la red.
- `pnpm verify`: 310 pruebas en 42 archivos, 0 errores. `pnpm build`: correcto.
  Detector de Impeccable sin hallazgos en la pantalla ni en el formulario de
  categorías.

## Siguiente

1. Probar la pantalla en un móvil real con el service worker ya instalado: el
   HTML viejo queda en caché hasta que se actualice el worker.
