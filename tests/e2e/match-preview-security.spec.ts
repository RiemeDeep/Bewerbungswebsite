import { expect, test } from "@playwright/test";

test("tokenized match previews keep privacy and indexing headers on not found", async ({
  request,
}) => {
  const response = await request.get("/match/preview/invalid-token");

  expect(response.status()).toBe(404);
  expect(response.headers()["referrer-policy"]).toBe("no-referrer");
  expect(response.headers()["x-robots-tag"]).toBe("noindex,nofollow");
});

test("disabled internal profile previews stay unavailable with privacy headers", async ({
  request,
}) => {
  const response = await request.get("/internal/profilvorschau");

  expect(response.status()).toBe(404);
  expect(response.headers()["cache-control"]).toBe("private, no-store, max-age=0");
  expect(response.headers()["referrer-policy"]).toBe("no-referrer");
  expect(response.headers()["x-robots-tag"]).toBe("noindex,nofollow");
});
