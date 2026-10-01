import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, Zap, Heart, Users, ArrowRight, Check, Mail, Lock, Trash2 } from "lucide-react";
import AdSlot from "@/components/ads/ad-slot";

export const metadata: Metadata = {
  title: "À propos — Notre mission anti-spam",
  description:
    "Découvrez TempMail Premium : notre mission, nos valeurs, notre engagement confidentialité et nos conditions d'utilisation.",
};

export default function AboutPage() {
  const values = [
    { icon: ShieldCheck, title: "Confidentialité absolue", desc: "Aucune inscription, aucun cookie de pistage, aucun log d'IP conservé. L'anonymat n'est pas une option, c'est notre architecture." },
    { icon: Zap, title: "Vitesse extrême", desc: "Réception en moins d'une seconde, interface instantanée, infrastructure répartie. Chaque milliseconde compte." },
    { icon: Heart, title: "Simplicité radicale", desc: "Un clic pour créer, un clic pour copier. Aucun tutoriel nécessaire, du mobile au PC." },
    { icon: Users, title: "Gratuit pour tous", desc: "Adresses illimitées, vrais domaines e-mail actifs, sans compte et sans publicité intrusive. Pour toujours." },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6">
      {/* Hero */}
      <div className="mx-auto mt-10 max-w-3xl text-center">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-500">À propos</p>
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl" style={{ color: "var(--text)" }}>
          On a créé la boîte jetable <span className="gradient-text">qu&apos;on rêvait d&apos;utiliser</span>
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
          TempMail Premium est né d&apos;un constat simple : 85 % des e-mails mondiaux sont du spam, et votre
          adresse personnelle est revendue en moyenne 6 fois après une simple inscription. Il était temps
          de reprendre le contrôle.
        </p>
      </div>

      {/* Stats */}
      <div className="card mx-auto mt-10 grid max-w-4xl grid-cols-2 gap-6 rounded-3xl p-8 sm:grid-cols-4">
        {[
          { v: "128K+", l: "Utilisateurs" },
          { v: "894K+", l: "E-mails reçus" },
          { v: "4.9/5", l: "Satisfaction" },
          { v: "99.98%", l: "Disponibilité" },
        ].map((s) => (
          <div key={s.l} className="text-center">
            <p className="text-3xl font-extrabold gradient-text">{s.v}</p>
            <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>{s.l}</p>
          </div>
        ))}
      </div>

      {/* Values */}
      <div className="mt-14 grid gap-4 sm:grid-cols-2">
        {values.map((v) => (
          <div key={v.title} className="card card-hover rounded-3xl p-7">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-indigo-500/10 text-indigo-500">
              <v.icon size={22} />
            </span>
            <h3 className="mt-4 text-lg font-bold" style={{ color: "var(--text)" }}>{v.title}</h3>
            <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>{v.desc}</p>
          </div>
        ))}
      </div>

      {/* Privacy commitment */}
      <div id="confidentialite" className="mt-14 scroll-mt-24 rounded-3xl bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 p-8 sm:p-12">
        <h2 className="text-2xl font-extrabold text-white sm:text-3xl">Notre engagement confidentialité 🛡️</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            { icon: Lock, t: "Chiffrement total", d: "Tout le trafic est chiffré en TLS 1.3. Les contenus HTML sont assainis avant affichage : aucun traqueur ne peut vous pister." },
            { icon: Trash2, t: "Suppression garantie", d: "À l'expiration, l'adresse et ses messages sont purgés définitivement. Aucune sauvegarde, aucune archive cachée." },
            { icon: Mail, t: "Réception seule", d: "Impossible d'envoyer des e-mails depuis nos domaines : notre réseau ne peut pas servir au spam ou au phishing." },
          ].map((c) => (
            <div key={c.t} className="rounded-2xl border border-white/10 bg-white/[0.06] p-6 backdrop-blur-xl">
              <c.icon size={22} className="text-emerald-400" />
              <h3 className="mt-3 font-bold text-white">{c.t}</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-slate-400">{c.d}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Terms */}
      <div id="conditions" className="card mt-8 scroll-mt-24 rounded-3xl p-8 sm:p-10">
        <h2 className="text-2xl font-extrabold" style={{ color: "var(--text)" }}>Conditions d&apos;utilisation (résumé)</h2>
        <ul className="mt-5 space-y-3 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
          {[
            "Le service est gratuit, sans inscription, et fourni « en l'état » pour un usage personnel et légal.",
            "Les adresses expirent après 60 minutes (prolongeables jusqu'à 10 fois) puis sont détruites avec leurs messages.",
            "N'utilisez pas d'adresse temporaire pour la banque, la santé, l'administration ou tout service sensible.",
            "Tout usage abusif, frauduleux ou illégal entraîne un blocage immédiat.",
            "Nous ne garantissons pas la réception des e-mails de tous les expéditeurs : certains sites bloquent les domaines jetables.",
          ].map((t, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-indigo-500/10 text-indigo-500">
                <Check size={12} strokeWidth={3} />
              </span>
              {t}
            </li>
          ))}
        </ul>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link href="/" className="btn-primary flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold">
            Créer une adresse <ArrowRight size={16} />
          </Link>
          <Link href="/contact" className="flex items-center gap-2 rounded-xl border px-6 py-3 text-sm font-semibold transition hover:-translate-y-0.5" style={{ borderColor: "var(--border)", color: "var(--text)" }}>
            Nous contacter
          </Link>
        </div>
      </div>

      <AdSlot slot="page" className="mt-10" />
    </div>
  );
}
