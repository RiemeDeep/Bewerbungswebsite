import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const routes = [
  "/",
  "/profil",
  "/werdegang",
  "/projekte",
  "/kontakt",
  "/impressum",
  "/datenschutz",
] as const;

for (const route of routes) {
  test(`${route} has no critical accessibility violations`, async ({ page }) => {
    await page.goto(route);

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    const criticalViolations = results.violations.filter(
      (violation) => violation.impact === "critical",
    );

    expect(criticalViolations).toEqual([]);
  });
}

test("skip link and reduced keyboard navigation reach the central interactions", async ({
  page,
}) => {
  await page.goto("/");

  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Zum Hauptinhalt springen" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#main-content")).toBeFocused();

  await page.goto("/");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Frage stellen", exact: true })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/#profilassistent$/u);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Finden Sie heraus");

  await page.getByRole("link", { name: "Passung prüfen" }).click();
  await expect(page).toHaveURL(/\/#passung$/u);
  await expect(page.getByRole("heading", { level: 2, name: /konkrete Analyse/i })).toBeVisible();
});

test("profile detail routes remain reachable from the footer", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("link", { name: "Werdegang" }).first().click();
  await expect(page).toHaveURL(/\/werdegang$/u);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Freigegebene Stationen");

  await page.getByRole("link", { name: "Projekte" }).first().click();
  await expect(page).toHaveURL(/\/projekte$/u);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Freigegebene Projektkerne");

  await page.getByRole("link", { name: "Kontakt" }).first().click();
  await expect(page).toHaveURL(/\/kontakt$/u);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Kontaktmöglichkeit folgt");
});

test("the central assistant interaction prepares a transparent response preview", async ({
  page,
}) => {
  await page.goto("/");

  await page
    .getByRole("textbox", { name: "Welche Frage möchten Sie klären?" })
    .fill("Welche Erfahrung ist für eine operative Rolle relevant?");
  await page.getByRole("button", { name: "Frage vorbereiten" }).click();

  await expect(page.getByText("Vorschau der späteren Antwortstruktur")).toBeVisible();
  await expect(page.getByText("Kein KI-Aufruf")).toBeVisible();
  await expect(page.getByText(/nicht gespeichert oder an eine KI gesendet/i)).toBeVisible();
});

test("contact route does not expose a live form or contact data", async ({ page }) => {
  await page.goto("/kontakt");

  await expect(page.locator("main form")).toHaveCount(0);
  await expect(page.locator("main button")).toHaveCount(0);
  await expect(page.getByText(/[\w.-]+@[\w.-]+\.[a-z]{2,}/iu)).toHaveCount(0);
  await expect(page.getByText(/\+\d{2,}/u)).toHaveCount(0);
});

test("public routes stay usable at release breakpoints", async ({ page }) => {
  for (const width of [375, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of routes) {
      await page.goto(route);

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
      );
      expect(overflow, `${route} overflows at ${width}px`).toBe(false);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

      if (route === "/") {
        await expect(
          page.getByRole("textbox", { name: "Welche Frage möchten Sie klären?" }),
        ).toBeVisible();
        await expect(
          page.getByRole("button", { name: "Warum sollten wir Michael nicht einstellen?" }),
        ).toBeVisible();
      }
    }
  }
});
