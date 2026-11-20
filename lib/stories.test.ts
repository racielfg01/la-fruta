import { describe, expect, test } from "vitest";
import {
  normalizeStoryDuration,
  storyCtaHref,
  storyLinkFields,
  toAdminStory,
  toPublicStory,
  validateStoryInput,
} from "./stories";

describe("stories domain", () => {
  test("normalizes duration to integer seconds >= 1 with default 5", () => {
    expect(normalizeStoryDuration(undefined)).toBe(5);
    expect(normalizeStoryDuration(0)).toBe(5);
    expect(normalizeStoryDuration(2.6)).toBe(2);
    expect(normalizeStoryDuration("7")).toBe(7);
  });

  test("maps admin record and resolves CTA href by link type", () => {
    const admin = toAdminStory({ id: "s1", name: "N", image: "/i.png", duration: 8, link_type: "product", product_id: "p1", offer_id: "", active: true, sort: 2 });
    expect(admin).toMatchObject({ id: "s1", duration: 8, linkType: "product", productId: "p1", offerId: "" });
    expect(storyCtaHref(admin)).toBe("/product/p1");
    expect(storyCtaHref({ ...admin, linkType: "offer", offerId: "o1" })).toBe("/ofertas");
    expect(storyCtaHref({ ...admin, linkType: "none" })).toBeNull();
  });

  test("toPublicStory exposes safe public fields", () => {
    const pub = toPublicStory({ id: "s1", name: "N", image: "/i.png", duration: 5, linkType: "none", productId: "", offerId: "", active: true, sort: 0 });
    expect(pub).toEqual({ id: "s1", name: "N", image: "/i.png", duration: 5, linkType: "none", productId: "", offerId: "", active: true, sort: 0 });
  });
});

describe("story validation", () => {
  test("validateStoryInput rejects empty name/image and duration < 1", () => {
    expect(() => validateStoryInput({ name: " ", image: "/x.png", duration: 5, linkType: "none" })).toThrow(/nombre/i);
    expect(() => validateStoryInput({ name: "Ok", image: "", duration: 5, linkType: "none" })).toThrow(/imagen/i);
    expect(() => validateStoryInput({ name: "Ok", image: "/x.png", duration: 0, linkType: "none" })).toThrow(/duraci/i);
    expect(() => validateStoryInput({ name: "Ok", image: "/x.png", duration: -1, linkType: "none" })).toThrow(/duraci/i);
  });

  test("storyLinkFields rejects missing destination by link type", () => {
    expect(() => storyLinkFields({ linkType: "product", productId: "" })).toThrow(/producto/i);
    expect(() => storyLinkFields({ linkType: "offer", offerId: "" })).toThrow(/oferta/i);
    expect(storyLinkFields({ linkType: "none" })).toEqual({ link_type: "none", product_id: "", offer_id: "" });
  });
});
