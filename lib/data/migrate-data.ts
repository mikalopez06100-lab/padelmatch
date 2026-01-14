// Script de migration des données locales vers Firestore
// Migre les parties, groupes et autres données depuis localStorage vers Firestore

import { createPartie } from "../firebase/firestore";
import { createGroupe } from "../firebase/firestore";
import { sendMessage } from "../firebase/firestore";
import type { Partie, Groupe, Message } from "../types";

const PARTIES_KEY = "padelmatch_parties_v1";
const GROUPES_KEY = "padelmatch_groupes_v1";
const MESSAGES_KEY = "padelmatch_messages_v1";

export interface MigrationDataResult {
  success: boolean;
  parties: {
    migrated: number;
    failed: number;
    errors: string[];
  };
  groupes: {
    migrated: number;
    failed: number;
    errors: string[];
  };
  messages: {
    migrated: number;
    failed: number;
    errors: string[];
  };
}

/**
 * Charge les données depuis localStorage
 */
function loadFromLocalStorage<T>(key: string, fallback: T): T {
  try {
    if (typeof window === "undefined") return fallback;
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed as T;
  } catch {
    return fallback;
  }
}

/**
 * Compte les données locales disponibles
 */
export function countLocalData() {
  if (typeof window === "undefined") {
    return { parties: 0, groupes: 0, messages: 0 };
  }
  
  const parties = loadFromLocalStorage<any[]>(PARTIES_KEY, []);
  const groupes = loadFromLocalStorage<any[]>(GROUPES_KEY, []);
  const allMessages = loadFromLocalStorage<Record<string, any[]>>(MESSAGES_KEY, {});
  const messagesCount = Object.values(allMessages).reduce((sum, msgs) => sum + (msgs?.length || 0), 0);
  
  return {
    parties: parties.length,
    groupes: groupes.length,
    messages: messagesCount,
  };
}

/**
 * Migre toutes les données locales vers Firestore
 */
export async function migrateAllDataToFirestore(): Promise<MigrationDataResult> {
  const result: MigrationDataResult = {
    success: true,
    parties: { migrated: 0, failed: 0, errors: [] },
    groupes: { migrated: 0, failed: 0, errors: [] },
    messages: { migrated: 0, failed: 0, errors: [] },
  };

  try {
    // 1. Migrer les groupes
    console.log("🔄 Migration des groupes...");
    const groupesRaw = loadFromLocalStorage<any[]>(GROUPES_KEY, []);
    const groupes = Array.isArray(groupesRaw) ? groupesRaw : [];
    for (const groupe of groupes) {
      try {
        const { id, createdAt, ...groupeData } = groupe;
        // createGroupe crée automatiquement createdAt, on ne le passe pas
        const groupeToCreate: Omit<Groupe, "id" | "createdAt"> = {
          nom: String(groupeData.nom ?? ""),
          zone: String(groupeData.zone ?? ""),
          membres: Array.isArray(groupeData.membres) ? groupeData.membres.map((m: any) => String(m)) : [],
        };
        const newId = await createGroupe(groupeToCreate);
        result.groupes.migrated++;
        console.log(`✅ Groupe migré: ${groupe.nom ?? "inconnu"} (${newId})`);
      } catch (error: any) {
        result.groupes.failed++;
        const errorMsg = `Erreur pour le groupe ${groupe.nom ?? "inconnu"}: ${error.message}`;
        result.groupes.errors.push(errorMsg);
        console.error(`❌ ${errorMsg}`);
      }
    }

    // 2. Migrer les parties
    console.log("🔄 Migration des parties...");
    const partiesRaw = loadFromLocalStorage<any[]>(PARTIES_KEY, []);
    const parties = Array.isArray(partiesRaw) ? partiesRaw : [];
    for (const partie of parties) {
      try {
        // Convertir la partie au format Firestore
        const partieData: Omit<Partie, "id" | "createdAt"> = {
          groupeId: String(partie.groupeId ?? ""),
          groupeNom: String(partie.groupeNom ?? ""),
          zone: String(partie.zone ?? ""),
          dateISO: String(partie.dateISO ?? ""),
          format: (partie.format === "Compétitif" || partie.format === "Mixte" ? partie.format : "Amical") as any,
          placesTotal: Number(partie.placesTotal ?? 4),
          terrainId: partie.terrainId ? String(partie.terrainId) : undefined,
          organisateurPseudo: String(partie.organisateurPseudo ?? "Organisateur"),
          participants: Array.isArray(partie.participants)
            ? partie.participants.map((x: any) => ({
                pseudo: String(x?.pseudo ?? "Joueur"),
                role: (x?.role === "organisateur" ? "organisateur" : "joueur") as any,
              }))
            : [],
          visibilite: (partie.visibilite === "profil" || partie.visibilite === "groupe" || partie.visibilite === "communaute"
            ? partie.visibilite
            : (partie.ouverteCommunaute ? "communaute" : "groupe")) as any,
          cibleProfilPseudo: partie.cibleProfilPseudo ? String(partie.cibleProfilPseudo) : undefined,
          ouverteCommunaute: Boolean(partie.ouverteCommunaute ?? false),
          demandes: Array.isArray(partie.demandes)
            ? partie.demandes.map((d: any) => ({
                pseudo: String(d?.pseudo ?? "Candidat"),
                createdAt: Number(d?.createdAt ?? Date.now()),
              }))
            : [],
        };

        const newId = await createPartie(partieData);
        result.parties.migrated++;
        console.log(`✅ Partie migrée: ${partieData.groupeNom} (${newId})`);

        // 3. Migrer les messages de cette partie
        const allMessagesRaw = loadFromLocalStorage<Record<string, any[]>>(MESSAGES_KEY, {});
        const allMessages = allMessagesRaw && typeof allMessagesRaw === "object" ? allMessagesRaw : {};
        const messagesPartie = Array.isArray(allMessages[partie.id]) ? allMessages[partie.id] : [];
        for (const message of messagesPartie) {
          try {
            // sendMessage crée automatiquement createdAt, on ne le passe pas
            const { id, createdAt, ...messageData } = message;
            await sendMessage({
              partieId: newId, // Utiliser le nouvel ID de la partie
              pseudo: String(messageData.pseudo ?? ""),
              contenu: String(messageData.contenu ?? ""),
            });
            result.messages.migrated++;
          } catch (error: any) {
            result.messages.failed++;
            const errorMsg = `Erreur pour le message de ${message.pseudo}: ${error.message}`;
            result.messages.errors.push(errorMsg);
            console.error(`❌ ${errorMsg}`);
          }
        }
      } catch (error: any) {
        result.parties.failed++;
        const errorMsg = `Erreur pour la partie ${partie.groupeNom ?? "inconnue"}: ${error.message}`;
        result.parties.errors.push(errorMsg);
        console.error(`❌ ${errorMsg}`);
      }
    }

    result.success = 
      result.parties.failed === 0 && 
      result.groupes.failed === 0 && 
      result.messages.failed === 0;

    console.log("✅ Migration terminée:", result);
    return result;
  } catch (error: any) {
    result.success = false;
    console.error("❌ Erreur générale lors de la migration:", error);
    return result;
  }
}
