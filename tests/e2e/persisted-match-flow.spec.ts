import { expect, request as playwrightRequest, test } from "@playwright/test";

test.skip(
  process.env.PERSISTED_MATCH_FLOW_E2E !== "1",
  "Enable only for the local persisted match browser gate.",
);

const jobContext = {
  company: {
    name: "Beispiel GmbH",
    description: "Ausschliesslich synthetischer Unternehmenskontext.",
    industrySignals: [],
    sizeSignals: [],
    valuesSignals: [],
  },
  job: {
    title: "Technische Projektkoordination",
    location: "Remote / Deutschland",
    workModel: "hybrid",
    employmentType: "Vollzeit",
    responsibilities: ["Projektstatus dokumentieren"],
    mustRequirements: ["Technische Anforderungen klaeren"],
    shouldRequirements: ["Kommunikation mit Stakeholdern"],
    benefits: [],
  },
  ambiguities: [],
  sourceSections: [
    {
      label: "Synthetischer Rohtext",
      excerpt: "Dieser Testauszug darf nicht in der Datenbank gespeichert werden.",
      sourceUrl: null,
    },
  ],
  sources: [
    {
      url: "https://example.com/jobs/persisted-browser-test",
      retrievedAt: "2026-08-27T12:00:00.000Z",
      title: "Synthetische Stelle",
    },
  ],
};

test("stored analysis can be opened and physically deleted in the browser", async ({ page }) => {
  const orchestrator = await playwrightRequest.newContext({
    baseURL: "http://127.0.0.1:4000",
  });
  let accessToken: string | undefined;

  try {
    const creationResponse = await orchestrator.post("/api/v1/match/analyses", {
      data: jobContext,
    });
    expect(creationResponse.status()).toBe(201);
    const creation = (await creationResponse.json()) as {
      access: { accessToken: string };
    };
    accessToken = creation.access.accessToken;

    const previewResponse = await page.goto(`/match/preview/${accessToken}`);
    expect(previewResponse?.status()).toBe(200);
    expect(previewResponse?.headers()["cache-control"]).toBe("private, no-store, max-age=0");
    expect(previewResponse?.headers()["referrer-policy"]).toBe("no-referrer");
    expect(previewResponse?.headers()["x-robots-tag"]).toBe("noindex,nofollow");
    await expect(
      page.getByRole("heading", {
        name: "Synthetische Match-Vorschau mit belegten und offenen Anforderungen",
      }),
    ).toBeVisible();
    await expect(page.getByText("Technische Projektkoordination", { exact: true })).toBeVisible();
    await expect(page.getByText("Dieser Testauszug darf nicht")).toHaveCount(0);

    await page.getByText("Analyse löschen", { exact: true }).click();
    await expect(page.getByText(/nicht rückgängig gemacht/u)).toBeVisible();
    await page.getByRole("button", { name: "Analyse endgültig löschen" }).click();
    await expect(page).toHaveURL(/\/match\?analysisDeleted=1$/u);
    await expect(page.getByRole("status")).toContainText(
      "Die Analyse wurde aus der aktiven Datenbank gelöscht",
    );

    expect((await orchestrator.get(`/api/v1/match/analyses/${accessToken}`)).status()).toBe(404);
    const deletedPreviewResponse = await page.goto(`/match/preview/${accessToken}`);
    expect(deletedPreviewResponse?.status()).toBe(404);
    expect(deletedPreviewResponse?.headers()["cache-control"]).toBe("private, no-store, max-age=0");
  } finally {
    if (accessToken) {
      await orchestrator.delete(`/api/v1/match/analyses/${accessToken}`);
    }
    await orchestrator.dispose();
  }
});
