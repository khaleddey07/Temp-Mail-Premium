# 🚀 GUIDE DE DÉPLOIEMENT GRATUIT — TempMail Premium

> Objectif : mettre votre site en ligne 100 % GRATUITEMENT sur une adresse
> `https://votre-site.vercel.app` fonctionnelle 24 h/24, avec vraie réception d'e-mails.
>
> Vous avez déjà créé les 3 comptes : **GitHub**, **Turso**, **Vercel**. C'est parfait !
> Suivez les 5 étapes ci-dessous, dans l'ordre. Comptez 20 à 30 minutes.

---

## 📦 ÉTAPE 1 — Préparer les fichiers (2 min)

1. Téléchargez le fichier **tempmail-premium-deploy.zip** (fourni dans la conversation).
2. Clic droit sur le ZIP → **« Extraire tout... »** (Windows) ou double-clic (Mac).
3. Ouvrez le dossier extrait : vous voyez des dossiers (`src`, `prisma`, `public`…)
   et des fichiers (`package.json`, `README.md`…).
4. **Laissez cette fenêtre ouverte**, vous en aurez besoin à l'étape 2.

---

## 🐙 ÉTAPE 2 — Envoyer le code sur GitHub (5 min)

1. Allez sur **github.com** et connectez-vous.
2. En haut à droite, cliquez sur le **« + »** → **« New repository »**.
3. Repository name : `tempmail-premium` — Visible : **Public** — ne cochez rien d'autre.
4. Cliquez **« Create repository »**.
5. Sur la page qui s'affiche, cliquez le lien **« uploading an existing file »**.
6. Dans votre dossier extrait (étape 1) : faites **Ctrl + A** (tout sélectionner),
   puis **glissez-déposez** tous les fichiers dans la zone GitHub.
7. Attendez que la barre de progression se termine (1–3 min), puis cliquez
   **« Commit changes »**.

✅ Votre code est maintenant sur GitHub à l'adresse
`https://github.com/VOTRE-PSEUDO/tempmail-premium`

---

## 🗄️ ÉTAPE 3 — Créer la base de données Turso (5 min)

Turso = base de données gratuite permanente (pas de carte bancaire demandée).

1. Allez sur **app.turso.tech** et connectez-vous (vous pouvez vous inscrire
   avec votre compte GitHub).
2. Cliquez **« Create Database »** (ou « New Database »).
   - Name : `tempmail`
   - Location : `Frankfurt` ou `Paris` (Europe)
3. Une fois créée, cliquez sur la base `tempmail` :
   - Copiez l'**URL** qui ressemble à `libsql://tempmail-votre-pseudo.turso.io`
     → c'est votre **TURSO_DATABASE_URL** (gardez-la de côté).
4. Créez le jeton d'accès : onglet **« Tokens »** (ou bouton « Generate Token »)
   → cliquez **« Generate Token »** → copiez-le
   → c'est votre **TURSO_AUTH_TOKEN** (gardez-le de côté).
5. Créez les tables :
   - Ouvrez le fichier `deploy/schema.sql` (dans le dossier extrait, avec le
     Bloc-notes).
   - Dans le tableau de bord Turso, onglet **« Edit Data »** (ou « Console » /
     « SQL ») → collez TOUT le contenu du fichier → cliquez **Run / Execute**.
   - Vous devez voir 3 tables apparaître : `TempAddress`, `Message`,
     `ContactMessage`.

> 💡 Si l'onglet SQL n'apparaît pas dans le tableau de bord, dites-le moi,
> je vous donnerai la méthode par terminal (2 commandes).

---

## ▲ ÉTAPE 4 — Déployer sur Vercel (5 min)

1. Allez sur **vercel.com** et connectez-vous **avec GitHub** (« Continue with
   GitHub ») → autorisez Vercel.
2. Cliquez **« Add New... »** → **« Project »**.
3. Dans la liste, trouvez `tempmail-premium` → cliquez **« Import »**.
4. À l'étape « Configure Project », **avant de cliquer sur Deploy** :
   ouvrez la section **« Environment Variables »** et ajoutez ces 3 variables
   (Nom → Valeur) :

   | Nom | Valeur |
   |---|---|
   | `TURSO_DATABASE_URL` | `libsql://tempmail-votre-pseudo.turso.io` (étape 3) |
   | `TURSO_AUTH_TOKEN` | le long jeton copié à l'étape 3 |
   | `DATABASE_URL` | `file:./db/custom.db` |

   ⚠️ Copiez-collez SANS espaces avant/après les valeurs.

5. Cliquez **« Deploy »** → patientez 2 à 4 minutes.

🎉 Vercel vous affiche **« Congratulations »** avec un bouton
**« Continue to Dashboard »**. En haut de la page se trouve votre adresse :

**`https://tempmail-premium.vercel.app`** (ou similaire)

---

## 🌐 ÉTAPE 5 — Finaliser (3 min)

1. Ouvrez votre adresse `https://….vercel.app` dans le navigateur :
   - Cliquez **« Nouvelle adresse »** → une vraie adresse e-mail s'affiche.
   - Envoyez-lui un message depuis votre Gmail → il arrive en quelques secondes.
2. **Ajoutez l'URL du site à sa propre configuration** (important pour le SEO) :
   - Vercel → votre projet → **Settings** → **Environment Variables**.
   - Ajoutez : Nom = `NEXT_PUBLIC_SITE_URL` →
     Valeur = `https://tempmail-premium.vercel.app` (votre vraie URL).
   - Puis onglet **Deployments** → clic sur les « ... » du déploiement du haut
     → **« Redeploy »** → confirmez.
3. **Envoyez-moi votre URL `….vercel.app` dans la conversation !**
   Je vous guiderai ensuite pour :
   - l'inscription à **Google Search Console** (gratuit, pour apparaître sur Google) ;
   - l'activation des **publicités A-ADS / Adsterra** (acceptent les sites
     hébergés gratuitement → premiers revenus) ;
   - la suite AdSense quand vous aurez un domaine (~1 €/an, optionnel).

---

## 🆘 Problèmes fréquents

| Symptôme | Cause probable | Solution |
|---|---|---|
| Le site affiche « Internal Server Error » ou erreur 500 | Variables Turso mal copiées | Vercel → Settings → Environment Variables : vérifiez `TURSO_DATABASE_URL` et `TURSO_AUTH_TOKEN` (sans espace), puis Redeploy |
| « Nouvelle adresse » ne fonctionne pas | Tables non créées sur Turso | Refaites l'étape 3.5 (coller `deploy/schema.sql`) |
| Erreur de build sur Vercel | Dépôt GitHub incomplet | Vérifiez que `src/`, `prisma/`, `package.json` et `bun.lock` sont bien visibles sur github.com |
| Le site s'affiche mais « Build failed » | Fichier manquant au dépôt | Ré-uploadez tous les fichiers de l'étape 2 |

---

## 💰 Après la mise en ligne — rappel des revenus possibles

- **A-ADS** (a-ads.com) : accepte `vercel.app` SANS validation → revenus en
  Bitcoin, dès le premier visiteur. Je l'intègre pour vous dès que vous me
  donnez votre URL.
- **Adsterra / Monetag** : bannières CPM, tolèrent les hébergements gratuits.
- **Google AdSense** : à faire PLUS TARD avec un domaine à vous (~1–12 €/an)
  — les sous-domaines gratuits sont refusés par AdSense.
