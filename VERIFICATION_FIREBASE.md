# 🔍 Vérification de la connexion Firebase

## Problème identifié
Les données créées ne persistent pas dans Firestore. Elles sont seulement sauvegardées dans localStorage.

## Causes possibles

### 1. Règles Firestore trop restrictives
Les règles Firestore peuvent bloquer l'écriture. Vérifiez dans la console Firebase :

**Console Firebase → Firestore Database → Rules**

Les règles doivent permettre la lecture/écriture. Pour tester, utilisez temporairement :

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true; // ⚠️ TEMPORAIRE - Pour tester uniquement
    }
  }
}
```

⚠️ **ATTENTION** : Ces règles sont ouvertes à tous. Utilisez-les uniquement pour tester, puis configurez des règles de sécurité appropriées.

### 2. Vérifier la connexion
Ouvrez la console du navigateur (F12) et vérifiez les logs :
- `🔄 Connexion à Firestore...` 
- `✅ Connexion Firestore réussie`
- `❌ Erreur...` avec le code d'erreur

### 3. Codes d'erreur courants

- **`permission-denied`** : Les règles Firestore bloquent l'accès
- **`unavailable`** : Firestore n'est pas disponible (vérifiez votre connexion)
- **`failed-precondition`** : Index manquant (créer l'index dans la console Firebase)

## Solution

### Étape 1 : Vérifier les règles Firestore

1. Allez sur https://console.firebase.google.com/
2. Sélectionnez votre projet `padelmatch06`
3. **Firestore Database** → **Rules**
4. Vérifiez que les règles permettent l'écriture

### Étape 2 : Vérifier les logs dans la console

1. Ouvrez votre application
2. Ouvrez la console du navigateur (F12)
3. Créez une partie
4. Regardez les logs :
   - Si vous voyez `✅ Partie créée avec succès` → Firebase fonctionne
   - Si vous voyez `❌ Erreur` → Notez le code d'erreur

### Étape 3 : Tester la connexion

Dans la console du navigateur, tapez :

```javascript
// Tester la connexion Firebase
import { db } from './lib/firebase/config';
import { collection, addDoc } from 'firebase/firestore';

// Test simple
addDoc(collection(db, "test"), { message: "test" })
  .then(() => console.log("✅ Connexion OK"))
  .catch((error) => console.error("❌ Erreur:", error));
```

## Règles Firestore recommandées (après test)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Profils : lecture publique, écriture uniquement par le propriétaire
    match /profils/{userId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Parties : lecture publique, écriture par utilisateurs authentifiés
    match /parties/{partieId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null;
    }
    
    // Groupes : lecture publique, écriture par utilisateurs authentifiés
    match /groupes/{groupeId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Messages : lecture par participants, écriture par utilisateurs authentifiés
    match /messages/{messageId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
    }
  }
}
```

## Prochaines étapes

1. ✅ Vérifier les règles Firestore
2. ✅ Tester la création d'une partie
3. ✅ Vérifier les logs dans la console
4. ✅ Si erreur `permission-denied`, mettre à jour les règles
5. ✅ Si erreur `unavailable`, vérifier la connexion internet
