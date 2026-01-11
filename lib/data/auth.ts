// Fonctions d'authentification
// Gère la connexion avec email/mot de passe

import type { Profil, ProfilComplet } from "../types";
import { hashPassword, verifyPassword } from "../utils/password";
import { getProfilGlobalByEmail, addOrUpdateProfilGlobal } from "./profils-globaux";
import { STORAGE_KEYS, loadFromStorage, saveToStorage } from "./storage";

/**
 * Recherche un profil par email dans les profils globaux et vérifie le mot de passe
 */
export function authenticate(email: string, password: string): Profil | null {
  const profilGlobal = getProfilGlobalByEmail(email);
  if (!profilGlobal) {
    return null;
  }

  // Vérifier le mot de passe
  if (!profilGlobal.passwordHash || !verifyPassword(password, profilGlobal.passwordHash)) {
    return null;
  }

  // Retourner le profil sans le passwordHash
  const { passwordHash, ...profil } = profilGlobal;
  return profil;
}

/**
 * Crée un nouveau profil avec email et mot de passe
 */
export function createProfil(data: {
  pseudo: string;
  email: string;
  password: string;
  niveau: string;
  photoUrl?: string;
}): Profil {
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

  // Sauvegarder le profil local (sans passwordHash dans le profil utilisateur)
  const { passwordHash: _, ...profilLocal } = profilComplet;
  saveToStorage(STORAGE_KEYS.profil, profilLocal);

  // Ajouter à la liste globale (avec passwordHash pour l'authentification)
  addOrUpdateProfilGlobal(profilComplet);

  return profilLocal;
}

/**
 * Charge le profil actuellement connecté (sans passwordHash)
 */
export function loadCurrentProfil(): Profil | null {
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
 */
export function emailExists(email: string): boolean {
  return getProfilGlobalByEmail(email) !== null;
}

/**
 * Met à jour un profil existant (sans modifier le mot de passe)
 * ⚠️ Cette fonction nécessite que le profil soit déjà authentifié
 */
export function updateProfil(profil: Profil): void {
  // Récupérer le profil complet depuis les profils globaux pour garder le passwordHash
  const profilGlobal = getProfilGlobalByEmail(profil.email);
  if (!profilGlobal) {
    console.error("Profil global non trouvé pour l'email:", profil.email);
    return;
  }

  // Mettre à jour les champs (en gardant le passwordHash)
  const profilComplet: ProfilComplet = {
    ...profilGlobal,
    ...profil,
    passwordHash: profilGlobal.passwordHash, // Garder le passwordHash existant
  };

  // Sauvegarder le profil local (sans passwordHash)
  saveToStorage(STORAGE_KEYS.profil, profil);

  // Mettre à jour dans la liste globale (avec passwordHash)
  addOrUpdateProfilGlobal(profilComplet);
}
