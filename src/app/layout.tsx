import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { ThemeProvider, ToastProvider } from "@/components/providers";
import { Header, Footer } from "@/components/site-chrome";
import AdsManager from "@/components/ads/ads-manager";

export const metadata: Metadata = {
  metadataBase: new URL("https://tempmail-premium.app"),
  title: {
    default: "TempMail Premium — Adresse E-mail Temporaire Gratuite & Sécurisée",
    template: "%s | TempMail Premium",
  },
  description:
    "Créez une adresse e-mail temporaire gratuite en 1 clic. Réception instantanée, QR code, compte à rebours, mode sombre, 100% anonyme et sans inscription. Anti-spam ultime.",
  keywords: [
    "email temporaire",
    "adresse jetable",
    "tempmail",
    "temp mail",
    "boite mail temporaire",
    "email jetable",
    "anti spam",
    "adresse email anonyme",
    "disposable email",
    "fake mail",
    "10 minute mail",
  ],
  authors: [{ name: "TempMail Premium" }],
  creator: "TempMail Premium",
  publisher: "TempMail Premium",
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: "https://tempmail-premium.app",
    siteName: "TempMail Premium",
    title: "TempMail Premium — Adresse E-mail Temporaire Gratuite",
    description:
      "Adresse e-mail jetable gratuite en 1 clic. Réception instantanée, QR Code, prolongation, mode sombre. Sans inscription, 100% anonyme.",
    images: [{ url: "/og-cover.jpg", width: 1200, height: 630, alt: "TempMail Premium" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "TempMail Premium — E-mail temporaire gratuit",
    description: "Créez une adresse jetable en 1 seconde. Réception instantanée, zéro spam, 100% anonyme.",
  },
  alternates: { canonical: "https://tempmail-premium.app" },
  category: "technology",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f7fb" },
    { media: "(prefers-color-scheme: dark)", color: "#070b18" },
  ],
  width: "device-width",
  initialScale: 1,
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "TempMail Premium",
  url: "https://tempmail-premium.app",
  applicationCategory: "UtilitiesApplication",
  operatingSystem: "Web",
  offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
  description: "Service gratuit d'adresses e-mail temporaires et jetables avec réception instantanée.",
  inLanguage: "fr-FR",
  aggregateRating: { "@type": "AggregateRating", ratingValue: "4.9", ratingCount: "2841" },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('tempmail-theme');if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}})();`,
          }}
        />
      </head>
      <body id="top" className="min-h-screen antialiased">
        <ThemeProvider>
          <ToastProvider>
            <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
              <div className="bg-grid absolute inset-0" />
              <div className="bg-orb left-1/2 top-[-180px] h-[420px] w-[720px] -translate-x-1/2 bg-indigo-500/25" />
            </div>
            <Header />
            <main className="min-h-[70vh] pb-4">{children}</main>
            <Footer />
            <AdsManager />
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
