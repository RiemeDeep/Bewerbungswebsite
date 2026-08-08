import type { ProfileContent } from "@bewerbungswebsite/contracts";

import { siteConfig } from "./site-config";

type JsonLdValue =
  string | number | boolean | null | JsonLdValue[] | { [key: string]: JsonLdValue };
type JsonLdObject = { [key: string]: JsonLdValue };

function sitePath(path: string): string | undefined {
  if (!siteConfig.siteUrl) return undefined;

  return new URL(path, siteConfig.siteUrl).toString();
}

function compactObject<T extends JsonLdObject>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined)) as T;
}

export function buildProfileStructuredData(content: ProfileContent): JsonLdObject {
  const pageUrl = sitePath("/");
  const personId = pageUrl ? `${pageUrl}#person` : undefined;
  const websiteId = pageUrl ? `${pageUrl}#website` : undefined;
  const website: JsonLdObject | undefined =
    pageUrl && websiteId
      ? {
          "@type": "WebSite",
          "@id": websiteId,
          url: pageUrl,
          name: siteConfig.shortName,
          inLanguage: content.meta.language,
        }
      : undefined;

  const person = compactObject({
    "@type": "Person",
    ...(personId ? { "@id": personId } : {}),
    name: siteConfig.shortName,
    description: siteConfig.description,
    knowsAbout: content.competencies.map((competency) => competency.title),
  });

  const profilePage = compactObject({
    "@type": "ProfilePage",
    ...(pageUrl ? { "@id": `${pageUrl}#profile-page`, url: pageUrl } : {}),
    name: siteConfig.name,
    description: siteConfig.description,
    inLanguage: content.meta.language,
    mainEntity: personId ? { "@id": personId } : person,
    ...(websiteId ? { isPartOf: { "@id": websiteId } } : {}),
  });

  return {
    "@context": "https://schema.org",
    "@graph": [...(website ? [website] : []), profilePage, person],
  };
}

function serializeJsonLd(data: JsonLdObject): string {
  return JSON.stringify(data).replace(/</gu, "\\u003c");
}

export function ProfileStructuredData({ content }: { content: ProfileContent }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(buildProfileStructuredData(content)) }}
    />
  );
}
