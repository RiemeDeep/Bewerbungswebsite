import {
  profileContentSchema,
  publicProfileArtifactSchema,
  type ProfileContent,
  type PublicProfileArtifact,
  type PublicProfileArtifactClaim,
} from "@bewerbungswebsite/contracts";

import publicProfileArtifactJson from "./generated/public-profile.json";
import { publicProfileLayout } from "./public-profile-layout";

export const publicProfileArtifact = publicProfileArtifactSchema.parse(publicProfileArtifactJson);

export function getPublicProfileLayoutClaimIds(): string[] {
  return [
    ...publicProfileLayout.perspectives.map((item) => item.claimId),
    ...publicProfileLayout.competencies.map((item) => item.claimId),
    ...publicProfileLayout.projectKernels.map((item) => item.claimId),
    ...publicProfileLayout.careerItems.flatMap((item) => [
      ...item.periodClaimIds,
      item.roleClaimId,
      item.summaryClaimId,
      ...item.highlightClaimIds,
    ]),
    ...publicProfileLayout.credentialGroups.flatMap((group) => group.claimIds),
  ];
}

function getClassification(claim: PublicProfileArtifactClaim): "direct-core" | "transferable-core" {
  return claim.evidence.some((item) => item.evidenceBasis === "direct_document")
    ? "direct-core"
    : "transferable-core";
}

export function assemblePublicProfileContent(input: unknown): ProfileContent {
  const artifact: PublicProfileArtifact = publicProfileArtifactSchema.parse(input);
  const claimsById = new Map(artifact.claims.map((claim) => [claim.claimId, claim]));
  const entitiesById = new Map(artifact.entities.map((entity) => [entity.entityId, entity]));

  const accountedFor = new Set(getPublicProfileLayoutClaimIds());
  if (artifact.claims.some((claim) => !accountedFor.has(claim.claimId))) {
    throw new Error("Public profile artifact contains a claim without a layout decision.");
  }

  function getPeriod(
    claimIds: readonly string[],
    mode: "range" | "since" | "from" | "until",
  ): string | null {
    const dates = claimIds.flatMap((claimId) => {
      const claim = claimsById.get(claimId);
      return claim
        ? [claim.validFrom, claim.validTo].filter((date): date is string => Boolean(date))
        : [];
    });
    if (dates.length === 0) return null;

    const years = dates.map((date) => date.slice(0, 4)).sort();
    const firstYear = years[0];
    const lastYear = years.at(-1);
    if (!firstYear || !lastYear) return null;

    if (mode === "since") return `seit ${firstYear}`;
    if (mode === "from") return `ab ${firstYear}`;
    if (mode === "until") return `bis ${lastYear}`;
    return firstYear === lastYear ? firstYear : `${firstYear} - ${lastYear}`;
  }

  function getEvidenceNote(claimIds: readonly string[]): string {
    const labels = [
      ...new Set(
        claimIds.flatMap(
          (claimId) => claimsById.get(claimId)?.evidence.map((item) => item.publicLabel) ?? [],
        ),
      ),
    ];
    return `Belegbasis: ${labels.join("; ")}.`;
  }

  return profileContentSchema.parse({
    meta: {
      schemaVersion: "1.0",
      language: "de",
      editorialStatus: "approved-public-draft",
      notice:
        "Freigegebene oeffentliche Arbeitsfassung aus dem kontrollierten Public-Profile-Artefakt.",
    },
    assistantEntry: {
      eyebrow: "Interaktives Kandidatenprofil",
      headline:
        "Finden Sie heraus, ob Michael zu Ihrem Unternehmen und Ihrer aktuellen Herausforderung passt.",
      intro:
        "Stellen Sie eine konkrete oder kritische Frage. Der Profilassistent soll Antworten später ausschließlich aus freigegebenen Informationen ableiten und fehlende Evidenz sichtbar benennen.",
      inputLabel: "Welche Frage möchten Sie klären?",
      inputPlaceholder: "Zum Beispiel: Wo könnte Michael bei uns nicht passen?",
      submitLabel: "Frage vorbereiten",
      status: "interface-preview",
      statusMessage:
        "Interaktionsvorschau: Ihre Eingabe wird aktuell nicht gespeichert oder an eine KI gesendet.",
      suggestedQuestions: [
        "Warum sollten wir Michael nicht einstellen?",
        "Wo könnte Michael bei uns scheitern?",
        "Welche technische Erfahrung ist wirklich belegt?",
        "Welche Rolle könnte zu Michaels Profil passen?",
      ],
      trustSignals: [
        "Belege statt Behauptungen",
        "Grenzen ausdrücklich sichtbar",
        "Keine erfundenen Profilangaben",
      ],
    },
    perspectives: publicProfileLayout.perspectives.flatMap((item) => {
      const claim = claimsById.get(item.claimId);
      return claim ? [{ id: item.id, title: item.title, description: claim.statement }] : [];
    }),
    competencies: publicProfileLayout.competencies.flatMap((item) => {
      const claim = claimsById.get(item.claimId);
      return claim
        ? [
            {
              id: item.id,
              title: item.title,
              description: claim.statement,
              classification: getClassification(claim),
            },
          ]
        : [];
    }),
    projectKernels: publicProfileLayout.projectKernels.flatMap((item) => {
      const claim = claimsById.get(item.claimId);
      const entity = entitiesById.get(item.entityId);
      return claim && entity
        ? [
            {
              id: item.id,
              name: entity.canonicalName,
              category: item.category,
              note: claim.statement,
            },
          ]
        : [];
    }),
    careerOverview: {
      eyebrow: "Werdegang",
      title: "Freigegebene Stationen mit bewussten Grenzen",
      intro:
        "Die folgenden Stationen werden aus freigegebenen Claims und oeffentlichen Belegauszuegen zusammengesetzt.",
      releaseNote:
        "Zahlen und Ergebnisse erscheinen nur, wenn sie im Public-Profile-Artefakt freigegeben sind.",
      status: "released-timeline",
      visibleFields: [
        "freigegebene Rollen, Zeitraeume und Aufgaben",
        "freigegebene Projekt- und Qualifikationsclaims",
        "oeffentliche Beleglabels und Belegauszuege",
      ],
      withheldFields: [
        "private Namen von Mitarbeitenden, Teammitgliedern und Ansprechpartnern",
        "Bankverbindungen, Steuerdaten, Telefonnummern und vollstaendige Partnerlisten",
        "exakter Exit-Adventures-Kaufpreis",
        "Noten und interne Zeugnisformulierungen",
        "Heil-, Therapie- oder Erfolgversprechen im Fitness-/Coachingkontext",
      ],
    },
    careerItems: publicProfileLayout.careerItems.flatMap((item) => {
      const role = claimsById.get(item.roleClaimId);
      const summary = claimsById.get(item.summaryClaimId);
      const period = getPeriod(item.periodClaimIds, item.periodMode);
      const title =
        "entityId" in item ? entitiesById.get(item.entityId)?.canonicalName : item.title;
      if (!role || !summary || !period || !title) return [];

      const highlights = item.highlightClaimIds.flatMap((claimId) => {
        const claim = claimsById.get(claimId);
        return claim ? [claim.statement] : [];
      });
      const contentClaimIds = [item.roleClaimId, item.summaryClaimId, ...item.highlightClaimIds];
      return [
        {
          id: item.id,
          period,
          title,
          role: role.statement,
          summary: summary.statement,
          highlights,
          evidenceNote: getEvidenceNote(contentClaimIds),
        },
      ];
    }),
    credentialGroups: publicProfileLayout.credentialGroups.flatMap((group) => {
      const credentials = group.claimIds.flatMap((claimId) => {
        const claim = claimsById.get(claimId);
        return claim ? [claim.statement] : [];
      });
      return credentials.length > 0
        ? [{ id: group.id, title: group.title, summary: group.summary, credentials }]
        : [];
    }),
    projectsOverview: {
      eyebrow: "Projekte",
      title: "Freigegebene Projektkerne ohne sensible Rohdaten",
      intro:
        "Die Projektseite verwendet ausschliesslich freigegebene Aussagen aus dem Public-Profile-Artefakt.",
      releaseNote:
        "Private Namen, steuerliche Details, exakte Kaufpreise und interne Unterlagen bleiben ausgeblendet.",
      status: "released-project-summaries",
    },
    contactOverview: {
      eyebrow: "Kontakt",
      title: "Kontaktmöglichkeit folgt nach Freigabe",
      intro:
        "Die spätere Kontaktseite soll einen bewussten und datensparsamen Austausch ermöglichen. Aktuell werden keine persönlichen Kontaktangaben veröffentlicht.",
      releaseNote:
        "Ein sendefähiges Formular, Kontaktwege und Einwilligungstexte folgen erst nach finaler Klärung von Betreiberangaben, Datenschutz und Aufbewahrung.",
      status: "withheld-until-release",
      visibleOptions: [
        "Hinweis auf spätere Kontaktaufnahme",
        "Einordnung der noch offenen Freigaben",
        "Trennung zwischen Profilbasis und produktiver Kontaktfunktion",
      ],
      withheldOptions: [
        "E-Mail-Adresse",
        "Telefonnummer",
        "Postanschrift",
        "sendefähiges Kontaktformular",
        "Lebenslauf-Download",
      ],
    },
    placeholders: {
      legalStatus: "not-production-ready",
      contactStatus: "withheld-until-release",
      message:
        "Finale Betreiber-, Datenschutz- und Kontaktangaben werden erst nach ausdrücklicher Freigabe veröffentlicht.",
    },
  });
}

export const profileContent = assemblePublicProfileContent(publicProfileArtifact);
