import { profileContentSchema } from "@bewerbungswebsite/contracts";

export const profileContent = profileContentSchema.parse({
  meta: {
    schemaVersion: "1.0",
    language: "de",
    editorialStatus: "phase-1-draft",
    notice:
      "Phase-1-Arbeitsfassung: Die Inhalte sind vorsichtige Spezifikationskerne und noch keine produktive Evidence-Ebene.",
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
  perspectives: [
    {
      id: "technik",
      title: "Technik verstehen",
      description:
        "Ausbildung, Maschinenbau und praktische Erfahrung an der Schnittstelle von Anlage, Anwendung, Dokumentation und Kunde.",
    },
    {
      id: "aufbau",
      title: "Strukturen aufbauen",
      description:
        "Unternehmerische Erfahrung mit Projekten, Prozessen, Teams und Angeboten - häufig dort, wo zu Beginn noch nicht alles definiert ist.",
    },
    {
      id: "umsetzung",
      title: "Verantwortung übernehmen",
      description:
        "Operatives Arbeiten, Koordination und kontinuierliche Verbesserung statt reiner Konzeptarbeit.",
    },
  ],
  competencies: [
    {
      id: "technik-analyse",
      title: "Technik und Analyse",
      description:
        "Maschinenbau, technische Fragestellungen, Dokumentation, strukturierte Bearbeitung und Abstimmung zwischen Technik und Anwendung.",
      classification: "to-be-evidenced",
    },
    {
      id: "projekt-prozessaufbau",
      title: "Projekt- und Prozessaufbau",
      description:
        "Aufgaben strukturieren, Verantwortlichkeiten klären, Abläufe etablieren und Verbesserungen praktisch umsetzen.",
      classification: "transferable-core",
    },
    {
      id: "team-schnittstellenarbeit",
      title: "Team- und Schnittstellenarbeit",
      description:
        "Zusammenarbeit mit technischen Teams, Entwicklern, Kunden und weiteren Beteiligten.",
      classification: "transferable-core",
    },
    {
      id: "unternehmerisches-handeln",
      title: "Unternehmerisches Handeln",
      description:
        "Ideen prüfen, Angebote entwickeln, Ressourcen koordinieren und Verantwortung für Ergebnisse übernehmen.",
      classification: "transferable-core",
    },
    {
      id: "digitalisierung-ki",
      title: "Digitalisierung und KI-Anwendung",
      description:
        "Aufbau digitaler Produkte und Workflows, unter anderem mit KI und Automatisierung.",
      classification: "to-be-evidenced",
    },
  ],
  projectKernels: [
    {
      id: "videospielunternehmen",
      name: "Videospielunternehmen",
      category: "Projekt- und Teamaufbau",
      note: "Details werden erst mit freigegebenen Belegen ergänzt.",
    },
    {
      id: "foodbox",
      name: "Foodbox-Konzept",
      category: "Geschäftsmodell und operative Abläufe",
      note: "Details bleiben bis zur redaktionellen Freigabe zurückgestellt.",
    },
    {
      id: "escape-room",
      name: "Escape-Room-Konzept",
      category: "Konzeptaufbau und Betrieb",
      note: "Details bleiben bis zur redaktionellen Freigabe zurückgestellt.",
    },
    {
      id: "fitnessstudio-clubmanagement",
      name: "Fitnessstudio/Clubmanagement",
      category: "Operative Verantwortung",
      note: "Rolle und Zeitraum werden nicht rekonstruiert.",
    },
    {
      id: "motai",
      name: "MotAI",
      category: "KI- und Digitalisierungsprojekt",
      note: "Wird in Phase 1 genannt, aber nicht verlinkt.",
    },
  ],
  careerOverview: {
    eyebrow: "Werdegang",
    title: "Chronologie folgt erst nach geprüfter Freigabe",
    intro:
      "Die spätere Werdegangsseite soll Stationen, Rollen, Aufgaben und Belege sauber verbinden. In dieser Phase werden noch keine Zeiträume, Arbeitgeber oder Rollenbezeichnungen rekonstruiert.",
    releaseNote:
      "Sobald ein geprüfter Lebenslauf und freigegebene Belege vorliegen, wird daraus ein ruhiger Zeitstrahl mit klaren Freigabestufen aufgebaut.",
    status: "awaiting-verified-timeline",
    visibleFields: [
      "technische Grundlagen und Maschinenbau-Bezug",
      "strukturierte Projektbearbeitung und Dokumentation",
      "Kundenabstimmung, Teamarbeit und operative Verantwortung",
      "unternehmerischer Aufbau und Digitalisierung",
    ],
    withheldFields: [
      "Zeiträume",
      "Arbeitgebernamen",
      "offizielle Rollenbezeichnungen",
      "Zertifikatsdetails",
      "Kennzahlen und Projektergebnisse",
    ],
  },
  projectsOverview: {
    eyebrow: "Projekte",
    title: "Projektkerne ohne ungeprüfte Fallstudien",
    intro:
      "Die Projektseite zeigt nur die freigegebenen Kernnamen und vorsichtige Kategorien. Fallstudien, Rollen, Ergebnisse und Belege werden später redaktionell ergänzt.",
    releaseNote:
      "Jede spätere Projektfallstudie braucht eine klare Trennung aus Ausgangslage, Rolle, Vorgehen, Ergebnis, Beleglage und Übertragbarkeit.",
    status: "kernel-only",
  },
  contactOverview: {
    eyebrow: "Kontakt",
    title: "Kontaktmöglichkeit folgt nach Freigabe",
    intro:
      "Wenn das Profil zu einer Aufgabe passen könnte, soll die spätere Kontaktseite einen bewussten und datensparsamen Austausch ermöglichen. In dieser Phase werden noch keine persönlichen Kontaktangaben veröffentlicht.",
    releaseNote:
      "Ein sendefähiges Formular, Kontaktwege und Einwilligungstexte folgen erst, wenn Betreiberangaben, Datenschutz und Aufbewahrung final geklärt sind.",
    status: "withheld-until-release",
    visibleOptions: [
      "Hinweis auf spätere Kontaktaufnahme",
      "Einordnung, welche Angaben vor Veröffentlichung noch fehlen",
      "klare Trennung zwischen Profilbasis und produktiver Kontaktfunktion",
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
