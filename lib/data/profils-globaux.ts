// Data Access Layer pour les Profils Globaux
// Stocke tous les profils créés dans l'application (pour MVP avec localStorage)

import type { ProfilComplet } from "../types";
import { STORAGE_KEYS, loadFromStorage, saveToStorage } from "./storage";

const PROFILS_GLOBAUX_KEY = "padelmatch_profils_globaux_v1";

export interface ProfilGlobal extends ProfilComplet {
  createdAt: number;
  updatedAt: number;
}

/**
 * Charge tous les profils globaux depuis localStorage
 */
export function loadProfilsGlobaux(): ProfilGlobal[] {
  try {
    const profils = loadFromStorage<ProfilGlobal[]>(PROFILS_GLOBAUX_KEY, []);
    return Array.isArray(profils) ? profils : [];
  } catch {
    return [];
  }
}

/**
 * Sauvegarde tous les profils globaux dans localStorage
 */
export function saveProfilsGlobaux(profils: ProfilGlobal[]): void {
  saveToStorage(PROFILS_GLOBAUX_KEY, profils);
}

/**
 * Ajoute ou met à jour un profil dans la liste globale
 */
export function addOrUpdateProfilGlobal(profil: ProfilComplet): void {
  const profils = loadProfilsGlobaux();
  const existingIndex = profils.findIndex((p) => p.pseudo.toLowerCase() === profil.pseudo.toLowerCase());

  const profilGlobal: ProfilGlobal = {
    ...profil,
    createdAt: existingIndex >= 0 ? profils[existingIndex].createdAt : Date.now(),
    updatedAt: Date.now(),
  };

  if (existingIndex >= 0) {
    // Mettre à jour le profil existant
    profils[existingIndex] = profilGlobal;
  } else {
    // Ajouter un nouveau profil
    profils.push(profilGlobal);
  }

  // Trier par pseudo pour faciliter la recherche
  profils.sort((a, b) => a.pseudo.localeCompare(b.pseudo));

  saveProfilsGlobaux(profils);
}

/**
 * Récupère un profil global par pseudo
 */
export function getProfilGlobalByPseudo(pseudo: string): ProfilGlobal | null {
  const profils = loadProfilsGlobaux();
  return profils.find((p) => p.pseudo.toLowerCase() === pseudo.toLowerCase()) || null;
}

/**
 * Récupère un profil global par email
 */
export function getProfilGlobalByEmail(email: string): ProfilGlobal | null {
  const profils = loadProfilsGlobaux();
  return profils.find((p) => p.email?.toLowerCase() === email.toLowerCase()) || null;
}

/**
 * Supprime un profil global (si nécessaire)
 */
export function removeProfilGlobal(pseudo: string): void {
  const profils = loadProfilsGlobaux();
  const filtered = profils.filter((p) => p.pseudo.toLowerCase() !== pseudo.toLowerCase());
  saveProfilsGlobaux(filtered);
}

// TODO: Migration backend - remplacer par Firebase Firestore / Supabase
// export async function loadProfilsGlobauxFromBackend(): Promise<ProfilGlobal[]>
// export async function addOrUpdateProfilGlobalInBackend(profil: Profil): Promise<ProfilGlobal>
// export async function subscribeToProfilsGlobaux(callback: (profils: ProfilGlobal[]) => void): Promise<() => void>
