import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim();
    const subject = String(body.subject ?? "").trim();
    const message = String(body.message ?? "").trim();

    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: "Tous les champs sont requis" }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Adresse e-mail invalide" }, { status: 400 });
    }
    if (message.length < 10) {
      return NextResponse.json({ error: "Message trop court (10 caractères minimum)" }, { status: 400 });
    }

    await db.contactMessage.create({ data: { name, email, subject, message } });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
