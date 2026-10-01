"use client";

import { useEffect, useState } from "react";

export type Consent = "all" | "essential" | null;

export const CONSENT_KEY = "tempmail-ads-consent";
export const CONSENT_EVENT = "tempmail-consent";

/**
 * Lit / écrit le choix de consentement publicitaire du visiteur (RGPD).
 * - "all"       → publicité personnalisée + formats site-wide autorisés
 * - "essential" → publicité non personnalisée uniquement (NPA)
 * - null        → pas encore décidé (aucun script pub chargé)
 */
export function useConsent(): [Consent, (c: Exclude<Consent, null>) => void] {
  const [consent, setConsent] = useState<Consent>(null);

  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setConsent((localStorage.getItem(CONSENT_KEY) as Consent) ?? null);
    } catch {
      /* localStorage indisponible : on reste sur null */
    }
    const onUpdate = (e: Event) => {
      const detail = (e as CustomEvent<Exclude<Consent, null>>).detail;
      setConsent(detail ?? null);
    };
    window.addEventListener(CONSENT_EVENT, onUpdate);
    return () => window.removeEventListener(CONSENT_EVENT, onUpdate);
  }, []);

  const choose = (c: Exclude<Consent, null>) => {
    try {
      localStorage.setItem(CONSENT_KEY, c);
    } catch {
      /* ignore */
    }
    window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: c }));
  };

  return [consent, choose];
}
