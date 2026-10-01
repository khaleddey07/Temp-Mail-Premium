/**
 * Utilitaires communs : domaines de secours, générateurs, helpers.
 * Les domaines RÉELS sont récupérés dynamiquement depuis mail.tm
 * (voir src/lib/mailtm.ts + /api/domains) — cette liste n'est
 * qu'un repli si le fournisseur est momentanément injoignable.
 */
export const FALLBACK_DOMAINS = ["uberip.com"] as const;

/** URL publique du site (SEO, sitemap, JSON-LD) — modifiable sans toucher au code via la
 *  variable d'environnement NEXT_PUBLIC_SITE_URL (ex. sur Vercel : https://mon-site.vercel.app). */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, "") ||
  "https://tempmail-premium.app";

const ADJECTIVES = [
  "swift", "bright", "silent", "rapid", "clever", "brave", "calm", "cosmic",
  "lunar", "solar", "neon", "velvet", "crisp", "bold", "fresh", "prime",
  "turbo", "hyper", "ultra", "alpha", "nova", "pixel", "quantum", "zen",
];

const NOUNS = [
  "fox", "falcon", "tiger", "wolf", "eagle", "shark", "panda", "koala",
  "otter", "raven", "viper", "cobra", "lynx", "bear", "hawk", "owl",
  "rocket", "comet", "storm", "wave", "cloud", "spark", "blade", "orbit",
];

export function generateLocalPart(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const num = Math.floor(100 + Math.random() * 9900);
  return `${adj}.${noun}.${num}`;
}

export function generateToken(): string {
  return (
    crypto.randomUUID().replace(/-/g, "") +
    Math.random().toString(36).slice(2) +
    Date.now().toString(36)
  );
}

export function humanSize(bytes: number): string {
  if (!bytes || bytes < 0) return "0 o";
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

/** TTL de vie d'une adresse (minutes) */
export const ADDRESS_TTL_MINUTES = 60;
export const EXTEND_MINUTES = 60;
export const MAX_EXTENDS = 10;
