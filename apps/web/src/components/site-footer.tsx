import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <p>Michael Flatau · Profilbasis in Arbeit</p>
      <nav aria-label="Fußnavigation">
        <Link href="/profil">Profil</Link>
        <Link href="/werdegang">Werdegang</Link>
        <Link href="/projekte">Projekte</Link>
        <Link href="/kontakt">Kontakt</Link>
        <Link href="/impressum">Impressum</Link>
        <Link href="/datenschutz">Datenschutz</Link>
      </nav>
    </footer>
  );
}
