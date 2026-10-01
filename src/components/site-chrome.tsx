"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Mail,
  Moon,
  Sun,
  Menu,
  X,
  Zap,
  ShieldCheck,
  Globe,
  ChevronRight,
  Sparkles,
  MessageCircle,
  Send,
} from "lucide-react";
import { useTheme } from "./providers";

const NAV = [
  { href: "/", label: "Boîte mail" },
  { href: "/blog", label: "Blog" },
  { href: "/about", label: "À propos" },
  { href: "/faq", label: "FAQ" },
  { href: "/api-docs", label: "API" },
  { href: "/contact", label: "Contact" },
];

export function useOnline() {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOnline(navigator.onLine);
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);
  return online;
}

export function ConnectionPill({ live }: { live?: boolean }) {
  const online = useOnline();
  const connected = online && live !== false;
  return (
    <div
      className="flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium"
      style={{ borderColor: "var(--border)", background: "var(--bg-muted)" }}
      title={connected ? "Connexion temps réel active" : "Hors ligne"}
    >
      <span className="relative flex h-2.5 w-2.5">
        <span
          className={`absolute inline-flex h-full w-full rounded-full ${
            connected ? "bg-emerald-400" : "bg-rose-400"
          } opacity-60 animate-ping`}
          style={{ animationDuration: "1.8s" }}
        />
        <span
          className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
            connected ? "bg-emerald-500" : "bg-rose-500"
          }`}
        />
      </span>
      <span style={{ color: connected ? "#10b981" : "#f43f5e" }}>
        {connected ? "En direct" : "Hors ligne"}
      </span>
    </div>
  );
}

export function Header({ onNewAddress }: { onNewAddress?: () => void }) {
  const { theme, toggle, mounted } = useTheme();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 12);
    fn();
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled ? "glass border-b shadow-[0_8px_32px_rgba(0,0,0,0.06)]" : "border-b border-transparent"
      }`}
      style={scrolled ? { borderColor: "var(--border)" } : undefined}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link href="/" className="group flex items-center gap-2.5">
          <span className="relative grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 text-white shadow-lg shadow-indigo-500/30 transition-transform group-hover:scale-105 group-hover:rotate-3">
            <Mail size={20} strokeWidth={2.2} />
            <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-emerald-400 text-[10px] font-bold text-emerald-950 ring-2 ring-white dark:ring-[#070b18]">
              ⚡
            </span>
          </span>
          <span className="leading-none">
            <span className="block text-[17px] font-800 font-extrabold tracking-tight" style={{ color: "var(--text)" }}>
              TempMail <span className="gradient-text">Premium</span>
            </span>
            <span className="mt-0.5 block text-[11px] font-medium uppercase tracking-[0.14em]" style={{ color: "var(--text-faint)" }}>
              Email jetable • Sécurisé
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {NAV.map((n) => {
            const active = pathname === n.href;
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  active ? "bg-indigo-500/10 text-indigo-500" : "hover:bg-black/5 dark:hover:bg-white/5"
                }`}
                style={active ? undefined : { color: "var(--text-muted)" }}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden sm:block">
            <ConnectionPill />
          </div>
          <button
            onClick={toggle}
            className="grid h-10 w-10 place-items-center rounded-xl border transition hover:scale-105 active:scale-95"
            style={{ borderColor: "var(--border)", background: "var(--bg-soft)", color: "var(--text)" }}
            aria-label="Basculer thème"
          >
            {!mounted ? <Sun size={18} /> : theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          {pathname === "/" && onNewAddress ? (
            <button
              onClick={onNewAddress}
              className="btn-primary hidden items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold sm:flex"
            >
              <Zap size={16} />
              Nouvelle adresse
            </button>
          ) : (
            <Link
              href="/"
              className="btn-primary hidden items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold sm:flex"
            >
              <Zap size={16} />
              Essayer gratuitement
            </Link>
          )}
          <button
            onClick={() => setOpen(!open)}
            className="grid h-10 w-10 place-items-center rounded-xl border lg:hidden"
            style={{ borderColor: "var(--border)", background: "var(--bg-soft)", color: "var(--text)" }}
            aria-label="Menu"
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {open && (
        <div
          className="animate-fade-in border-t px-4 pb-5 pt-3 lg:hidden"
          style={{ borderColor: "var(--border)", background: "var(--bg-soft)" }}
        >
          <nav className="flex flex-col gap-1">
            {NAV.map((n) => {
              const active = pathname === n.href;
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium ${
                    active ? "bg-indigo-500/10 text-indigo-500" : ""
                  }`}
                  style={active ? undefined : { color: "var(--text)" }}
                >
                  {n.label}
                  <ChevronRight size={16} style={{ color: "var(--text-faint)" }} />
                </Link>
              );
            })}
          </nav>
          <div className="mt-3 flex sm:hidden">
            <ConnectionPill />
          </div>
        </div>
      )}
    </header>
  );
}

export function Footer() {
  return (
    <footer className="mt-20 border-t" style={{ borderColor: "var(--border)", background: "var(--bg-soft)" }}>
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 text-white shadow-lg shadow-indigo-500/30">
                <Mail size={20} />
              </span>
              <span className="text-lg font-extrabold tracking-tight" style={{ color: "var(--text)" }}>
                TempMail <span className="gradient-text">Premium</span>
              </span>
            </div>
            <p className="mt-4 max-w-sm text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
              La boîte e-mail temporaire la plus élégante et la plus sûre. Créez une adresse jetable en un
              clic, recevez vos e-mails instantanément, sans inscription et sans spam.
            </p>
            <div className="mt-5 flex items-center gap-2">
              <span
                className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium"
                style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
              >
                <ShieldCheck size={14} className="text-emerald-500" />
                100 % anonyme
              </span>
              <span
                className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium"
                style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
              >
                <Sparkles size={14} className="text-indigo-500" />
                Sans inscription
              </span>
            </div>
            <div className="mt-5 flex gap-2">
              {[MessageCircle, Send, Globe].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="grid h-9 w-9 place-items-center rounded-lg border transition hover:-translate-y-0.5 hover:border-indigo-400 hover:text-indigo-500"
                  style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {[
            {
              title: "Produit",
              links: [
                { label: "Boîte de réception", href: "/" },
                { label: "Fonctionnalités", href: "/about" },
                { label: "API développeurs", href: "/api-docs" },
                { label: "Questions fréquentes", href: "/faq" },
              ],
            },
            {
              title: "Ressources",
              links: [
                { label: "Blog & guides", href: "/blog" },
                { label: "À propos", href: "/about" },
                { label: "Nous contacter", href: "/contact" },
                { label: "Confidentialité", href: "/about#confidentialite" },
                { label: "Conditions d'utilisation", href: "/about#conditions" },
              ],
            },
            {
              title: "Confiance",
              links: [
                { label: "Vraies adresses e-mail", href: "/" },
                { label: "Pièces jointes réelles", href: "/about" },
                { label: "Destruction automatique", href: "/about#confidentialite" },
                { label: "Aucune donnée conservée", href: "/about#confidentialite" },
              ],
            },
          ].map((col) => (
            <div key={col.title}>
              <h4 className="text-sm font-bold uppercase tracking-wider" style={{ color: "var(--text)" }}>
                {col.title}
              </h4>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="text-sm transition hover:text-indigo-500"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div
          className="mt-12 flex flex-col items-center justify-between gap-3 border-t pt-6 text-[13px] sm:flex-row"
          style={{ borderColor: "var(--border)", color: "var(--text-faint)" }}
        >
          <p>© 2026 TempMail Premium — Tous droits réservés. Fait avec ♥ pour votre vie privée.</p>
          <p className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse-dot" />
            Tous systèmes opérationnels
          </p>
        </div>
      </div>
    </footer>
  );
}
