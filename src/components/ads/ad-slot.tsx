"use client";

import { useEffect, useRef } from "react";
import { Megaphone } from "lucide-react";
import { ADS_CONFIG, adsenseActive, type AdSlotId } from "@/config/ads";
import { useConsent } from "./use-consent";

declare global {
  interface Window {
    adsbygoogle?: Array<Record<string, unknown>> & { requestNonPersonalizedAds?: number };
  }
}

type Props = {
  /** Emplacement défini dans src/config/ads.ts */
  slot: AdSlotId;
  /** Format AdSense */
  format?: "auto" | "horizontal" | "rectangle";
  minHeight?: number;
  className?: string;
};

/** Injecte du HTML publicitaire brut en exécutant les <script> (innerHTML ne le fait pas). */
function injectCustomHtml(host: HTMLElement, html: string) {
  host.innerHTML = "";
  const doc = new DOMParser().parseFromString(html, "text/html");
  doc.body.childNodes.forEach((node) => {
    if (node.nodeName === "SCRIPT") {
      const original = node as HTMLScriptElement;
      const script = document.createElement("script");
      for (const attr of Array.from(original.attributes)) script.setAttribute(attr.name, attr.value);
      script.text = original.text;
      host.appendChild(script);
    } else {
      host.appendChild(document.importNode(node, true));
    }
  });
}

/**
 * Bloc publicitaire universel.
 * Priorité : Google AdSense → bannière Adsterra → cadre indicatif (placeholder).
 * Aucun script tiers n'est chargé tant que rien n'est configuré dans src/config/ads.ts.
 */
export default function AdSlot({ slot, format = "auto", minHeight = 110, className = "" }: Props) {
  const asRef = useRef<HTMLModElement | null>(null);
  const atRef = useRef<HTMLDivElement | null>(null);
  const asPushedRef = useRef(false);
  const atDoneRef = useRef(false);
  const [consent] = useConsent();

  const asId = (ADS_CONFIG.adsense.slots[slot] || "").trim();
  const atBanner = ADS_CONFIG.adsterra.banners[slot];
  const customHtml = (ADS_CONFIG.custom[slot] || "").trim();
  const useAdsense = adsenseActive() && asId !== "";
  const useAdsterra = Boolean(atBanner?.key && atBanner.key.trim());
  const useCustom = customHtml !== "";

  // Google AdSense : pousser l'unité dans la file (traitée au chargement du script)
  useEffect(() => {
    if (!useAdsense || asPushedRef.current || !asRef.current) return;
    asPushedRef.current = true;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      /* le script pas encore chargé : la file sera traitée automatiquement */
    }
  }, [useAdsense]);

  // Bannière Adsterra : injectée dans une iframe isolée (compatible document.write)
  useEffect(() => {
    if (!useAdsterra || atDoneRef.current || !atRef.current || !atBanner?.key) return;
    if (consent === null) return; // RGPD : attendre le choix du visiteur
    atDoneRef.current = true;
    const host = atRef.current;
    host.innerHTML = "";
    const iframe = document.createElement("iframe");
    iframe.width = String(atBanner.width);
    iframe.height = String(atBanner.height);
    iframe.setAttribute("scrolling", "no");
    iframe.setAttribute("frameborder", "0");
    iframe.style.border = "0";
    iframe.title = "Publicité";
    host.appendChild(iframe);
    const doc = iframe.contentDocument;
    if (doc) {
      const key = atBanner.key.trim();
      doc.open();
      doc.write(
        `<!doctype html><html><head><meta charset="utf-8">` +
          `<style>html,body{margin:0;padding:0;overflow:hidden}</style></head><body>` +
          `<script type="text/javascript">atOptions = { 'key' : '${key}', 'format' : 'iframe', ` +
          `'height' : ${atBanner.height}, 'width' : ${atBanner.width}, 'params' : {} };<\/script>` +
          `<script type="text/javascript" src="//www.highperformanceformat.com/${key}/invoke.js"><\/script>` +
          `</body></html>`
      );
      doc.close();
    }
  }, [useAdsterra, consent, atBanner]);

  // HTML personnalisé (A-ADS…) : injecté après consentement
  const customRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!useCustom || !customRef.current || consent === null) return;
    injectCustomHtml(customRef.current, customHtml);
  }, [useCustom, consent, customHtml]);

  if (!ADS_CONFIG.enabled) return null;

  const showPlaceholder = ADS_CONFIG.showPlaceholders && !useAdsense && !useAdsterra && !useCustom;

  return (
    <aside aria-label="Publicité" className={`mx-auto w-full max-w-7xl px-4 sm:px-6 ${className}`}>
      <div
        className="mx-auto max-w-4xl overflow-hidden rounded-2xl"
        style={{
          background: "var(--bg-soft)",
          border: "1px dashed var(--border)",
          minHeight: showPlaceholder ? minHeight : undefined,
        }}
      >
        <div
          className="flex items-center justify-center gap-1.5 pt-2 text-[10px] font-semibold uppercase tracking-[0.2em]"
          style={{ color: "var(--text-faint)" }}
        >
          <Megaphone size={11} />
          Publicité
        </div>
        <div className="flex items-center justify-center px-3 pb-3 pt-1.5">
          {useAdsense ? (
            <ins
              ref={asRef}
              className="adsbygoogle block w-full"
              style={{ display: "block", minHeight }}
              data-ad-client={ADS_CONFIG.adsense.clientId.trim()}
              data-ad-slot={asId}
              data-ad-format={format}
              data-full-width-responsive="true"
            />
          ) : useAdsterra ? (
            <div ref={atRef} aria-hidden="true" />
          ) : useCustom ? (
            <div ref={customRef} aria-label="Bannière publicitaire" />
          ) : showPlaceholder ? (
            <div
              className="flex w-full flex-col items-center justify-center gap-1.5 py-5 text-center"
              style={{ color: "var(--text-faint)" }}
            >
              <p className="text-xs font-semibold">Emplacement « {slot} » disponible</p>
              <p className="max-w-md text-[11px] leading-relaxed">
                Collez votre identifiant AdSense ou une clé réseau CPM dans{" "}
                <code className="rounded bg-black/5 px-1 py-0.5 font-mono dark:bg-white/10">src/config/ads.ts</code>{" "}
                pour monétiser cet espace.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </aside>
  );
}
