---
author: Raciel Ferrin
branch: main
status: done
---
# El panel enseña solo lo que el rol puede ver

## Intent

Con el acceso por permisos ya resuelto (ver
[acceso-admin-por-permisos](acceso-admin-por-permisos.md)), quedaban dos cosas
que hacen que el panel confunda a quien lo usa:

1. **El dashboard enseña ceros donde no tiene permiso.** Los datos llegan
   acotados por permiso (`sectionsForPermissions`), así que para un rol con
   `orders` y nada más, las tarjetas de productos, categorías, usuarios,
   monedas y zonas de envío salían con «0» y «Sin moneda predeterminada».
   Un 0 ahí no significa «no hay nada», significa «no lo puedes ver»: la
   misma cifra dice dos cosas distintas.
2. **Los permisos no se refrescaban en caliente.** Si el dueño cambiaba los
   permisos de un rol, quien tenía la pestaña abierta seguía con los
   anteriores hasta que recargaba a mano.

Objetivo: que el panel diga la verdad («no lo ves») y que los cambios de
permisos se noten sin recargar.

## Scope

**Dentro**
- `app/admin/page.tsx`: las tarjetas de productos, categorías, usuarios,
  órdenes, ingresos, envío promedio, monedas, tasas de cambio, alertas de
  inventario, órdenes pendientes, acciones rápidas y órdenes recientes se
  muestran solo si el rol tiene el permiso de esa sección.
- `components/auth-provider.tsx`: al volver a la pestaña se revalida la sesión
  contra el servidor. Solo cuando la pestaña estuvo oculta de verdad (no en
  el primer render) y un fallo puntual no cierra la sesión.

**Fuera (explícito)**
- No se cambia el modelo de permisos ni cómo se calculan los datos acotados.
- La revalidación por visibilidad no sustituye al refresco al cargar: sigue
  habiendo una revalidación completa en cada carga de página.

## Checklist

- [x] Las tarjetas del dashboard se filtran por permiso — prueba: test de
      cableado en `lib/use-permissions.test.ts` (el repo no tiene DOM en los
      tests, así que se comprueba el cableado leyendo el fuente, igual que
      los tests que ya había para el header y el layout del panel).
- [x] La revalidación al volver a la pestaña no cierra la sesión ante un
      fallo puntual — prueba: `decideSessionRefresh` ya distingue
      `invalid_session` de `unavailable` (`lib/session-refresh.test.ts`).
- [x] Suite, tipos, lint y build en verde — prueba: `npx vitest run`
      (30 archivos, 244 tests), `npx tsc --noEmit` exit 0, `npx eslint .`
      exit 0, `npx next build` (Compiled successfully).

## Evidence

**Antes** (rol con `orders` y `dashboard`): el panel mostraba «Total Productos
0», «Categorías 0», «Usuarios 0», «Monedas 0/0 activas · Sin moneda
predeterminada» y «Envío Promedio 0.00 · 0 zonas configuradas».

**Ahora**: esas tarjetas no se pintan. Quedan solo las de las secciones que el
rol puede ver (órdenes, y las que el permiso permita).

## Next

- La revalidación por visibilidad es «al volver»: si el dueño cambia un
  permiso mientras el usuario está mirando la misma pestaña (sin ocultarla),
  el cambio se ve al cambiar de pestaña o al recargar.
- Los enlaces del panel que apuntan a secciones sin permiso: hoy el layout
  ya redirige a la primera sección permitida, así que no rompen, pero
  conviene revisar si ocultarlos también.
