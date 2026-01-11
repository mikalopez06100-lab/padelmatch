# Data Access Layer (DAL)

Cette couche de données sépare la logique UI de la logique de données.

## Structure actuelle (localStorage)

- `storage.ts` : Fonctions génériques de stockage
- `profil.ts` : Gestion du profil utilisateur
- `groupes.ts` : Gestion des groupes
- `parties.ts` : Gestion des parties
- `blocks.ts` : Gestion des soft blocks
- `messages.ts` : Gestion des messages (chat)

## Migration vers Firebase/Supabase

Pour migrer vers un backend, remplacer les fonctions dans chaque fichier par des appels API.

### Exemple de migration

**Avant (localStorage)** :
```typescript
export function loadGroupes(): Groupe[] {
  return loadFromStorage<Groupe[]>(STORAGE_KEYS.groupes, []);
}
```

**Après (Firebase)** :
```typescript
export async function loadGroupes(): Promise<Groupe[]> {
  const userId = await getCurrentUserId();
  const snapshot = await db.collection('groupes')
    .where('userId', '==', userId)
    .get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}
```

## Points d'extension

- Chaque fichier contient des `TODO: Migration backend` indiquant les fonctions à remplacer
- Les types dans `lib/types/index.ts` incluent déjà des champs préparés pour le backend (userId, updatedAt, etc.)
- La structure permet de migrer progressivement fichier par fichier
