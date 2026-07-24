import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="site-header">
      <Link className="brand" href="/" aria-label="Zur Startseite">
        Michael Flatau
      </Link>
      <nav className="site-nav" aria-label="Direkteinstiege">
        <Link className="assistant-nav-link" href="/#profilassistent">
          Frage stellen
        </Link>
        <Link className="header-cta" href="/#passung">
          Passung prüfen
        </Link>
      </nav>
    </header>
  );
}
