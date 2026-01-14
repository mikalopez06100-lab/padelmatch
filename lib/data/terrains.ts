// Gestion des terrains de padel
// Liste de base + terrains personnalisés stockés dans Firestore

import type { Terrain } from "@/lib/types";
import { getTerrainsPersonnalises, createTerrain, updateTerrain, deleteTerrain } from "@/lib/firebase/firestore";

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
 * Charge tous les terrains (base + personnalisés depuis Firestore)
 */
export async function loadTerrains(): Promise<Terrain[]> {
  const terrainsBase: Terrain[] = TERRAINS_BASE.map((t, index) => ({
    ...t,
    id: `base_${index}`,
    estPersonnalise: false,
  }));

  try {
    const terrainsPersonnalises = await getTerrainsPersonnalises();
    return [...terrainsBase, ...terrainsPersonnalises];
  } catch (error) {
    console.error("Erreur lors du chargement des terrains depuis Firestore:", error);
    // En cas d'erreur, retourner uniquement les terrains de base
    return terrainsBase;
  }
}

/**
 * Charge tous les terrains de manière synchrone (pour compatibilité)
 * Retourne uniquement les terrains de base
 * @deprecated Utiliser loadTerrains() de manière asynchrone
 */
export function loadTerrainsSync(): Terrain[] {
  return TERRAINS_BASE.map((t, index) => ({
    ...t,
    id: `base_${index}`,
    estPersonnalise: false,
  }));
}

/**
 * Ajoute un terrain personnalisé dans Firestore
 */
export async function addTerrainPersonnalise(nom: string, ville: string): Promise<Terrain> {
  // Charger tous les terrains pour vérifier les doublons
  const terrains = await loadTerrains();
  
  // Vérifier si le terrain existe déjà
  const existe = terrains.some(
    (t) => t.nom.toLowerCase() === nom.toLowerCase() && t.ville.toLowerCase() === ville.toLowerCase()
  );
  
  if (existe) {
    throw new Error("Ce terrain existe déjà");
  }

  try {
    const terrainId = await createTerrain({
      nom: nom.trim(),
      ville: ville.trim(),
      estPersonnalise: true,
    });
    
    return {
      id: terrainId,
      nom: nom.trim(),
      ville: ville.trim(),
      estPersonnalise: true,
    };
  } catch (error) {
    console.error("Erreur lors de l'ajout du terrain:", error);
    throw error;
  }
}

/**
 * Met à jour un terrain personnalisé dans Firestore
 */
export async function updateTerrainPersonnalise(id: string, nom: string, ville: string): Promise<void> {
  // Vérifier que l'ID ne commence pas par "base_" (terrains de base)
  if (id.startsWith("base_")) {
    throw new Error("Les terrains de base ne peuvent pas être modifiés");
  }

  // Charger tous les terrains pour vérifier les doublons
  const terrains = await loadTerrains();
  const existe = terrains.some(
    (t) => t.id !== id && t.nom.toLowerCase() === nom.toLowerCase() && t.ville.toLowerCase() === ville.toLowerCase()
  );

  if (existe) {
    throw new Error("Ce terrain existe déjà");
  }

  try {
    await updateTerrain(id, {
      nom: nom.trim(),
      ville: ville.trim(),
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour du terrain:", error);
    throw error;
  }
}

/**
 * Supprime un terrain personnalisé de Firestore
 */
export async function removeTerrainPersonnalise(id: string): Promise<void> {
  // Vérifier que l'ID ne commence pas par "base_" (terrains de base)
  if (id.startsWith("base_")) {
    throw new Error("Les terrains de base ne peuvent pas être supprimés");
  }

  try {
    await deleteTerrain(id);
  } catch (error) {
    console.error("Erreur lors de la suppression du terrain:", error);
    throw error;
  }
}

/**
 * Trouve un terrain par ID
 */
export async function getTerrainById(id: string): Promise<Terrain | null> {
  const terrains = await loadTerrains();
  return terrains.find((t) => t.id === id) || null;
}

// Réexporter le type pour compatibilité
export type { Terrain };
