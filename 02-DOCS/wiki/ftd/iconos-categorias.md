---
author: Raciel Ferrin
branch: main
status: done
---
# Iconos SVG para las categorías

## Intent

Dar un icono reconocible a cada categoría de la tienda: huevos, frutas,
vegetales y otras, en lugar de la hoja genérica que se usaba antes.

## Scope

**Dentro**
- Diez SVG estáticos en `public/categorias/`, con trazo y color del verde de la
  marca: huevos, frutas, vegetales, cítricos, bayas, tropicales, melones,
  tubérculos, hortalizas y hierbas.
- Registro cerrado de nombres en `lib/category-icons.ts`: acepta nombres en
  español y las claves inglesas que ya usa el catálogo, sin acentos ni
  mayúsculas. Nunca se renderiza un SVG que venga de la base de datos.
- Los iconos aparecen en los enlaces «Compra por categoría» de la portada, en
  los chips de filtro y en la lista lateral de la tienda.

**Fuera**
- Subir SVG desde el panel del admin: el campo de imagen de la categoría sigue
  igual.
- Cambiar el nombre de las categorías existentes en PocketBase.

## Evidencia

- `lib/category-icons.test.ts`: 4 pruebas escritas antes del código. Cubren
  normalización de acentos y espacios, nombres en español e inglés, y el
  retorno a `null` cuando no hay icono.
- Los diez SVG se cargaron en navegador: todos con `naturalWidth > 0` y trazo
  legible a 48 px.
- `pnpm verify`: 305 pruebas en 41 archivos, 0 errores de tipos y de lint.
  `pnpm build`: correcto. Detector de Impeccable sin hallazgos.

## Siguiente

1. Si el admin crea una categoría con otro nombre, decidir si quiere elegir
   icono desde el formulario en vez de ampliar el registro a mano.
