// Gestion des terrains de padel
// Liste de base + possibilité d'ajouter des terrains personnalisés

import { STORAGE_KEYS, loadFromStorage, saveToStorage } from "./storage";

export interface Terrain {
  id: string;
  nom: string;
  ville: string; // Pour le filtrage géographique
  estPersonnalise: boolean; // true si ajouté par l'utilisateur
}

// Liste de base des terrains dans les Alpes-Maritimes
const TERRAINS_BASE: Omit<Terrain, "id" | "estPersonnalise">[] = [
  // Nice & alentours
  { nom: "Padel Tennis Nice Valrose", ville: "Nice" },
  { nom: "ULTRA FABRON - PADEL et FOOTBALL", ville: "Nice" },
  { nom: "Gsem Tennis", ville: "Nice" },
  { nom: "UrbanPadel Villeneuve Loubet", ville: "Villeneuve-Loubet" },
  { nom: "V Indomitus Padel Nice la Trinité", ville: "La Trinité" },
  
  // Cannes — Mougins — Grasse
  { nom: "SAS PADEL RIVIERA", ville: "Mougins" },
  { nom: "ALL IN PADEL Mougins", ville: "Mougins" },
  { nom: "Tennis Club de Grasse", ville: "Grasse" },
  
  // Antibes, Vence, Èze
  { nom: "Tennis Padel Club la Roseraie Antibes", ville: "Antibes" },
  { nom: "Leçons de Tennis & Padel au Cap d'Antibes", ville: "Antibes" },
  { nom: "Vence Tennis Padel Club (VTPC)", ville: "Vence" },
  { nom: "Padel Eze - Côte d'Azur", ville: "Èze" },
  { nom: "Azur Calcetto", ville: "Sainte-Agnès" },
  { nom: "Tennis Padel Club Montaleigne", ville: "Cagnes-sur-Mer" },
  { nom: "US CAGNES - TENNIS, PADEL et MULTI‑SPORTS", ville: "Cagnes-sur-Mer" },
  { nom: "Dynamic'Sports : Padel, Tennis, Trail...", ville: "Tourrette-Levens" },
  
  // Grand complexe
  { nom: "Galactic Padel", ville: "Contes" },
];

/**
 * Charge tous les terrains (base + personnalisés)
 */
export function loadTerrains(): Terrain[] {
  const terrainsBase: Terrain[] = TERRAINS_BASE.map((t, index) => ({
    ...t,
    id: `base_${index}`,
    estPersonnalise: false,
  }));

  const terrainsPersonnalises = loadFromStorage<Terrain[]>(
    STORAGE_KEYS.terrainsPersonnalises,
    []
  );

  return [...terrainsBase, ...terrainsPersonnalises];
}

/**
 * Ajoute un terrain personnalisé
 */
export function addTerrainPersonnalise(nom: string, ville: string): Terrain {
  const terrains = loadTerrains();
  
  // Vérifier si le terrain existe déjà
  const existe = terrains.some(
    (t) => t.nom.toLowerCase() === nom.toLowerCase() && t.ville.toLowerCase() === ville.toLowerCase()
  );
  
  if (existe) {
    throw new Error("Ce terrain existe déjà");
  }

  const nouveauTerrain: Terrain = {
    id: `perso_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    nom: nom.trim(),
    ville: ville.trim(),
    estPersonnalise: true,
  };

  const terrainsPersonnalises = loadFromStorage<Terrain[]>(
    STORAGE_KEYS.terrainsPersonnalises,
    []
  );

  terrainsPersonnalises.push(nouveauTerrain);
  saveToStorage(STORAGE_KEYS.terrainsPersonnalises, terrainsPersonnalises);

  return nouveauTerrain;
}

/**
 * Supprime un terrain personnalisé
 */
export function removeTerrainPersonnalise(id: string): void {
  const terrainsPersonnalises = loadFromStorage<Terrain[]>(
    STORAGE_KEYS.terrainsPersonnalises,
    []
  );

  const filtered = terrainsPersonnalises.filter((t) => t.id !== id);
  saveToStorage(STORAGE_KEYS.terrainsPersonnalises, filtered);
}

/**
 * Trouve un terrain par ID
 */
export function getTerrainById(id: string): Terrain | null {
  const terrains = loadTerrains();
  return terrains.find((t) => t.id === id) || null;
}
