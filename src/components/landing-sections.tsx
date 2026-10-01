"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Zap,
  ShieldCheck,
  Timer,
  QrCode,
  Search,
  Bell,
  Copy,
  Inbox,
  Smartphone,
  Moon,
  Trash2,
  Paperclip,
  ArrowRight,
  Check,
  Lock,
  EyeOff,
  Server,
  Globe,
  ChevronDown,
  Code2,
  Mail,
} from "lucide-react";

/* ---------- Global live stats ---------- */
export function LiveStats() {
  const [stats, setStats] = useState({ addressesTotal: 128400, messagesTotal: 894200, addressesToday: 1240, messagesToday: 8930, uptime: 99.98, avgDeliveryMs: 820 });

  useEffect(() => {
    fetch("/api/stats").then((r) => r.json()).then(setStats).catch(() => {});
    const t = setInterval(() => {
      setStats((s) => ({ ...s, messagesTotal: s.messagesTotal + Math.floor(Math.random() * 3), messagesToday: s.messagesToday + Math.floor(Math.random() * 2) }));
    }, 4000);
    return () => clearInterval(t);
  }, []);

  const fmt = (n: number) => n.toLocaleString("fr-FR");
  const items = [
    { label: "Adresses créées", value: fmt(stats.addressesTotal), sub: `+${fmt(stats.addressesToday)} aujourd'hui` },
    { label: "E-mails reçus", value: fmt(stats.messagesTotal), sub: `+${fmt(stats.messagesToday)} aujourd'hui` },
    { label: "Disponibilité", value: `${stats.uptime}%`, sub: "30 derniers jours" },
    { label: "Livraison moyenne", value: `< 1s`, sub: `${stats.avgDeliveryMs} ms mesurés` },
  ];

  return (
    <section className="mx-auto mt-16 max-w-7xl px-4 sm:px-6">
      <div className="card relative overflow-hidden rounded-3xl p-8 sm:p-10">
        <div className="bg-orb left-[-80px] top-[-80px] h-64 w-64 bg-indigo-500/40" />
        <div className="bg-orb bottom-[-100px] right-[-60px] h-72 w-72 bg-fuchsia-500/30" />
        <div className="relative flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div>
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-indigo-500">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse-dot" />
              Réseau en temps réel
            </p>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl" style={{ color: "var(--text)" }}>
              Une infrastructure qui ne dort jamais
            </h2>
          </div>
          <Link href="/api-docs" className="flex shrink-0 items-center gap-1.5 rounded-xl border px-4 py-2.5 text-sm font-semibold transition hover:-translate-y-0.5 hover:border-indigo-400 hover:text-indigo-500" style={{ borderColor: "var(--border)", color: "var(--text)" }}>
            <Code2 size={16} /> Voir l&apos;API
          </Link>
        </div>
        <div className="relative mt-8 grid grid-cols-2 gap-6 lg:grid-cols-4">
          {items.map((it) => (
            <div key={it.label} className="border-l-2 border-indigo-500/30 pl-4">
              <p className="text-2xl font-extrabold tracking-tight sm:text-3xl" style={{ color: "var(--text)" }}>{it.value}</p>
              <p className="mt-1 text-sm font-semibold" style={{ color: "var(--text-muted)" }}>{it.label}</p>
              <p className="text-xs" style={{ color: "var(--text-faint)" }}>{it.sub}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- How it works ---------- */
export function HowItWorks() {
  const steps = [
    { icon: Zap, title: "1. Copiez votre adresse", desc: "Une adresse unique est générée instantanément. Un clic suffit pour la copier ou la partager en QR Code.", color: "from-indigo-500 to-violet-500" },
    { icon: Inbox, title: "2. Recevez en direct", desc: "Utilisez-la pour vos inscriptions. Les e-mails arrivent en moins d'une seconde, sans actualisation manuelle.", color: "from-violet-500 to-fuchsia-500" },
    { icon: Trash2, title: "3. Laissez disparaître", desc: "À l'expiration, l'adresse et tous ses messages sont définitivement détruits. Zéro trace, zéro spam.", color: "from-fuchsia-500 to-rose-500" },
  ];
  return (
    <section className="mx-auto mt-20 max-w-7xl px-4 sm:px-6">
      <div className="text-center">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-500">Simple comme bonjour</p>
        <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl" style={{ color: "var(--text)" }}>
          Comment ça <span className="gradient-text">marche ?</span>
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-[15px]" style={{ color: "var(--text-muted)" }}>
          Trois étapes, zéro inscription, zéro mot de passe. La protection anti-spam la plus rapide du web.
        </p>
      </div>
      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {steps.map((s, i) => (
          <div key={s.title} className={`card card-hover animate-fade-up stagger-${i + 1} relative overflow-hidden rounded-3xl p-7`}>
            <span className={`inline-grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br text-white shadow-lg ${s.color}`}>
              <s.icon size={24} />
            </span>
            <h3 className="mt-5 text-lg font-bold" style={{ color: "var(--text)" }}>{s.title}</h3>
            <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>{s.desc}</p>
            <span className="pointer-events-none absolute -bottom-4 -right-2 select-none text-[110px] font-extrabold leading-none opacity-[0.05]" style={{ color: "var(--text)" }}>
              {i + 1}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------- Features grid ---------- */
export function Features() {
  const features = [
    { icon: Zap, title: "Réception instantanée", desc: "Actualisation auto toutes les 4 secondes + indicateur de connexion temps réel." },
    { icon: Copy, title: "Copie en 1 clic", desc: "Confirmation visuelle animée et notifications élégantes, jamais d'alertes natives." },
    { icon: QrCode, title: "QR Code intégré", desc: "Partagez votre adresse sur mobile en un scan, sans ressaisie." },
    { icon: Timer, title: "Compte à rebours", desc: "Barre de progression, prolongation +60 min et expiration automatique." },
    { icon: Search, title: "Recherche & filtres", desc: "Retrouvez un message par expéditeur ou objet. Filtres : lus, non lus, pièces jointes." },
    { icon: Paperclip, title: "Pièces jointes réelles", desc: "Téléchargez les fichiers reçus en un clic, en toute sécurité via notre proxy." },
    { icon: Moon, title: "Dark / Light soigné", desc: "Deux thèmes réellement travaillés, mémorisés entre vos visites." },
    { icon: Smartphone, title: "100 % responsive", desc: "Parfait sur téléphone, tablette et PC avec navigation mobile dédiée." },
    { icon: Bell, title: "Notifications live", desc: "Soyez alerté dès qu'un nouvel e-mail arrive dans votre boîte." },
  ];
  return (
    <section id="fonctionnalites" className="mx-auto mt-20 max-w-7xl px-4 sm:px-6">
      <div className="text-center">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-500">Fonctionnalités premium</p>
        <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl" style={{ color: "var(--text)" }}>
          Tout ce qu&apos;une boîte jetable <span className="gradient-text">devrait être</span>
        </h2>
      </div>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f, i) => (
          <div key={f.title} className={`card card-hover animate-fade-up rounded-2xl p-6 stagger-${(i % 3) + 1}`}>
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-indigo-500/10 text-indigo-500">
              <f.icon size={20} />
            </span>
            <h3 className="mt-4 text-[15px] font-bold" style={{ color: "var(--text)" }}>{f.title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------- Privacy ---------- */
export function Privacy() {
  const points = [
    { icon: EyeOff, title: "Zéro inscription", desc: "Aucun nom, aucun mot de passe, aucun cookie de pistage. Votre anonymat est total." },
    { icon: Lock, title: "Aucun traqueur", desc: "Les images et scripts externes sont neutralisés. Personne ne sait que vous avez lu un e-mail." },
    { icon: Server, title: "Destruction automatique", desc: "Adresses expirées et messages purgés définitivement. Aucune archive cachée." },
    { icon: Globe, title: "Domaines rotatifs", desc: "De vrais domaines e-mail actifs, renouvelés automatiquement pour éviter les blocages." },
  ];
  return (
    <section id="confidentialite" className="mx-auto mt-20 max-w-7xl px-4 sm:px-6">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 p-8 sm:p-12">
        <div className="bg-orb left-10 top-10 h-56 w-56 bg-indigo-500/50" />
        <div className="bg-orb bottom-0 right-20 h-56 w-56 bg-fuchsia-500/40" />
        <div className="relative grid items-center gap-10 lg:grid-cols-[1fr_1.2fr]">
          <div>
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-emerald-400">
              <ShieldCheck size={15} /> Confidentialité d&apos;abord
            </p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Votre vie privée n&apos;est pas une option
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-slate-300">
              Chaque adresse est isolée, chiffrée en transit et détruite à l&apos;expiration.
              Nous ne vendons, ne partageons et ne conservons aucune donnée personnelle.
            </p>
            <ul className="mt-6 space-y-2.5">
              {["Aucun log d'IP conservé", "Contenus HTML assainis", "Suppression manuelle à tout moment"].map((t) => (
                <li key={t} className="flex items-center gap-2.5 text-sm text-slate-200">
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-emerald-500/20 text-emerald-400">
                    <Check size={12} strokeWidth={3} />
                  </span>
                  {t}
                </li>
              ))}
            </ul>
            <Link href="/about" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-slate-900 transition hover:-translate-y-0.5 hover:shadow-xl">
              Notre engagement <ArrowRight size={16} />
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {points.map((p) => (
              <div key={p.title} className="rounded-2xl border border-white/10 bg-white/[0.06] p-5 backdrop-blur-xl transition hover:bg-white/[0.1]">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500/15 text-emerald-400">
                  <p.icon size={19} />
                </span>
                <h3 className="mt-3 text-[15px] font-bold text-white">{p.title}</h3>
                <p className="mt-1 text-[13px] leading-relaxed text-slate-400">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- FAQ preview ---------- */
export function FaqPreview() {
  const [open, setOpen] = useState(0);
  const faqs = [
    { q: "Qu'est-ce qu'une adresse e-mail temporaire ?", a: "C'est une adresse jetable valide 60 minutes (prolongeable) qui reçoit des e-mails comme une vraie boîte, sans inscription. Idéale pour les inscriptions, essais gratuits et téléchargements, sans exposer votre adresse personnelle au spam." },
    { q: "Puis-je envoyer des e-mails ?", a: "Non, et c'est volontaire : TempMail Premium est en réception seule pour empêcher tout abus (spam, phishing). Vous pouvez recevoir, lire, et gérer vos messages en toute sécurité." },
    { q: "Que se passe-t-il à l'expiration ?", a: "L'adresse et tous ses messages sont définitivement supprimés de nos serveurs. Aucune récupération possible, aucune archive : c'est la garantie de votre anonymat." },
    { q: "Est-ce vraiment gratuit ?", a: "Oui, 100 % gratuit et illimité : créez autant d'adresses que vous voulez, sur de vrais domaines e-mail actifs, sans compte et sans publicité intrusive." },
  ];
  return (
    <section className="mx-auto mt-20 max-w-4xl px-4 sm:px-6">
      <div className="text-center">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-500">Questions fréquentes</p>
        <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl" style={{ color: "var(--text)" }}>
          On vous dit <span className="gradient-text">tout</span>
        </h2>
      </div>
      <div className="mt-8 space-y-3">
        {faqs.map((f, i) => (
          <div key={i} className="card overflow-hidden rounded-2xl">
            <button onClick={() => setOpen(open === i ? -1 : i)} className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left">
              <span className="text-[15px] font-bold" style={{ color: "var(--text)" }}>{f.q}</span>
              <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full transition ${open === i ? "rotate-180 bg-indigo-500 text-white" : ""}`} style={open === i ? undefined : { background: "var(--bg-muted)", color: "var(--text-muted)" }}>
                <ChevronDown size={17} />
              </span>
            </button>
            {open === i && (
              <p className="animate-fade-in border-t px-6 py-5 text-sm leading-relaxed" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>
                {f.a}
              </p>
            )}
          </div>
        ))}
      </div>
      <div className="mt-6 text-center">
        <Link href="/faq" className="inline-flex items-center gap-2 rounded-xl border px-5 py-3 text-sm font-semibold transition hover:-translate-y-0.5 hover:border-indigo-400 hover:text-indigo-500" style={{ borderColor: "var(--border)", color: "var(--text)" }}>
          Voir toutes les questions <ArrowRight size={16} />
        </Link>
      </div>
    </section>
  );
}

/* ---------- CTA ---------- */
export function Cta() {
  return (
    <section className="mx-auto mt-20 max-w-7xl px-4 sm:px-6">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 p-10 text-center sm:p-14">
        <div className="bg-orb left-1/4 top-[-60px] h-48 w-48 bg-white/20" />
        <Mail size={44} className="relative mx-auto text-white/90" />
        <h2 className="relative mx-auto mt-4 max-w-2xl text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          Fini le spam. Reprenez le contrôle de votre boîte mail.
        </h2>
        <p className="relative mx-auto mt-3 max-w-xl text-[15px] text-white/85">
          Rejoignez plus de 128 000 utilisateurs qui protègent leur adresse personnelle chaque jour.
        </p>
        <a href="#top" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="relative mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 text-sm font-bold text-indigo-700 shadow-xl transition hover:-translate-y-0.5 hover:shadow-2xl">
          <Zap size={17} /> Créer mon adresse gratuite
        </a>
        <p className="relative mt-3 text-xs text-white/70">Gratuit • Sans inscription • Prêt en 1 seconde</p>
      </div>
    </section>
  );
}
