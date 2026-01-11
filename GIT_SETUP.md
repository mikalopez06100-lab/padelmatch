# Configuration Git - PadelMatch

## ✅ Git a été initialisé avec succès !

Git a été initialisé dans votre projet. Il reste quelques étapes à faire manuellement.

---

## 📝 Étape 1 : Configurer votre identité Git

**Exécutez ces commandes** (remplacez par vos informations) :

```bash
cd "C:\Users\ppmpc\Documents\padelmatch"

# Configurer votre nom (remplacez "Votre Nom" par votre nom réel ou pseudo GitHub)
git config --global user.name "Votre Nom"

# Configurer votre email (utilisez l'email associé à votre compte GitHub)
git config --global user.email "votre.email@example.com"
```

**Note** : Ces informations seront utilisées pour tous vos projets Git. Si vous préférez configurer uniquement pour ce projet, enlevez `--global`.

---

## 📦 Étape 2 : Créer le commit initial

Une fois votre identité configurée, exécutez :

```bash
cd "C:\Users\ppmpc\Documents\padelmatch"

# Vérifier que tous les fichiers sont bien ajoutés
git status

# Créer le commit initial
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

---

## 🚀 Étape 3 : Créer le repository GitHub et pousser

1. **Créer un repository sur GitHub** :
   - Aller sur https://github.com/new
   - Nom : `padelmatch`
   - **Ne pas** initialiser avec README, .gitignore, ou license (déjà présents)
   - Cliquer sur "Create repository"

2. **Connecter et pousser** :
```bash
cd "C:\Users\ppmpc\Documents\padelmatch"

# Ajouter le remote (remplacez VOTRE_USERNAME par votre nom d'utilisateur GitHub)
git remote add origin https://github.com/VOTRE_USERNAME/padelmatch.git

# Renommer la branche en 'main'
git branch -M main

# Pousser vers GitHub
git push -u origin main
```

**Si vous êtes invité à vous authentifier** :
- GitHub utilise des Personal Access Tokens (pas de mot de passe)
- Créer un token : https://github.com/settings/tokens
- Utiliser le token comme mot de passe lors du push

---

## ✅ Étape 4 : Déployer sur Vercel

Une fois le code sur GitHub :

1. Aller sur https://vercel.com/new
2. Se connecter avec GitHub
3. Sélectionner le repository `padelmatch`
4. Cliquer sur "Deploy"
5. ✅ Votre app sera en ligne en 2-3 minutes !

---

## 📋 Checklist

- [ ] Git configuré (nom et email)
- [ ] Commit initial créé
- [ ] Repository GitHub créé
- [ ] Code poussé sur GitHub
- [ ] Déployé sur Vercel
- [ ] Application en ligne et testée

---

## 🎉 C'est tout !

Après ces étapes, votre application PadelMatch sera déployée et accessible en ligne !
