# Script de migration des données localStorage → Firestore

## 📝 Script de migration

Créez un fichier `scripts/migrate-to-firebase.ts` :

```typescript
// Script à exécuter une seule fois pour migrer les données
import { collection, doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { auth } from "@/lib/firebase/config";
import { signInAnonymously } from "firebase/auth";

async function migrateData() {
  // Se connecter anonymement pour la migration
  await signInAnonymously(auth);

  // Migrer les profils globaux
  const profilsGlobaux = JSON.parse(
    localStorage.getItem("padelmatch_profils_globaux_v1") || "[]"
  );

  for (const profil of profilsGlobaux) {
    // Créer un userId temporaire basé sur l'email
    const userId = profil.email.replace(/[^a-zA-Z0-9]/g, "_");
    await setDoc(doc(db, "profils", userId), {
      ...profil,
      createdAt: new Date(profil.createdAt || Date.now()),
      updatedAt: new Date(profil.updatedAt || Date.now()),
    });
  }

  // Migrer les parties
  const parties = JSON.parse(
    localStorage.getItem("padelmatch_parties_v1") || "[]"
  );

  for (const partie of parties) {
    await setDoc(doc(db, "parties", partie.id), {
      ...partie,
      createdAt: new Date(partie.createdAt || Date.now()),
    });
  }

  // Migrer les groupes
  const groupes = JSON.parse(
    localStorage.getItem("padelmatch_groupes_v1") || "[]"
  );

  for (const groupe of groupes) {
    await setDoc(doc(db, "groupes", groupe.id), {
      ...groupe,
      createdAt: new Date(groupe.createdAt || Date.now()),
    });
  }

  console.log("Migration terminée !");
}

// Exécuter uniquement en développement
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  // migrateData();
}
```

## ⚠️ Important

- Exécutez ce script **une seule fois**
- Faites une **sauvegarde** de localStorage avant
- Testez sur un **environnement de développement** d'abord
