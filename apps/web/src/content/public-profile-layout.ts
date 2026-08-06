type ClaimReference = string;

export const publicProfileLayout = {
  perspectives: [
    {
      id: "technik",
      title: "Technik verstehen",
      claimId: "32000000-0000-4000-8000-000000200007",
    },
    {
      id: "aufbau",
      title: "Strukturen aufbauen",
      claimId: "32000000-0000-4000-8000-000000200016",
    },
    {
      id: "umsetzung",
      title: "Verantwortung übernehmen",
      claimId: "32000000-0000-4000-8000-000000200026",
    },
  ],
  competencies: [
    {
      id: "technik-analyse",
      title: "Technik und Analyse",
      claimId: "32000000-0000-4000-8000-000000200007",
    },
    {
      id: "projekt-prozessaufbau",
      title: "Projekt- und Prozessaufbau",
      claimId: "21000000-0000-4000-8000-000000000203",
    },
    {
      id: "team-schnittstellenarbeit",
      title: "Team- und Schnittstellenarbeit",
      claimId: "21000000-0000-4000-8000-000000000205",
    },
    {
      id: "unternehmerisches-handeln",
      title: "Unternehmerisches Handeln",
      claimId: "32000000-0000-4000-8000-000000200015",
    },
    {
      id: "digitalisierung-ki",
      title: "Digitalisierung und KI-Anwendung",
      claimId: "32000000-0000-4000-8000-000000200029",
    },
  ],
  projectKernels: [
    {
      id: "videospielunternehmen",
      entityId: "21000000-0000-4000-8000-000000000001",
      category: "Projekt- und Teamaufbau",
      claimId: "21000000-0000-4000-8000-000000000206",
    },
    {
      id: "foodbox",
      entityId: "32000000-0000-4000-8000-000000000010",
      category: "Geschäftsmodell und operative Abläufe",
      claimId: "32000000-0000-4000-8000-000000200019",
    },
    {
      id: "escape-room",
      entityId: "32000000-0000-4000-8000-000000000009",
      category: "Konzeptaufbau und Betrieb",
      claimId: "32000000-0000-4000-8000-000000200018",
    },
    {
      id: "fitnessstudio-clubmanagement",
      entityId: "32000000-0000-4000-8000-000000000011",
      category: "Operative Verantwortung",
      claimId: "32000000-0000-4000-8000-000000200024",
    },
    {
      id: "motai",
      entityId: "32000000-0000-4000-8000-000000000012",
      category: "KI- und Digitalisierungsprojekt",
      claimId: "32000000-0000-4000-8000-000000200027",
    },
  ],
  careerItems: [
    {
      id: "ausbildung-maschinenbau",
      title: "Technischer Einstieg und Maschinenbau",
      periodMode: "range",
      periodClaimIds: [
        "32000000-0000-4000-8000-000000200001",
        "32000000-0000-4000-8000-000000200003",
      ],
      roleClaimId: "32000000-0000-4000-8000-000000200003",
      summaryClaimId: "32000000-0000-4000-8000-000000200001",
      highlightClaimIds: [
        "32000000-0000-4000-8000-000000200002",
        "32000000-0000-4000-8000-000000200004",
        "32000000-0000-4000-8000-000000200005",
      ],
    },
    {
      id: "rrc-power-solutions",
      title: "Engineering und technische Dokumentation",
      periodMode: "range",
      periodClaimIds: ["32000000-0000-4000-8000-000000200006"],
      roleClaimId: "32000000-0000-4000-8000-000000200006",
      summaryClaimId: "32000000-0000-4000-8000-000000200007",
      highlightClaimIds: [
        "32000000-0000-4000-8000-000000200008",
        "32000000-0000-4000-8000-000000200049",
      ],
    },
    {
      id: "loomis-products",
      title: "Service, Installation und technisches Zeichnen",
      periodMode: "from",
      periodClaimIds: ["32000000-0000-4000-8000-000000200009"],
      roleClaimId: "32000000-0000-4000-8000-000000200009",
      summaryClaimId: "32000000-0000-4000-8000-000000200010",
      highlightClaimIds: [],
    },
    {
      id: "sales-team-management",
      title: "Sales, Kundenkommunikation und Teamfuehrung",
      periodMode: "range",
      periodClaimIds: ["32000000-0000-4000-8000-000000200011"],
      roleClaimId: "32000000-0000-4000-8000-000000200011",
      summaryClaimId: "32000000-0000-4000-8000-000000200012",
      highlightClaimIds: [],
    },
    {
      id: "fun-forest",
      title: "Operative Leitung im Abenteuerpark",
      periodMode: "range",
      periodClaimIds: ["32000000-0000-4000-8000-000000200013"],
      roleClaimId: "32000000-0000-4000-8000-000000200013",
      summaryClaimId: "32000000-0000-4000-8000-000000200014",
      highlightClaimIds: [],
    },
    {
      id: "exit-adventures",
      entityId: "32000000-0000-4000-8000-000000000009",
      periodMode: "range",
      periodClaimIds: [
        "32000000-0000-4000-8000-000000200015",
        "32000000-0000-4000-8000-000000200018",
      ],
      roleClaimId: "32000000-0000-4000-8000-000000200015",
      summaryClaimId: "32000000-0000-4000-8000-000000200016",
      highlightClaimIds: [
        "32000000-0000-4000-8000-000000200017",
        "32000000-0000-4000-8000-000000200018",
      ],
    },
    {
      id: "tiny-state-games",
      entityId: "21000000-0000-4000-8000-000000000001",
      periodMode: "until",
      periodClaimIds: ["21000000-0000-4000-8000-000000000213"],
      roleClaimId: "21000000-0000-4000-8000-000000000201",
      summaryClaimId: "21000000-0000-4000-8000-000000000202",
      highlightClaimIds: [
        "21000000-0000-4000-8000-000000000203",
        "21000000-0000-4000-8000-000000000204",
        "21000000-0000-4000-8000-000000000206",
        "21000000-0000-4000-8000-000000000212",
      ],
    },
    {
      id: "legga-food",
      entityId: "32000000-0000-4000-8000-000000000010",
      periodMode: "range",
      periodClaimIds: ["32000000-0000-4000-8000-000000200019"],
      roleClaimId: "32000000-0000-4000-8000-000000200019",
      summaryClaimId: "32000000-0000-4000-8000-000000200020",
      highlightClaimIds: [
        "32000000-0000-4000-8000-000000200021",
        "32000000-0000-4000-8000-000000200022",
        "32000000-0000-4000-8000-000000200023",
        "32000000-0000-4000-8000-000000200050",
      ],
    },
    {
      id: "fitness-first",
      entityId: "32000000-0000-4000-8000-000000000011",
      periodMode: "range",
      periodClaimIds: ["32000000-0000-4000-8000-000000200024"],
      roleClaimId: "32000000-0000-4000-8000-000000200024",
      summaryClaimId: "32000000-0000-4000-8000-000000200025",
      highlightClaimIds: [
        "32000000-0000-4000-8000-000000200026",
        "32000000-0000-4000-8000-000000200051",
      ],
    },
    {
      id: "motai",
      entityId: "32000000-0000-4000-8000-000000000012",
      periodMode: "since",
      periodClaimIds: ["32000000-0000-4000-8000-000000200052"],
      roleClaimId: "32000000-0000-4000-8000-000000200052",
      summaryClaimId: "32000000-0000-4000-8000-000000200027",
      highlightClaimIds: [
        "32000000-0000-4000-8000-000000200028",
        "32000000-0000-4000-8000-000000200029",
        "32000000-0000-4000-8000-000000200030",
        "32000000-0000-4000-8000-000000200031",
      ],
    },
  ],
  credentialGroups: [
    {
      id: "fitness-gesundheit",
      title: "Fitness, Gesundheit und Training",
      summary: "Historische Abschlüsse und Trainerqualifikationen ohne Wirkungsversprechen.",
      claimIds: [
        "32000000-0000-4000-8000-000000200032",
        "32000000-0000-4000-8000-000000200033",
        "32000000-0000-4000-8000-000000200034",
        "32000000-0000-4000-8000-000000200035",
        "32000000-0000-4000-8000-000000200036",
        "32000000-0000-4000-8000-000000200037",
        "32000000-0000-4000-8000-000000200038",
        "32000000-0000-4000-8000-000000200039",
        "32000000-0000-4000-8000-000000200040",
        "32000000-0000-4000-8000-000000200041",
      ],
    },
    {
      id: "qualitaet-projekt",
      title: "Qualitaet und Projektmanagement",
      summary: "Historische Abschlüsse ohne Behauptung einer heutigen Zertifikatsgültigkeit.",
      claimIds: [
        "32000000-0000-4000-8000-000000200042",
        "32000000-0000-4000-8000-000000200043",
        "32000000-0000-4000-8000-000000200044",
        "32000000-0000-4000-8000-000000200045",
      ],
    },
    {
      id: "digital-change",
      title: "Digitalisierung und Change",
      summary: "Dokumentierte Weiterbildungen zu Digitalisierung und Veränderungsprozessen.",
      claimIds: [
        "32000000-0000-4000-8000-000000200046",
        "32000000-0000-4000-8000-000000200047",
        "32000000-0000-4000-8000-000000200048",
      ],
    },
  ],
} as const satisfies {
  perspectives: ReadonlyArray<{
    id: string;
    title: string;
    claimId: ClaimReference;
  }>;
  competencies: ReadonlyArray<{
    id: string;
    title: string;
    claimId: ClaimReference;
  }>;
  projectKernels: ReadonlyArray<{
    id: string;
    entityId: string;
    category: string;
    claimId: ClaimReference;
  }>;
  careerItems: ReadonlyArray<{
    id: string;
    title?: string;
    entityId?: string;
    periodMode: "range" | "since" | "from" | "until";
    periodClaimIds: ReadonlyArray<ClaimReference>;
    roleClaimId: ClaimReference;
    summaryClaimId: ClaimReference;
    highlightClaimIds: ReadonlyArray<ClaimReference>;
  }>;
  credentialGroups: ReadonlyArray<{
    id: string;
    title: string;
    summary: string;
    claimIds: ReadonlyArray<ClaimReference>;
  }>;
};
