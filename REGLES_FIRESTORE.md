# 🔒 Règles de sécurité Firestore

## 📋 Fichier de règles

Le fichier `firestore.rules` contient les règles de sécurité pour votre base de données Firestore.

## 🚀 Comment appliquer les règles

### Étape 1 : Accéder à la console Firebase

1. Allez sur https://console.firebase.google.com/
2. Sélectionnez votre projet **padelmatch06**
3. Dans le menu de gauche, cliquez sur **Firestore Database**
4. Cliquez sur l'onglet **Rules**

### Étape 2 : Copier les règles

1. Ouvrez le fichier `firestore.rules` dans votre éditeur
2. Copiez tout le contenu
3. Collez-le dans l'éditeur de règles de la console Firebase
4. Cliquez sur **Publish**

## 🔐 Explication des règles

### Profils (`/profils/{userId}`)

- **Lecture** : ✅ Publique (pour voir les profils des autres joueurs)
- **Création** : ✅ Uniquement par l'utilisateur authentifié pour son propre profil
- **Mise à jour** : ✅ Uniquement par le propriétaire (l'email ne peut pas être modifié)
- **Suppression** : ✅ Uniquement par le propriétaire

### Parties (`/parties/{partieId}`)

- **Lecture** : ✅ Publique (pour voir les parties disponibles)
- **Création** : ✅ Uniquement par utilisateurs authentifiés
- **Mise à jour** : ✅ Par l'organisateur ou pour mettre à jour les participants
- **Suppression** : ✅ Uniquement par l'organisateur

### Groupes (`/groupes/{groupeId}`)

- **Lecture** : ✅ Publique
- **Création** : ✅ Uniquement par utilisateurs authentifiés
- **Mise à jour** : ✅ Uniquement par utilisateurs authentifiés
- **Suppression** : ✅ Uniquement par utilisateurs authentifiés

### Messages (`/messages/{messageId}`)

- **Lecture** : ✅ Uniquement par utilisateurs authentifiés
- **Création** : ✅ Uniquement par utilisateurs authentifiés (le pseudo doit correspondre au profil)
- **Mise à jour** : ❌ Interdite (messages immutables)
- **Suppression** : ✅ Uniquement par l'auteur du message

## ⚠️ Notes importantes

1. **Les règles utilisent `organisateurPseudo`** : Pour une sécurité renforcée, vous devriez migrer vers `organisateurId` (l'UID Firebase) au lieu du pseudo.

2. **Vérification du pseudo** : Les règles vérifient que le pseudo correspond au profil de l'utilisateur authentifié. Cela nécessite que les profils soient créés avec l'UID comme document ID.

3. **Index requis** : Si vous utilisez des requêtes avec `orderBy`, vous devrez peut-être créer des index dans Firestore. La console vous indiquera les index manquants.

## 🔄 Amélioration de sécurité (optionnelle)

Pour une sécurité encore plus renforcée, vous pouvez ajouter `organisateurId` (UID Firebase) aux parties. Les règles actuelles fonctionnent avec le pseudo, mais l'ajout de l'UID permettrait une vérification plus directe.

Les règles actuelles vérifient le pseudo via `getUserPseudo()`, ce qui nécessite une lecture supplémentaire dans Firestore. Avec `organisateurId`, la vérification serait plus rapide et plus sécurisée.

## 🧪 Tester les règles

1. Créez une partie en étant connecté → ✅ Devrait fonctionner
2. Essayez de modifier une partie d'un autre utilisateur → ❌ Devrait être refusé
3. Essayez de supprimer un message d'un autre utilisateur → ❌ Devrait être refusé

## 📝 Logs de sécurité

Les règles Firestore génèrent automatiquement des logs dans la console Firebase :
- **Firebase Console** → **Firestore Database** → **Usage** → **Security Rules**

Vous pouvez voir les tentatives d'accès refusées ici.
