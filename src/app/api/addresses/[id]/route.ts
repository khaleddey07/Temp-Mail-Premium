import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getOwnedAddress } from "@/lib/address-service";
import * as mt from "@/lib/mailtm";

export const dynamic = "force-dynamic";

// GET /api/addresses/{id}?token=xxx
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = req.nextUrl.searchParams.get("token");
  const address = await getOwnedAddress(id, token);
  if (!address) return NextResponse.json({ error: "Adresse introuvable" }, { status: 404 });
  if (new Date(address.expiresAt).getTime() < Date.now()) {
    return NextResponse.json({ error: "Adresse expirée", expired: true }, { status: 410 });
  }
  const messageCount = await db.message.count({ where: { addressId: address.id } });
  return NextResponse.json({ address: { ...address, messageCount } });
}

// DELETE /api/addresses/{id}?token=xxx -> détruit l'adresse ET le compte mail.tm réel
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let token: string | null = req.nextUrl.searchParams.get("token");
  if (!token) {
    try {
      const body = await req.json();
      token = body.token ?? null;
    } catch {
      token = null;
    }
  }
  const address = await getOwnedAddress(id, token);
  if (!address) return NextResponse.json({ error: "Adresse introuvable" }, { status: 404 });

  // Suppression du compte réel chez mail.tm (best-effort)
  if (address.providerId && address.providerPassword) {
    try {
      const tok = await mt.login(address.email, address.providerPassword);
      await mt.deleteAccount(address.providerId, tok);
    } catch {
      // ignore — la purge automatique du fournisseur s'en chargera
    }
  }
  await db.tempAddress.delete({ where: { id: address.id } }).catch(() => {});
  return NextResponse.json({ ok: true });
}
