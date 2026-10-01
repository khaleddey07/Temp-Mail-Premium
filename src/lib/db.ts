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

function createDb(): PrismaClient {
  const tursoUrl = process.env.TURSO_DATABASE_URL?.trim();

  if (tursoUrl) {
    // Mode Turso (libSQL distant) — gratuit, compatible serverless Vercel
    const adapter = new PrismaLibSQL({
      url: tursoUrl,
      authToken: process.env.TURSO_AUTH_TOKEN?.trim() || undefined,
    });
    return new PrismaClient({ adapter });
  }

  // Mode local — SQLite fichier, comportement inchangé
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query"] : [],
  });
}

export const db = globalForPrisma.prisma ?? createDb();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
