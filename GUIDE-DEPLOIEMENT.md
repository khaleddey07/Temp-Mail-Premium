# 🚀 GUIDE DE DÉPLOIEMENT — TempMail Premium (Vercel + Turso)

> **Mise à jour du 4 octobre 2026** : ta base Turso est identifiée, testée et **déjà prête**
> (les tables y ont été créées avec succès lors du test réel). Il ne reste que 2 choses à faire :
> **1) uploader 6 fichiers sur GitHub, 2) corriger 3 variables sur Vercel.**

---

## ✅ ÉTAPE 1 — Uploader 6 fichiers sur GitHub (5 min)

Le site est déjà en ligne sur GitHub/Vercel. On ne remplace QUE les fichiers modifiés.

| Fichier téléchargé | Où le mettre sur GitHub (bouton « Add file → Upload files ») |
|---|---|
| `ads.ts` | `src/config/` (remplace l'existant) |
| `layout.tsx` | `src/app/` (remplace l'existant) |
| `ad-slot.tsx` | `src/components/ads/` (remplace l'existant) |
| `db.ts` | `src/lib/` (remplace l'existant) |
| `instrumentation.ts` | `src/` (remplace l'existant) |
| `health-route.ts` | `src/app/api/health/` → **renomme-le `route.ts`** en le nommant avant de l'ajouter |

> 💡 Astuce GitHub : va sur github.com → ton dépôt → navigue dans le bon dossier → « Add file » →
> « Upload files » → glisse le fichier → « Commit changes ». Répète pour chaque dossier
> (ou fais les 6 en une fois en respectsant les dossiers).
> ⏱️ Dès le commit, Vercel redéploie automatiquement (2-3 min).

---

## 🔑 ÉTAPE 2 — Corriger les 3 variables d'environnement sur Vercel (3 min)

Vercel → ton projet **temp-mail-premium** → **Settings → Environment Variables**.

C'est l'erreur 502/P2010 que tu voyais : l'URL Turso était mal recopiée
(`libmysql://` avec un espace). Voici les **bonnes valeurs, testées et validées** :

| Nom | Valeur — copie-colle EXACTEMENT (sélectionne tout, clic droit, copier) |
|---|---|
| `TURSO_DATABASE_URL` | `libsql://tempmail-khaleddey.aws-us-east-1.turso.io` |
| `TURSO_AUTH_TOKEN` | `eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3OTExMDk0NjgsImlkIjoiMDFhMTA2NmYtMjUwMS03ZGRhLThiZjItYmRjMjUwNTRhZWI5Iiwia2lkIjoiQWR1Wk15YlBrTkZONHFhS0JaS3U1NXZaT2t0dy1iYTlFY1lRN0EzMkVTcyIsInJpZCI6IjFlYTEwMDdjLTA5YmYtNDVhNi05YmI2LTQxY2FiNDNiY2IxNSJ9.QrMunFtaZJfHjfjEh-rYJrbsqbsP0ODNEWTJDMbMuZdIliYs_jAX4CR4p1DuQmifwAc1tHGZmxGp1npCPJQxDg` |
| `NEXT_PUBLIC_SITE_URL` | `https://temp-mail-premium.vercel.app` |

**Pour chaque variable** : colle le nom, colle la valeur, vérifie qu'il n'y a
**aucun espace avant/après**, sauvegarde (Save).

> 📌 Le nouveau `db.ts` corrige automatiquement les espaces et le mauvais préfixe
> (`libmysql://` → `libsql://`) : même si un copier-coller rate, ça passera quand même.

### 🗺️ Région des fonctions Vercel — IMPORTANT

Ta base Turso est en **Virginie, États-Unis** (aws-us-east-1) — pas à Francfort.

Vercel → **Settings → Functions → Function Region** → choisis **Washington, D.C. (iad1 - Capital of the US)** → Save.
La fonction et la base seront presque voisines → réponses **~4× plus rapides**.

### 🚀 ÉTAPE 3 — Redeployer

Vercel → **Deployments** → dernier déploiement → bouton **⋯** → **Redeploy** → Confirme.
Attends ~2 min que le statut repasse au vert.

### 🩺 ÉTAPE 4 — Vérifier en 30 secondes

1. Ouvre **https://temp-mail-premium.vercel.app/api/health**
   - `{"ok":true}` → ✅ **gagné, tout fonctionne**
   - `{"ok":false, "reason":"…", "hint":"…"}` → le site t'explique LUI-MÊME quoi corriger
     (URL de base ou token) — suis le champ « hint ».
2. Ouvre le site, clique « Créer mon adresse », puis envoie-lui un e-mail depuis
   Gmail — il arrive en quelques secondes.

---

## 🔍 DÉPANNAGE

| Symptôme | Cause | Solution |
|---|---|---|
| `P2010 … 502` / `no route configured` dans les logs Vercel | `TURSO_DATABASE_URL` incorrecte (espace, `libmysql://`, mauvais nom de base) | Recopie la valeur exacte du tableau Étape 2 |
| `/api/health` → « jeton refusé » | `TURSO_AUTH_TOKEN` faux ou tronqué | Régénère un token : dashboard Turso → ta base → Connect → copier (bouton) |
| `/api/health` → « Impossible de joindre le serveur » | URL incomplète | Elle doit contenir `.aws-us-east-1.turso.io` |
| `{"ok":true}` mais aucune adresse créée | API mail.tm momentanément inaccessible depuis Vercel | Réessaie dans 1 min — la bascule automatique vers mail.gw est intégrée |

> 📌 Le token est **privé** : ne le partage avec personne. S'il fuit, régénère-le
> (dashboard Turso) et remplace simplement la variable sur Vercel.

---

## 💰 GOOGLE ADSENSE — état et suite

### ✅ Déjà fait dans le code (4 octobre 2026)
- Identifiant éditeur **ca-pub-6535203279347573** intégré.
- Script officiel AdSense présent dans le `<head>` de **toutes les pages**
  (c'est ce que Google exige pour vérifier un site).
- **/ads.txt** généré automatiquement : `google.com, pub-6535203279347573, DIRECT, f08c47fec0942fa0`
- Bandeau cookies RGPD + publicités **non personnalisées** si le visiteur refuse.

### 📋 À faire côté adsense.google.com
1. **Sites → Ajouter un site** → colle ton URL.
   ⚠️ **Vérité importante** : Google AdSense refuse la quasi-totalité des sous-domaines
   gratuits (`vercel.app`) car tu n'en « possèdes » pas le domaine. Deux options :
   - **Tenter quand même** la validation (gratuit, réponse en 1-14 jours) — le code est
     déjà parfaitement en place, tu ne perds rien à essayer ;
   - **Acheter ton propre domaine** (~1-2 €/an en `.xyz`/`.top`) → validation quasi
     certaine. Il suffira ensuite de : pointer le domaine vers Vercel + changer la
     variable `NEXT_PUBLIC_SITE_URL`. **Aucune autre modification.**
2. En attendant, tu peux déjà gagner avec les réseaux qui **acceptent vercel.app** :
   **A-ADS** (a-ads.com, sans validation) et **Adsterra** → colle leur code dans
   `src/config/ads.ts` (section `custom` ou `adsterra`).
3. Une fois validé par Google : crée des blocs « Display » dans la console AdSense,
   puis colle leurs IDs numériques dans `ads.ts → slots` (top/mid/page/footer).
   Les **Annonces automatiques** peuvent aussi s'afficher toutes seules.

---

## 🎯 Récapitulatif final
1. ✅ Base Turso : `tempmail-khaleddey` opérationnelle, tables créées.
2. ⬜ Uploader les 6 fichiers sur GitHub (Étape 1).
3. ⬜ Coller les 3 variables sur Vercel + région **iad1** (Étape 2).
4. ⬜ Redeployer (Étape 3) puis vérifier `/api/health` (Étape 4).
5. ⬜ Demander la validation AdSense (ou A-ADS en attendant).
