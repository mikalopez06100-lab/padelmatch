# 🔍 Diagnostic des problèmes Firestore

Si les données ne chargent pas depuis Firestore, suivez ces étapes de diagnostic :

## 1. Vérifier les règles Firestore

Les règles doivent être déployées. Vérifiez dans la console Firebase :
- https://console.firebase.google.com/project/padelmatch06/firestore/rules

### Déployer les règles manuellement

Si les règles ne sont pas déployées, utilisez Firebase CLI :

```bash
firebase deploy --only firestore:rules
```

Ou copiez le contenu de `firestore.rules` dans la console Firebase.

## 2. Vérifier les index Firestore

Si vous voyez une erreur `failed-precondition`, un index Firestore manque.

### Créer les index automatiquement

1. Ouvrez la console Firebase : https://console.firebase.google.com/project/padelmatch06/firestore/indexes
2. Cliquez sur le lien dans l'erreur (si disponible)
3. Ou créez manuellement ces index :

**Collection: `parties`**
- Champ : `createdAt` (Descending)

**Collection: `messages`**
- Champ 1 : `partieId` (Ascending)
- Champ 2 : `createdAt` (Ascending)

## 3. Vérifier l'authentification

Certaines collections nécessitent une authentification :

- **profils** : Lecture publique ✅
- **parties** : Lecture publique ✅
- **groupes** : Lecture publique ✅
- **messages** : Lecture uniquement si authentifié ⚠️
- **terrains** : Lecture publique ✅

## 4. Utiliser la page de diagnostic

Accédez à : `/diagnostic` ou `/debug-firebase`

Ces pages affichent :
- L'état de l'authentification
- Les données dans Firestore
- Les erreurs éventuelles

## 5. Vérifier la console du navigateur

Ouvrez la console (F12) et cherchez :
- ❌ Erreurs en rouge
- ⚠️ Avertissements
- 🔄 Messages de connexion Firestore

Erreurs courantes :

### `permission-denied`
**Solution** : Déployez les règles Firestore (étape 1)

### `failed-precondition`
**Solution** : Créez les index manquants (étape 2)

### `network-error` ou timeout
**Solution** : Vérifiez votre connexion internet et que Firebase est accessible

### `unauthenticated`
**Solution** : Connectez-vous à l'application

## 6. Vérifier la configuration Firebase

Assurez-vous que `lib/firebase/config.ts` contient la bonne configuration :

```typescript
const firebaseConfig = {
  apiKey: "AIzaSyCelnZTQR1ACPayc1GxC4vQz93t1z0m3iM",
  authDomain: "padelmatch06.firebaseapp.com",
  projectId: "padelmatch06",
  // ...
};
```

## 7. Fallback automatique

L'application utilise automatiquement `localStorage` en cas d'erreur Firestore.

Si les données ne chargent pas :
1. Vérifiez si elles sont dans `localStorage` (F12 → Application → Local Storage)
2. Si oui, le problème vient de Firestore
3. Si non, les données n'ont jamais été sauvegardées

## 8. Tester manuellement

Dans la console du navigateur :

```javascript
// Tester la connexion Firestore
import { db } from '@/lib/firebase/config';
import { collection, getDocs } from 'firebase/firestore';

getDocs(collection(db, 'parties'))
  .then(snapshot => console.log('✅ Parties:', snapshot.size))
  .catch(error => console.error('❌ Erreur:', error));
```

## 9. Support

Si le problème persiste :
1. Notez le code d'erreur exact
2. Notez le message d'erreur
3. Vérifiez les logs dans la console Firebase
4. Consultez la documentation Firebase : https://firebase.google.com/docs/firestore
