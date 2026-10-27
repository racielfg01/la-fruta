---
type: spec
title: Spec — Avisos push de la tienda
description: WHAT and WHY for avisos push — pedidos, usuarios nuevos y productos nuevos, con configuración en el admin.
tags: [sdd, spec, notificaciones, push]
timestamp: 2026-10-27T14:00:00Z
topic: sdd
slug: notificaciones-push
status: clarified
---

# Spec — Avisos push de la tienda

> Slug: `notificaciones-push` · Status: clarified · Created: 2026-10-27
> Approved in autopilot: 2026-10-27 (spec + implementation run; stops before PocketBase/Vercel and before deploy)
> Inherits: [constitution](../constitution.md) (borrador; ver riesgo en el plan)

## Problem & why

El dueño se entera de un pedido nuevo solo cuando abre el panel, y de un cliente
nuevo cuando revisa la lista. El cliente registrado no sabe que llegaron productos
nuevos salvo que vuelva a entrar. Hoy el aviso depende de que alguien mire o de un
WhatsApp manual.

## Cost of not building it

Los pedidos se atienden tarde, sobre todo fuera del horario de oficina. Cada cliente
nuevo tarda en recibir respuesta. Las novedades se venden menos porque nadie se
entera. El costo no es dinero directo: es venta que se enfría y confianza que se
pierde.

## The cheapest alternative

Seguir refrescando el panel y avisar por WhatsApp. Resuelve el pedido si el dueño
está pendiente, pero no avisa solo, no cubre al cliente y vuelve a depender de que
alguien escriba. Un bot de WhatsApp resolvería los avisos al dueño, no las
novedades al cliente, y añade otro canal que mantener.

## Goals

- El administrador recibe en su teléfono un aviso cuando entra un pedido, sin abrir
  el panel, con lo necesario para actuar.
- El administrador recibe un aviso cuando se crea una cuenta de cliente.
- El administrador decide qué eventos avisan y puede probar su propio dispositivo.
- El cliente registrado que activa los avisos recibe uno cuando el administrador
  anuncia productos nuevos.
- Si un aviso falla, la tienda sigue funcionando: el pedido se crea y la cuenta se
  registra igual.

## Non-goals / out of scope

- Email, SMS o WhatsApp automáticos.
- Avisos de pedidos o usuarios a clientes.
- Envío automático de productos nuevos: el administrador decide cuándo (1a).
- Suscripciones anónimas: solo clientes registrados (2b).
- Campañas, segmentos, programación o envíos masivos.
- App nativa; se usa la web instalable que ya existe.
- Bandeja de notificaciones, historial leído/no leído o centro de mensajes.
- Cambiar el flujo de compra o de registro.
- Avisos por cambio de estado de un pedido.
- Push en iPhone sin instalar la web como app: es un límite de la plataforma, no
  una funcionalidad pendiente.

## Users & context

- **Administrador:** dueño o encargado, lejos del panel, con el teléfono a mano.
  Quiere saber de un pedido o un cliente nuevo sin refrescar nada.
- **Cliente registrado:** compra desde el móvil y quiere enterarse de productos
  nuevos sin revisar la tienda.
- **Administrador configurando:** entra a `/admin/notificaciones`, enciende los
  eventos, activa su dispositivo y envía una prueba.

## Behaviour

- **Pantalla de configuración.** En `/admin/notificaciones`, solo para el rol
  administrador, se ven tres eventos con su interruptor: pedido nuevo, usuario
  nuevo y productos nuevos. Cada cambio se guarda y se aplica al siguiente evento.
- **Este dispositivo.** La pantalla dice si el dispositivo actual está activo y
  permite activarlo, desactivarlo y enviar una prueba solo a ese dispositivo.
  Pedir el permiso del navegador ocurre después de pulsar, nunca al abrir la página.
  Si el permiso se niega, se explica cómo cambiarlo. La suscripción del
  administrador queda ligada a su cuenta y a ese dispositivo; al cerrar sesión o
  perder el rol, el dispositivo deja de recibir avisos.
- **Pedido nuevo.** Al crearse un pedido, si el evento está encendido, todos los
  dispositivos de administrador activos reciben un aviso con el código del pedido,
  el nombre del cliente, el total y la zona de entrega. Al tocarlo se abre el panel
  de órdenes. Si el envío falla, el pedido ya está creado y no se muestra un error
  al cliente.
- **Usuario nuevo.** Al crearse una cuenta de cliente, desde el registro o desde el
  panel, si el evento está encendido, los dispositivos de administrador reciben un
  aviso con el nombre del cliente. Al tocarlo se abre la lista de usuarios. Las
  cuentas de administrador no generan aviso.
- **Productos nuevos.** La pantalla muestra cuántos productos visibles se crearon
  desde el último aviso y habilita «Avisar a clientes» solo si hay alguno, el
  evento está encendido y hay al menos un cliente suscrito. Si no hay clientes,
  dice «No hay clientes suscritos» y no envía ni reinicia el contador. La primera
  vez que se enciende el evento, el contador arranca en cero: solo cuentan los
  productos creados después. Al pulsar, todos los dispositivos de cliente activos
  reciben un aviso con hasta tres nombres de producto y el resto en número. Al
  tocarlo se abre la tienda. Después de enviar, el contador vuelve a cero. Un
  segundo envío seguido espera un minuto.
- **Cliente.** Un cliente registrado ve «Activar avisos» en la tienda. Al pulsarlo
  se pide permiso y el dispositivo queda ligado a su cuenta; puede desactivarlo.
  Si no ha iniciado sesión, el control invita a entrar. Al cerrar sesión, ese
  dispositivo deja de recibir avisos de productos.
- **iPhone.** Si el dispositivo lo exige, se explica que hay que añadir la web a la
  pantalla de inicio antes de activar. No se promete un aviso que el navegador no
  puede dar.
- **Sin configuración.** Si el servicio de avisos no está configurado, la pantalla
  lo dice, los interruptores no envían nada y el resto de la tienda funciona.
- **Suscripciones vencidas.** Si un dispositivo deja de ser válido, se descarta y
  los demás siguen recibiendo.
- **Privacidad.** El aviso de pedido muestra nombre y total solo en dispositivos de
  administrador. No se envían direcciones, teléfonos ni contraseñas. El aviso de
  producto muestra nombres de producto.

## Acceptance criteria

- Given un administrador con el dispositivo activo y el evento de pedidos encendido,
  When un cliente crea un pedido, Then el dispositivo recibe un aviso con el código,
  el nombre del cliente y el total, y al tocarlo se abre el panel de órdenes.
- Given el evento de pedidos apagado, When se crea un pedido, Then no se envía aviso.
- Given un dispositivo de administrador activo y el evento de usuarios encendido,
  When se registra un cliente, Then el dispositivo recibe un aviso con el nombre y
  al tocarlo se abre la lista de usuarios.
- Given una cuenta de administrador creada, When se crea, Then no se envía aviso de
  usuario nuevo.
- Given dos productos visibles nuevos y al menos un cliente suscrito, When el
  administrador pulsa «Avisar a clientes», Then cada dispositivo de cliente recibe
  un aviso con hasta tres nombres y al tocarlo se abre la tienda.
- Given que no hay productos visibles nuevos desde el último aviso, When se abre la
  pantalla, Then el botón «Avisar a clientes» está deshabilitado y no se envía nada.
- Given el evento de productos encendido por primera vez, When se abre la pantalla,
  Then el contador está en cero y solo cuenta productos creados después.
- Given que no hay clientes suscritos, When hay productos visibles nuevos, Then el
  botón «Avisar a clientes» está deshabilitado, se muestra «No hay clientes
  suscritos» y el contador no se reinicia.
- Given un administrador que ya envió un aviso de productos, When pulsa otra vez
  dentro de un minuto, Then no se envía un segundo aviso.
- Given los tres interruptores en un estado, When se recarga la pantalla, Then
  conservan ese estado.
- Given un administrador con el dispositivo activo, When cierra sesión, Then ese
  dispositivo deja de recibir avisos.
- Given un visitante sin sesión, When pulsa «Activar avisos», Then se le invita a
  iniciar sesión y no se crea ninguna suscripción.
- Given un cliente con sesión que concede el permiso, When activa los avisos, Then
  su dispositivo queda suscrito; When cierra sesión, Then deja de recibir avisos de
  productos.
- Given un cliente que niega el permiso, When intenta activar, Then ve instrucciones
  y no queda suscrito.
- Given una suscripción vencida, When se intenta enviar, Then se descarta y los
  demás dispositivos reciben el aviso.
- Given un fallo del servicio de avisos, When se crea un pedido o una cuenta, Then
  la operación termina bien y el fallo no bloquea al cliente.
- Given que faltan las claves o la configuración, When se abre la pantalla, Then se
  muestra «sin configurar» y no se envía ningún aviso.
- Given un usuario sin rol de administrador, When entra a `/admin/notificaciones`,
  Then no accede.
- Given un administrador que pulsa «Enviar prueba», When se envía, Then solo su
  dispositivo recibe la prueba, no los demás administradores ni los clientes.
- Given un producto oculto o editado, When se calculan las novedades, Then no cuenta
  como nuevo; solo cuentan los visibles creados después del último aviso.
- Given un iPhone sin la web instalada, When se abre la pantalla de configuración,
  Then se explica el requisito de instalación y no se afirma que el push funciona.

## Points to clarify

- **suposición tomada** — el contador de productos arranca en cero la primera vez
  que se enciende el evento; no se anuncia el catálogo anterior. *Base:* evita
  volcar todo el catálogo en el primer envío. *Riesgo:* si el administrador quiere
  anunciar productos viejos, se añade un «incluir existentes» en otro ciclo.
- **suposición tomada** — el aviso de pedido incluye nombre del cliente y total en
  el texto. *Base:* el administrador decide con eso. *Riesgo:* el texto se ve en la
  pantalla bloqueada; si el teléfono es compartido, habría que reducirlo.
- **suposición tomada** — la suscripción del cliente se ata a su cuenta y se
  desactiva al cerrar sesión. *Base:* privacidad y control del cliente. *Riesgo:*
  si usa varias cuentas o dispositivos, hay que repetir la activación.
- **suposición tomada** — solo el rol administrador entra a la pantalla de avisos.
  *Base:* el guard actual del admin. *Riesgo:* si se quiere delegar a otro rol, se
  añade un permiso.
- **suposición tomada** — el botón de productos espera un minuto entre envíos.
  *Base:* evita dobles pulsaciones. *Riesgo:* si el administrador quiere anunciar
  dos tandas seguidas, espera.
- **decisión diferida** — envío automático o resumen diario de productos (1b/1c).
  Fuera de este ciclo.
- **decisión diferida** — campañas, segmentos y programación. Fuera de este ciclo.
- **área no formulable** — cuántos clientes aceptarán el permiso y cuántos instalarán
  la web en iPhone. No se sabe hasta medirlo; no cambia la construcción.


## Clarifications

- 2026-10-27 — Destinatarios: pedidos y usuarios nuevos a los administradores;
  productos nuevos a los clientes. Decidido por el usuario.
- 2026-10-27 — Productos nuevos: envío manual desde el panel (1a).
- 2026-10-27 — Clientes: solo cuentas registradas pueden activar los avisos (2b).
- 2026-10-27 — Infraestructura: el agente crea la colección y genera las claves
  VAPID; el usuario las pega en Vercel (3a).
- 2026-10-27 — Aprobación en autopilot. La ejecución se detiene antes de tocar
  PocketBase o Vercel y antes de desplegar.
