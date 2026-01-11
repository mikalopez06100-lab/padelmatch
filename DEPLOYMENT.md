# Guide de déploiement - PadelMatch

## Recommandation : Vercel

**Vercel** est la meilleure option pour déployer une application Next.js car :
- ✅ Créé par l'équipe Next.js
- ✅ Déploiement gratuit avec plan Hobby
- ✅ Configuration automatique pour Next.js
- ✅ Déploiements automatiques depuis Git
- ✅ SSL/HTTPS automatique
- ✅ CDN global inclus
- ✅ Support PWA natif

## Option 1 : Déploiement avec Vercel (Recommandé)

### Prérequis
1. Un compte GitHub, GitLab ou Bitbucket
2. Un compte Vercel (gratuit) : https://vercel.com/signup

### Étapes

#### 1. Initialiser Git (si pas déjà fait)
```bash
git init
git add .
git commit -m "Initial commit - PadelMatch MVP"
```

#### 2. Créer un repository sur GitHub
1. Aller sur https://github.com/new
2. Créer un nouveau repository (ex: `padelmatch`)
3. Ne pas initialiser avec README (déjà présent)
4. Copier l'URL du repository

#### 3. Pousser le code sur GitHub
```bash
git remote add origin https://github.com/VOTRE_USERNAME/padelmatch.git
git branch -M main
git push -u origin main
```

#### 4. Déployer sur Vercel

**Option A : Via l'interface Vercel (Recommandé)**
1. Aller sur https://vercel.com/new
2. Connecter votre compte GitHub/GitLab/Bitbucket
3. Sélectionner le repository `padelmatch`
4. Vercel détectera automatiquement Next.js
5. Cliquer sur "Deploy"
6. ✅ Votre application sera en ligne en ~2 minutes !

**Option B : Via la CLI Vercel**
```bash
# Installer Vercel CLI
npm i -g vercel

# Déployer
vercel

# Suivre les instructions
# Pour la production :
vercel --prod
```

### Configuration Vercel

Aucune configuration spéciale n'est nécessaire ! Vercel détectera automatiquement :
- ✅ Next.js 16
- ✅ Build command : `npm run build`
- ✅ Output directory : `.next`

### Variables d'environnement

Pour l'instant, aucune variable d'environnement n'est nécessaire car l'application utilise localStorage côté client.

### URL de production

Après le déploiement, vous obtiendrez une URL du type :
- `https://padelmatch.vercel.app`
- Vous pouvez configurer un domaine personnalisé dans les paramètres du projet

---

## Option 2 : Netlify (Alternative)

Netlify est aussi une excellente option pour Next.js.

### Via l'interface Netlify
1. Aller sur https://app.netlify.com
2. "Add new site" > "Import an existing project"
3. Connecter GitHub et sélectionner le repository
4. Configuration :
   - Build command : `npm run build`
   - Publish directory : `.next`
5. Deploy

---

## Option 3 : Railway

Railway offre aussi un déploiement simple.

1. Aller sur https://railway.app
2. "New Project" > "Deploy from GitHub repo"
3. Sélectionner le repository
4. Railway détectera Next.js automatiquement

---

## Points importants

### ⚠️ Limitations du MVP actuel

L'application actuelle utilise **localStorage** côté client, ce qui signifie :
- ❌ Les données sont stockées localement sur chaque appareil
- ❌ Pas de synchronisation entre appareils
- ❌ Les données sont perdues si le cache est vidé
- ✅ Parfait pour un MVP/test utilisateurs
- ✅ Aucun backend nécessaire

### 🔄 Prochaines étapes (Backend)

Pour une version production, il faudra migrer vers :
- Firebase / Supabase (recommandé)
- PostgreSQL + API
- Autre backend selon vos besoins

Le code est déjà préparé pour cette migration (voir `lib/data/README.md`)

---

## Vérification post-déploiement

Après le déploiement, vérifier :
1. ✅ La landing page s'affiche correctement
2. ✅ L'inscription/connexion fonctionne
3. ✅ La création de parties fonctionne
4. ✅ Les notifications PWA fonctionnent (si testées)
5. ✅ Le responsive fonctionne sur mobile

---

## Support

- Documentation Vercel : https://vercel.com/docs
- Documentation Next.js : https://nextjs.org/docs
- Support Vercel : support@vercel.com
