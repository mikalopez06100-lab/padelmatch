# 🗑️ Nettoyer complètement la base de données Firestore

## ⚠️ ATTENTION
Cette opération va supprimer **TOUTES** les données de Firestore (profils, parties, groupes, messages). Cette action est **IRRÉVERSIBLE**.

## 📋 Méthode : Via Firebase Console (Recommandée)

### Étape 1 : Accéder à Firebase Console

1. Va sur **https://console.firebase.google.com/**
2. Sélectionne ton projet **`padelmatch06`**
3. Dans le menu de gauche, clique sur **"Firestore Database"**

### Étape 2 : Supprimer les collections

Pour chaque collection (profils, parties, groupes, messages) :

1. Clique sur la collection (ex: "profils")
2. Clique sur le bouton **"..."** (trois points) à droite du nom de la collection
3. Sélectionne **"Delete collection"** (Supprimer la collection)
4. Dans la popup, tape le nom de la collection pour confirmer (ex: "profils")
5. Clique sur **"Delete"** (Supprimer)
6. Répète pour chaque collection :
   - `profils`
   - `parties`
   - `groupes`
   - `messages`

### Étape 3 : Vérifier

1. Vérifie que toutes les collections sont vides ou supprimées
2. Tu peux maintenant recommencer les inscriptions à zéro

## 🔄 Alternative : Supprimer la base de données complète (plus rapide)

Si tu veux supprimer **TOUTE** la base de données d'un coup :

1. Dans **Firestore Database**, clique sur l'onglet **"Data"**
2. Clique sur le bouton **"..."** (trois points) en haut à droite
3. Sélectionne **"Delete database"** (Supprimer la base de données)
4. Confirme la suppression
5. **Important** : Après la suppression, tu devras recréer la base de données :
   - Clique sur **"Create database"**
   - Choisis **"Start in production mode"** (ou "test mode" temporairement)
   - Choisis la région **"europe-west"**
   - Clique sur **"Enable"**
6. **N'oublie pas de redéployer les règles Firestore** depuis le fichier `firestore.rules`

## ✅ Après le nettoyage

Une fois la base de données nettoyée :

1. Les nouveaux utilisateurs pourront créer des comptes
2. Les nouvelles parties, groupes et messages seront créés normalement
3. Tout repart de zéro comme souhaité
