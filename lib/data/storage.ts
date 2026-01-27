// Couche de stockage abstraite
// DÉPRÉCIÉ : Toutes les données sont maintenant stockées dans Firebase Firestore
// Ce fichier est conservé uniquement pour la compatibilité des imports

const STORAGE_VERSION = "v1";

export const STORAGE_KEYS = {
  groupes: `padelmatch_groupes_${STORAGE_VERSION}`,
  parties: `padelmatch_parties_${STORAGE_VERSION}`,
  profil: `padelmatch_profil_${STORAGE_VERSION}`,
  blocks: `padelmatch_blocks_${STORAGE_VERSION}`,
  messages: `padelmatch_messages_${STORAGE_VERSION}`,
  profilsGlobaux: `padelmatch_profils_globaux_${STORAGE_VERSION}`,
  terrainsPersonnalises: `padelmatch_terrains_personnalises_${STORAGE_VERSION}`,
} as const;

// Fonctions vides - localStorage n'est plus utilisé
// Toutes les données sont maintenant dans Firebase Firestore
export function loadFromStorage<T>(key: string, fallback: T): T {
  // localStorage supprimé - retourner toujours le fallback
  return fallback;
}

export function saveToStorage<T>(key: string, value: T): void {
  // localStorage supprimé - ne rien faire
  // Les données sont sauvegardées directement dans Firebase Firestore
}

export function removeFromStorage(key: string): void {
  // localStorage supprimé - ne rien faire
  // Les données sont supprimées directement dans Firebase Firestore
}
