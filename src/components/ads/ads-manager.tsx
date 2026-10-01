"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Cookie } from "lucide-react";
import { ADS_CONFIG, adsenseActive, anyAdsConfigured } from "@/config/ads";
import { useConsent } from "./use-consent";

/**
 * Gestion centralisée de la monétisation :
 * 1. Bandeau de consentement RGPD (affiché seulement si une régie est configurée)
 * 2. Chargement du script Google AdSense APRÈS le choix du visiteur
 *    (refus → publicité non personnalisée via requestNonPersonalizedAds)
 * 3. Scripts site-wide (Social Bar, Popunder…) uniquement si consentement complet
 * Aucun de ces mécanismes ne s'active tant que src/config/ads.ts est vide.
 */
export default function AdsManager() {
  const [consent, choose] = useConsent();
  const [decided, setDecided] = useState(false);

  useEffect(() => {
    // le hook useConsent a déjà lu localStorage ; on considère la décision prise
    // dès le premier rendu côté client (le bandeau disparaît après le choix)
    const t = setTimeout(() => setDecided(true), 0);
    return () => clearTimeout(t);
  }, []);

  const adsActive = anyAdsConfigured();
  const adsense = adsenseActive();
  const siteWide = ADS_CONFIG.siteWideScripts.filter((s) => s && s.trim());

  // Script AdSense : chargé après la décision de consentement
  useEffect(() => {
    if (!adsActive || !adsense || !decided || consent === null) return;
    if (document.getElementById("adsense-loader")) return;
    if (consent === "essential") {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).requestNonPersonalizedAds = 1;
      } catch {
        /* ignore */
      }
    }
    const s = document.createElement("script");
    s.id = "adsense-loader";
    s.async = true;
    s.crossOrigin = "anonymous";
    s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(
      ADS_CONFIG.adsense.clientId.trim()
    )}`;
    document.head.appendChild(s);
  }, [adsActive, adsense, decided, consent]);

  // Scripts site-wide : uniquement avec un consentement complet
  useEffect(() => {
    if (!adsActive || consent !== "all" || siteWide.length === 0) return;
    siteWide.forEach((src, i) => {
      const id = `ad-sitewide-${i}`;
      if (document.getElementById(id)) return;
      const s = document.createElement("script");
      s.id = id;
      s.async = true;
      s.src = src.trim();
      document.body.appendChild(s);
    });
  }, [adsActive, consent, siteWide.length]);

  if (!adsActive || !decided || consent !== null) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[70] p-3 sm:p-4">
      <div
        className="glass mx-auto flex max-w-4xl flex-col items-start gap-3 rounded-2xl border p-4 shadow-[0_16px_48px_rgba(0,0,0,0.18)] sm:flex-row sm:items-center"
        style={{ borderColor: "var(--border)" }}
      >
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-indigo-500/10 text-indigo-500">
          <Cookie size={20} />
        </span>
        <p className="flex-1 text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
          Nous utilisons des cookies pour maintenir le service gratuit et afficher des annonces adaptées à vos
          centres d&apos;intérêt. Vous pouvez limiter l&apos;usage aux cookies essentiels.{" "}
          <Link href="/about#confidentialite" className="font-semibold text-indigo-500 hover:underline">
            En savoir plus
          </Link>
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            onClick={() => choose("essential")}
            className="rounded-xl border px-4 py-2.5 text-xs font-semibold transition hover:-translate-y-0.5"
            style={{ borderColor: "var(--border)", color: "var(--text)" }}
          >
            Essentiels uniquement
          </button>
          <button onClick={() => choose("all")} className="btn-primary rounded-xl px-4 py-2.5 text-xs font-semibold">
            Tout accepter
          </button>
        </div>
      </div>
    </div>
  );
}
