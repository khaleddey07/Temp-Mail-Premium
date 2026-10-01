/**
 * Service métier : adresses possédées, sync mail.tm -> cache local,
 * messages de bienvenue, purge des adresses expirées.
 */
import { db } from "@/lib/db";
import type { TempAddress } from "@prisma/client";
import * as mt from "@/lib/mailtm";
import { generateLocalPart } from "@/lib/temp-mail";

/* ============ Formatage client ============ */
export function toClientAddress(a: TempAddress, messageCount?: number) {
  return {
    id: a.id,
    email: a.email,
    localPart: a.localPart,
    domain: a.domain,
    token: a.token,
    expiresAt: a.expiresAt,
    createdAt: a.createdAt,
    extendedCount: a.extendedCount,
    messageCount,
  };
}

export function credsOf(a: TempAddress): {
  email: string;
  providerId: string | null;
  providerPassword: string | null;
  providerToken: string | null;
} {
  return {
    email: a.email,
    providerId: a.providerId,
    providerPassword: a.providerPassword,
    providerToken: a.providerToken,
  };
}

/** Persiste le token mail.tm rafraîchi (re-auth auto) */
export function makeTokenSaver(addressId: string) {
  return (token: string) => {
    db.tempAddress
      .update({ where: { id: addressId }, data: { providerToken: token, providerTokenAt: new Date() } })
      .catch(() => {});
  };
}

/* ============ Lookup ============ */
export async function getOwnedAddress(id: string, token: string | null): Promise<TempAddress | null> {
  if (!token || !id) return null;
  const rows = await db.tempAddress.findMany({
    where: { id, token },
    take: 1,
  });
  return rows[0] ?? null;
}

/* ============ Création ============ */
export interface CreateResult {
  address?: TempAddress;
  messageCount?: number;
  error?: string;
  status?: number;
}

export async function createRealAddress(localPartRaw?: string, domainRaw?: string): Promise<CreateResult> {
  // 1. Domaine réel actif
  let domain: string;
  try {
    const actives = await mt.getActiveDomains();
    domain = domainRaw && actives.includes(domainRaw) ? domainRaw : actives[0];
  } catch {
    return { error: "Fournisseur mail momentanément indisponible. Réessayez dans quelques secondes.", status: 503 };
  }

  // 2. Partie locale
  let base = (localPartRaw ?? "").trim().toLowerCase().replace(/[^a-z0-9._-]/g, "");
  if (!base || base.length < 3) base = generateLocalPart();

  // 3. Création du compte réel (retry suffixe si déjà pris)
  const password = mt.randomPassword();
  let created: { id: string; address: string } | null = null;
  let finalLocal = base;
  for (let i = 0; i < 4; i++) {
    const candidate = `${finalLocal}@${domain}`;
    try {
      created = await mt.createAccount(candidate, password);
      break;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      if (msg === "ADDRESS_TAKEN") {
        finalLocal = `${base}${Math.floor(Math.random() * 900 + 100)}`;
        continue;
      }
      return { error: "Impossible de créer l'adresse auprès du fournisseur. Réessayez.", status: 502 };
    }
  }
  if (!created) return { error: "Adresse déjà prise. Essayez un autre nom.", status: 409 };

  // 4. Login
  let providerToken: string | null = null;
  try {
    providerToken = await mt.login(created.address, password);
  } catch {
    providerToken = null; // le re-auth auto gèrera plus tard
  }

  // 5. Enregistrement local (TTL 60 min)
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
  const token = generateTokenLocal();
  const address = await db.tempAddress.create({
    data: {
      email: created.address,
      localPart: finalLocal,
      domain,
      token,
      providerId: created.id,
      providerPassword: password,
      providerToken,
      providerTokenAt: providerToken ? new Date() : null,
      expiresAt,
    },
  });

  // 6. Messages de bienvenue (cache local uniquement)
  await db.message.createMany({ data: welcomeMessages(address.id, address.email) });
  const count = await db.message.count({ where: { addressId: address.id } });

  return { address, messageCount: count };
}

function generateTokenLocal(): string {
  return (
    crypto.randomUUID().replace(/-/g, "") +
    Math.random().toString(36).slice(2) +
    Date.now().toString(36)
  );
}

/* ============ Messages de bienvenue ============ */
function welcomeMessages(addressId: string, email: string) {
  const now = Date.now();
  return [
    {
      addressId,
      providerMsgId: null,
      senderName: "TempMail Premium",
      senderEmail: "bienvenue@tempmail.app",
      subject: `Bienvenue ! Votre adresse ${email} est active 🎉`,
      preview: "Votre boîte temporaire est prête. Voici comment l'utiliser en 30 secondes...",
      isRead: false,
      hasAttachments: false,
      receivedAt: new Date(now - 40 * 1000),
      sizeBytes: 2400,
    },
    {
      addressId,
      providerMsgId: null,
      senderName: "Conseils Sécurité",
      senderEmail: "securite@tempmail.app",
      subject: "3 conseils pour rester anonyme en ligne 🛡️",
      preview: "Ne réutilisez jamais la même adresse, activez l'actualisation auto...",
      isRead: false,
      hasAttachments: false,
      receivedAt: new Date(now - 20 * 1000),
      sizeBytes: 1800,
    },
  ];
}

/* ============ Sync mail.tm -> cache ============ */
export async function syncMessages(address: TempAddress): Promise<{ ok: boolean; expired?: boolean }> {
  try {
    const list = await mt.listMessages(credsOf(address), makeTokenSaver(address.id));
    for (const m of list) {
      const data = {
        senderName: m.from?.name?.trim() || m.from?.address?.split("@")[0] || "Expéditeur",
        senderEmail: m.from?.address ?? "inconnu@inconnu",
        subject: m.subject || "(sans objet)",
        preview: m.intro || "",
        isRead: !!m.seen,
        hasAttachments: !!m.hasAttachments,
        receivedAt: new Date(m.createdAt),
        sizeBytes: m.size ?? 0,
      };
      await db.message.upsert({
        where: { addressId_providerMsgId: { addressId: address.id, providerMsgId: m.id } },
        create: { addressId: address.id, providerMsgId: m.id, ...data },
        update: data,
      });
    }
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "PROVIDER_AUTH_FAILED") {
      // Compte disparu chez le fournisseur : on purge localement
      await db.tempAddress.delete({ where: { id: address.id } }).catch(() => {});
      return { ok: false, expired: true };
    }
    return { ok: false };
  }
}

/* ============ Purge des adresses expirées ============ */
export async function cleanupExpired(): Promise<void> {
  try {
    const hardLimit = new Date(Date.now() - 2 * 60 * 1000); // marge de 2 min
    const expired = await db.tempAddress.findMany({
      where: { expiresAt: { lt: hardLimit } },
      take: 20,
      select: { id: true, providerId: true, providerPassword: true, providerToken: true, email: true },
    });

    for (const a of expired) {
      // Suppression côté fournisseur (best-effort, non bloquant)
      if (a.providerId && a.providerPassword) {
        const creds = { email: a.email, providerId: a.providerId, providerPassword: a.providerPassword, providerToken: a.providerToken };
        mt.login(a.email, a.providerPassword)
          .then((tok) => mt.deleteAccount(a.providerId as string, tok))
          .catch(() => {});
      }
      await db.tempAddress.delete({ where: { id: a.id } }).catch(() => {});
    }
  } catch {
    // ignore
  }
}
