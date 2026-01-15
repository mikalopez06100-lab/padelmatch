# 🖼️ Guide : Uploader l'image de fond

## 📋 Étapes complètes

### Étape 1 : Configurer les règles Firebase Storage

1. **Allez sur la console Firebase** :
   - Ouvrez : https://console.firebase.google.com/
   - Sélectionnez votre projet **`padelmatch06`**

2. **Activez Firebase Storage** (si pas encore fait) :
   - Dans le menu de gauche, cliquez sur **"Storage"** (ou "Stockage")
   - Si vous voyez **"Get started"** ou **"Commencer"** :
     - Cliquez dessus
     - Choisissez **"Start in test mode"**
     - Choisissez la région **"europe-west"** (ou celle de votre choix)
     - Cliquez sur **"Done"**

3. **Déployer les règles Storage** :
   - Toujours dans **Storage**, cliquez sur l'onglet **"Rules"** (en haut)
   - **Copiez tout le contenu** du fichier `storage.rules` de votre projet
   - **Collez** dans l'éditeur de règles de Firebase
   - Cliquez sur **"Publish"** (en haut à droite)
   - Attendez quelques secondes

### Étape 2 : Uploader l'image via la page admin

1. **Allez sur votre application en production** :
   - Ouvrez votre URL Vercel (ex: `https://padelmatch-xyz.vercel.app`)
   - Ou votre domaine personnalisé si vous en avez un

2. **Connectez-vous** à votre application (si pas déjà fait)

3. **Allez sur la page admin** :
   - Ouvrez : `https://votre-url-vercel.vercel.app/admin/background-image`
   - Ou naviguez vers **`/admin/background-image`** depuis votre application

4. **Uploader l'image** :
   - Cliquez sur **"Sélectionner une image"**
   - Choisissez votre image de fond (JPG, PNG ou WebP, max 10 MB)
   - Un aperçu apparaîtra
   - Cliquez sur **"📤 Uploader l'image"**
   - Attendez le message de succès ✅

5. **Vérifier** :
   - L'image devrait maintenant apparaître sur toutes les pages de l'application !
   - Rafraîchissez la page pour voir l'image de fond

## ✅ Vérification

Après l'upload, vous devriez voir :
- ✅ L'image de fond sur toutes les pages
- ✅ L'image visible sur les pages admin (fond transparent)
- ✅ L'image chargée depuis Firebase Storage

## 🔧 Dépannage

### Erreur "storage/unauthorized"
- **Cause** : Les règles Storage ne sont pas configurées
- **Solution** : Vérifiez que vous avez bien déployé les règles (Étape 1)

### Erreur "storage/object-not-found"
- **Cause** : L'image n'a pas été uploadée
- **Solution** : Réessayez l'upload via la page admin

### L'image n'apparaît pas
- **Cause** : Cache du navigateur ou image non chargée
- **Solution** : 
  - Rafraîchissez la page (Ctrl+F5 ou Cmd+Shift+R)
  - Vérifiez la console du navigateur (F12) pour les erreurs
  - Vérifiez que l'image est bien dans Firebase Storage

## 📝 Notes

- L'image est stockée dans Firebase Storage à : `background/background-image.jpg`
- L'image est accessible publiquement (lecture publique)
- Seuls les utilisateurs authentifiés peuvent uploader une nouvelle image
- L'image remplace automatiquement l'ancienne si vous en uploadez une nouvelle
