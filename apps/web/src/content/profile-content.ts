import { profileContentSchema } from "@bewerbungswebsite/contracts";

export const profileContent = profileContentSchema.parse({
  meta: {
    schemaVersion: "1.0",
    language: "de",
    editorialStatus: "approved-public-draft",
    notice:
      "Freigegebene oeffentliche Arbeitsfassung: sensible Details bleiben bewusst ausgeblendet.",
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
        "Industriemechaniker-Ausbildung, Maschinenbau-Studium und praktische Erfahrung an der Schnittstelle von Entwicklung, Dokumentation, Service und Kunde.",
    },
    {
      id: "aufbau",
      title: "Strukturen aufbauen",
      description:
        "Unternehmerische Erfahrung mit neuen Angeboten, Standorten, Teams, Prozessen und digitalen Produkten - auch unter unsicheren Rahmenbedingungen.",
    },
    {
      id: "umsetzung",
      title: "Verantwortung übernehmen",
      description:
        "Operative Verantwortung in Technik, Vertrieb, Freizeitbetrieb, Fitnessstudio und eigenen Projekten statt reiner Konzeptarbeit.",
    },
  ],
  competencies: [
    {
      id: "technik-analyse",
      title: "Technik und Analyse",
      description:
        "Maschinenbau, Produktentwicklung, technische Dokumentation, Service, Installation und Abstimmung zwischen Technik und Anwendung.",
      classification: "direct-core",
    },
    {
      id: "projekt-prozessaufbau",
      title: "Projekt- und Prozessaufbau",
      description:
        "Aufgaben strukturieren, Verantwortlichkeiten klaeren, Ablaeufe etablieren, Teams koordinieren und Verbesserungen praktisch umsetzen.",
      classification: "transferable-core",
    },
    {
      id: "team-schnittstellenarbeit",
      title: "Team- und Schnittstellenarbeit",
      description:
        "Zusammenarbeit mit technischen Teams, Entwicklern, Mitarbeitenden, Kunden, Partnern und weiteren Beteiligten.",
      classification: "transferable-core",
    },
    {
      id: "unternehmerisches-handeln",
      title: "Unternehmerisches Handeln",
      description:
        "Ideen pruefen, Angebote entwickeln, Standorte und Netzwerke aufbauen, Ressourcen koordinieren und Verantwortung fuer Ergebnisse uebernehmen.",
      classification: "transferable-core",
    },
    {
      id: "digitalisierung-ki",
      title: "Digitalisierung und KI-Anwendung",
      description:
        "Weiterbildungen zu Digitalisierung, digitale Geschaeftsmodelle und Change Management sowie ein eigenes KI-/Automatisierungsprojekt.",
      classification: "direct-core",
    },
  ],
  projectKernels: [
    {
      id: "videospielunternehmen",
      name: "Tiny State Games / BARTS",
      category: "Projekt- und Teamaufbau",
      note: "Gruendung und Geschaeftsfuehrung einer GmbH fuer ein geplantes Multiplayer-Spiel; Teamaufbau mit sieben weiteren freiwilligen Teammitgliedern, aber kein marktreifer Release.",
    },
    {
      id: "foodbox",
      name: "Legga Food",
      category: "Geschäftsmodell und operative Abläufe",
      note: "Kochbox-Vorhaben mit eigener Produktion, Abholstationen, Partnernetzwerk und ersten Umsaetzen; letztlich wegen zu langsamem Wachstum und stark steigenden Einkaufspreisen nicht fortgefuehrt.",
    },
    {
      id: "escape-room",
      name: "Exit Adventures",
      category: "Konzeptaufbau und Betrieb",
      note: "Live-Escape-Games-Unternehmen mit zwei Standorten, Teambuilding-Angeboten, Mitarbeitenden und Verkauf zu einem niedrigen sechsstelligen Betrag.",
    },
    {
      id: "fitnessstudio-clubmanagement",
      name: "Fitnessstudio/Clubmanagement",
      category: "Operative Verantwortung",
      note: "Club General Manager bei Fitness First Saarlouis mit Verantwortung fuer Team, Service, Vertrieb, Mitgliederbindung und taeglichen Clubbetrieb.",
    },
    {
      id: "motai",
      name: "MotAI",
      category: "KI- und Digitalisierungsprojekt",
      note: "KI-gestuetzter Alltagscoach ueber Messenger mit Website, MVP-Flow und erster Testphase; noch keine zahlenden Nutzer und Produktqualitaet noch nicht ausreichend.",
    },
  ],
  careerOverview: {
    eyebrow: "Werdegang",
    title: "Freigegebene Stationen mit bewussten Grenzen",
    intro:
      "Der Werdegang verbindet technische Ausbildung, Maschinenbau, Service, Vertrieb, Unternehmertum, Freizeit- und Fitnessbetrieb sowie Digitalisierung. Die Darstellung ist bewusst kuratiert: sensible Details und private Namen bleiben ausgeblendet.",
    releaseNote:
      "Freigegeben fuer die oeffentliche Vorbereitung. Zahlen und Ergebnisse werden nur dort genannt, wo sie bewusst aggregiert und nicht sensibel sind.",
    status: "released-timeline",
    visibleFields: [
      "technische Grundlagen, Maschinenbau und Dokumentation",
      "Service, Installation, Vertrieb und Kundenkommunikation",
      "Gruendung, Standortaufbau, Teamkoordination und operativer Betrieb",
      "Fitness-/Gesundheitsqualifikationen, Digitalisierung und Change Management",
    ],
    withheldFields: [
      "private Namen von Mitarbeitenden, Teammitgliedern und Ansprechpartnern",
      "Bankverbindungen, Steuerdaten, Telefonnummern und vollstaendige Partnerlisten",
      "exakter Exit-Adventures-Kaufpreis",
      "Noten und interne Zeugnisformulierungen",
      "Heil-, Therapie- oder Erfolgversprechen im Fitness-/Coachingkontext",
    ],
  },
  careerItems: [
    {
      id: "ausbildung-maschinenbau",
      period: "1997 - 2008",
      title: "Technischer Einstieg und Maschinenbau",
      role: "Industriemechaniker; Diplom-Ingenieur (FH) Maschinenbau, Konstruktionstechnik",
      summary:
        "Technische Grundlage durch Industriemechaniker-Ausbildung, Fachhochschulreife und Maschinenbau-Studium mit Konstruktionstechnik-Schwerpunkt.",
      highlights: [
        "Ausbildung bei Robert Bosch im Bereich Maschinen- und Systemtechnik.",
        "Diplomarbeit zur Optimierung und teilweisen Neukonstruktion eines Systems zur Fest-Fluessig-Trennung von Abwasser.",
        "Praxissemester an der James Madison University mit Automotive-/SAE-Bezug.",
      ],
      evidenceNote: "Ausbildungs-, Fachhochschulreife- und Diplomunterlagen liegen vor.",
    },
    {
      id: "rrc-loomis",
      period: "2008 - 2011",
      title: "Engineering, Dokumentation, Service und Installation",
      role: "Mechanical Development Engineer; Maschinenbau/Service/Installation/technisches Zeichnen",
      summary:
        "Berufliche Stationen mit Produktanforderungen, Entwicklung mechanischer und elektromechanischer Komponenten, Fertigungsdokumentation, Anlagenaufbau, Service und Installation.",
      highlights: [
        "Technische Unterstuetzung bei Angeboten und Produktanforderungen.",
        "Entwicklung und Dokumentation mechanischer und elektromechanischer Baugruppen.",
        "Zusammenbau, Service und Installation von Anlagen sowie technisches Zeichnen.",
      ],
      evidenceNote: "Arbeitszeugnisse von RRC power solutions und Loomis Products liegen vor.",
    },
    {
      id: "sales-team-management",
      period: "2011 - 2012",
      title: "Sales, Kundenkommunikation und Teamfuehrung",
      role: "Sales & Team Manager",
      summary:
        "Verantwortung fuer Kundenbetreuung, Akquise, Angebote, Vertragsvorbereitung, Bewerberauswahl, Mitarbeiterentwicklung und Teamkoordination.",
      highlights: [
        "Betreuung von Bestands- und Neukunden sowie Bewertung von Kundenanfragen.",
        "Bewerberauswahl, Bewerbungsgespraeche und Mitarbeitergespraeche.",
        "Fuehrung, Ausbildung und Coaching von Mitarbeitenden.",
      ],
      evidenceNote: "Arbeitszeugnis Randstad Professionals / YACHT TECCON liegt vor.",
    },
    {
      id: "fun-forest",
      period: "2013 - 2014",
      title: "Operative Leitung im Abenteuerpark",
      role: "Leiter Bau und Team-Trainer mit stellvertretender Managementfunktion",
      summary:
        "Operative Verantwortung im Abenteuerpark Homburg mit Teambuilding, Kundenbetreuung, Personalplanung, Sicherheit, Wartung, Parcours-Design und Marketingmassnahmen.",
      highlights: [
        "Leitung von Teambuilding-Massnahmen und Kundenbetreuung.",
        "Sicherheits-, Wartungs- und Instandhaltungsaufgaben im laufenden Betrieb.",
        "Personalplanung, Kundenakquise und lokale Marketingmassnahmen.",
      ],
      evidenceNote: "Arbeitszeugnis FUN FOREST liegt vor.",
    },
    {
      id: "exit-adventures",
      period: "2015 - 2019",
      title: "Exit Adventures",
      role: "Gruender, Inhaber und Betreiber eines Live-Escape-Games-Unternehmens",
      summary:
        "Aufbau und Betrieb eines Escape-Room-Unternehmens mit Standorten in Kaiserslautern und Saarbruecken, Teambuilding-Angeboten, Mitarbeitenden und spaeterem Verkauf.",
      highlights: [
        "Skalierung von einem Standort auf zwei Standorte.",
        "Teambuilding- und Firmenevent-Angebote neben Freizeitbesuchen.",
        "Zum Verkaufszeitpunkt 14 aufgefuehrte Mitarbeitende bzw. Vertragsverhaeltnisse; Verkauf zu einem niedrigen sechsstelligen Betrag.",
      ],
      evidenceNote:
        "Gewerbeunterlagen, Betriebsbeschreibungen, Umsatz-/Personal-Auswertungen und notarieller Unternehmenskaufvertrag liegen vor; exakter Kaufpreis und Namen bleiben ausgeblendet.",
    },
    {
      id: "tiny-state-games",
      period: "bis 2020",
      title: "Tiny State Games / BARTS",
      role: "Gruender, alleiniger Gesellschafter, erster Geschaeftsfuehrer; spaeter Liquidator",
      summary:
        "Gruendung einer GmbH fuer ein geplantes Multiplayer-Spielprojekt mit Teamaufbau, Projektmanagement, Finanzierungsplanung und klarer Einordnung der Grenzen.",
      highlights: [
        "Aufbau eines freiwillig arbeitenden Teams mit sieben weiteren namentlich aufgefuehrten Teammitgliedern.",
        "Verantwortung fuer Geschaeftsfuehrung, Finanzierung, Strategie, Teile des Game Designs, Marketing, Vertrieb, Networking und Personalmanagement.",
        "Spielbare Teilfunktionen entstanden, aber keine marktreife Gesamtfassung und kein Release.",
      ],
      evidenceNote:
        "Gruendungsunterlagen, Projektskizze, Team-Auszug und persoenliche Bestaetigungen liegen vor.",
    },
    {
      id: "legga-food",
      period: "2021 - 2022",
      title: "Legga Food",
      role: "Gruender, Inhaber und alleiniger Betreiber eines Kochbox-Vorhabens",
      summary:
        "Kochbox-Vorhaben mit frischen, passend portionierten Lebensmitteln, Abholstationen, Partnernetzwerk, eigener Produktion und ersten Umsaetzen.",
      highlights: [
        "Abofreies Kochbox-Konzept mit kurzfristiger Bereitstellung und Mehrweg-/Abholstationsidee.",
        "Durchschnittlich etwa 50 Bestellungen pro Monat laut freigegebener Betreiberangabe.",
        "Nicht fortgefuehrt wegen zu langsamem Wachstum und stark steigenden Einkaufspreisen im Kontext des Ukraine-Kriegs.",
      ],
      evidenceNote:
        "Gewerbeunterlagen, Businessplan, Steckbrief und freigegebene Betreiberangaben liegen vor; Partnerdaten bleiben ausgeblendet.",
    },
    {
      id: "fitness-first",
      period: "2024 - 2025",
      title: "Fitness First Saarlouis",
      role: "Club General Manager",
      summary:
        "Operative Clubleitung mit Verantwortung fuer Team, Mitgliederbetreuung, Servicequalitaet, Vertrieb, Trainingsangebote, lokale Kooperationen und taeglichen Clubbetrieb.",
      highlights: [
        "Personalauswahl, Onboarding, Teamfuehrung, Feedbackgespraeche und Dienstplanung.",
        "Mitgliederbindung, Beschwerdemanagement, Verkaufsgespraeche und Mitgliedschaftsabschluesse.",
        "Qualitaetskontrollen, Hygienestandards, Facility Management, Kundendatenanalyse und lokale Aktionen.",
      ],
      evidenceNote: "Arbeitszeugnis Fitness First / smilefit SLS GmbH liegt vor.",
    },
    {
      id: "motai",
      period: "seit 2025",
      title: "MotAI",
      role: "Gruender / Betreiber in Aufbau eines KI-gestuetzten Coaching-Systems",
      summary:
        "Digitaler Alltagscoach fuer Motivation, Bewegung und gesunde Routinen ueber Messenger-Dienste, mit Website, MVP-Flow und erster Testphase.",
      highlights: [
        "Konzept mit WhatsApp/Telegram, taeglichen Check-ins, Motivationsimpulsen und kleinen Handlungsschritten.",
        "Technische Planung mit Supabase, n8n, VPS/Hosting und Messenger-Integrationen.",
        "Erste Testphase mit 5 Test-Usern; noch keine zahlenden Nutzer und Produktqualitaet noch nicht ausreichend.",
      ],
      evidenceNote:
        "Businessplan, Gewerbeanmeldung, Projektplan, MVP-Flowchart, Website-/Deployment-Artefakte und freigegebene Betreiberangabe liegen vor.",
    },
  ],
  credentialGroups: [
    {
      id: "fitness-gesundheit",
      title: "Fitness, Gesundheit und Training",
      summary:
        "BSA-Akademie-Qualifikationen sowie DFB/Saarlaendischer-Fussball-Verband C-Lizenz im Sport- und Trainingskontext.",
      credentials: [
        "Fitnesstrainer/in A-Lizenz und B-Lizenz",
        "Lehrer/in fuer Fitness",
        "Trainer/in fuer geraetegestuetztes Krafttraining, Cardiofitness und Sportrehabilitation",
        "Gesundheitstrainer/in, Ernaehrungstrainer/in-B-Lizenz und Leistungssport Body-Trainer/in",
        "C Lizenz Trainer im Fussballkontext",
      ],
    },
    {
      id: "qualitaet-projekt",
      title: "Qualitaet und Projektmanagement",
      summary:
        "TUEV-SUED-Weiterbildungen zu Qualitaetsmanagement, Audit und Projektmanagement-Grundlagen.",
      credentials: [
        "Qualitaetsmanagement-Fachkraft QMF-TUEV",
        "Qualitaetsmanagement-Beauftragter QMB-TUEV",
        "Qualitaetsmanagement-Auditor QMA-TUEV",
        "Projektmanagement - Grundlagen",
      ],
    },
    {
      id: "digital-change",
      title: "Digitalisierung und Change",
      summary:
        "karriere-tutor-Weiterbildungen zu Digitalisierung, digitalen Geschaeftsmodellen und Veraenderungsprozessen.",
      credentials: [
        "Einfuehrung in die Digitalisierung",
        "Digital Business Innovator",
        "Change Management",
      ],
    },
  ],
  projectsOverview: {
    eyebrow: "Projekte",
    title: "Freigegebene Projektkerne ohne sensible Rohdaten",
    intro:
      "Die Projektseite zeigt unternehmerische und digitale Aufbauarbeit in vorsichtiger Form: mit Ergebnissen dort, wo sie freigegeben sind, und mit Grenzen dort, wo Projekte nicht marktreif wurden.",
    releaseNote:
      "Private Namen, steuerliche Details, exakte Kaufpreise und interne Unterlagen bleiben ausgeblendet.",
    status: "released-project-summaries",
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
