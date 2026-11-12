---
author: Raciel Ferrin
branch: main
status: done
---
# Linter que funcione y esquema de roles que no envejezca

## Intent

Dos cosas que\Admin dejan pasar y que ya han costado un incidente:

1. **`pnpm lint` no arrancaba.** ESLint 10 exige `eslint.config.*` y el repo
   no tenía ninguno: `eslint .` moría con «ESLint couldn't find an
   eslint.config.* file». Es decir, no había puerta de calidad.
2. **El setup de PocketBase no creaba el campo `permissions` de los roles.**
   `scripts/setup-pocketbase.ts` (y su copia compilada `.js`) creaban `roles`
   con `name` y `description`, nada más. La app escribe los permisos ahí, así
   que en una instancia levantada desde el script PocketBase aceptaba la
   escritura y la **descartaba en silencio**: todo rol se quedaba sin
   permisos y no aparecía ningún error. En producción el campo se acabó
   añadiendo a mano.

Objetivo: que `pnpm lint` sea una puerta real y que el esquema del setup no
pueda quedarse viejo sin que nadie se entere.

## Scope

**Dentro**
- `eslint.config.mjs` (nuevo): configuración plana con `@eslint/js`,
  `typescript-eslint`, `eslint-plugin-react-hooks` y `globals`. Los globales
  de navegador y de Node, porque la app corre en los dos sitios.
- Reglas: lo que puede romper la app es error; el ruido estilístico heredado
  (`no-control-regex`, `no-useless-escape`, `no-useless-assignment`,
  `preserve-caught-error`) y las reglas nuevas y opinadas de react-hooks v7
  quedan como aviso.
- `.rsc/**`, `.opencode/**` y `.superpowers/**` quedan fuera: son el harness,
  no la app.
- `scripts/setup-pocketbase.ts`: la colección `roles` incluye ya el campo
  `permissions` (json).
- `scripts/setup-pocketbase.js` **eliminado**: era la copia compilada del
  `.ts` y era la que el README mandaba ejecutar. Dos copias del mismo
  esquema es exactamente la forma de que se queden viejas.
- `scripts/ensure-role-permissions.mjs` (nuevo): asegura el campo
  `permissions` en una instancia que ya existe. Es idempotente y es lo que
  sustituye al PATCH a mano de producción.
- `README.md`: apunta al `.ts` y lista el script de reparación.
- `package.json`: `lint:fix` y `verify` (lint + test + tsc).

**Fuera (explícito)**
- No se arreglan los 259 avisos: son deuda conocida (`no-explicit-any` en los
  mapas de PocketBase, `set-state-in-effect` en el patrón de este repo). La
  puerta los muestra sin bloquear.
- No se instala `eslint-config-next`: sus reglas de Next solapan con
  react-hooks y este repo ya tiene reglas propias.

## Checklist

- [x] `pnpm lint` arranca y termina con **0 errores** — prueba:
      `npx eslint .` → exit 0, «259 problems (0 errors, 259 warnings)».
- [x] El linter encontró **dos bugs reales** que se arreglan aquí:
      - `app/favoritos/page.tsx`: `useMarginConfig(product)` se llamaba
        **dentro del `.map()`**. Es un hook (`useSettingsStore`), así que el
        número de hooks de la página cambiaba con la lista: al quitar un
        favorito, React lanzaba «Rendered fewer hooks than expected» y la
        página se caía. Ahora el hook se llama una vez arriba y en el mapa
        solo se arma el margen del producto.
      - `components/onboarding.tsx`: `direction.current` se leía durante el
        render para elegir la clase de la animación. Un ref no se lee en el
        render; ahora la dirección es estado.
- [x] El setup crea el campo `permissions` — prueba: lectura del diff.
- [x] El script de reparación es idempotente — prueba: si el campo ya existe
      no hace nada (en producción existe: el script lo reconoce y sale).
- [x] Suite, tipos y build en verde — prueba: `npx vitest run` (30 archivos,
      243 tests), `npx tsc --noEmit` exit 0, `npx next build` (Compiled
      successfully).

## Evidence

**Antes:** `npx eslint .` → «ESLint couldn't find an eslint.config.* file» y
`pnpm lint` terminaba con error. Ahora: exit 0.

**De 5524 a 0 errores.** El primer recuento salía así porque faltaban los
globales (`console`, `process`, `window`…) y porque las reglas de TypeScript
se aplicaban también a los scripts CommonJS del repo. Con los globales
declarados y las reglas de TS acotadas a `*.{ts,tsx,mts,cts}`, quedan **3
errores reales** (los dos bugs de arriba y una variable muerta en
`scripts/setup-collections-extra.cjs`) y 259 avisos.

**Por qué el `.js` estaba en el repo:** el README mandaba ejecutar
`node scripts/setup-pocketbase.js`, y ese `.js` era una transpilación del
`.ts`. El `.ts` ya corría solo con Node 22 (type stripping), así que la
copia no hacía falta: `node --check scripts/setup-pocketbase.ts` pasa y
`node scripts/setup-pocketbase.ts` arranca (verificado contra una URL
inalcanzable, sin tocar producción).

## Next

- Los 259 avisos: `no-explicit-any` en los mapas de PocketBase y
  `react-hooks/set-state-in-effect` (33) son los que más ruido dan.
- `react-hooks/exhaustive-deps` (7 avisos): alguno puede ser un efecto que
  se re-ejecuta de más.
- Añadir `pnpm verify` al hook de pre-commit (hoy `code-hooks` cubre otros
  gates).
