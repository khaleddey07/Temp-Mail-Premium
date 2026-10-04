import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";

/**
 * Double mode base de données — pensé pour le déploiement GRATUIT :
 *
 *  1. LOCAL / SANDBOX (par défaut)  → SQLite fichier (DATABASE_URL=file:…)
 *  2. PRODUCTION GRATUITE (Vercel)  → Turso / libSQL distant
 *     → il suffit de définir TURSO_DATABASE_URL (+ TURSO_AUTH_TOKEN)
 *       dans les variables d'environnement, aucun autre changement.
 *
 * Turso : https://turso.tech — offre gratuite permanente (pas de carte bancaire).
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/** Nettoie une URL Turso collée à la main — corrige 90 % des erreurs de déploiement :
 *  - supprime TOUS les espaces / retours à la ligne introduits par le copier-coller
 *    (ex. « libsql://ma-base -org.aws-us-east-1.turso.io »)
 *  - corrige le schéma erroné (libmysql://, https://, schéma manquant → libsql://)
 *  - supprime le ou les « / » finaux éventuels. */
function normalizeTursoUrl(raw: string): string {
  const cleaned = raw.replace(/\s+/g, "");
  if (/^file:/i.test(cleaned)) return cleaned; // tests locaux (SQLite) : ne pas toucher
  const withoutScheme = cleaned.replace(/^[a-z][a-z0-9+.-]*:\/\//i, "").replace(/\/+$/, "");
  return `libsql://${withoutScheme}`;
}

function createDb(): PrismaClient {
  const tursoUrl = process.env.TURSO_DATABASE_URL?.trim();

  if (tursoUrl) {
    // Mode Turso (libSQL distant) — gratuit, compatible serverless Vercel
    const url = normalizeTursoUrl(tursoUrl);
    const authToken = process.env.TURSO_AUTH_TOKEN?.replace(/\s+/g, "") || undefined;
    console.log(`[db] Mode Turso (libSQL distant) : ${url}`);
    const adapter = new PrismaLibSQL({ url, authToken });
    return new PrismaClient({ adapter });
  }

  // Mode local — SQLite fichier, comportement inchangé
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query"] : [],
  });
}

export const db = globalForPrisma.prisma ?? createDb();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
