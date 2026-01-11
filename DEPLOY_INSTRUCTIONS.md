# Instructions de déploiement - PadelMatch

## ✅ Git initialisé avec succès !

Le repository Git est maintenant prêt. Voici les prochaines étapes pour déployer sur Vercel :

---

## 📋 Étape 1 : Créer un repository sur GitHub

1. **Aller sur GitHub** : https://github.com/new
2. **Nom du repository** : `padelmatch` (ou un autre nom de votre choix)
3. **Visibilité** : 
   - Public (gratuit, recommandé pour un MVP)
   - Private (si vous préférez garder le code privé)
4. **NE PAS** cocher :
   - ❌ "Add a README file" (vous en avez déjà un)
   - ❌ "Add .gitignore" (vous en avez déjà un)
   - ❌ "Choose a license" (optionnel)
5. Cliquer sur **"Create repository"**

---

## 📤 Étape 2 : Connecter le repository local à GitHub

Après avoir créé le repository sur GitHub, vous obtiendrez une URL du type :
- `https://github.com/VOTRE_USERNAME/padelmatch.git`

**Exécutez ces commandes** (remplacez `VOTRE_USERNAME` par votre nom d'utilisateur GitHub) :

```bash
cd "C:\Users\ppmpc\Documents\padelmatch"

# Ajouter le remote GitHub
git remote add origin https://github.com/VOTRE_USERNAME/padelmatch.git

# Renommer la branche en 'main' (si nécessaire)
git branch -M main

# Pousser le code sur GitHub
git push -u origin main
```

**Si vous êtes invité à vous connecter** :
- GitHub utilise maintenant des tokens personnels au lieu des mots de passe
- Voir : https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens

---

## 🚀 Étape 3 : Déployer sur Vercel

### Option A : Via l'interface web (Recommandé)

1. **Aller sur Vercel** : https://vercel.com/new
2. **Se connecter** avec votre compte GitHub
3. **Importer le projet** :
   - Sélectionner le repository `padelmatch`
   - Vercel détectera automatiquement Next.js
4. **Configuration** :
   - Framework Preset : Next.js (détecté automatiquement)
   - Build Command : `npm run build` (par défaut)
   - Output Directory : `.next` (par défaut)
   - Install Command : `npm install` (par défaut)
   - **Ne pas modifier**, laisser les valeurs par défaut
5. **Cliquer sur "Deploy"**
6. ⏱️ **Attendre 2-3 minutes** pour le déploiement
7. ✅ **Votre application sera en ligne !**

### Option B : Via la CLI Vercel

```bash
# Installer Vercel CLI (une seule fois)
npm i -g vercel

# Déployer
cd "C:\Users\ppmpc\Documents\padelmatch"
vercel

# Suivre les instructions interactives
# Pour la production :
vercel --prod
```

---

## 🌐 Après le déploiement

### URL de votre application

Après le déploiement, vous obtiendrez une URL du type :
- `https://padelmatch-xyz.vercel.app`
- Vous pouvez aussi configurer un domaine personnalisé dans les paramètres du projet Vercel

### Vérifications à faire

1. ✅ La landing page s'affiche correctement
2. ✅ Le formulaire d'inscription/login fonctionne
3. ✅ La création de groupes fonctionne
4. ✅ La création de parties fonctionne
5. ✅ Les pages sont responsive sur mobile
6. ✅ Le PWA fonctionne (installation sur mobile)

---

## 🔄 Déploiements automatiques

Une fois configuré, Vercel déploiera automatiquement :
- ✅ **Chaque push sur la branche `main`** → déploiement en production
- ✅ **Chaque pull request** → déploiement de preview pour tester

---

## 📝 Commandes Git utiles

Pour les futurs changements :

```bash
# Voir les fichiers modifiés
git status

# Ajouter tous les fichiers modifiés
git add .

# Créer un commit
git commit -m "Description de vos changements"

# Pousser vers GitHub (déclenche automatiquement le déploiement sur Vercel)
git push origin main
```

---

## ❓ Questions fréquentes

### Erreur d'authentification GitHub ?
- GitHub n'accepte plus les mots de passe
- Créer un Personal Access Token : https://github.com/settings/tokens
- Utiliser le token comme mot de passe lors du `git push`

### Le déploiement échoue ?
- Vérifier que `npm run build` fonctionne localement
- Vérifier les logs sur Vercel
- S'assurer qu'aucune variable d'environnement n'est requise

### Changer de branche de déploiement ?
- Aller dans les paramètres du projet sur Vercel
- Section "Git" → "Production Branch"

---

## 🎉 C'est tout !

Votre application PadelMatch sera en ligne en quelques minutes. Bon déploiement ! 🚀
