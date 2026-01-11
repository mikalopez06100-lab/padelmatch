// Data Access Layer pour le Profil
// Séparation logique UI / logique data

import type { Profil } from "../types";
import { STORAGE_KEYS, loadFromStorage, saveToStorage } from "./storage";

export function loadProfil(): Profil | null {
  try {
    const profil = loadFromStorage<Profil | null>(STORAGE_KEYS.profil, null);
    if (!profil?.pseudo) return null;
    return profil;
  } catch {
    return null;
  }
}

export function saveProfil(profil: Profil): void {
  saveToStorage(STORAGE_KEYS.profil, profil);
}

export function deleteProfil(): void {
  saveToStorage<null>(STORAGE_KEYS.profil, null);
}

export function getMonPseudo(): string {
  const profil = loadProfil();
  const pseudo = profil?.pseudo?.trim() ?? "";
  return pseudo.length >= 2 ? pseudo : "Joueur";
}

// TODO: Migration backend - remplacer par Firebase Auth + Firestore
// export async function loadProfilFromBackend(userId: string): Promise<Profil | null>
// export async function saveProfilToBackend(profil: Profil): Promise<Profil>
// export async function getCurrentUser(): Promise<User | null>
