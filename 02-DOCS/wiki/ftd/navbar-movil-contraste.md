---
author: Raciel Ferrin
branch: main
status: done
---
# Barra inferior móvil con contraste alto

## Intent

La barra inferior móvil tenía fondo translúcido y el ítem activo solo cambiaba
el color del texto. Sobre fondos claros, el seleccionado se perdía. Ahora el
fondo es blanco sólido y el ítem activo lleva fondo verde con icono y texto
blancos.

## Scope

**Dentro**
- `components/mobile-bottom-nav.tsx`: `<nav>` con `bg-white`; activo con
  `bg-green-700 text-white`; inactivos con `text-slate-600`.
- `lib/mobile-bottom-nav.test.ts`: pruebas de render para fondo, activo e
  inactivo.

**Fuera**
- Barra lateral del admin y drawer de categorías.
- Cambios en el tema oscuro global.

## Checklist

- [x] ROJO: 3 pruebas fallan por fondo, activo e inactivo.
- [x] VERDE: 3/3 pruebas pasan tras el cambio.
- [x] `pnpm verify`: 345/345 pruebas, 0 errores de lint, tipos limpios.
- [x] `pnpm build`: exit 0.
- [x] Detector visual de Impeccable: `[]`.
- [x] Navegador a 390×844: `<nav>` en `rgb(255, 255, 255)`; `/favoritos`
  activo con fondo verde y texto/icono en `rgb(255, 255, 255)`; `/cart`
  inactivo sin fondo.

## Evidence

- `pnpm test lib/mobile-bottom-nav.test.ts`: 3 fallos antes del cambio, 3
  aciertos después.
- `pnpm verify`: 345/345 pruebas, 0 errores de lint y `tsc --noEmit` limpio.
- `pnpm build`: compilación correcta.
- Impeccable `detect --json components/mobile-bottom-nav.tsx`: `[]`.
- Playwright a 390×844 en `/favoritos`: fondo de la barra
  `rgb(255, 255, 255)`; enlace activo con `bg-green-700 text-white`, color
  de texto y SVG en blanco; enlace inactivo `text-slate-600` sin fondo.
- Captura: `ftd/navbar-movil-activo.png`.
- Los tipos generados corruptos de `.next/dev/types` se movieron a
  `/tmp/opencode/next-dev-types-corruptas`; `npx next typegen` regeneró
  `.next/types` y `tsc` volvió a pasar. Artefacto ignorado por Git.

## Next step

Decidir si este cambio y `.rsc.json` (rsc 4.1.8) se commitean juntos. Sin push
ni PR salvo solicitud nueva.
