# Guide étape par étape - Déploiement PadelMatch

## 📋 Checklist de déploiement

Suivez ces étapes dans l'ordre. Cochez chaque étape au fur et à mesure.

---

## ✅ ÉTAPE 1 : Configurer votre identité Git

**Objectif** : Dire à Git qui vous êtes (nom et email)

**À faire** : Exécutez ces commandes dans PowerShell (remplacez les valeurs) :

```powershell
cd "C:\Users\ppmpc\Documents\padelmatch"

# Remplacez "Votre Nom" par votre nom réel ou pseudo GitHub
git config --global user.name "Votre Nom"

# Remplacez par votre email (idéalement celui de GitHub)
git config --global user.email "votre.email@example.com"
```

**Exemple** :
```powershell
git config --global user.name "Jean Dupont"
git config --global user.email "jean.dupont@example.com"
```

**Vérification** : Exécutez pour vérifier :
```powershell
git config user.name
git config user.email
```

**Statut** : [ ] Fait

---

## ✅ ÉTAPE 2 : Créer le commit initial

**Objectif** : Enregistrer tous vos fichiers dans Git

**À faire** : Une fois l'étape 1 terminée, exécutez :

```powershell
cd "C:\Users\ppmpc\Documents\padelmatch"

# Créer le commit avec un message descriptif
git commit -m "Initial commit - PadelMatch MVP

- Landing page avec inscription/login
- Gestion des groupes avec membres
- Création et gestion des parties
- Visibilité des matchs (profil/groupe/communauté)
- Photos de profil
- Chat réservé aux joueurs
- Notifications PWA
- Design sombre responsive"
```

**Résultat attendu** : Un message confirmant que le commit a été créé

**Statut** : [ ] Fait

---

## ✅ ÉTAPE 3 : Créer un repository sur GitHub

**Objectif** : Créer un espace pour héberger votre code sur GitHub

**À faire** :

1. **Aller sur GitHub** : https://github.com/new
2. **Se connecter** à votre compte GitHub (ou créer un compte si nécessaire)
3. **Remplir le formulaire** :
   - **Repository name** : `padelmatch` (ou un autre nom)
   - **Description** (optionnel) : "Plateforme de mise en relation de joueurs de padel - Nice & alentours"
   - **Visibilité** : 
     - ☑️ Public (recommandé pour un MVP)
     - ☐ Private (si vous préférez garder privé)
   - **NE PAS COCHER** :
     - ❌ Add a README file
     - ❌ Add .gitignore
     - ❌ Choose a license
4. **Cliquer sur** "Create repository"

**Résultat attendu** : Une page avec des instructions de push (vous n'en avez pas besoin, continuez à l'étape 4)

**Statut** : [ ] Fait

---

## ✅ ÉTAPE 4 : Connecter votre code local à GitHub

**Objectif** : Lier votre repository local au repository GitHub créé

**À faire** : 

1. Sur la page GitHub de votre repository, copiez l'URL HTTPS (du type : `https://github.com/VOTRE_USERNAME/padelmatch.git`)

2. Exécutez ces commandes (remplacez `VOTRE_USERNAME` par votre nom d'utilisateur GitHub) :

```powershell
cd "C:\Users\ppmpc\Documents\padelmatch"

# Ajouter le remote GitHub (remplacez l'URL par la vôtre)
git remote add origin https://github.com/VOTRE_USERNAME/padelmatch.git

# Renommer la branche en 'main' (standard moderne)
git branch -M main

# Vérifier que le remote est bien ajouté
git remote -v
```

**Résultat attendu** : L'URL de votre repository GitHub s'affiche

**Statut** : [ ] Fait

---

## ✅ ÉTAPE 5 : Pousser le code sur GitHub

**Objectif** : Envoyer votre code sur GitHub

**À faire** : Exécutez :

```powershell
cd "C:\Users\ppmpc\Documents\padelmatch"

# Pousser le code vers GitHub
git push -u origin main
```

**Si vous êtes invité à vous authentifier** :

GitHub n'accepte plus les mots de passe. Vous devez utiliser un **Personal Access Token** :

1. **Créer un token** : https://github.com/settings/tokens
2. Cliquer sur "Generate new token" > "Generate new token (classic)"
3. **Nom** : `padelmatch-deployment`
4. **Durée** : 90 days (ou No expiration)
5. **Permissions** : Cocher uniquement `repo` (accès complet aux repositories)
6. Cliquer sur "Generate token"
7. **COPIER LE TOKEN** (vous ne le verrez qu'une fois !)
8. Lors du `git push`, utilisez :
   - **Username** : Votre nom d'utilisateur GitHub
   - **Password** : Le token que vous venez de créer (collez-le)

**Résultat attendu** : Un message confirmant que le push a réussi

**Statut** : [ ] Fait

---

## ✅ ÉTAPE 6 : Déployer sur Vercel

**Objectif** : Mettre votre application en ligne

**À faire** :

1. **Aller sur Vercel** : https://vercel.com/new
2. **Se connecter** avec votre compte GitHub
3. **Autoriser Vercel** à accéder à vos repositories (si demandé)
4. **Importer le projet** :
   - Sélectionner le repository `padelmatch`
   - Vercel détectera automatiquement Next.js
5. **Configuration** (ne rien modifier, les valeurs par défaut sont correctes) :
   - Framework Preset : Next.js ✅
   - Build Command : `npm run build` ✅
   - Output Directory : `.next` ✅
   - Install Command : `npm install` ✅
6. **Cliquer sur "Deploy"**
7. **Attendre 2-3 minutes** pendant le déploiement

**Résultat attendu** : 
- ✅ Un message "Congratulations! Your project has been deployed"
- Une URL du type : `https://padelmatch-xyz.vercel.app`

**Statut** : [ ] Fait

---

## ✅ ÉTAPE 7 : Tester l'application

**Objectif** : Vérifier que tout fonctionne

**À faire** :

1. Ouvrir l'URL fournie par Vercel dans votre navigateur
2. Vérifier :
   - [ ] La landing page s'affiche
   - [ ] Le formulaire d'inscription fonctionne
   - [ ] La connexion fonctionne
   - [ ] La création de groupes fonctionne
   - [ ] La création de parties fonctionne
   - [ ] Le responsive fonctionne (tester sur mobile)

**Statut** : [ ] Fait

---

## 🎉 Félicitations !

Votre application PadelMatch est maintenant en ligne et accessible au monde entier !

---

## 📝 Prochaines étapes (optionnel)

- **Domaine personnalisé** : Configurer un nom de domaine dans les paramètres Vercel
- **Variables d'environnement** : Ajouter si nécessaire pour la future migration backend
- **Monitoring** : Vercel fournit des analytics intégrés

---

## ❓ Besoin d'aide ?

Si vous rencontrez une erreur à une étape :
1. Notez le message d'erreur exact
2. Consultez les guides détaillés (`DEPLOYMENT.md`, `DEPLOY_INSTRUCTIONS.md`)
3. Documentation Vercel : https://vercel.com/docs
4. Documentation GitHub : https://docs.github.com
