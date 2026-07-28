import { expect, test } from "@playwright/test";

test.skip(
  process.env.ENABLE_SYNTHETIC_ASSISTANT_TEST !== "1" ||
    process.env.SYNTHETIC_ASSISTANT_MODE !== "orchestrator" ||
    !process.env.ORCHESTRATOR_BASE_URL,
  "Synthetic assistant E2E requires opt-in flags and a running local orchestrator.",
);

test("synthetic profile assistant reaches the local orchestrator path", async ({ page }) => {
  await page.goto("/test/profilassistent");

  await page
    .getByRole("textbox", { name: "Synthetische Frage" })
    .fill("Welche Erfahrung gibt es mit technischen Wartungsprozessen?");
  await page.getByRole("button", { name: "Synthetisch testen" }).click();

  await expect(page.getByLabel("Validierte synthetische Antwort")).toContainText("direct");
  await expect(page.getByText("Synthetischer Arbeitsnachweis")).toBeVisible();
  await expect(
    page.getByText("Diese Seite verwendet ausschliesslich synthetische Testdaten."),
  ).toBeVisible();
});
