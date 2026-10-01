import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createRealAddress, toClientAddress, cleanupExpired } from "@/lib/address-service";
import { ADDRESS_TTL_MINUTES } from "@/lib/temp-mail";
import * as mt from "@/lib/mailtm";

export const dynamic = "force-dynamic";

// GET /api/addresses?token=xxx -> retrouver mon adresse (restauration de session)
export async function GET(req: NextRequest) {
  cleanupExpired();
  const token = req.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.json({ address: null });

  const rows = await db.tempAddress.findMany({ where: { token }, take: 1 });
  const address = rows[0] ?? null;
  if (!address) return NextResponse.json({ address: null });

  if (new Date(address.expiresAt).getTime() < Date.now()) {
    await db.tempAddress.delete({ where: { id: address.id } }).catch(() => {});
    return NextResponse.json({ address: null, expired: true });
  }

  const messageCount = await db.message.count({ where: { addressId: address.id } });
  db.tempAddress
    .update({ where: { id: address.id }, data: { lastAccessedAt: new Date() } })
    .catch(() => {});

  return NextResponse.json({ address: toClientAddress(address, messageCount) });
}

// POST /api/addresses -> créer une VRAIE adresse (mail.tm)
export async function POST(req: NextRequest) {
  cleanupExpired();
  let body: { localPart?: string; domain?: string; oldToken?: string } = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  // Supprimer l'ancienne adresse liée à ce navigateur
  if (body.oldToken) {
    const old = await db.tempAddress.findMany({ where: { token: body.oldToken }, take: 1 });
    const oldAddr = old[0];
    if (oldAddr) {
      // Suppression du compte réel chez le fournisseur (best-effort, non bloquant)
      if (oldAddr.providerId && oldAddr.providerPassword) {
        mt.login(oldAddr.email, oldAddr.providerPassword)
          .then((tok) => mt.deleteAccount(oldAddr.providerId as string, tok))
          .catch(() => {});
      }
      await db.tempAddress.delete({ where: { id: oldAddr.id } }).catch(() => {});
    }
  }

  const result = await createRealAddress(body.localPart, body.domain);
  if (result.error || !result.address) {
    return NextResponse.json({ error: result.error ?? "Erreur inconnue" }, { status: result.status ?? 500 });
  }

  return NextResponse.json(
    { address: toClientAddress(result.address, result.messageCount), ttlMinutes: ADDRESS_TTL_MINUTES },
    { status: 201 }
  );
}
