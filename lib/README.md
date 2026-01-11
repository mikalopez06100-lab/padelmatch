# Library - Structure pour migration backend

Cette bibliothèque prépare la migration vers Firebase/Supabase en séparant la logique UI de la logique de données.

## Structure

```
lib/
├── types/          # Types TypeScript centralisés
│   └── index.ts    # Tous les types de l'application
└── data/           # Data Access Layer (DAL)
    ├── storage.ts  # Fonctions génériques de stockage
    ├── profil.ts   # Gestion du profil
    ├── groupes.ts  # Gestion des groupes
    ├── parties.ts  # Gestion des parties
    ├── blocks.ts   # Gestion des soft blocks
    └── messages.ts # Gestion des messages (chat)
```

## Principe

**Séparation UI / Data** :
- Les pages UI utilisent les fonctions de `lib/data/`
- Les fonctions de `lib/data/` gèrent le stockage local (localStorage actuellement)
- Pour migrer vers Firebase/Supabase, remplacer uniquement les fonctions de `lib/data/`

## Types préparés pour le backend

Les types dans `lib/types/index.ts` incluent déjà :
- Champs `id` : prêts pour Firebase document IDs
- Champs `createdAt` / `updatedAt` : prêts pour timestamps
- Champs `userId` : préparés dans les types Document (pour relations)
- Commentaires `TODO: Migration backend` pour identifier les champs à ajouter

## Migration progressive

Vous pouvez migrer progressivement :
1. Commencer par un module (ex: `profil.ts`)
2. Remplacer les fonctions localStorage par Firebase/Supabase
3. Les pages UI continuent de fonctionner (même interface)
4. Répéter pour chaque module

## Exemple de migration

**Avant (localStorage)** :
```typescript
// lib/data/profil.ts
export function loadProfil(): Profil | null {
  return loadFromStorage<Profil | null>(STORAGE_KEYS.profil, null);
}
```

**Après (Firebase)** :
```typescript
// lib/data/profil.ts
export async function loadProfil(): Promise<Profil | null> {
  const userId = await getCurrentUserId();
  const doc = await db.collection('profils').doc(userId).get();
  return doc.exists ? doc.data() as Profil : null;
}
```

**L'interface reste la même** : les pages n'ont pas besoin de changer (sauf pour async/await).

## Points d'extension

Chaque fichier de `lib/data/` contient des commentaires `TODO: Migration backend` indiquant :
- Les fonctions à remplacer
- Les nouvelles fonctions à créer (ex: subscriptions)
- Les champs à ajouter dans les types
