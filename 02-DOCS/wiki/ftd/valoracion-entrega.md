---
author: Raciel Ferrin
branch: main
status: done
---
# Valoración de la entrega e icono redondeado

## Intent

El cliente pueda valorar la entrega de cada orden con estrellas y una
descripción, dentro de las 72 h posteriores a la recepción. La valoración la ve
solo el admin. Además, el icono instalado en móviles debe verse redondeado.

## Scope

**Dentro**
- `delivered_at` se escribe en la orden cuando el admin la pasa a «Entregado».
  El plazo se mide desde esa fecha real, no desde `updatedAt`.
- Formulario en el detalle de la orden de `/perfil`: 1–5 estrellas, texto de
  1 a 500 caracteres, un envío por orden y mensaje de error si falla.
- La valoración guardada se muestra en el detalle de la orden, tanto al cliente
  como al admin.
- Acción de servidor que comprueba sesión, titular de la orden, estado, plazo y
  valoración previa; confirma la lectura porque PocketBase descarta campos
  inexistentes sin avisar.
- Script idempotente `scripts/ensure-order-rating-fields.mjs` para añadir los
  campos a una colección `orders` ya creada.
- Iconos `any` con esquinas de radio ~22% y variantes `maskable` con fondo
  completo; `manifest.json` declara ambos propósitos por separado.

**Fuera**
- Mostrar valoraciones en la portada: los 10 testimonios fijos siguen ahí.
- Promedio de estrellas, notificaciones al admin ni exportación.

## Evidencia

- `lib/order-ratings.test.ts`: 10 pruebas. Cubren el cierre exacto a las 72 h,
  fechas ausentes o inválidas, entregas futuras, órdenes no entregadas, una
  segunda valoración y los límites de estrellas y texto.
- Vista temporal con una orden entregada en navegador, a 390 × 844 y 1280 ×
  900: el bloque «Valoración de la entrega» aparece con cinco botones de
  estrella, área de texto, contador de horas restantes y sin desbordamiento.
  Al enviar, el formulario se sustituye por el resumen con estrellas y texto.
- `pnpm verify`: 281 pruebas en 37 archivos, 0 errores de tipos y de lint.
- Detector de Impeccable sin hallazgos en los archivos de interfaz.
- Icono `any` inspeccionado visualmente: esquinas redondeadas y tomato centrado.
  Variante `maskable` con fondo crema hasta los bordes y sin recorte del dibujo.

## Siguiente

1. Ejecutar `node scripts/ensure-order-rating-fields.mjs` en PocketBase con
   las credenciales de admin antes de probar el guardado en producción.
2. Comprobar en un móvil real que el icono instalado usa la variante redondeada.
3. Si se quiere mostrar algo en la portada, decidir después cómo se eligen las
   valoraciones reales sin mezclarlas con los testimonios fijos.
