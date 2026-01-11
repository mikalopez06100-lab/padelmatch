// Fonction d'initialisation des profils globaux avec des données de départ
// À utiliser uniquement lors du premier démarrage de l'application

import { loadProfilsGlobaux, saveProfilsGlobaux } from "./profils-globaux";
import type { ProfilGlobal } from "./profils-globaux";

const JOUEURS_INITIAUX: Omit<ProfilGlobal, "createdAt" | "updatedAt">[] = [
  { pseudo: "Max", zone: "Nice", niveau: "Intermédiaire", friendlyScore: 82, xp: 0 },
  { pseudo: "Sarah", zone: "Antibes", niveau: "Confirmé", friendlyScore: 90, xp: 0 },
  { pseudo: "Nico", zone: "Nice", niveau: "Débutant", friendlyScore: 75, xp: 0 },
  { pseudo: "Leïla", zone: "Cagnes-sur-Mer", niveau: "Intermédiaire", friendlyScore: 88, xp: 0 },
  { pseudo: "Tom", zone: "Monaco", niveau: "Compétitif", friendlyScore: 79, xp: 0 },
  { pseudo: "Inès", zone: "Nice", niveau: "Confirmé", friendlyScore: 92, xp: 0 },
];

/**
 * Initialise les profils globaux avec des données de départ si la liste est vide
 * Cette fonction est appelée une seule fois lors du premier démarrage
 */
export function initProfilsGlobauxIfNeeded(): void {
  const profils = loadProfilsGlobaux();
  
  // Si la liste est vide, initialiser avec les joueurs initiaux
  if (profils.length === 0) {
    const now = Date.now();
    const profilsInitiaux: ProfilGlobal[] = JOUEURS_INITIAUX.map((j) => ({
      ...j,
      createdAt: now,
      updatedAt: now,
    }));
    
    saveProfilsGlobaux(profilsInitiaux);
  }
}
