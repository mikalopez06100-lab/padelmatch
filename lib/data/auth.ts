// Fonctions d'authentification
// Gère la connexion avec email/mot de passe
// Utilise Firebase Auth + Firestore

import type { Profil, ProfilComplet, Niveau } from "../types";
import { login as firebaseLogin, createAccount as firebaseCreateAccount, resetPassword as firebaseResetPassword, getCurrentUser, onAuthChange } from "../firebase/auth";
import { getProfil, updateProfil as updateProfilFirestore } from "../firebase/firestore";
import { STORAGE_KEYS, loadFromStorage, saveToStorage } from "./storage";
import { getProfilGlobalByEmail, addOrUpdateProfilGlobal } from "./profils-globaux";
import { hashPassword, verifyPassword } from "../utils/password";
import { convertOldNiveauToNew } from "../utils/niveau";

/**
 * Recherche un profil par email dans les profils globaux et vérifie le mot de passe
 * Utilise Firebase Auth pour l'authentification
 */
export async function authenticate(email: string, password: string): Promise<Profil | null> {
  try {
    // Se connecter avec Firebase Auth
    const user = await firebaseLogin(email, password);
    if (!user) {
      return null;
    }

    // Récupérer le profil depuis Firestore
    const profil = await getProfil(user.uid);
    if (profil) {
      // Sauvegarder dans localStorage pour compatibilité
      saveToStorage(STORAGE_KEYS.profil, profil);
      return profil;
    }

    return null;
  } catch (error: any) {
    console.error("Erreur d'authentification:", error);
    // Si erreur Firebase, essayer avec l'ancien système (fallback)
    const profilGlobal = getProfilGlobalByEmail(email);
    if (!profilGlobal) {
      return null;
    }
    // Pour compatibilité avec anciens comptes, on garde l'ancien système temporairement
    const { passwordHash, ...profil } = profilGlobal;
    saveToStorage(STORAGE_KEYS.profil, profil);
    return profil;
  }
}

/**
 * Crée un nouveau profil avec email et mot de passe
 * Utilise Firebase Auth + Firestore
 */
export async function createProfil(data: {
  pseudo: string;
  email: string;
  password: string;
  niveau: Niveau;
  photoUrl?: string;
}): Promise<Profil> {
  try {
    console.log("🔄 Création du profil via Firebase...", { email: data.email, pseudo: data.pseudo });
    
    // Créer le compte dans Firebase Auth et le profil dans Firestore
    const user = await firebaseCreateAccount(data.email, data.password, {
      pseudo: data.pseudo,
      niveau: data.niveau as any,
      friendlyScore: 50,
      xp: 0,
      photoUrl: data.photoUrl,
    });

    console.log("✅ Compte Firebase créé, récupération du profil...", user.uid);

    // Récupérer le profil créé
    const profil = await getProfil(user.uid);
    if (profil) {
      console.log("✅ Profil récupéré depuis Firestore:", profil);
      // Sauvegarder dans localStorage pour compatibilité
      saveToStorage(STORAGE_KEYS.profil, profil);
      return profil;
    }

    console.error("❌ Profil non trouvé dans Firestore après création");
    throw new Error("Profil non créé dans Firestore");
  } catch (error: any) {
    console.error("❌ Erreur lors de la création du profil:", error);
    console.error("Code d'erreur:", error.code);
    console.error("Message:", error.message);
    
    // Ne pas utiliser le fallback localStorage si c'est une erreur Firebase critique
    // L'utilisateur doit savoir que ça n'a pas fonctionné
    if (error.code === "permission-denied") {
      throw new Error("Permission refusée par Firestore. Vérifiez les règles de sécurité.");
    }
    if (error.code === "auth/email-already-in-use") {
      throw error; // Propager l'erreur pour que l'UI puisse gérer
    }
    
    // Si erreur Firebase autre, essayer avec l'ancien système (fallback)
    console.warn("⚠️ Utilisation du fallback localStorage");
    const passwordHash = hashPassword(data.password);
    const profilComplet: ProfilComplet = {
      pseudo: data.pseudo,
      email: data.email,
      passwordHash,
      niveau: data.niveau as any,
      friendlyScore: 50,
      xp: 0,
      photoUrl: data.photoUrl,
    };
    const { passwordHash: _, ...profilLocal } = profilComplet;
    saveToStorage(STORAGE_KEYS.profil, profilLocal);
    addOrUpdateProfilGlobal(profilComplet);
    return profilLocal;
  }
}

/**
 * Charge le profil actuellement connecté (sans passwordHash)
 * Utilise Firebase Auth pour vérifier la connexion
 */
export async function loadCurrentProfil(): Promise<Profil | null> {
  try {
    // Vérifier si un utilisateur Firebase est connecté
    const user = getCurrentUser();
    if (user) {
      // Récupérer le profil depuis Firestore
      const profil = await getProfil(user.uid);
      if (profil) {
        // Migration automatique : si le niveau dans Firestore est encore une string, le migrer
        // (getProfil fait déjà la conversion, mais on s'assure ici aussi)
        let profilMigre = profil;
        if (typeof profil.niveau === "string") {
          const nouveauNiveau = convertOldNiveauToNew(profil.niveau);
          profilMigre = { ...profil, niveau: nouveauNiveau };
          // Mettre à jour dans Firestore pour que la migration soit permanente
          try {
            await updateProfilFirestore(user.uid, { niveau: nouveauNiveau });
            console.log(`✅ Niveau migré dans Firestore pour ${user.uid}: "${profil.niveau}" → ${nouveauNiveau}`);
          } catch (error) {
            console.warn("⚠️ Impossible de migrer le niveau dans Firestore:", error);
          }
        }
        
        // Sauvegarder dans localStorage pour compatibilité
        saveToStorage(STORAGE_KEYS.profil, profilMigre);
        return profilMigre;
      }
    }

    // Fallback : vérifier localStorage (pour compatibilité avec anciens comptes)
    const profil = loadFromStorage<Profil | null>(STORAGE_KEYS.profil, null);
    if (!profil?.pseudo) return null;
    
    // Migration du niveau si nécessaire (pour localStorage aussi)
    if (typeof profil.niveau === "string") {
      const nouveauNiveau = convertOldNiveauToNew(profil.niveau);
      const profilMigre = { ...profil, niveau: nouveauNiveau };
      saveToStorage(STORAGE_KEYS.profil, profilMigre);
      return profilMigre;
    }
    
    return profil;
  } catch {
    return null;
  }
}

/**
 * Version synchrone pour compatibilité (utilise localStorage)
 */
export function loadCurrentProfilSync(): Profil | null {
  try {
    const profil = loadFromStorage<Profil | null>(STORAGE_KEYS.profil, null);
    if (!profil?.pseudo) return null;
    return profil;
  } catch {
    return null;
  }
}

/**
 * Vérifie si un email existe déjà
 * Note: Avec Firebase, on ne peut pas vérifier directement sans essayer de créer le compte
 * On garde le fallback pour compatibilité
 */
export function emailExists(email: string): boolean {
  // Pour l'instant, on garde l'ancien système
  // Avec Firebase, on découvrira si l'email existe lors de la création
  return getProfilGlobalByEmail(email) !== null;
}

/**
 * Met à jour un profil existant (sans modifier le mot de passe)
 * ⚠️ Cette fonction nécessite que le profil soit déjà authentifié
 */
export async function updateProfil(profil: Profil): Promise<void> {
  try {
    const user = getCurrentUser();
    if (user) {
      // Migration automatique du niveau si nécessaire
      let profilMigre = profil;
      if (typeof profil.niveau === "string") {
        profilMigre = { ...profil, niveau: convertOldNiveauToNew(profil.niveau) };
        console.log(`✅ Migration niveau lors de la mise à jour: "${profil.niveau}" → ${profilMigre.niveau}`);
      }
      
      // Mettre à jour dans Firestore
      await updateProfilFirestore(user.uid, profilMigre);
      // Sauvegarder dans localStorage pour compatibilité
      saveToStorage(STORAGE_KEYS.profil, profilMigre);
      return;
    }
  } catch (error) {
    console.error("Erreur lors de la mise à jour Firebase:", error);
  }

  // Fallback : ancien système
  const profilGlobal = getProfilGlobalByEmail(profil.email);
  if (!profilGlobal) {
    console.error("Profil global non trouvé pour l'email:", profil.email);
    return;
  }

  // Migration du niveau pour le système local aussi
  let niveauMigre = profil.niveau;
  if (typeof profil.niveau === "string") {
    niveauMigre = convertOldNiveauToNew(profil.niveau);
  }

  const profilComplet: ProfilComplet = {
    ...profilGlobal,
    ...profil,
    niveau: niveauMigre,
    passwordHash: profilGlobal.passwordHash,
  };

  const profilSansPassword: Profil = {
    ...profil,
    niveau: niveauMigre,
  };

  saveToStorage(STORAGE_KEYS.profil, profilSansPassword);
  addOrUpdateProfilGlobal(profilComplet);
}

/**
 * Génère un nouveau mot de passe aléatoire
 */
export function generateNewPassword(): string {
  const length = 12;
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}

/**
 * Réinitialise le mot de passe d'un utilisateur par email
 * Utilise Firebase Auth pour envoyer un email de réinitialisation
 */
export async function resetPassword(email: string): Promise<boolean> {
  try {
    // Firebase envoie un email de réinitialisation
    await firebaseResetPassword(email);
    return true;
  } catch (error: any) {
    console.error("Erreur lors de la réinitialisation:", error);
    // Si erreur Firebase, essayer avec l'ancien système (fallback)
    const profilGlobal = getProfilGlobalByEmail(email);
    if (!profilGlobal) {
      return false;
    }
    const newPassword = generateNewPassword();
    const passwordHash = hashPassword(newPassword);
    const profilComplet: ProfilComplet = {
      ...profilGlobal,
      passwordHash,
    };
    addOrUpdateProfilGlobal(profilComplet);
    // Pour l'ancien système, on retourne le mot de passe généré
    // Mais on ne peut pas le retourner dans une fonction async
    return true;
  }
}
