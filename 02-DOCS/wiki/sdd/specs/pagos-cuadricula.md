---
type: spec
title: Spec — Cuadrícula de opciones de pago
description: WHAT and WHY for a single payment grid built from active currencies, banks and accounts, with no currency selector.
tags: [sdd, spec, checkout, pagos, bancos, zelle, usdt]
timestamp: 2026-11-05T12:00:00Z
topic: sdd
slug: pagos-cuadricula
status: draft
---

# Spec — Cuadrícula de opciones de pago

> Slug: `pagos-cuadricula` · Status: draft · Created: 2026-11-05
> Pendiente: aprobación del usuario.

## Problem & why

Hoy el checkout separa «Moneda de pago» y «Método de pago» en dos controles. Solo
entiende dos métodos: efectivo y transferencia. Zelle y USDT ya existen como bancos
con sus cuentas en Configuración → Bancos y cuentas, pero el cliente tiene que elegir
«transferencia», luego una moneda, luego un banco y por último una cuenta. La forma
de pago real (Zelle, USDT, efectivo USD, efectivo CUP) queda escondida detrás de dos
pasos que no la nombran.

## Cost of not building it

El cliente no ve de un vistazo cómo puede pagar. Cada paso extra es una oportunidad
de abandonar el pedido, y el dueño no puede destacar Zelle o USDT sin explicarlo por
fuera de la tienda. Si la cuenta que corresponde no aparece, el pedido llega con un
comprobante que no se puede conciliar.

## The cheapest alternative

Dejar el flujo actual y añadir una nota con las formas de pago. No escala: cada banco
nuevo sigue escondido y el cliente sigue eligiendo banco y cuenta a mano.

## Goals

- El cliente ve todas las formas de pago en una sola cuadrícula: efectivo USD,
  efectivo CUP y un espacio por cada banco activo (Zelle, USDT…).
- Al elegir un banco, ve los datos de su cuenta sin pasos intermedios.
- La cuadrícula usa 4 columnas en escritorio y 2 en móvil; la segunda fila se llena
  a medida que se activan más bancos.
- Todo se administra desde Configuración: efectivo en General; bancos, moneda, logo,
  cuentas, tipo de cuenta y estado activo en Bancos y cuentas.
- El pedido guarda banco y cuenta igual que hoy, así que el admin, los límites y el
  comprobante siguen funcionando sin migración de datos.

## Non-goals / out of scope

- Colecciones o campos nuevos en PocketBase.
- Reordenar bancos a mano (arrastrar) o fijar un orden distinto al alfabético.
- Varias cuentas a la vez en un mismo pedido o pago dividido.
- Monedas nuevas: solo las activas en Configuración → Monedas.
- Cambiar el flujo de efectivo, sus totales o el redondeo.
- Cambiar la página de confirmación, el detalle de orden o los avisos.
- Pasarela de pago automática (links, QR, conciliación bancaria).
- Editar el selector de moneda del catálogo o de la tienda.

## Users & context

- **Cliente que paga:** compra desde el móvil, ya eligió envío y datos. Quiere ver
  cómo pagar y qué datos usar para transferir.
- **Administrador:** mantiene los bancos y cuentas activos en Configuración. Sabe que
  apagar un banco o una cuenta lo quita del checkout sin tocar código.
- **Administrador de pedidos:** recibe el pedido con el banco y la cuenta usados, y
  con el comprobante adjunto.

## Behaviour

### Cuadrícula

- La sección Pago muestra una cuadrícula de **4 columnas en escritorio** y **2 en
  móvil**. Los tiles fluyen a la segunda fila cuando hay más de cuatro.
- Orden: primero los tiles de efectivo (USD y después CUP), luego los bancos activos
  ordenados por nombre.
- Cada tile muestra: icono o logo, nombre y subtítulo. Efectivo: «Efectivo». Banco:
  el campo **Tipo** de su cuenta si está lleno (por ejemplo `BEP-20`), si no la
  moneda del banco (`USD`).
- Un tile de banco sin cuentas usables se muestra **deshabilitado** con el motivo
  «No hay cuentas activas en {moneda}.». No se oculta.
- Un banco inactivo no se muestra. Si la moneda del banco no está activa, su tile
  tampoco se muestra: no hay tasa con la que cobrarlo.
- Si el administrador apaga Efectivo, no hay tiles de efectivo. Si apaga
  Transferencias, no hay tiles de banco. Si apaga ambos, se muestran todos (regla
  actual de no dejar el checkout sin pago).
- La cuadrícula es un grupo de radios: teclado, flechas y lector de pantalla
  funcionan como una sola elección.

### Efectivo

- Elegir efectivo USD o CUP fija la moneda del pedido y muestra el total redondeado
  a billetes exactos, con la línea de redondeo, como hoy.
- El efectivo solo existe para CUP y USD, las monedas con billetes definidos.

### Banco (Zelle, USDT, cuenta bancaria)

- Elegir un tile de banco fija la moneda del pedido a la del banco y muestra, en el
  mismo bloque, los datos de su cuenta: número/teléfono/wallet con botón de copiar,
  tipo, titular y CI/RUC si existe.
- Si el banco tiene una sola cuenta usable, sus datos se muestran directamente. Si
  tiene varias, aparece un selector de cuenta con la primera elegida.
- Se mantiene el monto a transferir, el comprobante obligatorio y la referencia
  opcional. El envío sin comprobante sigue bloqueado con su error.
- Las cuentas con el límite de transferencias alcanzado no se ofrecen. Si todas lo
  alcanzaron, el tile queda deshabilitado con el mismo motivo.

### Moneda y totales

- La moneda la define el tile elegido; desaparece el selector de moneda del checkout.
- Al cargar, se preselecciona el tile de efectivo de la moneda global de la tienda
  (CUP por defecto). Si esa moneda no tiene efectivo, se elige el primer tile
  disponible.
- La barra de totales, el resumen y la confirmación usan la moneda del tile.
- Bajo la cuadrícula se muestran la tasa del día (`1 USD = 780.00 CUP`) y el aviso de
  ahorro al pagar en USD cuando corresponda.

### Configuración

- **General → Pago:** «Efectivo» enciende los tiles de efectivo. «Transferencia
  bancaria» pasa a llamarse «Transferencias y pagos digitales» y enciende todos los
  tiles de banco; su descripción menciona Zelle, USDT y cuentas bancarias.
- **Bancos y cuentas:** el switch activo del banco decide si su tile aparece. El
  switch activo de la cuenta y su moneda deciden si el tile se puede usar y qué
  datos se muestran. El campo Tipo se usa como subtítulo.
- No se añaden campos ni pantallas nuevas.

### Pedido y admin

- Un pago por banco se guarda como `payment_method = transfer`, con el nombre del
  banco, el id y número de cuenta y el comprobante, como hoy.
- El contador de transferencias de la cuenta se incrementa igual que hoy. El detalle
  del pedido y el panel de órdenes no cambian.
- La confirmación muestra el monto en la moneda del tile.

### Errores y vacíos

- Si falla la carga de bancos, quedan los tiles de efectivo y el checkout sigue.
- Si no hay ningún tile disponible, la cuadrícula lo explica y la confirmación queda
  bloqueada con un aviso.
- Si el tile elegido deja de estar disponible (por ejemplo, se alcanzó un límite
  entre la carga y el envío), el servidor rechaza el pedido con su error actual.

## Acceptance criteria

- Given monedas activas CUP y USD, bancos activos Zelle y USDT, When se abre el
  checkout, Then la cuadrícula muestra efectivo USD, efectivo CUP, Zelle y USDT en
  cuatro columnas (dos en móvil).
- Given más de cuatro opciones activas, When se renderiza, Then las siguientes pasan
  a la segunda fila sin cambiar el ancho de las columnas.
- Given el banco Zelle con una cuenta activa en USD, When el cliente elige Zelle,
  Then ve teléfono, titular y botón de copiar; el total y la moneda pasan a USD.
- Given el banco USDT con una cuenta de tipo `BEP-20`, When se muestra su tile,
  Then el subtítulo dice `BEP-20`.
- Given un banco activo sin cuentas usables, When se muestra, Then su tile aparece
  deshabilitado con «No hay cuentas activas en {moneda}.».
- Given un banco inactivo, When se muestra la cuadrícula, Then su tile no aparece.
- Given el switch de Efectivo apagado, When se abre el checkout, Then no hay tiles de
  efectivo y sí los de banco.
- Given el switch de Transferencias apagado, When se abre el checkout, Then no hay
  tiles de banco y sí los de efectivo.
- Given ambos switches apagados, When se abre el checkout, Then se muestran todos los
  tiles disponibles.
- Given la moneda global CUP, When se abre el checkout, Then el tile elegido es
  efectivo CUP y los totales están en CUP.
- Given un tile de banco elegido, When se envía sin comprobante, Then el pedido no se
  crea y se muestra el error del comprobante.
- Given un tile de banco elegido con comprobante, When se confirma, Then el pedido se
  crea como transferencia con banco, cuenta y comprobante, y la confirmación muestra
  la moneda del banco.
- Given una cuenta con el límite alcanzado, When se listan las cuentas del banco,
  Then esa cuenta no aparece y no se puede elegir.
- Given que la carga de bancos falla, When se abre el checkout, Then los tiles de
  efectivo funcionan y no se bloquea la compra.
- Given que ningún tile está disponible, When el cliente intenta confirmar, Then ve
  un aviso y el pedido no se crea.
- Given un lector de pantalla, When recorre la cuadrícula, Then cada tile anuncia su
  nombre, su moneda o tipo y si está deshabilitado.

## Points to clarify

- **suposición tomada** — el subtítulo del banco usa el campo Tipo de la cuenta y,
  si está vacío, la moneda. *Base:* el usuario pidió ver `USDT (BEP-20)` sin campos
  nuevos; Tipo ya existe. *Riesgo:* si el banco tiene cuentas con tipos distintos,
  el subtítulo usa el de la primera cuenta usable.
- **suposición tomada** — los tiles de banco se ordenan por nombre y el efectivo va
  primero (USD y luego CUP). *Base:* no hay campo de orden y el usuario no lo pidió.
  *Riesgo:* si quiere Zelle antes que USDT, hace falta un orden manual en otro ciclo.
- **suposición tomada** — la moneda del banco manda: un tile de banco en una moneda
  inactiva no se muestra. *Base:* sin moneda activa no hay tasa para cobrar.
  *Riesgo:* el administrador podría esperar verlo deshabilitado; se explica en la
  documentación de la spec.
- **suposición tomada** — el tile de efectivo de la moneda global se preselecciona al
  cargar. *Base:* evita que el checkout cambie de CUP a USD solo por el orden de la
  cuadrícula. *Riesgo:* si el usuario espera que se recuerde el último método, se
  añade en otro ciclo.
- **decisión diferida** — orden manual de tiles, pago dividido y pasarela automática.
  Fuera de este ciclo.

## Clarifications

- 2026-11-05 — Los datos de Zelle y USDT salen de Configuración → Bancos y cuentas.
  Decidido por el usuario.
- 2026-11-05 — Se quita el selector de moneda; la moneda la define el tile. Decidido
  por el usuario.
