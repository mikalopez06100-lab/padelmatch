// Fonctions pour calculer les statistiques de matchs des joueurs

import type { Partie } from "../types";
import { loadParties } from "./parties";

export interface MatchStats {
  matchsJouesCetteSemaine: number;
  matchsJouesCeMois: number;
  matchsJouesTotal: number;
  matchsOrganises: number;
}

/**
 * Calcule les statistiques de matchs pour un pseudo donné
 */
export function calculateMatchStats(pseudo: string): MatchStats {
  const parties = loadParties();
  const now = new Date();
  
  // Dates de référence
  const debutSemaine = new Date(now);
  debutSemaine.setDate(now.getDate() - now.getDay()); // Dimanche de cette semaine
  debutSemaine.setHours(0, 0, 0, 0);
  
  const debutMois = new Date(now.getFullYear(), now.getMonth(), 1);
  debutMois.setHours(0, 0, 0, 0);
  
  let matchsJouesCetteSemaine = 0;
  let matchsJouesCeMois = 0;
  let matchsJouesTotal = 0;
  let matchsOrganises = 0;
  
  for (const partie of parties) {
    // Vérifier si le joueur est participant (organisateur ou joueur)
    const estParticipant = partie.participants.some(p => p.pseudo.toLowerCase() === pseudo.toLowerCase());
    const estOrganisateur = partie.organisateurPseudo.toLowerCase() === pseudo.toLowerCase();
    
    if (estParticipant || estOrganisateur) {
      // Vérifier si la partie a déjà eu lieu (dateISO dans le passé)
      if (partie.dateISO) {
        try {
          const datePartie = new Date(partie.dateISO);
          
          // Compter les matchs joués (parties passées uniquement)
          if (datePartie < now) {
            matchsJouesTotal++;
            
            // Cette semaine
            if (datePartie >= debutSemaine) {
              matchsJouesCetteSemaine++;
            }
            
            // Ce mois
            if (datePartie >= debutMois) {
              matchsJouesCeMois++;
            }
          }
        } catch {
          // Si la date est invalide, on ignore cette partie
        }
      }
    }
    
    // Compter les matchs organisés (tous, passés et futurs)
    if (estOrganisateur) {
      matchsOrganises++;
    }
  }
  
  return {
    matchsJouesCetteSemaine,
    matchsJouesCeMois,
    matchsJouesTotal,
    matchsOrganises,
  };
}
