// Data Access Layer pour les Groupes
// Séparation logique UI / logique data

import type { Groupe } from "../types";
import { STORAGE_KEYS, loadFromStorage, saveToStorage } from "./storage";

export function loadGroupes(): Groupe[] {
  try {
    const groupes = loadFromStorage<Groupe[]>(STORAGE_KEYS.groupes, []);
    return Array.isArray(groupes) ? groupes : [];
  } catch {
    return [];
  }
}

export function saveGroupes(groupes: Groupe[]): void {
  saveToStorage(STORAGE_KEYS.groupes, groupes);
}

export function createGroupe(groupe: Omit<Groupe, "id" | "createdAt">): Groupe {
  const newGroupe: Groupe = {
    ...groupe,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
  };
  const groupes = loadGroupes();
  saveGroupes([newGroupe, ...groupes]);
  return newGroupe;
}

export function deleteGroupe(id: string): void {
  const groupes = loadGroupes();
  saveGroupes(groupes.filter((g) => g.id !== id));
}

export function getGroupeById(id: string): Groupe | null {
  const groupes = loadGroupes();
  return groupes.find((g) => g.id === id) ?? null;
}

// TODO: Migration backend - remplacer par Firebase Firestore / Supabase
// export async function loadGroupesFromBackend(userId: string): Promise<Groupe[]>
// export async function createGroupeInBackend(groupe: Omit<Groupe, "id" | "createdAt">): Promise<Groupe>
// export async function deleteGroupeFromBackend(id: string): Promise<void>
// export async function subscribeToGroupes(userId: string, callback: (groupes: Groupe[]) => void): Promise<() => void>
