import { describe, expect, test } from "vitest";
import { normalizeStoryDuration, storyCtaHref, toAdminStory, toPublicStory } from "./stories";

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
