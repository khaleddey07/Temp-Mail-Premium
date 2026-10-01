import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { credsOf, makeTokenSaver } from "@/lib/address-service";
import * as mt from "@/lib/mailtm";

export const dynamic = "force-dynamic";

// GET /api/messages/{id}/attachments/{attId}?token=xxx
// -> téléchargement RÉEL de la pièce jointe via proxy mail.tm
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; attId: string }> }
) {
  const { id, attId } = await params;
  const token = req.nextUrl.searchParams.get("token");

  if (!token) return NextResponse.json({ error: "Token requis" }, { status: 401 });

  const rows = await db.message.findMany({ where: { id }, take: 1 });
  const msg = rows[0];
  if (!msg || !msg.providerMsgId) {
    return NextResponse.json({ error: "Pièce jointe introuvable" }, { status: 404 });
  }
  const addrs = await db.tempAddress.findMany({
    where: { id: msg.addressId, token },
    take: 1,
  });
  const address = addrs[0];
  if (!address) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  let upstream: Response;
  try {
    upstream = await mt.fetchAttachment(
      credsOf(address),
      msg.providerMsgId,
      attId,
      makeTokenSaver(address.id)
    );
  } catch {
    return NextResponse.json({ error: "Téléchargement impossible" }, { status: 502 });
  }
  if (!upstream.ok || !upstream.body) {
    return NextResponse.json({ error: "Pièce jointe indisponible" }, { status: upstream.status || 502 });
  }

  // Nom de fichier : depuis l'en-tête du fournisseur ou l'URL
  const cd = upstream.headers.get("content-disposition") ?? "";
  let filename = "";
  const star = /filename\*=(?:UTF-8'')?([^;]+)/i.exec(cd);
  const plain = /filename="?([^";]+)"?/i.exec(cd);
  if (star) filename = decodeURIComponent(star[1].trim().replace(/^"|"$/g, ""));
  else if (plain) filename = plain[1].trim();
  else filename = "piece-jointe";

  const headers = new Headers();
  headers.set("Content-Type", upstream.headers.get("content-type") ?? "application/octet-stream");
  headers.set(
    "Content-Disposition",
    `attachment; filename="${filename.replace(/[^\x20-\x7E]/g, "_")}"; filename*=UTF-8''${encodeURIComponent(filename)}`
  );
  const len = upstream.headers.get("content-length");
  if (len) headers.set("Content-Length", len);

  return new Response(upstream.body, { status: 200, headers });
}
