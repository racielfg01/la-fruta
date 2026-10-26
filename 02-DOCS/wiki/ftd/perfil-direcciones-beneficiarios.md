---
author: Raciel Ferrin
branch: main
status: done
---
# Direcciones y beneficiarios en el perfil

## Intent

El checkout ya deja guardar direcciones de entrega y beneficiarios (la persona
que recibe el pedido), pero `/perfil` no los muestra: el usuario solo los ve
cuando vuelve a comprar, y no puede corregir un teléfono equivocado ni borrar
una dirección vieja sin pasar por el checkout. Su perfil parece vacío aunque
tenga datos guardados.

El objetivo es que `/perfil` liste esos datos y permita gestionarlos ahí mismo:
añadir, editar y eliminar, con las mismas acciones de servidor que usa el
checkout (nada de duplicar la capa de datos).

## Scope

**Dentro**
- Dos tarjetas nuevas bajo la tarjeta de datos del usuario, en la columna
  izquierda del perfil: **Direcciones** y **Beneficiarios**.
- Listado con alias, dirección, zona e instrucciones (direcciones) y nombre,
  teléfono y carnet (beneficiarios).
- Crear, editar y eliminar desde el perfil, con validación en el formulario y
  confirmación antes de borrar.
- Estado vacío con explicación y botón para añadir el primero.
- Carga con esqueletos; error de carga visible y reintentable.
- Nueva acción `updateBeneficiaryAction` (faltaba: solo existían crear y
  borrar), con la misma comprobación de propiedad que el resto.
- La zona se elige entre las zonas de envío activas; si una dirección guardada
  tiene una zona que ya no está activa, se conserva al editarla.

**Fuera**
- No se toca el checkout ni el modelo de datos: mismas colecciones
  (`user_addresses`, `beneficiaries`) y mismas acciones existentes.
- No se implementa «dirección predeterminada» / «beneficiario
  predeterminado»: el campo `is_default` existe en la colección pero ningún
  flujo lo usa (el checkout no preselecciona nada). Añadir aquí un concepto que
  el checkout ignora sería una promesa falsa; se deja para cuando el checkout
  lo consuma.
- No se permite borrar la dirección que coincide con el pedido en curso: no
  hay tal vínculo, los pedidos guardan su propia copia de la dirección.
- No hay paginación: son listas cortas por naturaleza.

## Checklist

- [x] `updateBeneficiaryAction` añadida con validación de propiedad.
- [x] Tarjeta **Direcciones**: lista, vacío, crear, editar, borrar.
- [x] Tarjeta **Beneficiarios**: lista, vacío, crear, editar, borrar.
- [x] Validación en el formulario (obligatorios, teléfono, feedback por campo).
- [x] Confirmación antes de eliminar y aviso (toast) tras cada cambio.
- [x] Carga con esqueletos y error reintentable.
- [x] Verificado en navegador (escritorio y móvil) y `tsc --noEmit` limpio.

## Evidence

Verificado en el navegador (`localhost:3000/perfil`) con un usuario de prueba
que tenía 2 direcciones y 2 beneficiarios reales en PocketBase. Al terminar se
borraron usuario, direcciones, beneficiarios y la orden de prueba.

**Listado**
- Las tarjetas aparecen bajo la tarjeta de perfil, en la columna izquierda:
  «Direcciones» con contador, alias, dirección, zona (badge) e instrucciones;
  «Beneficiarios» con nombre, teléfono y carnet.
- Escritorio 1280: columna de 320 px; direcciones y beneficiarios apilados a la
  izquierda, historial a la derecha. Sin desbordamiento horizontal.
- Móvil 390: perfil → direcciones → beneficiarios → historial, ancho 343 px,
  sin desbordamiento. Botones de editar/eliminar de 40×40 px (36×36 en
  escritorio) y «Añadir» de 36 px de alto: áreas táctiles cómodas.

**Direcciones**
- Validación: guardar con la dirección vacía deja el diálogo abierto, marca el
  campo (`aria-invalid`) y muestra «Escribe la dirección de entrega».
- Crear: «Oficina», zona «Sueño» → toast «Dirección guardada», contador 3 y la
  fila aparece con su badge de zona.
- Editar: el diálogo precarga alias, dirección, zona e instrucciones. La zona
  «Vedado» (ya no está entre las zonas activas) se conserva al editar; guardar
  muestra «Dirección actualizada» y el alias cambia en la lista.
- Borrar: confirma con `¿Eliminar dirección?` y el nombre; toast «Dirección
  eliminada»; contador 2.

**Beneficiarios**
- Validación: teléfono «123» → «Ingresa un teléfono válido, por ejemplo
  +53 5123 4567» y el diálogo no se cierra.
- Crear: al corregir el teléfono, toast «Beneficiario guardado» y contador 3.
- Editar: precarga nombre, teléfono y carnet; al guardar, toast «Beneficiario
  actualizado» y la fila muestra el teléfono y carnet nuevos (acción
  `updateBeneficiaryAction` nueva).
- Borrar: confirmación `¿Eliminar beneficiario?` + nombre, toast «Beneficiario
  eliminado».

**Estados**
- Vacío: con las dos listas a cero se muestra el icono, «Aún no tienes
  direcciones» / «Aún no tienes beneficiarios», una frase de para qué sirven y
  el botón para añadir la primera.
- Error: si falla la carga no se borran los datos ya visibles; se muestra un
  aviso compacto con «Reintentar» (y el estado vacío con reintento cuando no
  hay nada). Se corrigió una carrera de desarrollo que marcaba error después
  de una carga correcta.

**Estático**
- `npx tsc --noEmit` sin errores.

## Decisión

No se implementa «predeterminada»: el campo `is_default` existe en la colección
pero el checkout nunca lo usa ni preselecciona nada, así que aquí sería una
promesa vacía. Se añadirá cuando el checkout lo consuma.
