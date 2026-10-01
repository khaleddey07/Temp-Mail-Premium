"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, Search, ArrowRight, MessageCircle } from "lucide-react";
import AdSlot from "@/components/ads/ad-slot";

const CATEGORIES = ["Tous", "Général", "Confidentialité", "Technique", "Limites"] as const;

const FAQS: { cat: (typeof CATEGORIES)[number]; q: string; a: string }[] = [
  { cat: "Général", q: "Qu'est-ce qu'une adresse e-mail temporaire ?", a: "C'est une adresse jetable valide 60 minutes (prolongeable) qui reçoit des e-mails comme une vraie boîte mail, sans inscription ni mot de passe. Parfaite pour les inscriptions, essais gratuits, téléchargements et vérifications ponctuelles." },
  { cat: "Général", q: "Le service est-il vraiment gratuit ?", a: "Oui, 100 % gratuit et illimité : autant d'adresses que vous voulez, de vrais domaines e-mail actifs, réception instantanée, QR Code et prolongations. Aucun compte, aucune carte bancaire. Le service est financé par quelques encarts publicitaires discrets, sans pop-ups ni redirections agressives." },
  { cat: "Général", q: "Dois-je créer un compte ?", a: "Non. Aucune inscription, aucun mot de passe, aucun e-mail de confirmation. Votre adresse est générée instantanément et liée à un jeton anonyme stocké dans votre navigateur." },
  { cat: "Général", q: "Puis-je choisir mon adresse personnalisée ?", a: "Oui ! Cliquez sur « Nouveau » puis activez la personnalisation : choisissez votre nom d'utilisateur et votre domaine parmi les domaines réellement actifs du moment (renouvelés automatiquement pour rester acceptés partout)." },
  { cat: "Confidentialité", q: "Mes e-mails sont-ils privés ?", a: "Oui. Seul le détenteur du jeton anonyme (votre navigateur) peut accéder à votre boîte. Les contenus HTML sont assainis, les traqueurs externes neutralisés, et tout est détruit à l'expiration." },
  { cat: "Confidentialité", q: "Conservez-vous mes données ?", a: "Non. Aucun log d'IP conservé, aucune revente, aucun partage. Les adresses expirées et leurs messages sont purgés définitivement de nos serveurs, sans archive cachée." },
  { cat: "Confidentialité", q: "Puis-je supprimer mes données manuellement ?", a: "À tout moment : supprimez un message individuellement, videz toute la boîte, ou détruisez l'adresse entière d'un clic. La suppression est immédiate et irréversible." },
  { cat: "Technique", q: "À quelle vitesse les e-mails arrivent-ils ?", a: "En quelques secondes en général. La boîte s'actualise automatiquement toutes les 4 secondes et vous notifie dès qu'un nouveau message arrive. L'indicateur « En direct » confirme la connexion temps réel." },
  { cat: "Technique", q: "Puis-je envoyer des e-mails ?", a: "Non, la réception seule est volontaire : cela empêche tout usage abusif (spam, phishing) et garantit que nos domaines restent bien délivrés pour la réception." },
  { cat: "Technique", q: "Les pièces jointes sont-elles prises en charge ?", a: "Oui, elles s'affichent avec leur nom, taille et type, et vous pouvez les télécharger réellement via notre proxy sécurisé. Les contenus HTML restent assainis pour bloquer les traqueurs." },
  { cat: "Technique", q: "Comment fonctionne le QR Code ?", a: "Cliquez sur « QR Code » sous votre adresse : un code s'affiche pour copier l'adresse sur votre téléphone en un scan. Idéal pour les inscriptions mobiles." },
  { cat: "Technique", q: "Proposez-vous une API ?", a: "Oui ! Notre API REST permet de créer des adresses, lister les messages et automatiser vos tests. Consultez la page API pour la documentation complète et les exemples de code." },
  { cat: "Limites", q: "Combien de temps mon adresse reste-t-elle valide ?", a: "60 minutes par défaut, avec une barre de progression et un compte à rebours. Vous pouvez prolonger de 60 minutes jusqu'à 10 fois (soit 11h maximum)." },
  { cat: "Limites", q: "Que se passe-t-il à l'expiration ?", a: "L'adresse et tous ses messages sont définitivement supprimés. Aucune récupération possible : pensez à prolonger ou à sauvegarder les informations importantes avant la fin." },
  { cat: "Limites", q: "Pourquoi certains sites refusent-ils mon adresse ?", a: "Certains services (banques, administrations, parfois réseaux sociaux) bloquent les domaines jetables connus. Le domaine actif change régulièrement : réessayez avec une nouvelle adresse, et gardez votre adresse réelle pour les services sensibles — c'est d'ailleurs recommandé." },
  { cat: "Limites", q: "Combien de messages puis-je recevoir ?", a: "Jusqu'à 100 messages affichés par boîte, ce qui est largement suffisant pour un usage temporaire. Les anciens messages restent accessibles jusqu'à l'expiration ou la suppression." },
];

export default function FaqPage() {
  const [cat, setCat] = useState<(typeof CATEGORIES)[number]>("Tous");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState<number | null>(0);

  const filtered = FAQS.filter(
    (f) =>
      (cat === "Tous" || f.cat === cat) &&
      (!search || (f.q + f.a).toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6">
      <div className="mt-10 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-500">Centre d&apos;aide</p>
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl" style={{ color: "var(--text)" }}>
          Questions <span className="gradient-text">fréquentes</span>
        </h1>
        <p className="mt-3 text-[15px]" style={{ color: "var(--text-muted)" }}>
          Tout ce que vous devez savoir sur les e-mails temporaires. {FAQS.length} réponses détaillées.
        </p>
      </div>

      {/* Search */}
      <div className="relative mx-auto mt-8 max-w-xl">
        <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: "var(--text-faint)" }} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher une question…"
          className="w-full rounded-2xl border py-3.5 pl-12 pr-4 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
          style={{ borderColor: "var(--border)", background: "var(--bg-soft)", color: "var(--text)" }}
        />
      </div>

      {/* Categories */}
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => { setCat(c); setOpen(0); }}
            className={`rounded-full px-4 py-2 text-[13px] font-semibold transition ${
              cat === c ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/30" : ""
            }`}
            style={cat === c ? undefined : { background: "var(--bg-soft)", color: "var(--text-muted)", border: "1px solid var(--border)" }}
          >
            {c}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="mt-8 space-y-3">
        {filtered.length === 0 && (
          <div className="card rounded-2xl p-10 text-center">
            <p className="font-bold" style={{ color: "var(--text)" }}>Aucun résultat pour « {search} »</p>
            <p className="mt-1 text-sm" style={{ color: "var(--text-faint)" }}>Essayez un autre mot-clé ou contactez-nous.</p>
          </div>
        )}
        {filtered.map((f, i) => (
          <div key={i} className="card animate-fade-in overflow-hidden rounded-2xl">
            <button onClick={() => setOpen(open === i ? null : i)} className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left">
              <span>
                <span className="mb-1 inline-block rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-indigo-500">
                  {f.cat}
                </span>
                <span className="block text-[15px] font-bold" style={{ color: "var(--text)" }}>{f.q}</span>
              </span>
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

      {/* CTA */}
      <div className="card mt-8 flex flex-col items-center gap-4 rounded-3xl p-8 text-center sm:flex-row sm:text-left">
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-indigo-500/10 text-indigo-500">
          <MessageCircle size={26} />
        </span>
        <div className="flex-1">
          <p className="font-bold" style={{ color: "var(--text)" }}>Toujours bloqué ?</p>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>Notre équipe répond en moins de 24h, 7j/7.</p>
        </div>
        <Link href="/contact" className="btn-primary flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold">
          Nous contacter <ArrowRight size={16} />
        </Link>
      </div>

      <AdSlot slot="page" className="mt-8" />
    </div>
  );
}
