# 🚀 Déployer les règles Firebase Storage

## 📋 Étapes pour configurer Firebase Storage

### Étape 1 : Activer Firebase Storage

1. Allez sur **https://console.firebase.google.com/**
2. Sélectionnez votre projet **`padelmatch06`**
3. Dans le menu de gauche, cliquez sur **"Storage"** (ou "Stockage")
4. Si vous voyez un bouton **"Get started"** ou **"Commencer"** :
   - Cliquez dessus
   - Choisissez **"Start in test mode"** (mode test)
   - Choisissez la région **"europe-west"** (ou celle de votre choix)
   - Cliquez sur **"Done"** ou **"Terminé"**

### Étape 2 : Déployer les règles Storage

1. Toujours dans **Storage**, cliquez sur l'onglet **"Rules"** (en haut)
2. Vous verrez un éditeur de texte avec des règles par défaut
3. **Copiez tout le contenu** du fichier `storage.rules` de votre projet
4. **Collez** dans l'éditeur de règles de Firebase
5. Cliquez sur **"Publish"** (en haut à droite)
6. Attendez quelques secondes

### Étape 3 : Vérifier les règles

Les règles doivent permettre :
- ✅ **Lecture publique** de l'image de fond (pour que tous puissent la voir)
- ✅ **Écriture authentifiée** (seuls les utilisateurs connectés peuvent uploader)

## 📤 Uploader l'image de fond

### Option 1 : Via la page admin (Recommandé)

1. Allez sur votre application en production (URL Vercel)
2. Naviguez vers **`/admin/background-image`**
3. Cliquez sur **"Sélectionner une image"**
4. Choisissez votre image
5. Cliquez sur **"Uploader l'image"**

### Option 2 : Via le script Node.js

1. Placez votre image dans le dossier du projet (ex: `background.jpg`)
2. Exécutez la commande :
   ```bash
   node scripts/upload-background.js background.jpg
   ```

⚠️ **Note** : Pour utiliser le script, vous devez être authentifié. Pour l'instant, utilisez plutôt la page admin.

## ✅ Vérification

Après l'upload, l'image devrait apparaître sur toutes les pages de l'application !
