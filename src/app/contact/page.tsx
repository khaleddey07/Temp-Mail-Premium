"use client";

import { useState } from "react";
import { Send, CheckCircle2, Mail, MessageCircle, Clock, MapPin } from "lucide-react";
import { useToast } from "@/components/providers";
import AdSlot from "@/components/ads/ad-slot";

export default function ContactPage() {
  const { notify } = useToast();
  const [form, setForm] = useState({ name: "", email: "", subject: "Question générale", message: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      notify("warning", "Champs manquants", "Nom, e-mail et message sont requis.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      notify("error", "E-mail invalide", "Vérifiez le format de votre adresse.");
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        notify("error", "Envoi impossible", data.error ?? "Réessayez plus tard.");
        return;
      }
      setSent(true);
      notify("success", "Message envoyé !", "Nous répondons en moins de 24h.");
    } catch {
      notify("error", "Erreur réseau", "Vérifiez votre connexion.");
    } finally {
      setSending(false);
    }
  };

  const inputCls =
    "w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20";

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <div className="mx-auto mt-10 max-w-2xl text-center">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-500">Contact</p>
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl" style={{ color: "var(--text)" }}>
          Parlons-nous <span className="gradient-text">💬</span>
        </h1>
        <p className="mt-3 text-[15px]" style={{ color: "var(--text-muted)" }}>
          Une question, un bug, une idée de fonctionnalité ? On lit et on répond à tout, en moins de 24h.
        </p>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        {/* Infos */}
        <div className="space-y-4">
          {[
            { icon: Mail, t: "E-mail", d: "bonjour@tempmail.premium", s: "Réponse sous 24h ouvrées" },
            { icon: MessageCircle, t: "Chat communautaire", d: "Discord — 2 400 membres", s: "Entraide entre utilisateurs" },
            { icon: Clock, t: "Disponibilité", d: "7j/7 — monitoring 24/24", s: "Uptime 99,98 % sur 90 jours" },
            { icon: MapPin, t: "Localisation", d: "Paris, France 🇫🇷", s: "Données hébergées en Europe (RGPD)" },
          ].map((c) => (
            <div key={c.t} className="card card-hover flex items-start gap-4 rounded-2xl p-5">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-indigo-500/10 text-indigo-500">
                <c.icon size={20} />
              </span>
              <span>
                <span className="block text-sm font-bold" style={{ color: "var(--text)" }}>{c.t}</span>
                <span className="block text-sm font-semibold text-indigo-500">{c.d}</span>
                <span className="block text-xs" style={{ color: "var(--text-faint)" }}>{c.s}</span>
              </span>
            </div>
          ))}
        </div>

        {/* Form */}
        <div className="card rounded-3xl p-7 sm:p-9">
          {sent ? (
            <div className="animate-pop-in flex flex-col items-center py-10 text-center">
              <span className="grid h-20 w-20 place-items-center rounded-full bg-emerald-500/10 text-emerald-500">
                <CheckCircle2 size={40} />
              </span>
              <h2 className="mt-5 text-xl font-extrabold" style={{ color: "var(--text)" }}>Message bien reçu !</h2>
              <p className="mt-2 max-w-sm text-sm" style={{ color: "var(--text-muted)" }}>
                Merci {form.name.split(" ")[0] || "!"}. Notre équipe vous répondra à{" "}
                <strong className="text-indigo-500">{form.email}</strong> très vite.
              </p>
              <button
                onClick={() => { setSent(false); setForm({ name: "", email: "", subject: "Question générale", message: "" }); }}
                className="mt-6 rounded-xl border px-6 py-2.5 text-sm font-semibold transition hover:-translate-y-0.5"
                style={{ borderColor: "var(--border)", color: "var(--text)" }}
              >
                Envoyer un autre message
              </button>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-faint)" }}>Votre nom *</label>
                  <input value={form.name} onChange={set("name")} placeholder="Marie Dupont" className={inputCls} style={{ borderColor: "var(--border)", background: "var(--bg)", color: "var(--text)" }} />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-faint)" }}>Votre e-mail *</label>
                  <input value={form.email} onChange={set("email")} type="email" placeholder="marie@exemple.fr" className={inputCls} style={{ borderColor: "var(--border)", background: "var(--bg)", color: "var(--text)" }} />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-faint)" }}>Sujet</label>
                <select value={form.subject} onChange={set("subject")} className={inputCls} style={{ borderColor: "var(--border)", background: "var(--bg)", color: "var(--text)" }}>
                  <option>Question générale</option>
                  <option>Signaler un bug</option>
                  <option>Proposer une fonctionnalité</option>
                  <option>Problème de réception</option>
                  <option>Demande API / développeur</option>
                  <option>Autre</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-faint)" }}>Message * ({form.message.length}/2000)</label>
                <textarea value={form.message} onChange={set("message")} rows={6} maxLength={2000} placeholder="Décrivez votre demande en détail…" className={`${inputCls} resize-none`} style={{ borderColor: "var(--border)", background: "var(--bg)", color: "var(--text)" }} />
              </div>
              <button type="submit" disabled={sending} className="btn-primary flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-bold disabled:opacity-60">
                <Send size={16} /> {sending ? "Envoi en cours…" : "Envoyer le message"}
              </button>
              <p className="text-center text-[11px]" style={{ color: "var(--text-faint)" }}>
                En envoyant ce formulaire, vous acceptez que vos données soient utilisées uniquement pour traiter votre demande. Aucun spam, promis.
              </p>
            </form>
          )}
        </div>
      </div>

      <AdSlot slot="page" className="mt-10" />
    </div>
  );
}
