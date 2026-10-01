import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getOwnedAddress } from "@/lib/address-service";
import { EXTEND_MINUTES, MAX_EXTENDS } from "@/lib/temp-mail";

export const dynamic = "force-dynamic";

// POST /api/addresses/{id}/extend -> +60 min (max 10)
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

  if (new Date(address.expiresAt).getTime() < Date.now()) {
    return NextResponse.json({ error: "Adresse expirée" }, { status: 410 });
  }
  if (address.extendedCount >= MAX_EXTENDS) {
    return NextResponse.json({ error: "Limite de prolongations atteinte" }, { status: 429 });
  }

  const base = Math.max(new Date(address.expiresAt).getTime(), Date.now());
  const updated = await db.tempAddress.update({
    where: { id },
    data: {
      expiresAt: new Date(base + EXTEND_MINUTES * 60 * 1000),
      extendedCount: address.extendedCount + 1,
      lastAccessedAt: new Date(),
    },
  });

  return NextResponse.json({ address: updated });
}
