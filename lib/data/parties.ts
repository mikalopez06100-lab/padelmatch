// Data Access Layer pour les Parties
// Séparation logique UI / logique data

import type { Partie, Participant, Demande } from "../types";
import { STORAGE_KEYS, loadFromStorage, saveToStorage } from "./storage";
import { getMonPseudo } from "./profil";

export function loadParties(): Partie[] {
  try {
    const raw = loadFromStorage<any[]>(STORAGE_KEYS.parties, []);
    // Migration/réparation des anciennes données
    return raw.map(repairPartie);
  } catch {
    return [];
  }
}

function repairPartie(p: any): Partie {
  const orga = String(p.organisateurPseudo ?? "Organisateur");

  const participants: Participant[] = Array.isArray(p.participants)
    ? p.participants.map((x: any) => ({
        pseudo: String(x?.pseudo ?? "Joueur"),
        role: (x?.role === "organisateur" ? "organisateur" : "joueur") as Participant["role"],
      }))
    : [{ pseudo: orga, role: "organisateur" as const }];

  const demandes: Demande[] = Array.isArray(p.demandes)
    ? p.demandes.map((d: any) => ({
        pseudo: String(d?.pseudo ?? "Candidat"),
        createdAt: Number(d?.createdAt ?? Date.now()),
      }))
    : [];

  const visibilite =
    p.visibilite === "profil" || p.visibilite === "groupe" || p.visibilite === "communaute"
      ? p.visibilite
      : (p.ouverteCommunaute ? "communaute" : "groupe");

  return {
    id: String(p.id ?? crypto.randomUUID()),
    groupeId: String(p.groupeId ?? ""),
    groupeNom: String(p.groupeNom ?? "Groupe"),
    zone: String(p.zone ?? "Nice"),
    dateISO: String(p.dateISO ?? ""),
    format: (p.format === "Compétitif" || p.format === "Mixte" ? p.format : "Amical") as any,
    placesTotal: Number(p.placesTotal ?? 4),
    organisateurPseudo: orga,
    participants,
    visibilite,
    cibleProfilPseudo: p.cibleProfilPseudo ? String(p.cibleProfilPseudo) : undefined,
    ouverteCommunaute: Boolean(p.ouverteCommunaute ?? false), // DEPRECATED
    demandes,
    createdAt: Number(p.createdAt ?? Date.now()),
  };
}

export function saveParties(parties: Partie[]): void {
  saveToStorage(STORAGE_KEYS.parties, parties);
}

export function createPartie(partie: Omit<Partie, "id" | "createdAt">): Partie {
  const newPartie: Partie = {
    ...partie,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
  };
  const parties = loadParties();
  saveParties([newPartie, ...parties]);
  return newPartie;
}

export function updatePartie(id: string, updates: Partial<Partie>): Partie | null {
  const parties = loadParties();
  const index = parties.findIndex((p) => p.id === id);
  if (index === -1) return null;

  const updated = { ...parties[index], ...updates };
  parties[index] = updated;
  saveParties(parties);
  return updated;
}

export function deletePartie(id: string): void {
  const parties = loadParties();
  saveParties(parties.filter((p) => p.id !== id));
}

export function getPartieById(id: string): Partie | null {
  const parties = loadParties();
  return parties.find((p) => p.id === id) ?? null;
}

export function addParticipantToPartie(partieId: string, participant: Participant): Partie | null {
  const partie = getPartieById(partieId);
  if (!partie || partie.participants.length >= partie.placesTotal) return null;

  const updated = {
    ...partie,
    participants: [...partie.participants, participant],
  };
  return updatePartie(partieId, { participants: updated.participants });
}

export function removeParticipantFromPartie(partieId: string, pseudo: string): Partie | null {
  const partie = getPartieById(partieId);
  if (!partie) return null;

  const updated = {
    ...partie,
    participants: partie.participants.filter((p) => p.pseudo !== pseudo),
  };
  return updatePartie(partieId, { participants: updated.participants });
}

export function addDemandeToPartie(partieId: string, demande: Demande): Partie | null {
  const partie = getPartieById(partieId);
  if (!partie || !partie.ouverteCommunaute) return null;

  const monPseudo = getMonPseudo();
  if (
    partie.participants.some((p) => p.pseudo === monPseudo) ||
    partie.demandes.some((d) => d.pseudo === monPseudo)
  ) {
    return null; // Déjà participant ou déjà demandé
  }

  const updated = {
    ...partie,
    demandes: [...partie.demandes, demande],
  };
  return updatePartie(partieId, { demandes: updated.demandes });
}

export function acceptDemandeInPartie(partieId: string, pseudo: string): Partie | null {
  const partie = getPartieById(partieId);
  if (!partie || partie.participants.length >= partie.placesTotal) return null;

  const demande = partie.demandes.find((d) => d.pseudo === pseudo);
  if (!demande) return null;

  const updated = {
    ...partie,
    demandes: partie.demandes.filter((d) => d.pseudo !== pseudo),
    participants: [...partie.participants, { pseudo, role: "joueur" as const }],
  };
  return updatePartie(partieId, { demandes: updated.demandes, participants: updated.participants });
}

// TODO: Migration backend - remplacer par Firebase Firestore / Supabase
// export async function loadPartiesFromBackend(filters?: { userId?: string, zone?: string }): Promise<Partie[]>
// export async function createPartieInBackend(partie: Omit<Partie, "id" | "createdAt">): Promise<Partie>
// export async function updatePartieInBackend(id: string, updates: Partial<Partie>): Promise<Partie>
// export async function subscribeToParties(callback: (parties: Partie[]) => void): Promise<() => void>
