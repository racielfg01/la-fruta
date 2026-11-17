---
author: Raciel Ferrin
branch: main
status: in-progress
---
# Visibilidad local en Google y agentes de IA

## Intent

La tienda no aparecía para búsquedas locales como «productos agrícolas de
calidad, bien pesados llevados hasta tu casa en Santiago de Cuba». Buscar
«MercaToma» devolvía textos de «lex mercatoma», no la tienda. Competir por
«enviar comida a Cuba desde el extranjero» no es viable: ahí mandan DimeCuba,
acuba, Cubakilos, MallHabana y supermarket23.

Objetivo: que Google y los agentes de IA puedan encontrar y citar hechos
verdaderos sobre la tienda, usando la intención local de Santiago de Cuba.

## Decisiones

- Competir por intención local, no por envíos internacionales.
- No inventar horarios, zonas ni política de peso. Todo sale de los ajustes y
  del catálogo de PocketBase.
- Mantener `mercatoma.vercel.app` como dominio por ahora.
- No añadir reglas explícitas para bots de IA en `robots.ts`: la regla `*` ya
  permite las rutas públicas, y una regla `allow: '/'` por agente dejaría fuera
  los `disallow` de `/admin`, `/perfil`, etc.

## Scope

**Dentro**
- `lib/seo.ts`: título y descripción de portada con «productos agrícolas»,
  «de calidad», «bien pesados» y «Santiago de Cuba».
- `lib/seo-content.ts`: helpers puros y testeados para slugs de categoría,
  metadatos, `GroceryStore`, `FAQPage`, `ItemList` y un resumen `llms.txt`.
- `app/page.tsx`: JSON-LD local y de preguntas frecuentes; sección de texto y
  enlaces a categorías renderizada en el servidor.
- `app/categoria/[slug]/page.tsx`: 8 páginas de categoría con título,
  descripción, migas de pan, `ItemList` y enlaces a cada producto.
- `app/sitemap.ts`: URLs `/categoria/*`.
- `app/llms.txt/route.ts`: resumen en texto plano, regenerado con los ajustes.

**Fuera**
- Cambios en precios, carrito, checkout ni en el diseño de la tienda.
- `robots.ts`: sin cambios, por el motivo explicado arriba.

## Evidencia

- `lib/seo-content.test.ts`: 6 pruebas; las 6 fallaron con los stubs y pasan con
  la implementación. `pnpm verify`: 268 pruebas en 35 archivos, 0 errores de
  tipos y 0 errores de lint (238 advertencias preexistentes).
- `pnpm build`: compila y genera 8 rutas estáticas `/categoria/*` y `/llms.txt`.
- HTML de portada generado: contiene `GroceryStore`, `FAQPage` con 6 preguntas,
  el texto local, los enlaces `/categoria/*` y el teléfono `+5352013998`. El
  horario del JSON-LD sale del ajuste real (`Lunes a sábado, 8:00 AM - 5:00 PM`).
- `categoria/frutas.html`: contiene `ItemList`, migas de pan y 7 productos.
- `/llms.txt` responde `text/plain` con hechos verificables y enlaces absolutos
  al dominio de producción.
- Corrección detectada en el navegador: el título de categoría llevaba dos
  sufijos (`| MercaToma | MercaToma`); se quitó del helper y se añadió una
  aserción para que no vuelva.

## Siguiente

1. Medir en producción con Search Console: impresiones y consultas para
   «Santiago de Cuba», «viandas», «productos agrícolas».
2. Confirmar que Google indexa las páginas de categoría y que `llms.txt` es
   leído por los agentes; no hay métrica local que lo demuestre.
3. Si llega un dominio propio, actualizar `NEXT_PUBLIC_SITE_URL` y revisar
   canónicos y JSON-LD.
