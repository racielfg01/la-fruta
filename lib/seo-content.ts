import {
  SITE_DESCRIPTION,
  SITE_URL,
  WHATSAPP_DISPLAY,
  absoluteUrl,
  truncate,
} from "./seo";

const CITY = "Santiago de Cuba";
const COUNTRY = "CU";

/** Slug estable para rutas /categoria/... a partir del nombre de PocketBase. */
export function categorySlug(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Recupera el nombre original buscando en las categorías publicadas. */
export function categoryFromSlug(slug: string, categories: string[]): string | undefined {
  return categories.find((category) => categorySlug(category) === slug);
}

export function categoryMetadata(category: string, count: number) {
  return {
    title: `${category} a domicilio en ${CITY}`,
    description: truncate(
      `${category} a domicilio en ${CITY}: ${count} productos agrícolas de calidad, bien pesados y llevados hasta tu casa. Pide por WhatsApp en MercaToma.`,
      158
    ),
  };
}

/** Datos estructurados del negocio local: responde «quién, dónde y cómo contactar». */
export function localBusinessSchema(settings: {
  storeName?: string;
  whatsappPhone?: string;
  storeSchedule?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "GroceryStore",
    name: settings.storeName || "MercaToma",
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    telephone: `+${(settings.whatsappPhone || "5352013998").replace(/\D/g, "")}`,
    image: absoluteUrl("/icon-512x512.png"),
    areaServed: {
      "@type": "City",
      name: CITY,
      containedInPlace: { "@type": "State", name: CITY, addressCountry: COUNTRY },
    },
    address: {
      "@type": "PostalAddress",
      addressLocality: CITY,
      addressRegion: CITY,
      addressCountry: COUNTRY,
    },
    openingHours: settings.storeSchedule || undefined,
  };
}

export interface FaqItem {
  question: string;
  answer: string;
}

/** Respuestas con datos verificables del catálogo, los términos y los ajustes. */
export function faqItems(settings: { storeSchedule?: string }): FaqItem[] {
  return [
    {
      question: `¿Dónde puedo comprar frutas y viandas frescas en ${CITY}?`,
      answer:
        `MercaToma es una tienda en línea de productos agrícolas frescos en ${CITY}. Elige tus alimentos en el catálogo, indica tu zona de entrega y recíbelos en tu casa.`,
    },
    {
      question: "¿Hacen entregas a domicilio?",
      answer:
        "Sí. Trabajamos por zonas de entrega: al elegir tu provincia y municipio se muestran los productos y el stock disponibles para esa zona. Si tu zona no aparece, el reparto todavía no está habilitado.",
    },
    {
      question: "¿Cómo sé el peso de lo que compro?",
      answer:
        "El peso y la unidad de venta de cada alimento aparecen en su ficha, por ejemplo 1 kg o 1 libra. Los productos frescos pueden variar ligeramente en tamaño o presentación.",
    },
    {
      question: "¿Qué métodos de pago puedo usar?",
      answer:
        "Puedes pagar en efectivo al recibir el pedido o por transferencia bancaria. Los métodos disponibles se muestran en el checkout antes de confirmar.",
    },
    {
      question: "¿Cuándo llega el pedido?",
      answer:
        "La entrega se coordina para la dirección y la zona que indicaste. La entrega el mismo día depende de la zona, el stock y la hora del pedido.",
    },
    {
      question: "¿Cómo hago un pedido o resuelvo una duda?",
      answer:
        `Agrega productos al carrito y completa el checkout con tu dirección. Para cualquier duda, escríbenos por WhatsApp al ${WHATSAPP_DISPLAY}.` +
        (settings.storeSchedule ? ` Horario de atención: ${settings.storeSchedule}.` : ""),
    },
  ];
}

export function faqPageSchema(items: FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}

export function itemListSchema(
  category: string,
  products: { id: string; name: string }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${category} en ${CITY}`,
    numberOfItems: products.length,
    itemListElement: products.map((product, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: absoluteUrl(`/product/${product.id}`),
      name: product.name,
    })),
  };
}

/** Resumen en texto plano para agentes de IA que no ejecutan JavaScript. */
export function llmsTxt(settings: {
  storeName?: string;
  whatsappPhone?: string;
  storeSchedule?: string;
}): string {
  const name = settings.storeName || "MercaToma";
  return `# ${name}

> Tienda en línea de productos agrícolas frescos, bien pesados y llevados hasta tu casa en ${CITY}, Cuba.

${name} vende frutas, verduras, viandas y otros alimentos frescos del campo. El catálogo se organiza por categorías y cada producto indica su unidad de venta, su peso y la zona donde está disponible.

## Hechos verificables

- Ciudad: ${CITY}, Cuba. El reparto funciona por zonas; al elegir provincia y municipio se muestra el stock disponible.
- Pedidos: se agregan productos al carrito y se confirma el pedido en el checkout con la dirección de entrega.
- Pago: efectivo al recibir el pedido o transferencia bancaria, según lo disponible en el checkout.
- Entrega: se coordina para la zona indicada; la entrega el mismo día depende de la zona, el stock y la hora del pedido.
- Contacto: WhatsApp ${WHATSAPP_DISPLAY}.${settings.storeSchedule ? ` Horario de atención: ${settings.storeSchedule}.` : ""}

## Enlaces

- Catálogo y categorías: ${SITE_URL}/
- Todas las páginas: ${SITE_URL}/sitemap.xml
- Contacto: ${absoluteUrl("/contacto")}
- Condiciones de entrega y pago: ${absoluteUrl("/terminos")}
`;
}
