"use client";

import { useState } from "react";
import { Code2, Play, Copy, Check, Zap, ShieldCheck, Clock } from "lucide-react";
import { useToast } from "@/components/providers";
import AdSlot from "@/components/ads/ad-slot";

const ENDPOINTS = [
  {
    method: "GET",
    path: "/api/domains",
    title: "Domaines actifs",
    desc: "Liste les domaines e-mail réellement actifs pour créer des adresses.",
    body: null,
    response: `{ "domains": ["uberip.com"], "provider": "mail.tm" }`,
  },
  {
    method: "POST",
    path: "/api/addresses",
    title: "Créer une adresse réelle",
    desc: "Crée un vrai compte e-mail (valide 60 minutes) capable de recevoir de vrais messages, avec messages de bienvenue.",
    body: `{\n  "localPart": "mon.test.42",\n  "domain": "uberip.com"\n}`,
    response: `{\n  "address": {\n    "id": "uuid",\n    "email": "mon.test.42@uberip.com",\n    "token": "jeton-secret",\n    "expiresAt": "2026-10-01T12:00:00Z"\n  }\n}`,
  },
  {
    method: "GET",
    path: "/api/addresses?token=xxx",
    title: "Récupérer mon adresse",
    desc: "Retrouve l'adresse liée à votre jeton anonyme.",
    body: null,
    response: `{ "address": { "email": "...", "messageCount": 3 } }`,
  },
  {
    method: "GET",
    path: "/api/addresses/{id}/messages",
    title: "Lister les messages",
    desc: "Paramètres : token (requis), search, filter (all|unread|read|attachments).",
    body: null,
    response: `{\n  "messages": [...],\n  "total": 12,\n  "unread": 4\n}`,
  },
  {
    method: "GET",
    path: "/api/messages/{id}?token=xxx",
    title: "Lire un message",
    desc: "Retourne le contenu complet (texte + HTML) et marque comme lu.",
    body: null,
    response: `{ "message": { "subject": "...", "bodyHtml": "..." } }`,
  },
  {
    method: "PATCH",
    path: "/api/messages/{id}",
    title: "Marquer lu / non lu",
    desc: "Bascule le statut de lecture d'un message.",
    body: `{ "token": "xxx", "isRead": true }`,
    response: `{ "ok": true, "isRead": true }`,
  },
  {
    method: "DELETE",
    path: "/api/messages/{id}",
    title: "Supprimer un message",
    desc: "Suppression définitive et immédiate.",
    body: `{ "token": "xxx" }`,
    response: `{ "ok": true }`,
  },
  {
    method: "POST",
    path: "/api/addresses/{id}/extend",
    title: "Prolonger +60 min",
    desc: "Repousse l'expiration de 60 minutes (max 10 prolongations).",
    body: `{ "token": "xxx" }`,
    response: `{ "address": { "expiresAt": "...", "extendedCount": 1 } }`,
  },
  {
    method: "DELETE",
    path: "/api/addresses/{id}?token=xxx",
    title: "Supprimer une adresse",
    desc: "Détruit l'adresse et tous ses messages (cascade).",
    body: null,
    response: `{ "ok": true }`,
  },
];

function MethodBadge({ m }: { m: string }) {
  const colors: Record<string, string> = {
    GET: "bg-emerald-500/15 text-emerald-500",
    POST: "bg-indigo-500/15 text-indigo-500",
    PATCH: "bg-amber-500/15 text-amber-500",
    DELETE: "bg-rose-500/15 text-rose-500",
  };
  return <span className={`rounded-lg px-2.5 py-1 font-mono text-[11px] font-bold ${colors[m]}`}>{m}</span>;
}

export default function ApiDocsPage() {
  const { notify } = useToast();
  const [copied, setCopied] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);
  const [tab, setTab] = useState<"curl" | "js">("js");

  const copy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {}
    setCopied(key);
    notify("success", "Copié dans le presse-papiers");
    setTimeout(() => setCopied(null), 1800);
  };

  const testStats = async () => {
    setTesting(true);
    try {
      const res = await fetch("/api/stats");
      const data = await res.json();
      setTestResult(JSON.stringify(data, null, 2));
      notify("success", "Requête réussie", `${res.status} OK en quelques ms`);
    } catch {
      notify("error", "Échec de la requête");
    } finally {
      setTesting(false);
    }
  };

  const quickstartJs = `// 1. Créer une adresse\nconst res = await fetch("/api/addresses", {\n  method: "POST",\n  headers: { "Content-Type": "application/json" },\n  body: JSON.stringify({})\n});\nconst { address } = await res.json();\nconsole.log(address.email, address.token);\n\n// 2. Lister les messages (polling 4s recommandé)\nconst inbox = await fetch(\n  \`/api/addresses/\${address.id}/messages?token=\${address.token}\`\n).then(r => r.json());\nconsole.log(inbox.total, "messages,", inbox.unread, "non lus");\n\n// 3. Lire un message\nconst msg = await fetch(\n  \`/api/messages/\${inbox.messages[0].id}?token=\${address.token}\`\n).then(r => r.json());`;

  const quickstartCurl = `# Créer une adresse\ncurl -X POST https://votre-site.vercel.app/api/addresses \\\n  -H "Content-Type: application/json" \\\n  -d '{}'\n\n# Lister les messages\ncurl "https://votre-site.vercel.app/api/addresses/ID/messages?token=TOKEN"\n\n# Prolonger de 60 min\ncurl -X POST https://votre-site.vercel.app/api/addresses/ID/extend \\\n  -H "Content-Type: application/json" \\\n  -d '{"token":"TOKEN"}'`;

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <div className="mx-auto mt-10 max-w-3xl text-center">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-500">Développeurs</p>
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl" style={{ color: "var(--text)" }}>
          API <span className="gradient-text">TempMail</span>
        </h1>
        <p className="mt-3 text-[15px]" style={{ color: "var(--text-muted)" }}>
          API REST simple, sans clé, sans authentification complexe. Un jeton anonyme par adresse,
          du JSON partout, prête pour vos tests automatisés.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2 text-xs font-semibold">
          {[{ t: "Sans clé API", Icon: Zap }, { t: "JSON partout", Icon: Code2 }, { t: "Limite souple : 60 req/min", Icon: Clock }, { t: "CORS ouvert", Icon: ShieldCheck }].map(({ t, Icon }) => (
            <span key={t} className="flex items-center gap-1.5 rounded-full border px-3.5 py-1.5" style={{ borderColor: "var(--border)", background: "var(--bg-soft)", color: "var(--text-muted)" }}>
              <Icon size={13} className="text-indigo-500" /> {t}
            </span>
          ))}
        </div>
      </div>

      {/* Quickstart */}
      <div className="card mt-10 overflow-hidden rounded-3xl">
        <div className="flex items-center justify-between border-b px-6 py-4" style={{ borderColor: "var(--border)" }}>
          <h2 className="flex items-center gap-2 text-[15px] font-bold" style={{ color: "var(--text)" }}>
            <Zap size={17} className="text-indigo-500" /> Démarrage rapide
          </h2>
          <div className="flex gap-1 rounded-xl p-1" style={{ background: "var(--bg-muted)" }}>
            {(["js", "curl"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)} className={`rounded-lg px-3.5 py-1.5 font-mono text-xs font-bold transition ${tab === t ? "bg-indigo-500 text-white" : ""}`} style={tab === t ? undefined : { color: "var(--text-muted)" }}>
                {t === "js" ? "JavaScript" : "cURL"}
              </button>
            ))}
          </div>
        </div>
        <div className="relative bg-[#0b1120] p-6">
          <button onClick={() => copy(tab === "js" ? quickstartJs : quickstartCurl, "qs")} className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-lg bg-white/10 text-slate-300 transition hover:bg-white/20">
            {copied === "qs" ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
          </button>
          <pre className="overflow-x-auto font-mono text-[13px] leading-relaxed text-slate-200">
            {tab === "js" ? quickstartJs : quickstartCurl}
          </pre>
        </div>
      </div>

      {/* Live test */}
      <div className="card mt-5 rounded-3xl p-6 sm:p-8">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="flex items-center gap-2 text-[15px] font-bold" style={{ color: "var(--text)" }}>
              <Play size={17} className="text-emerald-500" /> Testez en direct
            </h2>
            <p className="mt-1 font-mono text-xs" style={{ color: "var(--text-faint)" }}>
              GET /api/stats — aucune authentification requise
            </p>
          </div>
          <button onClick={testStats} disabled={testing} className="btn-primary flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold disabled:opacity-60">
            <Play size={15} /> {testing ? "Envoi…" : "Exécuter la requête"}
          </button>
        </div>
        {testResult && (
          <pre className="animate-fade-in mt-4 max-h-64 overflow-auto rounded-2xl bg-[#0b1120] p-5 font-mono text-[13px] leading-relaxed text-emerald-300">
            {testResult}
          </pre>
        )}
      </div>

      {/* Endpoints */}
      <h2 className="mt-12 text-2xl font-extrabold" style={{ color: "var(--text)" }}>Référence des endpoints</h2>
      <div className="mt-5 space-y-4">
        {ENDPOINTS.map((e, i) => (
          <div key={i} className="card animate-fade-up overflow-hidden rounded-2xl" style={{ animationDelay: `${Math.min(i * 0.05, 0.3)}s` }}>
            <div className="flex flex-wrap items-center gap-3 px-6 py-4">
              <MethodBadge m={e.method} />
              <code className="font-mono text-sm font-bold" style={{ color: "var(--text)" }}>{e.path}</code>
              <span className="ml-auto text-sm font-semibold" style={{ color: "var(--text-muted)" }}>{e.title}</span>
            </div>
            <div className="grid gap-0 border-t md:grid-cols-2" style={{ borderColor: "var(--border)" }}>
              <div className="border-b p-5 md:border-b-0 md:border-r" style={{ borderColor: "var(--border)" }}>
                <p className="text-[13px] leading-relaxed" style={{ color: "var(--text-muted)" }}>{e.desc}</p>
                {e.body && (
                  <>
                    <p className="mb-1.5 mt-4 text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--text-faint)" }}>Corps de requête</p>
                    <pre className="overflow-x-auto rounded-xl bg-[#0b1120] p-4 font-mono text-xs leading-relaxed text-slate-200">{e.body}</pre>
                  </>
                )}
              </div>
              <div className="p-5">
                <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--text-faint)" }}>Réponse 200</p>
                <pre className="overflow-x-auto rounded-xl bg-[#0b1120] p-4 font-mono text-xs leading-relaxed text-emerald-300">{e.response}</pre>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card mt-8 rounded-3xl p-8 text-center">
        <p className="font-bold" style={{ color: "var(--text)" }}>Besoin d&apos;un SDK ou d&apos;un webhook ?</p>
        <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>Dites-le-nous, la feuille de route est pilotée par vos retours.</p>
        <a href="/contact" className="btn-primary mt-4 inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold">
          Proposer une fonctionnalité
        </a>
      </div>

      <AdSlot slot="page" className="mt-8" />
    </div>
  );
}
