import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getOwnedAddress, syncMessages } from "@/lib/address-service";

export const dynamic = "force-dynamic";

type Filter = "all" | "unread" | "read" | "attachments";

// GET /api/addresses/{id}/messages?token=xxx&search=&filter=
// -> synchronise mail.tm puis sert le cache local (rapide, filtrable)
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = req.nextUrl.searchParams.get("token");
  const search = (req.nextUrl.searchParams.get("search") ?? "").trim();
  const filter = (req.nextUrl.searchParams.get("filter") ?? "all") as Filter;

  const address = await getOwnedAddress(id, token);
  if (!address) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  if (new Date(address.expiresAt).getTime() < Date.now()) {
    return NextResponse.json({ error: "Adresse expirée", expired: true }, { status: 410 });
  }

  // 1. Synchronisation avec le fournisseur réel (source de vérité)
  const sync = await syncMessages(address);
  if (sync.expired) {
    return NextResponse.json({ error: "Adresse expirée", expired: true }, { status: 410 });
  }

  // 2. Lecture du cache avec filtres
  const where: Record<string, unknown> = { addressId: id };
  if (search) {
    const s = { contains: search };
    where.OR = [
      { subject: s },
      { senderName: s },
      { senderEmail: s },
      { preview: s },
    ];
  }
  if (filter === "unread") where.isRead = false;
  else if (filter === "read") where.isRead = true;
  else if (filter === "attachments") where.hasAttachments = true;

  const args = {
    where,
    orderBy: { receivedAt: "desc" as const },
    take: 100,
  };

  // SQLite (Prisma) : LIKE sensible à la casse -> on élargit si nécessaire
  let list = await db.message.findMany(args);
  if (search && list.length === 0) {
    // fallback insensible à la casse
    const lower = search.toLowerCase();
    const all = await db.message.findMany({
      where: { addressId: id },
      orderBy: { receivedAt: "desc" },
      take: 200,
    });
    list = all.filter(
      (m) =>
        m.subject.toLowerCase().includes(lower) ||
        m.senderName.toLowerCase().includes(lower) ||
        m.senderEmail.toLowerCase().includes(lower) ||
        m.preview.toLowerCase().includes(lower)
    );
    if (filter === "unread") list = list.filter((m) => !m.isRead);
    else if (filter === "read") list = list.filter((m) => m.isRead);
    else if (filter === "attachments") list = list.filter((m) => m.hasAttachments);
    list = list.slice(0, 100);
  }

  const allRows = await db.message.findMany({
    where: { addressId: id },
    select: { isRead: true },
  });
  const unread = allRows.filter((m) => !m.isRead).length;

  return NextResponse.json({
    messages: list,
    total: allRows.length,
    unread,
    address: { expiresAt: address.expiresAt, email: address.email },
  });
}

// DELETE /api/addresses/{id}/messages?token=xxx -> vider la boîte (cache + mail.tm)
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = req.nextUrl.searchParams.get("token");
  const address = await getOwnedAddress(id, token);
  if (!address) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  // Suppression réelle chez le fournisseur (best-effort, parallèle)
  const providerMsgs = await db.message.findMany({
    where: { addressId: id, providerMsgId: { not: null } },
    select: { providerMsgId: true },
  });
  const { credsOf, makeTokenSaver } = await import("@/lib/address-service");
  const creds = credsOf(address);
  const saver = makeTokenSaver(address.id);
  await Promise.allSettled(
    providerMsgs
      .filter((m) => m.providerMsgId)
      .map((m) => import("@/lib/mailtm").then((mt) => mt.deleteMessage(creds, m.providerMsgId as string, saver)))
  );

  await db.message.deleteMany({ where: { addressId: id } });
  return NextResponse.json({ ok: true });
}
