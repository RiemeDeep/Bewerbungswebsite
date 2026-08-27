import AxeBuilder from "@axe-core/playwright";
import { expect, request as playwrightRequest, test, type Page } from "@playwright/test";

test.skip(
  process.env.SYNTHETIC_MATCH_FLOW_E2E !== "1",
  "Enable only for the local synthetic match browser gate.",
);

async function expectNoSeriousAccessibilityViolations(page: Page) {
  const results = await new AxeBuilder({ page }).analyze();
  expect(
    results.violations.filter(({ impact }) => impact === "critical" || impact === "serious"),
  ).toEqual([]);
}

test("synthetic match page and APIs reject invalid credentials", async () => {
  const unauthorized = await playwrightRequest.newContext({
    baseURL: "http://127.0.0.1:3000",
    httpCredentials: { username: "invalid", password: "invalid" },
  });
  try {
    for (const path of [
      "/test/match",
      "/api/test/job-context-preview",
      "/api/test/match-analysis",
      "/api/test/match-assistant",
    ]) {
      const response =
        path === "/test/match" ? await unauthorized.get(path) : await unauthorized.post(path);
      expect(response.status(), path).toBe(401);
      expect(response.headers()["cache-control"]).toBe("private, no-store, max-age=0");
      expect(response.headers()["referrer-policy"]).toBe("no-referrer");
      expect(response.headers()["x-robots-tag"]).toBe("noindex,nofollow");
    }
  } finally {
    await unauthorized.dispose();
  }
});

test("URL and fallback text reach correction, analysis and assistant", async ({ page }) => {
  const response = await page.goto("/test/match");
  expect(response?.status()).toBe(200);
  expect(response?.headers()["cache-control"]).toBe("private, no-store, max-age=0");
  expect(response?.headers()["referrer-policy"]).toBe("no-referrer");
  expect(response?.headers()["x-robots-tag"]).toBe("noindex,nofollow");

  await page.locator("#job-url").fill("https://example.com/jobs/m7-browser-test");
  await page
    .locator("#pasted-text")
    .fill("Synthetischer Stellentext fuer technische Koordination und Dokumentation.");
  await page.getByRole("button", { name: "Vorschau pruefen" }).click();

  const preview = page.getByLabel("Validierte synthetische Match-Vorschau");
  await expect(preview).toBeVisible();
  await page.locator("#preview-job-title").fill("Korrigierte technische Projektleitung");
  await page
    .locator("#preview-must-requirements")
    .fill("Strukturierte technische Projektarbeit\nNachvollziehbare Dokumentation");
  await page.getByRole("button", { name: "Stellenkontext bestaetigen" }).click();

  const result = page.getByLabel("Synthetisches Match-Ergebnis");
  await expect(result).toBeVisible();
  await expect(result).toContainText("Nachvollziehbare Dokumentation");
  const resultLink = page.getByRole("link", {
    name: "Gespeicherte Analyse im geschuetzten Testpfad oeffnen",
  });
  await expect(resultLink).toHaveAttribute("href", /^\/match\/preview\/[A-Za-z0-9_-]{43}$/u);

  await page
    .getByLabel("Frage zur bestaetigten Match-Analyse")
    .fill("Wie passt die technische Dokumentation?");
  await page.getByRole("button", { name: "Match-Assistent fragen" }).click();
  await expect(page.getByLabel("Synthetische Match-Assistentenantwort")).toContainText(
    "technische Anforderung",
  );

  await page.getByLabel("Frage zur bestaetigten Match-Analyse").focus();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Match-Assistent fragen" })).toBeFocused();
  await expectNoSeriousAccessibilityViolations(page);
});

test("pasted-text-only flow remains usable at 375 pixels", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/test/match");
  await page.locator("#job-url").fill("");
  await page.locator("#company-url").fill("");
  await page
    .locator("#pasted-text")
    .fill("Synthetische mobile Stellenbeschreibung fuer technische Projektarbeit.");
  await page.locator("#job-title").fill("Mobile Testrolle");
  await page.getByRole("button", { name: "Vorschau pruefen" }).click();

  await expect(page.getByLabel("Validierte synthetische Match-Vorschau")).toBeVisible();
  await expect(page.getByLabel("Quellen der Vorschau")).toContainText(
    "https://example.invalid/pasted-job-context",
  );
  await page.locator("#preview-job-title").fill("Korrigierte mobile Testrolle");
  await page.getByRole("button", { name: "Stellenkontext bestaetigen" }).click();
  await expect(page.getByLabel("Synthetisches Match-Ergebnis")).toBeVisible();

  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(hasHorizontalOverflow).toBe(false);
  await expectNoSeriousAccessibilityViolations(page);
});
