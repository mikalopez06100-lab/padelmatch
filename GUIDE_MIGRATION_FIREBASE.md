# Guide de migration vers Firebase

## 📋 Vue d'ensemble

Ce guide vous explique comment migrer PadelMatch de localStorage vers Firebase Firestore pour permettre la synchronisation des données entre appareils et utilisateurs.

---

## 🎯 Objectifs de la migration

- ✅ Synchronisation des données entre tous les appareils
- ✅ Partage des parties entre tous les utilisateurs
- ✅ Authentification sécurisée avec Firebase Auth
- ✅ Données persistantes sur un serveur
- ✅ Temps réel avec Firestore

---

## 📦 Étape 1 : Créer un projet Firebase

### 1.1 Créer le projet
1. Allez sur [Firebase Console](https://console.firebase.google.com/)
2. Cliquez sur **"Ajouter un projet"** ou **"Créer un projet"**
3. Entrez le nom : `padelmatch` (ou votre choix)
4. Désactivez Google Analytics (optionnel pour MVP)
5. Cliquez sur **"Créer le projet"**

### 1.2 Enregistrer l'application web
1. Dans le tableau de bord Firebase, cliquez sur l'icône **Web** (`</>`)
2. Entrez un nom d'app : `PadelMatch Web`
3. **Ne cochez PAS** "Also set up Firebase Hosting" (on utilise Vercel)
4. Cliquez sur **"Enregistrer l'application"**
5. **Copiez la configuration** qui s'affiche (vous en aurez besoin)

---

## 🔧 Étape 2 : Installer Firebase dans le projet

### 2.1 Installer les dépendances
```bash
npm install firebase
```

### 2.2 Créer le fichier de configuration
Créez `lib/firebase/config.ts` :

```typescript
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// ⚠️ Remplacez par votre configuration Firebase
const firebaseConfig = {
  apiKey: "VOTRE_API_KEY",
  authDomain: "VOTRE_AUTH_DOMAIN",
  projectId: "VOTRE_PROJECT_ID",
  storageBucket: "VOTRE_STORAGE_BUCKET",
  messagingSenderId: "VOTRE_MESSAGING_SENDER_ID",
  appId: "VOTRE_APP_ID"
};

// Initialiser Firebase
const app = initializeApp(firebaseConfig);

// Exporter les services
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
```

### 2.3 Créer un fichier `.env.local`
Créez `.env.local` à la racine du projet :

```env
NEXT_PUBLIC_FIREBASE_API_KEY=votre_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=votre_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=votre_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=votre_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=votre_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=votre_app_id
```

Puis mettez à jour `lib/firebase/config.ts` :

```typescript
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};
```

---

## 🔐 Étape 3 : Configurer Firebase Authentication

### 3.1 Activer l'authentification par email/mot de passe
1. Dans Firebase Console, allez dans **Authentication**
2. Cliquez sur **"Commencer"**
3. Dans l'onglet **"Sign-in method"**, activez **"Email/Password"**
4. Cliquez sur **"Email/Password"** → Activez → **"Enregistrer"**

### 3.2 Créer le service d'authentification
Créez `lib/firebase/auth.ts` :

```typescript
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth } from "./config";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "./config";
import type { Profil } from "@/lib/types";

// Créer un compte
export async function createAccount(email: string, password: string, profilData: Omit<Profil, "email">) {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // Créer le profil dans Firestore
  await setDoc(doc(db, "profils", user.uid), {
    ...profilData,
    email,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return user;
}

// Se connecter
export async function login(email: string, password: string) {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
}

// Se déconnecter
export async function logout() {
  await signOut(auth);
}

// Réinitialiser le mot de passe
export async function resetPassword(email: string) {
  await sendPasswordResetEmail(auth, email);
}

// Écouter les changements d'authentification
export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

// Obtenir l'utilisateur actuel
export function getCurrentUser() {
  return auth.currentUser;
}
```

---

## 💾 Étape 4 : Configurer Firestore

### 4.1 Créer la base de données
1. Dans Firebase Console, allez dans **Firestore Database**
2. Cliquez sur **"Créer une base de données"**
3. Choisissez **"Démarrer en mode test"** (pour commencer)
4. Choisissez une région (ex: `europe-west` pour la France)
5. Cliquez sur **"Activer"**

### 4.2 Définir les règles de sécurité
Dans l'onglet **"Règles"** de Firestore, remplacez par :

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
      allow update, delete: if request.auth != null && 
        resource.data.organisateurId == request.auth.uid;
    }
    
    // Groupes : lecture publique, écriture par utilisateurs authentifiés
    match /groupes/{groupeId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Messages : lecture par participants, écriture par utilisateurs authentifiés
    match /messages/{messageId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

### 4.3 Créer les services Firestore
Créez `lib/firebase/firestore.ts` :

```typescript
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
} from "firebase/firestore";
import { db } from "./config";
import type { Partie, Groupe, Profil, Message } from "@/lib/types";

// ===== PROFILS =====
export async function getProfil(userId: string): Promise<Profil | null> {
  const docRef = doc(db, "profils", userId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data() as Profil;
  }
  return null;
}

export async function updateProfil(userId: string, data: Partial<Profil>) {
  const docRef = doc(db, "profils", userId);
  await updateDoc(docRef, {
    ...data,
    updatedAt: new Date(),
  });
}

// ===== PARTIES =====
export async function getParties(): Promise<Partie[]> {
  const q = query(collection(db, "parties"), orderBy("createdAt", "desc"));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toMillis() || Date.now(),
  })) as Partie[];
}

export async function createPartie(partie: Omit<Partie, "id" | "createdAt">) {
  const docRef = await addDoc(collection(db, "parties"), {
    ...partie,
    createdAt: Timestamp.now(),
  });
  return docRef.id;
}

export async function updatePartie(partieId: string, updates: Partial<Partie>) {
  const docRef = doc(db, "parties", partieId);
  await updateDoc(docRef, updates);
}

export async function deletePartie(partieId: string) {
  await deleteDoc(doc(db, "parties", partieId));
}

// Écouter les changements en temps réel
export function subscribeToParties(callback: (parties: Partie[]) => void) {
  const q = query(collection(db, "parties"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    const parties = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toMillis() || Date.now(),
    })) as Partie[];
    callback(parties);
  });
}

// ===== GROUPES =====
export async function getGroupes(): Promise<Groupe[]> {
  const querySnapshot = await getDocs(collection(db, "groupes"));
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toMillis() || Date.now(),
  })) as Groupe[];
}

export async function createGroupe(groupe: Omit<Groupe, "id" | "createdAt">) {
  const docRef = await addDoc(collection(db, "groupes"), {
    ...groupe,
    createdAt: Timestamp.now(),
  });
  return docRef.id;
}

// ===== MESSAGES =====
export async function getMessages(partieId: string): Promise<Message[]> {
  const q = query(
    collection(db, "messages"),
    where("partieId", "==", partieId),
    orderBy("createdAt", "asc")
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toMillis() || Date.now(),
  })) as Message[];
}

export async function sendMessage(message: Omit<Message, "id" | "createdAt">) {
  const docRef = await addDoc(collection(db, "messages"), {
    ...message,
    createdAt: Timestamp.now(),
  });
  return docRef.id;
}
```

---

## 🔄 Étape 5 : Migrer les fonctions existantes

### 5.1 Adapter `lib/data/auth.ts`
Remplacez les fonctions pour utiliser Firebase :

```typescript
import { createAccount, login, logout, resetPassword, getCurrentUser } from "@/lib/firebase/auth";
import { getProfil, updateProfil } from "@/lib/firebase/firestore";

export async function authenticate(email: string, password: string) {
  try {
    const user = await login(email, password);
    if (!user) return null;
    
    const profil = await getProfil(user.uid);
    return profil;
  } catch (error) {
    console.error("Erreur de connexion:", error);
    return null;
  }
}

export async function createProfil(data: {
  pseudo: string;
  email: string;
  password: string;
  niveau: string;
  photoUrl?: string;
}) {
  const { password, ...profilData } = data;
  const user = await createAccount(data.email, password, {
    pseudo: data.pseudo,
    niveau: data.niveau as any,
    friendlyScore: 50,
    xp: 0,
    photoUrl: data.photoUrl,
  });
  
  return await getProfil(user.uid);
}
```

### 5.2 Adapter `lib/data/parties.ts`
Remplacez pour utiliser Firestore :

```typescript
import { getParties, createPartie, updatePartie, deletePartie } from "@/lib/firebase/firestore";

export async function loadParties(): Promise<Partie[]> {
  return await getParties();
}

export async function createPartie(partie: Omit<Partie, "id" | "createdAt">): Promise<Partie> {
  const id = await createPartie(partie);
  return { ...partie, id, createdAt: Date.now() };
}
```

---

## 🧪 Étape 6 : Tester la migration

### 6.1 Tester localement
```bash
npm run dev
```

### 6.2 Vérifier
- ✅ Créer un compte
- ✅ Se connecter
- ✅ Créer une partie
- ✅ Voir les parties d'autres utilisateurs
- ✅ Synchronisation entre onglets

---

## 🚀 Étape 7 : Déployer

### 7.1 Ajouter les variables d'environnement sur Vercel
1. Allez sur votre projet Vercel
2. **Settings** → **Environment Variables**
3. Ajoutez toutes les variables `NEXT_PUBLIC_FIREBASE_*`
4. Redéployez

### 7.2 Vérifier les règles de sécurité
Assurez-vous que les règles Firestore sont correctes avant de passer en production.

---

## 📊 Structure Firestore recommandée

```
firestore/
├── profils/
│   └── {userId}/
│       ├── pseudo: string
│       ├── email: string
│       ├── niveau: string
│       ├── friendlyScore: number
│       ├── xp: number
│       └── photoUrl?: string
│
├── parties/
│   └── {partieId}/
│       ├── groupeId: string
│       ├── groupeNom: string
│       ├── zone: string
│       ├── dateISO: string
│       ├── format: string
│       ├── placesTotal: number
│       ├── terrainId?: string
│       ├── organisateurId: string
│       ├── organisateurPseudo: string
│       ├── participants: array
│       ├── visibilite: string
│       └── createdAt: timestamp
│
├── groupes/
│   └── {groupeId}/
│       ├── nom: string
│       ├── zone: string
│       ├── membres: array
│       └── createdAt: timestamp
│
└── messages/
    └── {messageId}/
        ├── partieId: string
        ├── userId: string
        ├── pseudo: string
        ├── contenu: string
        └── createdAt: timestamp
```

---

## ⚠️ Points importants

1. **Migration des données existantes** : Créez un script pour migrer les données localStorage vers Firestore
2. **Gestion des erreurs** : Ajoutez try/catch partout
3. **Loading states** : Affichez des indicateurs de chargement
4. **Offline support** : Firestore gère automatiquement le mode hors ligne
5. **Sécurité** : Revoir les règles Firestore avant production

---

## 📚 Ressources

- [Documentation Firebase](https://firebase.google.com/docs)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Firebase Auth Documentation](https://firebase.google.com/docs/auth)

---

## 🎯 Prochaines étapes

1. Suivre ce guide étape par étape
2. Tester chaque fonctionnalité
3. Migrer progressivement (ne pas tout faire d'un coup)
4. Déployer une fois que tout fonctionne

Bon courage ! 🚀
