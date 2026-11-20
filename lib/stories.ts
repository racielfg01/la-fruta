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
