// Types centralisés pour PadelMatch
// Prêts pour migration Firebase/Supabase

export type ParticipantRole = "organisateur" | "joueur";

export type PartieFormat = "Amical" | "Compétitif" | "Mixte";

export type Niveau = number; // 1.0 à 8.0 par tranche de 0.5 (ex: 1.0, 1.5, 2.0, 2.5, ... 8.0)
export type MainDominante = "droitier" | "gaucher";
export type PositionTerrain = "droite" | "gauche";

export type Zone =
  | "Nice"
  | "Antibes"
  | "Cagnes-sur-Mer"
  | "Cannes"
  | "Monaco"
  | "Menton"
  | "Autre";

export type PreferenceCommunication = "notification" | "email" | "whatsapp" | "notification_email";

// Types de base
export interface Participant {
  pseudo: string;
  role: ParticipantRole;
  // TODO: Migration backend - ajouter userId: string
}

export interface Demande {
  pseudo: string;
  createdAt: number;
  // TODO: Migration backend - ajouter userId: string, demandeId: string
}

export type VisibilitePartie = "profil" | "groupe" | "communaute";

export interface Partie {
  id: string;
  groupeId: string;
  groupeNom: string;
  zone: string;
  dateISO: string; // ex: 2026-01-09T18:30
  format: PartieFormat;
  placesTotal: number;
  terrainId?: string; // ID du terrain (optionnel pour compatibilité)

  organisateurPseudo: string;
  participants: Participant[];

  visibilite: VisibilitePartie; // "profil" | "groupe" | "communaute"
  cibleProfilPseudo?: string; // Si visibilite === "profil", pseudo du joueur cible
  // Si visibilite === "groupe", utiliser groupeId
  // Si visibilite === "communaute", visible par tous
  ouverteCommunaute: boolean; // DEPRECATED - gardé pour compatibilité, utiliser visibilite === "communaute"
  demandes: Demande[];

  createdAt: number;
  // TODO: Migration backend - ajouter updatedAt: number, organisateurId: string
}

export interface Groupe {
  id: string;
  nom: string;
  zone: string;
  membres: string[]; // Pseudos des membres du groupe
  createdAt: number;
  // TODO: Migration backend - ajouter userId: string, updatedAt: number
}

// Profil complet avec mot de passe hashé (pour stockage global uniquement)
export interface ProfilComplet {
  pseudo: string;
  email: string;
  passwordHash: string; // Hash du mot de passe (ne jamais stocker en clair)
  niveau: Niveau; // 1.0 à 8.0 par tranche de 0.5
  friendlyScore: number; // 0-100
  xp: number; // points
  photoUrl?: string; // base64 image URL
  telephone?: string; // Numéro de téléphone
  preferenceCommunication?: PreferenceCommunication; // Préférence de communication
  mainDominante?: MainDominante; // Droitier ou gaucher
  positionTerrain?: PositionTerrain; // Joueur à droite ou à gauche
}

// Profil utilisateur (sans passwordHash - pour localStorage local)
export interface Profil {
  pseudo: string;
  email: string;
  niveau: Niveau; // 1.0 à 8.0 par tranche de 0.5
  friendlyScore: number; // 0-100
  xp: number; // points
  photoUrl?: string; // base64 image URL
  telephone?: string; // Numéro de téléphone
  preferenceCommunication?: PreferenceCommunication; // Préférence de communication
  mainDominante?: MainDominante; // Droitier ou gaucher
  positionTerrain?: PositionTerrain; // Joueur à droite ou à gauche
  terrainFavoriId?: string; // ID du terrain favori/club
  // TODO: Migration backend - ajouter userId: string, updatedAt: number
}

export interface Message {
  id: string;
  partieId: string;
  pseudo: string;
  contenu: string;
  createdAt: number;
  // TODO: Migration backend - ajouter userId: string, updatedAt?: number
}

export interface Joueur {
  id: string;
  pseudo: string;
  zone: string;
  niveau: Niveau;
  friendlyScore: number; // 0-100
}

export interface Terrain {
  id: string;
  nom: string;
  ville: string; // Pour le filtrage géographique
  estPersonnalise: boolean; // true si ajouté par l'utilisateur (pas un terrain de base)
}

// Types pour Firebase/Supabase (futur)
export interface PartieDocument {
  // Structure prête pour Firebase Firestore / Supabase
  id: string;
  groupeId: string;
  groupeNom: string;
  zone: string;
  dateISO: string;
  format: PartieFormat;
  placesTotal: number;
  organisateurId: string;
  organisateurPseudo: string;
  participants: Participant[];
  ouverteCommunaute: boolean;
  demandes: Demande[];
  createdAt: number;
  updatedAt: number;
}

export interface GroupeDocument {
  id: string;
  userId: string;
  nom: string;
  zone: string;
  createdAt: number;
  updatedAt: number;
}

export interface ProfilDocument {
  userId: string;
  pseudo: string;
  email: string;
  passwordHash: string;
  niveau: Niveau; // 1.0 à 8.0 par tranche de 0.5
  friendlyScore: number;
  xp: number;
  photoUrl?: string; // URL de l'image (Firebase Storage ou base64 en MVP)
  telephone?: string; // Numéro de téléphone
  preferenceCommunication?: PreferenceCommunication; // Préférence de communication
  mainDominante?: MainDominante; // Droitier ou gaucher
  positionTerrain?: PositionTerrain; // Joueur à droite ou à gauche
  createdAt: number;
  updatedAt: number;
}
