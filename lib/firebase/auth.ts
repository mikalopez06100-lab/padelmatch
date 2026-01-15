// Fonctions d'authentification Firebase

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth } from "./config";
import { doc, setDoc, getDoc, Timestamp } from "firebase/firestore";
import { db } from "./config";
import type { Profil } from "@/lib/types";

/**
 * Crée un compte utilisateur avec email/mot de passe
 */
export async function createAccount(
  email: string,
  password: string,
  profilData: Omit<Profil, "email">
) {
  try {
    console.log("🔄 Création du compte Firebase Auth...", { email, pseudo: profilData.pseudo });
    
    // Créer l'utilisateur dans Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    console.log("✅ Compte Firebase Auth créé avec succès, UID:", user.uid);

    // Créer le profil complet dans Firestore
    // ⚠️ Important : inclure au minimum pseudo, email, niveau pour respecter les règles Firestore
    const profilDoc = {
      pseudo: profilData.pseudo,
      email,
      niveau: profilData.niveau,
      friendlyScore: profilData.friendlyScore ?? 50,
      xp: profilData.xp ?? 0,
      photoUrl: profilData.photoUrl ?? null,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    
    console.log("🔄 Création du profil dans Firestore...", profilDoc);
    console.log("📋 Détails:", {
      userId: user.uid,
      email: user.email,
      pseudo: profilDoc.pseudo,
      niveau: profilDoc.niveau,
      keys: Object.keys(profilDoc),
    });
    
    try {
      await setDoc(doc(db, "profils", user.uid), profilDoc);
      console.log("✅ Profil créé dans Firestore avec succès !");
      
      // Attendre un court délai pour la synchronisation Firestore
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      // Vérification immédiate
      const docRef = doc(db, "profils", user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const profilData = docSnap.data();
        console.log("✅ Vérification OK : Le profil existe dans Firestore", {
          uid: user.uid,
          pseudo: profilData.pseudo,
          email: profilData.email,
          niveau: profilData.niveau,
          keys: Object.keys(profilData),
        });
      } else {
        console.error("❌ PROBLÈME : Le profil n'existe pas après création !");
        // Essayer une nouvelle fois après un délai supplémentaire
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const docSnapRetry = await getDoc(docRef);
        if (docSnapRetry.exists()) {
          console.log("✅ Profil trouvé après nouvelle tentative");
        } else {
          console.error("❌ Le profil n'existe toujours pas après nouvelle tentative");
        }
      }
    } catch (firestoreError: any) {
      console.error("❌ Erreur Firestore lors de la création:", firestoreError);
      console.error("Code d'erreur:", firestoreError.code);
      console.error("Message:", firestoreError.message);
      if (firestoreError.code === "permission-denied") {
        console.error("⚠️ Permission refusée - Vérifiez les règles Firestore pour la collection 'profils'");
        console.error("📋 Règle attendue: allow create: if isAuthenticated() && request.auth.uid == userId && request.resource.data.keys().hasAll(['pseudo', 'email', 'niveau'])");
      }
      throw firestoreError;
    }

    return user;
  } catch (error: any) {
    console.error("❌ Erreur lors de la création du compte:", error);
    console.error("Code d'erreur:", error.code);
    console.error("Message:", error.message);
    if (error.code === "permission-denied") {
      console.error("⚠️ Permission refusée - Vérifiez les règles Firestore");
    }
    throw error;
  }
}

/**
 * Se connecter avec email/mot de passe
 */
export async function login(email: string, password: string) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error: any) {
    console.error("Erreur de connexion:", error);
    throw error;
  }
}

/**
 * Se déconnecter
 */
export async function logout() {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Erreur de déconnexion:", error);
    throw error;
  }
}

/**
 * Réinitialiser le mot de passe
 */
export async function resetPassword(email: string) {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    console.error("Erreur lors de la réinitialisation:", error);
    throw error;
  }
}

/**
 * Écouter les changements d'authentification
 */
export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

/**
 * Obtenir l'utilisateur actuellement connecté
 */
export function getCurrentUser() {
  return auth.currentUser;
}
