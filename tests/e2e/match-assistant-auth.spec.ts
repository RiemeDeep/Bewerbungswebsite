import { expect, test } from "@playwright/test";

test.skip(
  process.env.MATCH_ASSISTANT_AUTH_E2E !== "1",
  "Run with MATCH_ASSISTANT_AUTH_E2E=1 to start the protected staging composition.",
);

test("enabled internal match assistant enforces Basic Auth before the BFF", async ({ request }) => {
  const unauthorized = await request.post("/api/internal/match-assistant", { data: {} });

  expect(unauthorized.status()).toBe(401);
  expect(unauthorized.headers()["www-authenticate"]).toContain("Basic");
  expect(unauthorized.headers()["cache-control"]).toBe("private, no-store, max-age=0");

  const authorized = await request.post("/api/internal/match-assistant", {
    data: {},
    headers: {
      authorization: `Basic ${Buffer.from("match-e2e-user:match-e2e-password").toString("base64")}`,
    },
  });

  expect(authorized.status()).toBe(400);
  expect(authorized.headers()["cache-control"]).toBe("private, no-store, max-age=0");
  expect(authorized.headers()["x-robots-tag"]).toBe("noindex,nofollow");
});
