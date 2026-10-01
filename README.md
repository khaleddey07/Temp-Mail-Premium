# 📬 TempMail Premium

Application d'e-mails temporaires **qui reçoit de VRAIS e-mails** — **Next.js 16** + **SQLite (Prisma)** + **Tailwind CSS 4** + **API mail.tm**.

---

## ✅ Ce qui marche dès l'installation

| Fonction | Statut |
|---|---|
| Création d'une **vraie adresse e-mail** (ex. `primerocket5541@uberip.com`) | ✅ automatique |
| Réception de **vrais e-mails** envoyés par n'importe qui (Gmail, GitHub, Netflix…) | ✅ via mail.tm |
| Actualisation automatique toutes les **4 secondes** (en pause si l'onglet est caché) | ✅ |
| **Pièces jointes réelles** téléchargeables (proxy sécurisé) | ✅ |
| Prolongation +60 min (×10), QR Code, recherche, filtres, dark/light, responsive | ✅ |
| Destruction automatique à l'expiration (60 min) — cache local **et** compte fournisseur | ✅ |

> **Aucun nom de domaine à acheter, aucun MX à configurer** : les adresses sont de vrais
> comptes créés en temps réel sur les serveurs mail.tm (domaines actifs récupérés
> dynamiquement sur `/api/domains`).

---

## 🚀 Démarrage

```bash
npm install            # ou bun install
npx drizzle-kit push   # non nécessaire ici — voir Prisma
bun run db:push        # crée les tables SQLite (db/custom.db)
npm run dev            # http://localhost:3000
```

Variable d'environnement (fichier `.env`) :

```
DATABASE_URL=file:/chemin/vers/db/custom.db
```

---

## 🏗️ Architecture

```
src/
├── app/
│   ├── page.tsx                 Boîte mail + landing + teaser blog
│   ├── blog/                    Blog SEO : index filtrable + 6 articles (JSON-LD, sitemap)
│   ├── about/ faq/ contact/     Pages institutionnelles (fr)
│   ├── api-docs/                Documentation API interactive
│   └── api/
│       ├── domains/             GET  domaines actifs (mail.tm)
│       ├── addresses/           GET/POST créer / restaurer une adresse réelle
│       ├── addresses/[id]/      GET/DELETE détail, suppression (compte inclus)
│       ├── .../extend/          POST +60 min (max 10)
│       ├── .../messages/        GET liste (sync + filtres) · DELETE vider
│       ├── messages/[id]/       GET contenu complet · PATCH lu/non-lu · DELETE
│       ├── .../attachments/[a]/ GET téléchargement réel (proxy streaming)
│       ├── stats/ contact/ health/
├── components/
│   ├── temp-mail-app.tsx        Cœur de l'application (client)
│   ├── landing-sections.tsx     Sections marketing
│   ├── site-chrome.tsx          Header + footer
│   └── providers.tsx            Thème + toasts
├── lib/
│   ├── mailtm.ts                Client API mail.tm (retry 429/5xx, re-auth 401)
│   ├── address-service.ts       Création, sync, purge, messages de bienvenue
│   ├── temp-mail.ts             Constantes + générateurs
│   └── db.ts                    Client Prisma
└── prisma/schema.prisma         TempAddress · Message (cache) · ContactMessage
```

### Comment la réception réelle fonctionne

1. `POST /api/addresses` crée un **compte réel** chez mail.tm (`POST /accounts` + `POST /token`)
   et stocke les identifiants côté serveur uniquement (jamais exposés au client).
2. Le navigateur garde un **jeton anonyme** (localStorage) qui lui donne accès à SA boîte.
3. Chaque lecture (`GET .../messages`) **synchronise** la boîte mail.tm → cache SQLite
   (filtres/recherche instantanés côté serveur), puis répond.
4. Un e-mail envoyé à l'adresse par n'importe quel expéditeur apparaît en ≤ 4 s.
5. Suppression (message, boîte ou adresse) → appliquée **chez mail.tm et localement**.

---

## 💰 Monétisation — gagner de l'argent avec le site

Le site intègre un **système publicitaire complet et conforme RGPD** : bandeau de
consentement, publicité non personnalisée en cas de refus, fichier `/ads.txt` automatique.
**Un seul fichier à modifier : `src/config/ads.ts`.**

### Option 1 — Google AdSense (revenus CPM/CPC les plus élevés)

1. Créez un compte sur [adsense.google.com](https://adsense.google.com) et ajoutez votre
   domaine (le site a déjà les pages exigées : À propos, FAQ, Contact, Confidentialité).
2. Une fois le site validé, collez votre identifiant éditeur dans `ADS_CONFIG.adsense.clientId`
   (format `ca-pub-XXXXXXXXXXXXXXXX`) et les identifiants de vos blocs « Display » dans
   `ADS_CONFIG.adsense.slots` (`top`, `mid`, `page`, `footer`).
3. C'est tout : les annonces s'affichent aux 4 emplacements prévus et `/ads.txt` se met
   à jour automatiquement.

> ⚠️ AdSense refuse souvent les sites « outils » à contenu mince. Si votre site est refusé,
> enrichissez le blog/FAQ, attendez un trafic régulier, ou passez à l'option 2.

### Option 2 — Réseaux CPM alternatifs (acceptation facile, idéal pour un temp-mail)

| Réseau | Formats | Particularité |
|---|---|---|
| **Adsterra** | Bannières, Social Bar, Popunder | Acceptation quasi immédiate, paiement dès 5 $ |
| **Monetag** (ex-PropellerAds) | Bannières, Social Bar, Direct link | Idem, bon CPM trafic FR |
| **A-ADS** | Bannière crypto | Aucune validation, parfait pour temp-mail |
| **HilltopAds / Galaksion** | Bannières, Popunder | Alternatives correctes |

Pour Adsterra/Monetag : créez une bannière (ex. 728x90), copiez la « key » fournie dans
`ADS_CONFIG.adsterra.banners`, ou collez l'URL du script Social Bar dans
`ADS_CONFIG.siteWideScripts`. Les lignes `ads.txt` du réseau vont dans `ADS_CONFIG.adsTxtExtra`.

### Revenus réalistes

Le revenu dépend **à 100 % du trafic** (RPM ≈ 0,5–3 € pour un trafic FR/EU selon la régie) :

| Visites / jour | Revenu estimé / mois |
|---|---|
| 500 | 5 – 15 € |
| 5 000 | 75 – 450 € |
| 50 000 | 750 – 4 500 € |

Pour générer du trafic : SEO (mots-clés « email temporaire »…), TikTok/YouTube shorts,
Reddit, référencement dans les listes « best temp mail ».

### Conformité

- Le bandeau de consentement s'affiche **automatiquement** dès qu'une régie est configurée ;
  en cas de refus, AdSense bascule en **publicité non personnalisée** et les scripts
  intrusifs (Social Bar/Popunder) restent désactivés.
- Pour une conformité EU stricte (TCF v2), activez aussi **Google Funding Choices** côté
  console AdSense — le site reste compatible.
- Les cadres « Emplacement publicitaire » visibles tant que rien n'est configuré se
  masquent avec `showPlaceholders: false`.

---

## 🆓 Déployer GRATUITEMENT (Vercel + Turso) — sans acheter de domaine

L'application fonctionne **en double mode base de données** : SQLite en local, **Turso** (libSQL)
en production. Turso est une offre cloud **gratuite de façon permanente** (pas de carte bancaire).
Résultat : un site en ligne 24h/24 sur une URL `votre-projet.vercel.app`, pour 0 €.

### Étape 1 — Base de données Turso (5 min, gratuit)

1. Créez un compte sur [turso.tech](https://turso.tech) (connexion GitHub/Google, sans CB).
2. Installez la CLI puis créez la base :
   ```bash
   curl -sSfL https://get.tur.so/install.sh | bash   # ou : brew install tursodigital/turso/turso
   turso auth login
   turso db create tempmail
   turso db show tempmail --url          # → libsql://tempmail-<user>.turso.io   = TURSO_DATABASE_URL
   turso db tokens create tempmail       # → TURSO_AUTH_TOKEN
   ```
3. Créez les tables dans la base distante (le SQL est prêt dans `deploy/schema.sql`) :
   ```bash
   turso db shell tempmail < deploy/schema.sql
   ```

### Étape 2 — Hébergement Vercel (5 min, gratuit)

1. Poussez ce projet sur un dépôt GitHub (privé convient).
2. Sur [vercel.com](https://vercel.com) (compte gratuit, sans CB) : **Add New → Project** → importez le dépôt.
3. Dans **Environment Variables**, ajoutez :
   | Nom | Valeur |
   |---|---|
   | `TURSO_DATABASE_URL` | `libsql://tempmail-<user>.turso.io` |
   | `TURSO_AUTH_TOKEN` | le token créé à l'étape 1 |
   | `DATABASE_URL` | même valeur que `TURSO_DATABASE_URL` (requis par le schéma, non utilisé à l'exécution) |
4. Cliquez **Deploy**. Après 2 min, votre site est en ligne : `https://votre-projet.vercel.app`.

> Le basculement est automatique : dès que `TURSO_DATABASE_URL` existe, l'app utilise Turso ;
> sinon elle reste sur SQLite local. Aucun code à modifier.

### Étape 3 — Google Search Console (gratuit, accepte vercel.app)

1. Allez sur [search.google.com/search-console](https://search.google.com/search-console) → **Ajouter une propriété** → entrez `https://votre-projet.vercel.app`.
   > Ne collez PAS un lien `chat.z.ai` ni un lien de partage : uniquement l'URL du site déployé.
2. Vérifiez la propriété (méthode recommandée : **balise HTML** — Google donne une balise `<meta name="google-site-verification"…>` ; demandez-nous de l'ajouter dans le layout, ou utilisez l'enregistrement DNS si le domaine est à vous).
3. **Sitemaps** → soumettez `sitemap.xml` (déjà généré automatiquement, blog inclus).
4. L'indexation démarre sous quelques jours. Vérifiez avec `site:votre-projet.vercel.app` sur Google.

### Et AdSense sans domaine acheté ?

AdSense exige en pratique un domaine racine. En attendant, deux leviers gratuits :

- **A-ADS ([a-ads.com](https://a-ads.com))** : régie crypto qui accepte **n'importe quelle URL,
  sans validation, sans volume minimum** — parfaite pour un sous-domaine gratuit. Créez la
  bannière, copiez le code HTML fourni et collez-le dans `ADS_CONFIG.custom.top` (ou un autre
  emplacement) dans `src/config/ads.ts` : le bloc apparaît après consentement du visiteur.
- **Adsterra / Monetag** : acceptent souvent les sous-domaines gratuits pour leurs bannières —
  inscrivez le site, récupérez la « key » d'une bannière, collez-la dans `src/config/ads.ts`.
- Plus tard, un domaine à ~1 €/an (promos `.xyz`, `.online`) ou un domaine gratuit **eu.org**
  (délai d'approbation de quelques semaines) débloquera AdSense : il suffira de le brancher
  sur Vercel (un réglage DNS) et de le déclarer dans Search Console.

---

## 🔒 Sécurité

- HTML des e-mails assaini avec **DOMPurify** avant rendu.
- Aucune credential fournisseur dans le client ; seul le jeton anonyme circule.
- Pièces jointes servies par **proxy** avec en-têtes `Content-Disposition` contrôlés.
- Purge automatique des adresses expirées (+ suppression des comptes chez le fournisseur).

## ❓ Dépannage

| Problème | Solution |
|---|---|
| « Fournisseur mail momentanément indisponible » | mail.tm est injoignable — réessayez quelques secondes plus tard |
| Aucun e-mail reçu | Envoyez un message réel à l'adresse affichée ; vérifiez le dossier spam de l'expéditeur |
| Tables manquantes | `bun run db:push` |
| Le domaine affiché change | Normal : les domaines actifs mail.tm évoluent, l'app suit automatiquement |
