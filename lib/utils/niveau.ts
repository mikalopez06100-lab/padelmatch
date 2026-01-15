// Utilitaires pour gérer les niveaux de jeu (1.0 à 8.0 par tranche de 0.5)

import type { Niveau } from "@/lib/types";

/**
 * Génère tous les niveaux possibles de 1.0 à 8.0 par tranche de 0.5
 */
export function getAllNiveaux(): Niveau[] {
  const niveaux: Niveau[] = [];
  for (let i = 1; i <= 8; i += 0.5) {
    niveaux.push(i);
  }
  return niveaux;
}

/**
 * Convertit un niveau numérique en catégorie textuelle
 * Débutant: 1.0 - 1.5
 * Intermédiaire: 2.0 - 3.5
 * Confirmé: 4.0 - 5.5
 * Expert: 6.0 - 8.0
 */
export function getCategorieNiveau(niveau: Niveau): string {
  if (niveau >= 1.0 && niveau <= 1.5) {
    return "Débutant";
  } else if (niveau >= 2.0 && niveau <= 3.5) {
    return "Intermédiaire";
  } else if (niveau >= 4.0 && niveau <= 5.5) {
    return "Confirmé";
  } else if (niveau >= 6.0 && niveau <= 8.0) {
    return "Expert";
  }
  return "Non défini";
}

/**
 * Formate un niveau pour l'affichage (ex: "2.5" ou "2")
 */
export function formatNiveau(niveau: Niveau): string {
  return niveau % 1 === 0 ? niveau.toString() : niveau.toFixed(1);
}

/**
 * Vérifie si un niveau est valide (entre 1.0 et 8.0, multiple de 0.5)
 */
export function isValidNiveau(niveau: number): boolean {
  return niveau >= 1.0 && niveau <= 8.0 && (niveau * 2) % 1 === 0;
}

/**
 * Convertit un ancien niveau textuel en nouveau niveau numérique (pour migration)
 */
export function convertOldNiveauToNew(oldNiveau: string): Niveau {
  switch (oldNiveau) {
    case "Débutant":
      return 1.0;
    case "Intermédiaire":
      return 2.5;
    case "Confirmé":
      return 4.5;
    case "Compétitif":
      return 6.5;
    default:
      return 2.5; // Par défaut : Intermédiaire
  }
}
