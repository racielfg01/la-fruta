---
author: Raciel Ferrin
branch: main
status: done
---
# Admin usable en móvil

## Intent

A 390 px el panel ya tenía menú hamburguesa y tarjetas en lugar de tablas, pero
el espacio se desperdiciaba: las métricas del Panel Principal se apilaban en una
columna y cada tarjeta usaba el relleno del sistema de la tienda.

## Scope

**Dentro**
- Cabecera de 56 px en móvil (64 px en adelante) con el nombre de la sección
  activa en vez del título genérico; `lib/admin-navigation.ts` concentra el
  menú y calcula la etiqueta.
- Métricas del Panel Principal en dos columnas desde el móvil y tarjetas más
  compactas; accesos rápidos y tasas también en dos columnas.
- Cajón lateral de hasta 288 px, con la navegación en su propio scroll y el pie
  empujado abajo con flex (antes `absolute bottom-0` podía tapar enlaces).
- Relleno de tarjetas reducido a 16 px solo dentro de `.admin-main` en móvil;
  los diálogos no se tocan porque se renderizan fuera de ese árbol.
- Botones de menú y enlaces del cajón de 44 px de alto, mínimo táctil.

**Fuera**
- Datos, permisos, colores, tipografía y composición de escritorio.

## Evidencia

Medido en el build de producción con navegador a 390 × 844:

| Métrica | Antes | Después |
| --- | --- | --- |
| Alto de cabecera | 64 px | 56 px |
| Columnas de métricas | 1 | 2 |
| Alto de cada métrica | 154 px | 110 px |
| Scroll del `main` | 1.942 px | 1.169 px |
| Relleno de tarjeta | 24 px | 16 px |
| Ancho del cajón | 256 px | 288 px |
| Área táctil del menú | 36 px | 44 px |

La cabecera nombra la sección («Productos», «Órdenes», «Panel Principal»).
No hay desbordamiento horizontal a 390 ni a 768 px; el pie del cajón empieza
justo donde acaba la lista de nueve enlaces. El detector de Impeccable no
devolvió hallazgos en los archivos cambiados.

`pnpm verify`: 271 pruebas en 36 archivos, 0 errores de tipos y 0 errores de
lint. `lib/admin-navigation.test.ts` cubre la etiqueta de la sección activa:
las dos primeras pruebas fallaron con el stub antes de implementar el helper.

## Siguiente

1. Confirmar en el móvil real del dueño del negocio, sobre todo el cajón con
   pantallas bajas y el acceso a órdenes pendientes.
2. Revisar si conviene el mismo patrón de dos columnas en Ofertas y Envíos.
