import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import { SiteFooter } from "../components/site-footer";
import { SiteHeader } from "../components/site-header";
import { siteConfig } from "../lib/site-config";
import "./globals.css";

export const metadata: Metadata = {
  title: siteConfig.name,
  description: siteConfig.description,
  robots: {
    index: false,
    follow: false,
  },
};

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#f7f9fc",
};

type RootLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="de">
      <body>
        <a className="skip-link" href="#main-content">
          Zum Hauptinhalt springen
        </a>
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
