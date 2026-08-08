function parseSiteUrl(value: string | undefined): URL | undefined {
  if (!value) return undefined;

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url : undefined;
  } catch {
    return undefined;
  }
}

export const siteConfig = {
  name: "Michael Flatau | Maschinenbau, Projekte und unternehmerische Umsetzung",
  shortName: "Michael Flatau",
  description:
    "Interaktives Profil von Michael Flatau: technische Erfahrung, Projekt- und Prozessaufbau, Unternehmertum sowie eine beleggestützte Analyse für konkrete Stellen.",
  locale: "de_DE",
  type: "profile",
  siteUrl: parseSiteUrl(process.env.NEXT_PUBLIC_SITE_URL),
} as const;
