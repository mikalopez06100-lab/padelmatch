// Couche de stockage abstraite
// Permet de facilement migrer vers Firebase/Supabase

const STORAGE_VERSION = "v1";

export const STORAGE_KEYS = {
  groupes: `padelmatch_groupes_${STORAGE_VERSION}`,
  parties: `padelmatch_parties_${STORAGE_VERSION}`,
  profil: `padelmatch_profil_${STORAGE_VERSION}`,
  blocks: `padelmatch_blocks_${STORAGE_VERSION}`,
  messages: `padelmatch_messages_${STORAGE_VERSION}`,
} as const;

// Fonctions génériques de stockage local
export function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Erreur lors de la sauvegarde de ${key}:`, error);
  }
}

export function removeFromStorage(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Erreur lors de la suppression de ${key}:`, error);
  }
}

// TODO: Migration backend - remplacer par Firebase/Supabase
// export async function loadFromBackend<T>(collection: string, id?: string): Promise<T | T[]>
// export async function saveToBackend<T>(collection: string, data: T): Promise<T>
