import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Traduit une erreur de connexion DB en diagnostic ACTIONNABLE en français.
 *  Permet à l'utilisateur de vérifier son déploiement en ouvrant simplement /api/health. */
function diagnose(err: unknown): { reason: string; hint: string } {
  const msg = err instanceof Error ? err.message : String(err);

  if (/no route configured/i.test(msg)) {
    return {
      reason: "L'URL de la base Turso est incorrecte (hôte inconnu de Turso).",
      hint: "Ouvre le dashboard Turso → ta base de données → copie la « Database URL » AVEC LE BOUTON COPIER (elle commence par libsql:// et ne contient aucun espace). Colle-la dans la variable TURSO_DATABASE_URL sur Vercel, puis Redeploy.",
    };
  }
  if (/401|unauthorized|invalid token|authentication|forbidden/i.test(msg)) {
    return {
      reason: "Le jeton d'accès (TURSO_AUTH_TOKEN) est refusé par Turso.",
      hint: "Dans le dashboard Turso, génère un nouveau token (bouton copier) et remplace la variable TURSO_AUTH_TOKEN sur Vercel, puis Redeploy.",
    };
  }
  if (/ENOTFOUND|fetch failed|getaddrinfo|network|ECONNREFUSED/i.test(msg)) {
    return {
      reason: "Impossible de joindre le serveur de base de données.",
      hint: "Vérifie que TURSO_DATABASE_URL est l'URL complète fournie par Turso (ex. libsql://ma-base-mon-org.aws-us-east-1.turso.io).",
    };
  }
  return {
    reason: "Erreur de base de données : " + msg.slice(0, 180),
    hint: "Consulte GUIDE-DEPLOIEMENT.md, section « Dépannage ».",
  };
}

export async function GET() {
  try {
    await db.tempAddress.count();
    return Response.json({ ok: true });
  } catch (err) {
    const { reason, hint } = diagnose(err);
    console.error("[health] DB KO :", err);
    return Response.json({ ok: false, reason, hint }, { status: 500 });
  }
}
