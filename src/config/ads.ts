/* ============================================================
   MONÉTISATION — Configuration centrale des publicités
   ============================================================
   C'est le SEUL fichier à modifier pour afficher de la pub
   et gagner de l'argent avec le site.

   ─── 1) GOOGLE ADSENSE (https://adsense.google.com) ──────────
      a. Créez un compte AdSense et ajoutez votre site.
      b. Une fois validé, copiez votre identifiant éditeur
         (format : ca-pub-XXXXXXXXXXXXXXXX) dans `clientId`.
      c. Dans la console AdSense → Annonces → Par bloc d'annonces,
         créez des blocs « Display » et copiez chaque identifiant
         numérique (ex. 1234567890123456) dans `slots` ci-dessous.
      d. Le fichier /ads.txt est généré automatiquement.

   ─── 2) RÉSEAUX CPM ALTERNATIFS (plus tolérants pour les
          outils en ligne que AdSense) ─────────────────────────
      Adsterra, Monetag, HilltopAds, Galaksion, A-ADS…
      a. Inscrivez-vous sur le réseau et ajoutez votre site.
      b. Pour chaque bannière, le réseau vous donne une « key »
         (une longue clé alphanumérique) : collez-la dans
         `adsterra.banners` selon le format choisi (728x90, 300x250…).
      c. Pour les formats site-wide (Social Bar, Popunder,
         Direct link…), collez l'URL complète du script fournie
         par le réseau dans `siteWideScripts`.
         ⚠️ Ces formats sont intrusifs : à activer avec parcimonie,
            ils peuvent faire fuir vos visiteurs.

   ─── 3) HTML PERSONNALISÉ (A-ADS et tout autre code) ─────────
      Certaines régies (A-ADS, bannières en HTML simple…) fournissent
      un code <a>/<img>/<iframe>/<script> brut. Collez-le tel quel
      dans `custom` ci-dessous — il sera injecté après consentement.
      A-ADS (https://a-ads.com) accepte n'importe quelle URL SANS
      validation : idéal pour un sous-domaine gratuit type vercel.app.

   ─── Emplacements disponibles ────────────────────────────────
      top    → sous la boîte mail (page d'accueil)
      mid    → entre les sections de la page d'accueil
      page   → bas des pages À propos / FAQ / Contact / API
      footer → grande bannière en bas de la page d'accueil

   ⚠️ Laissez une valeur vide ('') pour désactiver un emplacement.
   ============================================================ */

export const ADS_CONFIG = {
  /** Interrupteur général — false coupe toute la monétisation */
  enabled: true,

  /** Affiche des cadres « Emplacement publicitaire » tant que rien n'est configuré
   *  (utile pour voir où apparaîtront les annonces ; passez à false pour masquer) */
  showPlaceholders: true,

  adsense: {
    /** Identifiant éditeur AdSense — ex. "ca-pub-1234567890123456" */
    clientId: "",
    /** Identifiants des blocs d'annonces AdSense (créés dans la console AdSense) */
    slots: {
      top: "",
      mid: "",
      page: "",
      footer: "",
    },
  },

  /** Bannières Adsterra ou compatible : « key » fournie par le réseau + format */
  adsterra: {
    banners: {
      top: { key: "", width: 728, height: 90 },
      mid: { key: "", width: 468, height: 60 },
      page: { key: "", width: 300, height: 250 },
      footer: { key: "", width: 728, height: 90 },
    },
  },

  /** Code HTML publicitaire brut (A-ADS, régies exotiques…) — collé tel quel.
   *  Injecté après consentement ; les <script> inclus sont exécutés. */
  custom: {
    top: "",
    mid: "",
    page: "",
    footer: "",
  },

  /** Scripts site-wide (Social Bar, Popunder…) — URLs complètes fournies par le réseau.
   *  Chargés uniquement si le visiteur accepte les cookies publicitaires (RGPD). */
  siteWideScripts: [] as string[],

  /** Lignes ads.txt supplémentaires (ex. la ligne fournie par Adsterra/Monetag) */
  adsTxtExtra: [] as string[],
};

export type AdSlotId = "top" | "mid" | "page" | "footer";

/** AdSense est-il prêt à l'emploi ? (ID éditeur au bon format) */
export function adsenseActive(): boolean {
  if (!ADS_CONFIG.enabled) return false;
  return /^ca-pub-\d{10,}$/.test(ADS_CONFIG.adsense.clientId.trim());
}

/** Au moins une régie est-elle configurée ? (pilote le bandeau de consentement) */
export function anyAdsConfigured(): boolean {
  if (!ADS_CONFIG.enabled) return false;
  if (adsenseActive()) return true;
  if (ADS_CONFIG.siteWideScripts.some((s) => s && s.trim())) return true;
  if (Object.values(ADS_CONFIG.custom).some((c) => c && c.trim())) return true;
  return Object.values(ADS_CONFIG.adsterra.banners).some((b) => b.key && b.key.trim());
}
