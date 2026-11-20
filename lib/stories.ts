export type StoryLinkType = "none" | "product" | "offer";

export type StoryReaction = "like" | "love" | "whatever" | "dislike";

export interface AdminStory {
  id: string;
  name: string;
  image: string;
  duration: number;
  linkType: StoryLinkType;
  productId: string;
  offerId: string;
  active: boolean;
  sort: number;
}

export type PublicStory = AdminStory;

export interface StoryInput {
  name: string;
  image: string;
  duration: number;
  linkType: StoryLinkType;
  productId: string;
  offerId: string;
  active: boolean;
  sort: number;
}

export function normalizeStoryDuration(value: unknown): number {
  if (value === undefined || value === null || value === "") return 5;
  const n = Math.trunc(Number(value));
  if (!Number.isFinite(n) || n < 1) return 5;
  return n;
}

function normalizeLinkType(value: unknown): StoryLinkType {
  if (value === "product" || value === "offer" || value === "none") return value;
  return "none";
}

export function toAdminStory(rec: Record<string, any>): AdminStory {
  const linkType = normalizeLinkType(rec.link_type ?? rec.linkType);
  return {
    id: String(rec.id ?? ""),
    name: String(rec.name ?? ""),
    image: String(rec.image ?? ""),
    duration: normalizeStoryDuration(rec.duration),
    linkType,
    productId: String(rec.product_id ?? rec.productId ?? ""),
    offerId: String(rec.offer_id ?? rec.offerId ?? ""),
    active: rec.active !== false,
    sort: Number.isFinite(Number(rec.sort)) ? Number(rec.sort) : 0,
  };
}

export function toPublicStory(story: AdminStory): PublicStory {
  return {
    id: story.id,
    name: story.name,
    image: story.image,
    duration: story.duration,
    linkType: story.linkType,
    productId: story.productId,
    offerId: story.offerId,
    active: story.active,
    sort: story.sort,
  };
}

export function storyCtaHref(story: Pick<AdminStory, "linkType" | "productId" | "offerId">): string | null {
  if (story.linkType === "product" && story.productId) {
    return `/product/${story.productId}`;
  }
  if (story.linkType === "offer" && story.offerId) {
    return "/ofertas";
  }
  return null;
}

export function storyLinkFields(data: {
  linkType?: StoryLinkType | string;
  productId?: string;
  offerId?: string;
}) {
  const linkType = normalizeLinkType(data.linkType);
  if (linkType === "product") {
    const productId = String(data.productId || "").trim();
    if (!productId) throw new Error("Elige el producto al que lleva la historia");
    return { link_type: "product" as const, product_id: productId, offer_id: "" };
  }
  if (linkType === "offer") {
    const offerId = String(data.offerId || "").trim();
    if (!offerId) throw new Error("Elige la oferta a la que lleva la historia");
    return { link_type: "offer" as const, product_id: "", offer_id: offerId };
  }
  return { link_type: "none" as const, product_id: "", offer_id: "" };
}

export function validateStoryInput(data: {
  name?: string;
  image?: string;
  duration?: unknown;
  linkType?: StoryLinkType | string;
  productId?: string;
  offerId?: string;
}) {
  const name = String(data.name ?? "").trim();
  if (!name) throw new Error("El nombre de la historia es requerido");
  const image = String(data.image ?? "").trim();
  if (!image) throw new Error("La imagen de la historia es requerida");
  if (data.duration !== undefined && data.duration !== null && data.duration !== "") {
    const n = Math.trunc(Number(data.duration));
    if (!Number.isFinite(n) || n < 1) {
      throw new Error("La duración debe ser de al menos 1 segundo");
    }
  }
  storyLinkFields(data);
  return true;
}
