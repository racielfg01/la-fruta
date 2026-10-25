import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/page-shell";

export const metadata: Metadata = {
  title: "Política de privacidad | MercaToma",
  description:
    "Qué datos usa MercaToma, para qué los usa, qué se guarda en tu navegador y cómo ejercer tus derechos.",
};

export default function PrivacidadPage() {
  return (
    <PageShell
      title="Política de privacidad"
      subtitle="Qué datos usamos para llevarte el pedido y qué control tienes sobre ellos."
    >
      <div className="legal-prose">
        <p className="legal-updated">Última actualización: 25 de octubre de 2026.</p>

        <p>
          Esta política explica cómo <strong>MercaToma</strong> trata los datos
          personales de quienes usan la tienda. La idea es simple: usamos solo
          lo necesario para preparar y entregar tu pedido, y no vendemos tus
          datos a nadie.
        </p>

        <h2>1. Datos que recogemos</h2>
        <ul>
          <li><strong>Datos de cuenta:</strong> nombre, correo electrónico, teléfono y, si lo indicas, género.</li>
          <li><strong>Datos de entrega:</strong> provincia, municipio y dirección donde se entrega el pedido.</li>
          <li><strong>Datos del pedido:</strong> productos, cantidades, totales, moneda y método de pago elegido.</li>
          <li><strong>Datos de contacto:</strong> los mensajes que nos envías por WhatsApp o desde la página de contacto.</li>
        </ul>
        <p>
          No pedimos datos de tarjetas: los pagos con transferencia se
          gestionan fuera del sitio, con los datos bancarios que se muestran
          en el checkout.
        </p>

        <h2>2. Para qué los usamos</h2>
        <ul>
          <li>Preparar, confirmar y entregar tu pedido.</li>
          <li>Contactarte por WhatsApp si hay un problema con la entrega o el pago.</li>
          <li>Mostrarte el catálogo y el stock disponibles en tu zona.</li>
          <li>Atender consultas, cambios y reclamaciones.</li>
        </ul>
        <p>
          No usamos tus datos para publicidad de terceros ni los vendemos. Si
          en el futuro se envía algún aviso de la tienda, podrás darte de baja.
        </p>

        <h2>3. Qué se guarda en tu navegador</h2>
        <p>
          Para que la tienda funcione sin pedirte lo mismo en cada visita,
          guardamos información en el almacenamiento local del navegador
          (localStorage) y en la caché del service worker:
        </p>
        <ul>
          <li>El carrito y su contenido.</li>
          <li>La zona de entrega elegida.</li>
          <li>Preferencias de la interfaz, como el tema claro u oscuro.</li>
          <li>Archivos del sitio en caché para que cargue más rápido y funcione con mala conexión.</li>
        </ul>
        <p>
          Puedes borrar estos datos desde la configuración de tu navegador.
          Si los borras, se pierde el contenido del carrito y la zona elegida.
        </p>

        <h2>4. Con quién se comparten</h2>
        <p>
          Solo con proveedores necesarios para operar la tienda: el
          alojamiento y la base de datos donde se guardan los pedidos, el
          servicio de mensajería de WhatsApp para coordinar la entrega y el
          proveedor de imágenes del catálogo. No cedemos datos a terceros con
          fines comerciales.
        </p>

        <h2>5. Cuánto tiempo se conservan</h2>
        <p>
          Los datos de pedidos se conservan mientras sean necesarios para
          atender el pedido, responder reclamaciones y cumplir obligaciones
          contables o legales. Los datos de la cuenta se mantienen hasta que
          pidas su eliminación.
        </p>

        <h2>6. Tus derechos</h2>
        <p>
          Puedes pedir acceso a tus datos, su corrección o su eliminación, y
          oponerte a un uso concreto. Escríbenos desde la página de{" "}
          <Link href="/contacto">Contacto</Link> indicando qué necesitas.
          Responderemos en un plazo razonable y, si corresponde, eliminaremos
          o corregiremos la información.
        </p>

        <h2>7. Seguridad</h2>
        <p>
          Aplicamos medidas razonables para proteger la información: acceso
          restringido a los pedidos y conexión cifrada con el sitio. Ningún
          sistema es infalible; si detectamos un incidente que afecte a tus
          datos, te lo comunicaremos por el canal de contacto que tengamos
          registrado.
        </p>

        <h2>8. Menores de edad</h2>
        <p>
          La tienda no está dirigida a menores de edad. Si eres menor,
          necesita la autorización de tu madre, padre o tutor para usar el
          servicio.
        </p>

        <h2>9. Cambios en esta política</h2>
        <p>
          Si cambiamos la forma de tratar los datos, actualizaremos esta
          página y su fecha. Te recomendamos revisarla de vez en cuando.
        </p>

        <h2>10. Contacto</h2>
        <p>
          Para cualquier consulta sobre privacidad, usa la página de{" "}
          <Link href="/contacto">Contacto</Link>. Si la tienda tiene WhatsApp
          configurado, verás el botón para escribirnos directamente.
        </p>
      </div>
    </PageShell>
  );
}
