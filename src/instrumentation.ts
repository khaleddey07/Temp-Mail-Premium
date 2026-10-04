/**
 * Démarrage du serveur (y compris chaque instance serverless Vercel) :
 * vérifie et crée AUTOMATIQUEMENT les tables de la base si absentes
 * (idempotent — peut tourner des milliers de fois sans risque).
 *
 * → Aucun script SQL à lancer manuellement sur Turso : au premier
 *   démarrage après configuration des variables d'environnement,
 *   les 3 tables et leurs index sont créés tout seuls.
 */
export async function register(): Promise<void> {
  // Uniquement le runtime Node.js (pas le runtime Edge).
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { db } = await import("@/lib/db");

  const statements = [
    `CREATE TABLE IF NOT EXISTS "TempAddress" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "email" TEXT NOT NULL,
      "localPart" TEXT NOT NULL,
      "domain" TEXT NOT NULL,
      "token" TEXT NOT NULL,
      "providerId" TEXT,
      "providerPassword" TEXT,
      "providerToken" TEXT,
      "providerTokenAt" DATETIME,
      "expiresAt" DATETIME NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "extendedCount" INTEGER NOT NULL DEFAULT 0,
      "lastAccessedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS "Message" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "addressId" TEXT NOT NULL,
      "providerMsgId" TEXT,
      "senderName" TEXT NOT NULL,
      "senderEmail" TEXT NOT NULL,
      "subject" TEXT NOT NULL,
      "preview" TEXT NOT NULL,
      "isRead" BOOLEAN NOT NULL DEFAULT false,
      "hasAttachments" BOOLEAN NOT NULL DEFAULT false,
      "receivedAt" DATETIME NOT NULL,
      "sizeBytes" INTEGER NOT NULL DEFAULT 0,
      CONSTRAINT "Message_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "TempAddress" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS "ContactMessage" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "name" TEXT NOT NULL,
      "email" TEXT NOT NULL,
      "subject" TEXT NOT NULL,
      "message" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "TempAddress_email_key" ON "TempAddress"("email")`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "TempAddress_token_key" ON "TempAddress"("token")`,
    `CREATE INDEX IF NOT EXISTS "TempAddress_expiresAt_idx" ON "TempAddress"("expiresAt")`,
    `CREATE INDEX IF NOT EXISTS "TempAddress_email_idx" ON "TempAddress"("email")`,
    `CREATE INDEX IF NOT EXISTS "Message_addressId_idx" ON "Message"("addressId")`,
    `CREATE INDEX IF NOT EXISTS "Message_receivedAt_idx" ON "Message"("receivedAt")`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "Message_addressId_providerMsgId_key" ON "Message"("addressId", "providerMsgId")`,
  ];

  // 3 tentatives : Turso (offre gratuite) peut répondre 502 transitoirement
  // (démarrage à froid de l'instance) — on réessaie avant d'abandonner.
  // Ne JAMAIS bloquer le démarrage : si la base reste injoignable, les
  // requêtes API afficheront l'erreur et /api/health donnera un diagnostic.
  const MAX_TRIES = 3;
  for (let attempt = 1; attempt <= MAX_TRIES; attempt++) {
    try {
      for (const sql of statements) {
        await db.$executeRawUnsafe(sql);
      }
      console.log("[boot] Schéma de base vérifié : 3 tables + index présents");
      return;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[boot] Schéma (tentative ${attempt}/${MAX_TRIES}) impossible :`, msg);
      if (attempt < MAX_TRIES) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 2000));
      }
    }
  }
  console.error(
    "[boot] Base injoignable après 3 tentatives — ouvre /api/health sur le site déployé pour un diagnostic précis."
  );
}
