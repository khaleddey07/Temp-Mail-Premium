import Link from "next/link";
import { ArrowRight, Check, Info, Lightbulb, Quote } from "lucide-react";
import type { BlogBlock } from "@/content/blog-types";

/* Rendu serveur des blocs d'article. Support inline : **gras** et [texte](/lien). */

const TOKEN = /(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g;

function renderInline(text: string, prefix: string) {
  const tokens = text.split(TOKEN).filter(Boolean);
  return tokens.map((tk, i) => {
    const key = `${prefix}-${i}`;
    if (tk.startsWith("**") && tk.endsWith("**")) {
      return (
        <strong key={key} style={{ color: "var(--text)" }}>
          {tk.slice(2, -2)}
        </strong>
      );
    }
    const m = tk.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (m) {
      return (
        <Link key={key} href={m[2]} className="font-semibold text-indigo-500 hover:underline">
          {m[1]}
        </Link>
      );
    }
    return <span key={key}>{tk}</span>;
  });
}

export function FaqAccordion({ items }: { items: { q: string; a: string }[] }) {
  return (
    <div className="space-y-3">
      {items.map((f) => (
        <details
          key={f.q}
          className="card group rounded-2xl px-5 py-4 [&_summary::-webkit-details-marker]:hidden"
        >
          <summary className="flex cursor-pointer items-center justify-between gap-3 text-sm font-bold" style={{ color: "var(--text)" }}>
            {f.q}
            <Chevron className="shrink-0 text-indigo-500 transition-transform group-open:rotate-90" />
          </summary>
          <p className="mt-3 border-t pt-3 text-sm leading-relaxed" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>
            {renderInline(f.a, `faq-${f.q.slice(0, 12)}`)}
          </p>
        </details>
      ))}
    </div>
  );
}

function Chevron({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`h-4 w-4 ${className ?? ""}`} aria-hidden="true">
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

export default function BlogBlocks({ blocks }: { blocks: BlogBlock[] }) {
  return (
    <div className="space-y-6">
      {blocks.map((b, i) => {
        switch (b.type) {
          case "heading":
            return (
              <h2 key={i} className="pt-4 text-xl font-extrabold tracking-tight sm:text-2xl" style={{ color: "var(--text)" }}>
                {b.text}
              </h2>
            );
          case "paragraph":
            return (
              <p key={i} className="text-[15px] leading-[1.8]" style={{ color: "var(--text-muted)" }}>
                {renderInline(b.text, `p${i}`)}
              </p>
            );
          case "list":
            return (
              <ul key={i} className="space-y-2.5">
                {b.items.map((it, j) => (
                  <li key={j} className="flex items-start gap-3 text-[15px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
                    <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-indigo-500/10 text-indigo-500">
                      <Check size={12} strokeWidth={3} />
                    </span>
                    <span>{renderInline(it, `li${i}-${j}`)}</span>
                  </li>
                ))}
              </ul>
            );
          case "quote":
            return (
              <blockquote
                key={i}
                className="relative rounded-2xl border-l-4 bg-indigo-500/5 px-6 py-5 text-[15px] font-medium italic leading-relaxed"
                style={{ borderColor: "#6366f1", color: "var(--text)" }}
              >
                <Quote size={18} className="mb-2 text-indigo-400" />
                {renderInline(b.text, `q${i}`)}
              </blockquote>
            );
          case "tip":
            return (
              <div key={i} className="rounded-2xl border border-emerald-500/25 bg-emerald-500/5 px-5 py-4">
                <p className="flex items-center gap-2 text-sm font-bold" style={{ color: "#10b981" }}>
                  <Lightbulb size={16} /> {b.title}
                </p>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                  {renderInline(b.text, `tip${i}`)}
                </p>
              </div>
            );
          case "steps":
            return (
              <ol key={i} className="space-y-4">
                {b.items.map((s, j) => (
                  <li key={j} className="flex items-start gap-4">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-sm font-extrabold text-white shadow-md shadow-indigo-500/25">
                      {j + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-bold" style={{ color: "var(--text)" }}>
                        {s.title}
                      </p>
                      <p className="mt-1 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                        {renderInline(s.text, `st${i}-${j}`)}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            );
          case "faq":
            return (
              <div key={i}>
                <h2 className="pb-1 pt-4 text-xl font-extrabold tracking-tight sm:text-2xl" style={{ color: "var(--text)" }}>
                  Questions fréquentes
                </h2>
                <FaqAccordion items={b.items} />
              </div>
            );
          case "cta":
            return (
              <div key={i} className="card mt-2 overflow-hidden rounded-3xl p-8 text-center">
                <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/30">
                  <Info size={24} />
                </span>
                <p className="mt-4 text-lg font-extrabold" style={{ color: "var(--text)" }}>
                  Prêt à essayer par vous-même ?
                </p>
                <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                  Créez votre adresse e-mail temporaire en un clic : réception instantanée, sans inscription, 100 % gratuit.
                </p>
                <Link href="/" className="btn-primary mt-5 inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-sm font-bold">
                  Créer mon adresse gratuite <ArrowRight size={16} />
                </Link>
              </div>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
