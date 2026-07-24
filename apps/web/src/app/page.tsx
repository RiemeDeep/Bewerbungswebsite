import { siteConfig } from "../lib/site-config";

export default function HomePage() {
  return (
    <main className="shell">
      <section className="status-card" aria-labelledby="page-title">
        <p className="eyebrow">Phase 0</p>
        <h1 id="page-title">{siteConfig.name}</h1>
        <p className="summary">
          Die technische Projektgrundlage ist initialisiert. Inhalte und oeffentliche Routen werden
          erst nach Freigabe der Phase-1-Entscheidungen umgesetzt.
        </p>
        <dl className="status-list">
          <div>
            <dt>Status</dt>
            <dd>Entwicklungs-Shell, nicht produktiv</dd>
          </div>
          <div>
            <dt>Source of Truth</dt>
            <dd>OpenCode-Projektspezifikation</dd>
          </div>
        </dl>
      </section>
    </main>
  );
}
