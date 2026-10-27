import { describe, expect, it } from "vitest";
import { isExpiredPushError, normalizePushSubscription } from "./subscriptions";

const valid = {
  endpoint: "https://fcm.googleapis.com/fcm/send/abc123",
  keys: { p256dh: "BPublicKey123", auth: "secret123" },
};

describe("normalizePushSubscription", () => {
  it("acepta una suscripción https con claves", () => {
    expect(normalizePushSubscription(valid)).toEqual({
      endpoint: valid.endpoint,
      keys: valid.keys,
      expirationTime: null,
    });
  });

  it("rechaza http y endpoints vacíos", () => {
    expect(normalizePushSubscription({ ...valid, endpoint: "http://x" })).toBeNull();
    expect(normalizePushSubscription({ ...valid, endpoint: "" })).toBeNull();
  });

  it("rechaza claves ausentes", () => {
    expect(normalizePushSubscription({ endpoint: valid.endpoint })).toBeNull();
    expect(
      normalizePushSubscription({ endpoint: valid.endpoint, keys: { p256dh: "", auth: "" } })
    ).toBeNull();
  });

  it("rechaza entradas que no son objeto", () => {
    expect(normalizePushSubscription(null)).toBeNull();
    expect(normalizePushSubscription("x")).toBeNull();
  });

  it("conserva expirationTime numérico", () => {
    expect(
      normalizePushSubscription({ ...valid, expirationTime: 123 })?.expirationTime
    ).toBe(123);
  });
});

describe("isExpiredPushError", () => {
  it("reconoce 404 y 410", () => {
    expect(isExpiredPushError({ statusCode: 404 })).toBe(true);
    expect(isExpiredPushError({ status: 410 })).toBe(true);
  });

  it("no descarta otros errores", () => {
    expect(isExpiredPushError({ statusCode: 500 })).toBe(false);
    expect(isExpiredPushError(new Error("network"))).toBe(false);
  });
});
