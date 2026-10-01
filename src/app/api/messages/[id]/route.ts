import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { credsOf, makeTokenSaver } from "@/lib/address-service";
import * as mt from "@/lib/mailtm";
import { humanSize } from "@/lib/temp-mail";

export const dynamic = "force-dynamic";

async function verifyOwnership(messageId: string, token: string | null) {
  if (!token) return null;
  const rows = await db.message.findMany({ where: { id: messageId }, take: 1 });
  const msg = rows[0];
  if (!msg) return null;
  const addrs = await db.tempAddress.findMany({
    where: { id: msg.addressId, token },
    take: 1,
  });
  if (!addrs[0]) return null;
  return { msg, address: addrs[0] };
}

// GET /api/messages/{id}?token=xxx -> contenu complet (texte + HTML + pièces jointes réelles)
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = req.nextUrl.searchParams.get("token");
  const owned = await verifyOwnership(id, token);
  if (!owned) return NextResponse.json({ error: "Message introuvable" }, { status: 404 });
  const { msg, address } = owned;

  // Message local (bienvenue) : pas de détail côté fournisseur
  if (!msg.providerMsgId) {
    if (!msg.isRead) {
      await db.message.update({ where: { id }, data: { isRead: true } }).catch(() => {});
    }
    const welcomeBody = buildWelcomeBody(msg.subject, address.email);
    return NextResponse.json({
      message: {
        id: msg.id,
        senderName: msg.senderName,
        senderEmail: msg.senderEmail,
        subject: msg.subject,
        preview: msg.preview,
        bodyText: welcomeBody.text,
        bodyHtml: welcomeBody.html,
        isRead: true,
        hasAttachments: false,
        attachments: [],
        receivedAt: msg.receivedAt,
        sizeBytes: msg.sizeBytes,
      },
    });
  }

  // Message réel : récupération complète chez mail.tm
  let full: mt.MtMessageFull;
  try {
    full = await mt.getMessage(credsOf(address), msg.providerMsgId, makeTokenSaver(address.id));
  } catch {
    return NextResponse.json({ error: "Contenu momentanément indisponible", retry: true }, { status: 502 });
  }

  const attachments = (full.attachments ?? []).map((a) => ({
    id: a.id,
    filename: a.filename || "piece-jointe",
    mime: a.contentType || "application/octet-stream",
    size: humanSize(a.size ?? 0),
    downloadUrl: `/api/messages/${id}/attachments/${a.id}?token=${encodeURIComponent(token!)}`,
  }));

  if (!full.seen) {
    mt.markSeen(credsOf(address), msg.providerMsgId, true, makeTokenSaver(address.id)).catch(() => {});
  }
  await db.message.update({ where: { id }, data: { isRead: true } }).catch(() => {});

  const html = Array.isArray(full.html) ? full.html.join("\n") : full.html ?? null;

  return NextResponse.json({
    message: {
      id: msg.id,
      senderName: msg.senderName,
      senderEmail: msg.senderEmail,
      subject: full.subject || msg.subject,
      preview: full.intro || msg.preview,
      bodyText: full.text ?? "",
      bodyHtml: html,
      isRead: true,
      hasAttachments: attachments.length > 0,
      attachments,
      receivedAt: full.createdAt ?? msg.receivedAt,
      sizeBytes: full.size ?? msg.sizeBytes,
    },
  });
}

// PATCH /api/messages/{id} {token, isRead} -> vu / non vu (sync mail.tm)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let body: { token?: string; isRead?: boolean } = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const token = body.token ?? req.nextUrl.searchParams.get("token");
  const owned = await verifyOwnership(id, token);
  if (!owned) return NextResponse.json({ error: "Message introuvable" }, { status: 404 });
  const { msg, address } = owned;

  const isRead = typeof body.isRead === "boolean" ? body.isRead : !msg.isRead;
  await db.message.update({ where: { id }, data: { isRead } });
  if (msg.providerMsgId) {
    mt.markSeen(credsOf(address), msg.providerMsgId, isRead, makeTokenSaver(address.id)).catch(() => {});
  }
  return NextResponse.json({ ok: true, isRead });
}

// DELETE /api/messages/{id} -> suppression réelle + cache
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
  const owned = await verifyOwnership(id, token);
  if (!owned) return NextResponse.json({ error: "Message introuvable" }, { status: 404 });
  const { msg, address } = owned;

  if (msg.providerMsgId) {
    await mt.deleteMessage(credsOf(address), msg.providerMsgId, makeTokenSaver(address.id)).catch(() => {});
  }
  await db.message.delete({ where: { id } }).catch(() => {});
  return NextResponse.json({ ok: true });
}

/* ===== Corps des messages de bienvenue (locaux) ===== */
function buildWelcomeBody(subject: string, email: string): { text: string; html: string } {
  if (subject.includes("Bienvenue")) {
    return {
      text: `Bienvenue sur TempMail Premium !\n\nVotre adresse ${email} est active pour 60 minutes.\n\n- Partagez-la partout sans crainte du spam\n- Les VRAIS e-mails arrivent automatiquement ici\n- Prolongez la durée d'un clic (+60 min)\n- Tout est supprimé à l'expiration\n\nBonne utilisation !`,
      html: `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,'Segoe UI',Roboto,sans-serif;"><div style="max-width:560px;margin:0 auto;padding:24px;"><div style="background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;box-shadow:0 4px 24px rgba(0,0,0,.06);"><div style="background:linear-gradient(135deg,#6366f1,#a855f7);padding:28px 32px;color:#fff;"><div style="font-size:22px;font-weight:800;">🎉 Bienvenue sur TempMail Premium</div><div style="opacity:.85;font-size:13px;margin-top:4px;">Votre adresse est active</div></div><div style="padding:32px;color:#334155;font-size:15px;line-height:1.7;"><p>Votre adresse <strong style="color:#6366f1;">${email}</strong> est prête pour <strong>60 minutes</strong>.</p><div style="background:#f8fafc;border-radius:12px;padding:20px;margin:16px 0;"><div style="font-weight:700;margin-bottom:8px;">⚡ Démarrage en 30 secondes</div><div style="font-size:14px;">1. Copiez votre adresse ci-dessus<br/>2. Utilisez-la pour vous inscrire partout<br/>3. Les e-mails arrivent instantanément ici<br/>4. Prolongez ou supprimez à tout moment</div></div><p style="font-size:13px;color:#64748b;">Aucune inscription, aucun mot de passe, zéro spam dans votre vraie boîte.</p></div></div></div></body></html>`,
    };
  }
  return {
    text: `3 conseils pour rester anonyme :\n\n1. Utilisez une adresse différente par service\n2. Ne partagez jamais d'infos sensibles via un e-mail jetable\n3. Supprimez les messages sensibles après lecture\n\nVotre vie privée vous appartient.`,
    html: `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,'Segoe UI',Roboto,sans-serif;"><div style="max-width:560px;margin:0 auto;padding:24px;"><div style="background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;"><div style="background:linear-gradient(135deg,#059669,#10b981);padding:28px 32px;color:#fff;"><div style="font-size:20px;font-weight:800;">🛡️ 3 conseils anonymat</div></div><div style="padding:32px;color:#334155;font-size:15px;line-height:1.7;"><p><strong>1. Une adresse par service</strong><br/><span style="color:#64748b;">Évitez le recoupement entre vos comptes.</span></p><p><strong>2. Zéro donnée sensible</strong><br/><span style="color:#64748b;">Un e-mail jetable n'est pas fait pour la banque ou la santé.</span></p><p><strong>3. Supprimez après lecture</strong><br/><span style="color:#64748b;">Les messages sensibles ne doivent pas traîner.</span></p></div></div></div></body></html>`,
  };
}
