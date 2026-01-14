# 🚀 Déployer les règles Firestore - Guide étape par étape

## ⚠️ PROBLÈME IDENTIFIÉ
Les règles Firestore ne sont probablement pas déployées dans Firebase Console. C'est pour ça que rien n'apparaît dans Firestore.

## 📋 Étapes pour déployer les règles

### Étape 1 : Vérifier que Firestore est activé

1. Va sur **https://console.firebase.google.com/**
2. Sélectionne ton projet **`padelmatch06`**
3. Dans le menu de gauche, cherche **"Firestore Database"** (ou "Base de données Firestore")
4. Si tu vois un bouton **"Create database"** → Clique dessus :
   - Choisis **"Start in test mode"** (pour le moment)
   - Choisis la région **"europe-west"**
   - Clique sur **"Enable"**
   - Attends quelques secondes

### Étape 2 : Déployer les règles Firestore

1. Toujours dans **Firestore Database**, clique sur l'onglet **"Rules"** (en haut)
2. Tu verras un éditeur de texte avec des règles par défaut
3. **Copie tout le contenu** du fichier `firestore.rules` de ton projet
4. **Colle** dans l'éditeur de règles de Firebase
5. Clique sur **"Publish"** (en haut à droite)
6. Attends quelques secondes

### Étape 3 : Vérifier que ça fonctionne

1. Va sur ta page de test : **http://localhost:3000/test-firebase** (ou ton URL)
2. Ouvre la console du navigateur (F12)
3. Crée un nouveau compte depuis la page d'accueil
4. Vérifie dans la console qu'il n'y a pas d'erreur `permission-denied`
5. Va dans Firebase Console → Firestore Database → Data
6. Tu devrais voir une collection **"profils"** avec un document

## 🔧 Si ça ne fonctionne toujours pas

### Solution temporaire : Règles de test ouvertes

Pour tester rapidement, utilise ces règles **TEMPORAIRES** dans Firebase Console :

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

⚠️ **ATTENTION** : Ces règles permettent à n'importe quel utilisateur authentifié de lire/écrire. 
C'est juste pour tester. Remplace par les règles complètes après.

### Vérifier l'authentification Firebase

1. Va dans Firebase Console → **Authentication**
2. Vérifie que **"Email/Password"** est activé :
   - Onglet **"Sign-in method"**
   - Si "Email/Password" n'est pas activé → Clique dessus → Active → Sauvegarde

## ✅ Checklist

- [ ] Firestore Database est créé et actif
- [ ] Les règles Firestore sont déployées (onglet Rules → Publish)
- [ ] Authentication → Email/Password est activé
- [ ] Test dans la console du navigateur montre des logs ✅
- [ ] Les profils apparaissent dans Firestore → Data → profils
