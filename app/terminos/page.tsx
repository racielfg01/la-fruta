import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/page-shell";

export const metadata: Metadata = {
  title: "Términos y condiciones",
  description:
    "Condiciones de uso de la tienda MercaToma: pedidos, precios, entregas por zona, pagos y cancelaciones.",
  alternates: { canonical: "/terminos" },
  openGraph: {
    url: "/terminos",
    title: "Términos y condiciones",
    description:
      "Pedidos, precios, entregas por zona, pagos y cancelaciones en MercaToma.",
  },
};

export default function TerminosPage() {
  return (
    <PageShell
      title="Términos y condiciones"
      subtitle="Las reglas para comprar en MercaToma: pedidos, precios, entregas y pagos."
    >
      <div className="legal-prose">
        <p className="legal-updated">Última actualización: 25 de octubre de 2026.</p>

        <p>
          Estos términos regulan el uso de la tienda en línea de{" "}
          <strong>MercaToma</strong> y la compra de los productos que se
          muestran en ella. Al navegar por el sitio o realizar un pedido,
          aceptas estas condiciones. Si no estás de acuerdo, te pedimos no
          usar el servicio.
        </p>

        <h2>1. Uso del sitio</h2>
        <p>
          Puedes navegar y comprar como invitado o creando una cuenta. Te
          comprometes a dar información veraz en el registro, el carrito y el
          checkout, y a no usar el sitio para fines fraudulentos o para
          interferir con su funcionamiento.
        </p>
        <p>
          El catálogo, el stock y los precios pueden cambiar sin previo aviso.
          Las imágenes son orientativas: el producto entregado puede variar
          ligeramente en tamaño, color o presentación por tratarse de
          alimentos frescos.
        </p>

        <h2>2. Zonas y disponibilidad</h2>
        <p>
          La tienda trabaja por zonas de entrega. Al elegir tu provincia y
          municipio se muestra el catálogo y el stock disponibles para esa
          zona. Si tu zona no aparece en el selector, el reparto no está
          habilitado todavía.
        </p>

        <h2>3. Precios y monedas</h2>
        <p>
          Los precios se publican en las monedas habilitadas por la tienda.
          El precio de referencia se calcula en dólares estadounidenses (USD)
          y puede mostrarse su equivalente en pesos cubanos (CUP) según la
          configuración vigente.
        </p>
        <p>
          El <strong>total que se muestra en el checkout</strong> es el que se
          aplica al pedido. Puede incluir un costo operativo o de entrega,
          que verás desglosado antes de confirmar. Los precios pueden
          actualizarse; el cambio no afecta a pedidos ya confirmados.
        </p>

        <h2>4. Pedidos y entregas</h2>
        <ul>
          <li>Un pedido se considera confirmado cuando finalizas el checkout y recibes la confirmación.</li>
          <li>La entrega se coordina para la dirección y la zona que indicaste.</li>
          <li>La disponibilidad de entrega el mismo día depende de la zona, el stock y la hora del pedido.</li>
          <li>Si no es posible entregar en la dirección indicada, te contactaremos por WhatsApp para acordar una alternativa.</li>
        </ul>
        <p>
          Es responsabilidad del cliente facilitar una dirección correcta y
          estar disponible para recibir el pedido en el horario acordado.
        </p>

        <h2>5. Pagos</h2>
        <p>
          Los métodos de pago disponibles se muestran en el checkout. Según la
          configuración de la tienda, pueden incluir:
        </p>
        <ul>
          <li><strong>Efectivo</strong> al recibir el pedido.</li>
          <li><strong>Transferencia bancaria</strong>, con los datos que se indican al elegir ese método.</li>
        </ul>
        <p>
          Si eliges transferencia, el pedido puede quedar pendiente hasta
          confirmar el pago. Los datos bancarios que se muestran en el
          checkout son los únicos válidos.
        </p>

        <h2>6. Cancelaciones y cambios</h2>
        <p>
          Puedes solicitar la cancelación antes de que el pedido salga a
          reparto. Escríbenos por{" "}
          <Link href="/contacto">nuestro canal de contacto</Link> con el número
          de pedido. Si el pedido ya fue entregado, revisa el producto al
          recibirlo y comunícanos cualquier problema el mismo día.
        </p>
        <p>
          Al tratarse de productos frescos y perecederos, no se aceptan
          devoluciones por cambio de opinión. Si el producto llega en mal
          estado o no corresponde a lo pedido, lo reponemos o reembolsamos
          según el caso.
        </p>

        <h2>7. Responsabilidad</h2>
        <p>
          Hacemos lo posible por mantener el catálogo, los precios y la
          disponibilidad actualizados. No respondemos por interrupciones del
          servicio ajenas a nosotros, como fallos de conexión, del proveedor
          de alojamiento o de la pasarela de pago. Tampoco por el uso
          indebido de la cuenta por parte de terceros si el cliente no
          protegió sus credenciales.
        </p>

        <h2>8. Cambios en estos términos</h2>
        <p>
          Podemos actualizar estos términos para reflejar cambios en el
          servicio o en la ley. La versión vigente es la publicada en esta
          página, con su fecha de actualización.
        </p>

        <h2>9. Contacto</h2>
        <p>
          Para dudas sobre estos términos o sobre un pedido, usa la página de{" "}
          <Link href="/contacto">Contacto</Link>. Ahí encontrarás el canal de
          WhatsApp de la tienda cuando esté configurado.
        </p>
      </div>
    </PageShell>
  );
}
