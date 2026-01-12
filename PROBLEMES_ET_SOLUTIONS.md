# Problèmes identifiés et solutions

## 🔴 Problème 1 : Les joueurs n'apparaissent pas sur un nouvel appareil

### Explication
**C'est normal** avec l'architecture actuelle. L'application utilise `localStorage` qui est :
- **Local au navigateur** : Chaque navigateur/appareil a son propre localStorage
- **Non synchronisé** : Les données ne sont pas partagées entre appareils
- **Perdu si effacé** : Si vous videz le cache, les données sont perdues

### Solution actuelle (MVP)
Les données sont stockées localement sur chaque appareil. Pour partager les données entre appareils, il faut un **backend/serveur**.

### Solution recommandée
Migrer vers un backend avec base de données :
- **Firebase Firestore** (gratuit jusqu'à 50k lectures/jour)
- **Supabase** (gratuit jusqu'à 500MB)
- **Backend Node.js + MongoDB/PostgreSQL**

---

## 🔴 Problème 2 : Image de fond n'apparaît pas

### Causes possibles
1. L'URL Unsplash peut être bloquée par certains navigateurs
2. Problème de chargement réseau
3. Cache du navigateur

### Solution
Utiliser une image locale ou une autre source fiable.

---

## 🔴 Problème 3 : "Mot de passe oublié" n'apparaît pas

### Vérification
Le code est présent dans `app/page.tsx` ligne 226-245. Le lien devrait apparaître à droite du label "Mot de passe" en mode "login".

### Causes possibles
1. Cache du navigateur
2. Problème de rendu CSS
3. Version non déployée

---

## 🔴 Problème 4 : Reconnexion ne fonctionne pas

### Explication
Si vous vous connectez sur un nouvel appareil :
- Les profils globaux sont vides (localStorage vide)
- Votre compte n'existe pas dans le localStorage de ce nouvel appareil
- Donc la connexion échoue car le profil n'est pas trouvé

### Solution
C'est la même limitation que le problème 1 : **besoin d'un backend** pour synchroniser les données.

---

## ✅ Solutions immédiates

### 1. Pour l'image de fond
Utiliser une image locale ou une URL plus fiable.

### 2. Pour le mot de passe oublié
Vider le cache du navigateur (`Ctrl + Shift + R`).

### 3. Pour les données partagées
**Nécessite un backend** - voir section suivante.

---

## 🚀 Solution à long terme : Backend nécessaire

### Pourquoi un backend est nécessaire
- ✅ Synchronisation des données entre appareils
- ✅ Authentification sécurisée
- ✅ Stockage persistant
- ✅ Partage des parties et groupes
- ✅ Statistiques globales

### Options recommandées

#### Option 1 : Firebase (Google)
- **Gratuit** : 50k lectures/jour, 20k écritures/jour
- **Facile** : SDK JavaScript, authentification intégrée
- **Temps** : 2-3 jours de migration

#### Option 2 : Supabase
- **Gratuit** : 500MB base de données, 2GB bande passante
- **Open source** : PostgreSQL, API REST
- **Temps** : 3-5 jours de migration

#### Option 3 : Backend Node.js custom
- **Contrôle total** : Votre propre serveur
- **Coût** : Serveur dédié (5-20€/mois)
- **Temps** : 1-2 semaines de développement

### Nom de domaine
- **Pas nécessaire** pour le fonctionnement
- **Recommandé** pour la professionnalisation
- **Coût** : 10-15€/an pour un .com ou .fr

---

## 📋 Checklist de migration backend

- [ ] Choisir la solution (Firebase/Supabase/Custom)
- [ ] Créer le projet backend
- [ ] Migrer les fonctions de stockage
- [ ] Implémenter l'authentification
- [ ] Tester la synchronisation multi-appareils
- [ ] Déployer et migrer les données existantes

---

## ⚠️ Limitations actuelles (MVP)

L'application fonctionne actuellement comme un **prototype/MVP** :
- ✅ Fonctionne parfaitement sur un seul appareil
- ❌ Données non partagées entre appareils
- ❌ Perte de données si cache vidé
- ❌ Pas de synchronisation en temps réel

Ces limitations sont **normales** pour un MVP avec localStorage. Pour une application de production, un backend est **indispensable**.
