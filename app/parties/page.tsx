"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { showNotification } from "../utils/notifications";
import { loadProfilsGlobaux } from "@/lib/data/profils-globaux";
import type { ProfilGlobal } from "@/lib/data/profils-globaux";
import { loadTerrains, addTerrainPersonnalise, type Terrain } from "@/lib/data/terrains";
import { loadCurrentProfilSync } from "@/lib/data/auth";
import { getParties, createPartie as createPartieFirestore, updatePartie as updatePartieFirestore, deletePartie as deletePartieFirestore, subscribeToParties, getGroupes } from "@/lib/firebase/firestore";
import { getCurrentUser } from "@/lib/firebase/auth";

type Groupe = {
  id: string;
  nom: string;
  zone: string;
  membres?: string[]; // Pseudos des membres du groupe
  createdAt: number;
};

type Participant = {
  pseudo: string;
  role: "organisateur" | "joueur";
};

type Demande = {
  pseudo: string;
  createdAt: number;
};

type VisibilitePartie = "profil" | "groupe" | "communaute";

type Partie = {
  id: string;
  groupeId: string;
  groupeNom: string;
  zone: string;
  dateISO: string; // ex: 2026-01-09T18:30
  format: "Amical" | "Compétitif" | "Mixte";
  placesTotal: number;
  terrainId?: string; // ID du terrain (optionnel)

  organisateurPseudo: string;
  participants: Participant[];

  visibilite: VisibilitePartie; // "profil" | "groupe" | "communaute"
  cibleProfilPseudo?: string; // Si visibilite === "profil", pseudo du joueur cible
  ouverteCommunaute: boolean; // DEPRECATED - gardé pour compatibilité
  demandes: Demande[];

  createdAt: number;
};

const GROUPES_KEY = "padelmatch_groupes_v1";
const PARTIES_KEY = "padelmatch_parties_v1";
const PROFIL_KEY = "padelmatch_profil_v1";
const BLOCKS_KEY = "padelmatch_blocks_v1";

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getMonPseudo(): string {
  try {
    const raw = localStorage.getItem(PROFIL_KEY);
    if (!raw) return "Joueur";
    const parsed = JSON.parse(raw);
    const pseudo = String(parsed?.pseudo ?? "").trim();
    return pseudo.length >= 2 ? pseudo : "Joueur";
  } catch {
    return "Joueur";
  }
}

function loadBlocks(): string[] {
  try {
    const raw = localStorage.getItem(BLOCKS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map((p) => String(p)) : [];
  } catch {
    return [];
  }
}

function saveBlocks(blocks: string[]) {
  localStorage.setItem(BLOCKS_KEY, JSON.stringify(blocks));
}

function addBlock(pseudo: string) {
  const blocks = loadBlocks();
  if (!blocks.includes(pseudo)) {
    saveBlocks([...blocks, pseudo]);
  }
}

function removeBlock(pseudo: string) {
  const blocks = loadBlocks();
  saveBlocks(blocks.filter((p) => p !== pseudo));
}

function getCandidats(blocks: string[], profilsGlobaux: ProfilGlobal[]): ProfilGlobal[] {
  const candidats = profilsGlobaux.filter((p) => !blocks.includes(p.pseudo));
  candidats.sort((a, b) => b.friendlyScore - a.friendlyScore);
  return candidats.slice(0, 4);
}

function shareWhatsApp(p: Partie) {
  const inscrits = p.participants.length;
  const manque = Math.max(0, p.placesTotal - inscrits);

  const texte =
    `🎾 Partie Pádel (${p.format})\n` +
    `📍 ${p.zone}\n` +
    `🕒 ${p.dateISO.replace("T", " ")}\n` +
    `👥 ${inscrits}/${p.placesTotal} inscrits — il manque ${manque}\n` +
    `👉 Rejoins-nous sur PadelMatch !`;

  const url = `https://wa.me/?text=${encodeURIComponent(texte)}`;
  window.open(url, "_blank");
}

export default function PartiesPage() {
  const router = useRouter();
  const [groupes, setGroupes] = useState<Groupe[]>([]);
  const [parties, setParties] = useState<Partie[]>([]);
  const [mode, setMode] = useState<"organisateur" | "joueur">("organisateur");
  const [blocks, setBlocks] = useState<string[]>([]);
  const [profilsGlobaux, setProfilsGlobaux] = useState<ProfilGlobal[]>([]);

  // Form state
  const [groupeId, setGroupeId] = useState("");
  const [dateISO, setDateISO] = useState("");
  const [datePart, setDatePart] = useState("");
  const [heurePart, setHeurePart] = useState("");
  const [minutesPart, setMinutesPart] = useState("00");
  const [format, setFormat] = useState<Partie["format"]>("Amical");
  const [placesTotal, setPlacesTotal] = useState(4);
  const [visibilite, setVisibilite] = useState<VisibilitePartie>("groupe");
  const [cibleProfilPseudo, setCibleProfilPseudo] = useState("");
  const [terrainId, setTerrainId] = useState("");
  const [terrains, setTerrains] = useState<Terrain[]>([]);
  const [terrainTab, setTerrainTab] = useState<"select" | "add">("select");
  const [nouveauTerrainNom, setNouveauTerrainNom] = useState("");
  const [nouveauTerrainVille, setNouveauTerrainVille] = useState("");
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    async function loadGroupesFromFirestore() {
      try {
        const groupesData = await getGroupes();
        setGroupes(groupesData);
        setGroupeId(groupesData[0]?.id ?? "");
      } catch (error) {
        console.error("Erreur lors du chargement des groupes:", error);
        // Fallback : charger depuis localStorage
        const gs = load<Groupe[]>(GROUPES_KEY, []);
        setGroupes(gs);
        setGroupeId(gs[0]?.id ?? "");
      }
    }
    loadGroupesFromFirestore();

    // Charger les blocs
    setBlocks(loadBlocks());

    // Charger les profils globaux
    setProfilsGlobaux(loadProfilsGlobaux());

    // Charger les terrains depuis Firestore
    async function loadTerrainsFromFirestore() {
      try {
        const terrainsData = await loadTerrains();
        setTerrains(terrainsData);
      } catch (error) {
        console.error("Erreur lors du chargement des terrains:", error);
      }
    }
    loadTerrainsFromFirestore();

    // Charger les parties depuis Firestore
    async function loadPartiesFromFirestore() {
      try {
        const partiesFirestore = await getParties();
        // Convertir les parties Firestore au format local
        const partiesConverties: Partie[] = partiesFirestore.map((p: any) => {
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
          return {
            id: p.id ?? crypto.randomUUID(),
            groupeId: String(p.groupeId ?? ""),
            groupeNom: String(p.groupeNom ?? "Groupe"),
            zone: String(p.zone ?? "Nice"),
            dateISO: String(p.dateISO ?? ""),
            format: (p.format === "Compétitif" || p.format === "Mixte" ? p.format : "Amical") as any,
            placesTotal: Number(p.placesTotal ?? 4),
            terrainId: p.terrainId ? String(p.terrainId) : undefined,
            organisateurPseudo: orga,
            participants,
            visibilite: (p.visibilite === "profil" || p.visibilite === "groupe" || p.visibilite === "communaute"
              ? p.visibilite
              : (p.ouverteCommunaute ? "communaute" : "groupe")) as VisibilitePartie,
            cibleProfilPseudo: p.cibleProfilPseudo ? String(p.cibleProfilPseudo) : undefined,
            ouverteCommunaute: Boolean(p.ouverteCommunaute ?? false),
            demandes,
            createdAt: typeof p.createdAt === "number" ? p.createdAt : Date.now(),
          };
        });
        setParties(partiesConverties);
      } catch (error) {
        console.error("Erreur lors du chargement des parties:", error);
        // Fallback : charger depuis localStorage
        const raw = load<any[]>(PARTIES_KEY, []);
        const repaired: Partie[] = raw.map((p) => {
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
          return {
            id: String(p.id ?? crypto.randomUUID()),
            groupeId: String(p.groupeId ?? ""),
            groupeNom: String(p.groupeNom ?? "Groupe"),
            zone: String(p.zone ?? "Nice"),
            dateISO: String(p.dateISO ?? ""),
            format: (p.format === "Compétitif" || p.format === "Mixte" ? p.format : "Amical") as any,
            placesTotal: Number(p.placesTotal ?? 4),
            terrainId: p.terrainId ? String(p.terrainId) : undefined,
            organisateurPseudo: orga,
            participants,
            visibilite: (p.visibilite === "profil" || p.visibilite === "groupe" || p.visibilite === "communaute"
              ? p.visibilite
              : (p.ouverteCommunaute ? "communaute" : "groupe")) as VisibilitePartie,
            cibleProfilPseudo: p.cibleProfilPseudo ? String(p.cibleProfilPseudo) : undefined,
            ouverteCommunaute: Boolean(p.ouverteCommunaute ?? false),
            demandes,
            createdAt: Number(p.createdAt ?? Date.now()),
          };
        });
        setParties(repaired);
      }
    }

    loadPartiesFromFirestore();

    // S'abonner aux mises à jour en temps réel
    const unsubscribe = subscribeToParties((partiesFirestore) => {
      const partiesConverties: Partie[] = partiesFirestore.map((p: any) => {
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
        return {
          id: p.id ?? crypto.randomUUID(),
          groupeId: String(p.groupeId ?? ""),
          groupeNom: String(p.groupeNom ?? "Groupe"),
          zone: String(p.zone ?? "Nice"),
          dateISO: String(p.dateISO ?? ""),
          format: (p.format === "Compétitif" || p.format === "Mixte" ? p.format : "Amical") as any,
          placesTotal: Number(p.placesTotal ?? 4),
          terrainId: p.terrainId ? String(p.terrainId) : undefined,
          organisateurPseudo: orga,
          participants,
          visibilite: (p.visibilite === "profil" || p.visibilite === "groupe" || p.visibilite === "communaute"
            ? p.visibilite
            : (p.ouverteCommunaute ? "communaute" : "groupe")) as VisibilitePartie,
          cibleProfilPseudo: p.cibleProfilPseudo ? String(p.cibleProfilPseudo) : undefined,
          ouverteCommunaute: Boolean(p.ouverteCommunaute ?? false),
          demandes,
          createdAt: typeof p.createdAt === "number" ? p.createdAt : Date.now(),
        };
      });
      setParties(partiesConverties);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Recharger les profils globaux périodiquement pour avoir les dernières mises à jour
  useEffect(() => {
    const interval = setInterval(() => {
      setProfilsGlobaux(loadProfilsGlobaux());
    }, 2000); // Recharger toutes les 2 secondes
    return () => clearInterval(interval);
  }, []);

  const groupeSelectionne = useMemo(
    () => groupes.find((g) => g.id === groupeId) ?? null,
    [groupes, groupeId]
  );

  function updateDateISO(date: string, heure: string, minutes: string) {
    if (date && heure && minutes) {
      const dateTimeISO = `${date}T${heure}:${minutes}`;
      setDateISO(dateTimeISO);
    } else {
      setDateISO("");
    }
  }

  const monPseudo = getMonPseudo();

  // Filtrer les parties selon la visibilité
  const partiesVisibles = useMemo(() => {
    return parties.filter((p) => {
      const isOrganisateur = p.organisateurPseudo === monPseudo;
      const isParticipant = p.participants.some((x) => x.pseudo === monPseudo);

      // L'organisateur et les participants voient toujours leur partie
      if (isOrganisateur || isParticipant) return true;

      // Filtrage selon la visibilité
      if (p.visibilite === "communaute") return true;
      if (p.visibilite === "groupe") return true; // En MVP, visible par tous pour les groupes
      if (p.visibilite === "profil" && p.cibleProfilPseudo === monPseudo) return true;

      return false;
    });
  }, [parties, monPseudo]);

  function persist(next: Partie[]) {
    setParties(next);
    // Sauvegarder dans localStorage pour compatibilité (fallback)
    save(PARTIES_KEY, next);
  }

  async function updatePartieInFirestore(partieId: string, updates: Partial<Partie>) {
    try {
      await updatePartieFirestore(partieId, updates);
      console.log("✅ Partie mise à jour dans Firestore:", partieId);
    } catch (error: any) {
      console.error("❌ Erreur lors de la mise à jour dans Firestore:", error);
      console.error("Code d'erreur:", error.code);
      console.error("Message:", error.message);
      // Afficher une alerte pour informer l'utilisateur
      if (error.code === "permission-denied") {
        alert("Erreur : Permission refusée. Vérifiez les règles Firestore.");
      } else {
        alert(`Erreur lors de la sauvegarde : ${error.message}`);
      }
    }
  }

  async function createPartie() {
    // Vérifier si l'utilisateur est connecté
    const profilConnecte = loadCurrentProfilSync();
    if (!profilConnecte || !profilConnecte.pseudo || profilConnecte.pseudo === "Joueur") {
      setShowLoginModal(true);
      return;
    }

    if (!groupeSelectionne) return;
    if (!dateISO) return;

    if (visibilite === "profil" && !cibleProfilPseudo) {
      alert("Veuillez sélectionner un joueur pour proposer à un profil spécifique.");
      return;
    }

    const orgaPseudo = profilConnecte.pseudo; // Utiliser le pseudo du profil connecté
    const user = getCurrentUser();
    const organisateurId = user?.uid || null; // UID Firebase si disponible

    const newPartie: Omit<Partie, "id"> = {
      groupeId: groupeSelectionne.id,
      groupeNom: groupeSelectionne.nom,
      zone: groupeSelectionne.zone,
      dateISO,
      format,
      placesTotal: Number(placesTotal) || 4,
      terrainId: terrainId || undefined,

      organisateurPseudo: orgaPseudo,
      // @ts-ignore - Ajout temporaire pour les règles Firestore
      organisateurId: organisateurId,
      participants: [{ pseudo: orgaPseudo, role: "organisateur" as const }],

      visibilite,
      cibleProfilPseudo: visibilite === "profil" ? cibleProfilPseudo : undefined,
      ouverteCommunaute: visibilite === "communaute", // DEPRECATED
      demandes: [],

      createdAt: Date.now(),
    };

    try {
      // Créer la partie dans Firestore
      console.log("🔄 Création de la partie dans Firestore...");
      const partieId = await createPartieFirestore(newPartie);
      console.log("✅ Partie créée dans Firestore avec l'ID:", partieId);
      // Ajouter localement avec l'ID retourné
      persist([{ ...newPartie, id: partieId }, ...parties]);
      alert("Partie créée avec succès ✅");
    } catch (error: any) {
      console.error("❌ Erreur lors de la création de la partie:", error);
      console.error("Code d'erreur:", error.code);
      console.error("Message:", error.message);
      // Fallback : créer localement
      const partieId = crypto.randomUUID();
      persist([{ ...newPartie, id: partieId }, ...parties]);
      if (error.code === "permission-denied") {
        alert("⚠️ Erreur : Permission refusée par Firestore. La partie est sauvegardée localement uniquement. Vérifiez les règles Firestore.");
      } else {
        alert(`⚠️ Erreur lors de la sauvegarde dans Firestore : ${error.message}\nLa partie est sauvegardée localement uniquement.`);
      }
    }

    setDateISO("");
    setDatePart("");
    setHeurePart("");
    setMinutesPart("00");
    setFormat("Amical");
    setPlacesTotal(4);
    setVisibilite("groupe");
    setCibleProfilPseudo("");
    setTerrainId("");
    setTerrainTab("select");
  }

  async function handleAddTerrain() {
    if (!nouveauTerrainNom.trim() || !nouveauTerrainVille.trim()) {
      alert("Veuillez remplir le nom et la ville du terrain.");
      return;
    }

    try {
      const nouveauTerrain = await addTerrainPersonnalise(nouveauTerrainNom.trim(), nouveauTerrainVille.trim());
      const terrainsData = await loadTerrains();
      setTerrains(terrainsData);
      setTerrainId(nouveauTerrain.id);
      setTerrainTab("select");
      setNouveauTerrainNom("");
      setNouveauTerrainVille("");
      alert("Terrain ajouté avec succès ✅");
    } catch (error: any) {
      alert(error.message || "Erreur lors de l'ajout du terrain.");
    }
  }

  async function toggleOpen(id: string) {
    const partie = parties.find((p) => p.id === id);
    if (!partie) return;

    const nouvelleVisibilite: VisibilitePartie =
      partie.visibilite === "communaute" ? "groupe" : "communaute";
    const isOpening = nouvelleVisibilite === "communaute";

    const updated = {
      visibilite: nouvelleVisibilite,
      ouverteCommunaute: nouvelleVisibilite === "communaute", // DEPRECATED
    };

    const updatedParties = parties.map((p) =>
      p.id === id
        ? {
            ...p,
            ...updated,
          }
        : p
    );
    persist(updatedParties);

    // Sauvegarder dans Firestore
    await updatePartieInFirestore(id, updated);

    // Notification si ouverture à la communauté avec places disponibles
    if (isOpening && partie) {
      const manque = partie.placesTotal - partie.participants.length;
      if (manque > 0) {
        showNotification(`🌍 Partie ouverte à la communauté`, {
          body: `${partie.groupeNom} — ${manque} place${manque > 1 ? "s" : ""} disponible${manque > 1 ? "s" : ""}`,
          tag: `partie-ouverte-${id}`,
        });
      }
    }
  }

  function addPlayerTest(id: string) {
    persist(
      parties.map((p) => {
        if (p.id !== id) return p;
        if (p.participants.length >= p.placesTotal) return p;

        const pseudo = `Joueur${p.participants.length + 1}`;
        return { ...p, participants: [...p.participants, { pseudo, role: "joueur" as const }] };
      })
    );
  }

  async function requestJoin(id: string) {
    const monPseudo = getMonPseudo();

    const updatedParties = parties.map((p) => {
      if (p.id !== id) return p;
      
      // Vérifier la visibilité : on peut rejoindre si :
      // 1. Partie ouverte à la communauté
      // 2. Partie profil et on est la cible
      // 3. Partie groupe et on est membre du groupe
      const peutRejoindre =
        p.visibilite === "communaute" ||
        (p.visibilite === "profil" && p.cibleProfilPseudo === monPseudo) ||
        (p.visibilite === "groupe" && (() => {
          const groupe = getGroupeById(p.groupeId);
          return groupe?.membres?.includes(monPseudo) ?? false;
        })());
      
      if (!peutRejoindre) return p;
      if (p.participants.length >= p.placesTotal) return p;

      // Si déjà dedans ou déjà demandé, on ne refait pas
      if (p.participants.some((x) => x.pseudo === monPseudo)) return p;
      if (p.demandes.some((d) => d.pseudo === monPseudo)) return p;

      return { ...p, demandes: [...p.demandes, { pseudo: monPseudo, createdAt: Date.now() }] };
    });
    
    persist(updatedParties);

    // Sauvegarder dans Firestore
    const partie = updatedParties.find((p) => p.id === id);
    if (partie) {
      await updatePartieInFirestore(id, { demandes: partie.demandes });
    }
  }

  async function acceptRequest(matchId: string, pseudo: string) {
    const partie = parties.find((p) => p.id === matchId);
    const updatedParties = parties.map((p) => {
      if (p.id !== matchId) return p;
      if (p.participants.length >= p.placesTotal) return p;

      const demandes = p.demandes.filter((d) => d.pseudo !== pseudo);
      const participants = [...p.participants, { pseudo, role: "joueur" as const }];

      return { ...p, demandes, participants };
    });
    
    persist(updatedParties);

    // Sauvegarder dans Firestore
    const updatedPartie = updatedParties.find((p) => p.id === matchId);
    if (updatedPartie) {
      await updatePartieInFirestore(matchId, {
        demandes: updatedPartie.demandes,
        participants: updatedPartie.participants,
      });
    }

    // Notification pour l'organisateur (confirmation)
    if (partie) {
      showNotification(`✅ Joueur accepté`, {
        body: `${pseudo} a rejoint ${partie.groupeNom}`,
        tag: `accept-${matchId}-${pseudo}`,
      });
    }

    // Note: Pour notifier le joueur accepté, il faudrait un système de polling
    // car les données sont locales. Ce sera fait dans une prochaine version.
  }

  async function removePartie(id: string) {
    try {
      await deletePartieFirestore(id);
    } catch (error) {
      console.error("Erreur lors de la suppression dans Firestore:", error);
    }
    persist(parties.filter((p) => p.id !== id));
  }

  return (
    <div
      style={{
        background: "#000",
        color: "#fff",
        minHeight: "100vh",
        padding: "16px",
        paddingBottom: 80,
        boxSizing: "border-box",
        maxWidth: "100%",
        overflowX: "hidden",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, marginBottom: 8, color: "#fff" }}>🎾 Mes parties</h1>
          <p style={{ opacity: 0.7, marginTop: 0, color: "#fff", fontSize: 14 }}>
            Mode test : passe de Joueur à Organisateur pour simuler le flux demande → acceptation.
          </p>
        </div>

        <div
          style={{
            border: "1px solid #2a2a2a",
            borderRadius: 12,
            padding: 8,
            display: "flex",
            gap: 8,
            alignItems: "center",
            background: "#1f1f1f",
          }}
        >
          <span style={{ fontSize: 13, opacity: 0.7, color: "#fff" }}>Mode :</span>
          <button
            onClick={() => setMode("organisateur")}
            style={{
              padding: "8px 10px",
              borderRadius: 10,
              border: "1px solid #2a2a2a",
              background: mode === "organisateur" ? "#10b981" : "transparent",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            Organisateur
          </button>
          <button
            onClick={() => setMode("joueur")}
            style={{
              padding: "8px 10px",
              borderRadius: 10,
              border: "1px solid #2a2a2a",
              background: mode === "joueur" ? "#10b981" : "transparent",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            Joueur
          </button>
        </div>
      </div>

      {/* Form */}
      <div
        style={{
          marginTop: 16,
          padding: 16,
          border: "1px solid #2a2a2a",
          borderRadius: 12,
          display: "grid",
          gap: 12,
          background: "#1f1f1f",
          maxWidth: "100%",
        }}
      >
        <div style={{ display: "grid", gap: 8, maxWidth: "100%" }}>
          <label style={{ fontSize: 13, opacity: 0.7, color: "#fff" }}>Groupe</label>
          <select
            value={groupeId}
            onChange={(e) => setGroupeId(e.target.value)}
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: 10,
              borderRadius: 10,
              border: "1px solid #2a2a2a",
              background: "#141414",
              color: "#fff",
              fontSize: 14,
            }}
          >
            {groupes.length === 0 ? (
              <option style={{ background: "#141414", color: "#fff" }}>Aucun groupe (crée-en sur /groupes)</option>
            ) : (
              groupes.map((g) => (
                <option key={g.id} value={g.id} style={{ background: "#141414", color: "#fff" }}>
                  {g.nom} — {g.zone}
                </option>
              ))
            )}
          </select>
        </div>

        <div style={{ display: "grid", gap: 8, maxWidth: "100%" }}>
          <label style={{ fontSize: 13, opacity: 0.7, color: "#fff" }}>Date & heure</label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: 8, width: "100%" }}>
            <input
              type="date"
              value={datePart}
              onChange={(e) => {
                setDatePart(e.target.value);
                updateDateISO(e.target.value, heurePart, minutesPart);
              }}
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: 10,
                borderRadius: 10,
                border: "1px solid #2a2a2a",
                background: "#141414",
                color: "#fff",
                fontSize: 14,
                minWidth: 0,
              }}
            />
            <select
              value={heurePart}
              onChange={(e) => {
                setHeurePart(e.target.value);
                updateDateISO(datePart, e.target.value, minutesPart);
              }}
              style={{
                boxSizing: "border-box",
                padding: 10,
                borderRadius: 10,
                border: "1px solid #2a2a2a",
                background: "#141414",
                color: "#fff",
                fontSize: 14,
                minWidth: 70,
                maxWidth: 80,
              }}
            >
              <option value="" style={{ background: "#141414", color: "#fff" }}>
                --
              </option>
              {Array.from({ length: 24 }, (_, i) => {
                const heure = i.toString().padStart(2, "0");
                return (
                  <option key={heure} value={heure} style={{ background: "#141414", color: "#fff" }}>
                    {heure}h
                  </option>
                );
              })}
            </select>
            <select
              value={minutesPart}
              onChange={(e) => {
                setMinutesPart(e.target.value);
                updateDateISO(datePart, heurePart, e.target.value);
              }}
              style={{
                boxSizing: "border-box",
                padding: 10,
                borderRadius: 10,
                border: "1px solid #2a2a2a",
                background: "#141414",
                color: "#fff",
                fontSize: 14,
                minWidth: 70,
                maxWidth: 80,
              }}
            >
              <option value="00" style={{ background: "#141414", color: "#fff" }}>
                00
              </option>
              <option value="30" style={{ background: "#141414", color: "#fff" }}>
                30
              </option>
            </select>
          </div>
        </div>

        <div style={{ display: "grid", gap: 8, maxWidth: "100%" }}>
          <label style={{ fontSize: 13, opacity: 0.7, color: "#fff" }}>Format</label>
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value as any)}
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: 10,
              borderRadius: 10,
              border: "1px solid #2a2a2a",
              background: "#141414",
              color: "#fff",
              fontSize: 14,
            }}
          >
            <option style={{ background: "#141414", color: "#fff" }}>Amical</option>
            <option style={{ background: "#141414", color: "#fff" }}>Compétitif</option>
            <option style={{ background: "#141414", color: "#fff" }}>Mixte</option>
          </select>
        </div>

        <div style={{ display: "grid", gap: 8, maxWidth: "100%" }}>
          <label style={{ fontSize: 13, opacity: 0.7, color: "#fff" }}>Places</label>
          <input
            type="number"
            min={2}
            max={4}
            value={placesTotal}
            onChange={(e) => setPlacesTotal(Number(e.target.value))}
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: 10,
              borderRadius: 10,
              border: "1px solid #2a2a2a",
              background: "#141414",
              color: "#fff",
              fontSize: 14,
            }}
          />
        </div>

        {/* Sélection de terrain */}
        <div style={{ display: "grid", gap: 8, maxWidth: "100%" }}>
          <label style={{ fontSize: 13, opacity: 0.7, color: "#fff" }}>Terrain</label>
          
          {/* Onglets */}
          <div style={{ display: "flex", gap: 8, marginBottom: 8, width: "100%", maxWidth: "100%", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => setTerrainTab("select")}
              style={{
                flex: 1,
                minWidth: 0,
                padding: "8px 12px",
                borderRadius: 8,
                border: "1px solid #2a2a2a",
                background: terrainTab === "select" ? "#10b981" : "transparent",
                color: "#fff",
                fontSize: 13,
                cursor: "pointer",
                fontWeight: terrainTab === "select" ? 600 : 400,
              }}
            >
              Choisir un terrain
            </button>
            <button
              type="button"
              onClick={() => setTerrainTab("add")}
              style={{
                flex: 1,
                minWidth: 0,
                padding: "8px 12px",
                borderRadius: 8,
                border: "1px solid #2a2a2a",
                background: terrainTab === "add" ? "#10b981" : "transparent",
                color: "#fff",
                fontSize: 13,
                cursor: "pointer",
                fontWeight: terrainTab === "add" ? 600 : 400,
              }}
            >
              Ajouter un terrain
            </button>
          </div>

          {/* Contenu selon l'onglet */}
          {terrainTab === "select" ? (
            <select
              value={terrainId}
              onChange={(e) => setTerrainId(e.target.value)}
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: 10,
                borderRadius: 10,
                border: "1px solid #2a2a2a",
                background: "#141414",
                color: "#fff",
                fontSize: 14,
              }}
            >
              <option value="" style={{ background: "#141414", color: "#fff" }}>
                Aucun terrain sélectionné
              </option>
              {terrains.map((t) => (
                <option key={t.id} value={t.id} style={{ background: "#141414", color: "#fff" }}>
                  {t.nom} — {t.ville}
                </option>
              ))}
            </select>
          ) : (
            <div style={{ display: "grid", gap: 8 }}>
              <input
                type="text"
                value={nouveauTerrainNom}
                onChange={(e) => setNouveauTerrainNom(e.target.value)}
                placeholder="Nom du terrain"
                style={{
                  padding: 10,
                  borderRadius: 10,
                  border: "1px solid #2a2a2a",
                  background: "#141414",
                  color: "#fff",
                  fontSize: 14,
                }}
              />
              <input
                type="text"
                value={nouveauTerrainVille}
                onChange={(e) => setNouveauTerrainVille(e.target.value)}
                placeholder="Ville"
                style={{
                  padding: 10,
                  borderRadius: 10,
                  border: "1px solid #2a2a2a",
                  background: "#141414",
                  color: "#fff",
                  fontSize: 14,
                }}
              />
              <button
                type="button"
                onClick={handleAddTerrain}
                style={{
                  padding: "10px 16px",
                  borderRadius: 10,
                  border: "none",
                  background: "#10b981",
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Ajouter le terrain
              </button>
            </div>
          )}
        </div>

        <div style={{ display: "grid", gap: 8 }}>
          <label style={{ fontSize: 13, opacity: 0.7, color: "#fff" }}>Proposer à</label>
          <select
            value={visibilite}
            onChange={(e) => {
              setVisibilite(e.target.value as VisibilitePartie);
              if (e.target.value !== "profil") {
                setCibleProfilPseudo("");
              }
            }}
            style={{
              padding: 10,
              borderRadius: 10,
              border: "1px solid #2a2a2a",
              background: "#141414",
              color: "#fff",
              fontSize: 14,
            }}
          >
            <option value="groupe" style={{ background: "#141414", color: "#fff" }}>
              👥 Groupe uniquement
            </option>
            <option value="profil" style={{ background: "#141414", color: "#fff" }}>
              👤 Profil spécifique
            </option>
            <option value="communaute" style={{ background: "#141414", color: "#fff" }}>
              🌍 Communauté entière
            </option>
          </select>
        </div>

        {visibilite === "profil" && (
          <div style={{ display: "grid", gap: 8 }}>
            <label style={{ fontSize: 13, opacity: 0.7, color: "#fff" }}>Joueur cible</label>
            <select
              value={cibleProfilPseudo}
              onChange={(e) => setCibleProfilPseudo(e.target.value)}
              style={{
                padding: 10,
                borderRadius: 10,
                border: "1px solid #2a2a2a",
                background: "#141414",
                color: "#fff",
                fontSize: 14,
              }}
            >
              <option value="" style={{ background: "#141414", color: "#fff" }}>
                Sélectionner un joueur
              </option>
              {profilsGlobaux.map((p) => (
                <option key={p.pseudo} value={p.pseudo} style={{ background: "#141414", color: "#fff" }}>
                   {p.pseudo} ({p.niveau})
                </option>
              ))}
            </select>
          </div>
        )}

        <button
          onClick={createPartie}
          style={{
            padding: "12px 16px",
            borderRadius: 10,
            border: "none",
            background: groupes.length === 0 ? "#2a2a2a" : "#10b981",
            color: "#fff",
            fontWeight: 600,
            fontSize: 14,
            cursor: groupes.length === 0 ? "not-allowed" : "pointer",
            opacity: groupes.length === 0 ? 0.5 : 1,
          }}
          disabled={groupes.length === 0}
        >
          + Créer la partie
        </button>
      </div>

      {/* List */}
      <div style={{ marginTop: 20, display: "grid", gap: 12, maxWidth: "100%" }}>
        {partiesVisibles.length === 0 ? (
          <div style={{ opacity: 0.7, marginTop: 10, color: "#fff", textAlign: "center", padding: 20 }}>
            Aucune partie visible pour l'instant.
          </div>
        ) : (
          partiesVisibles.map((p) => {
              const inscrits = p.participants.length;
              const manque = Math.max(0, p.placesTotal - inscrits);
              const complete = manque === 0;

              const canSeeRequests = mode === "organisateur"; // MVP : en mode organisateur, tu "vois" les demandes
              const canRequest = mode === "joueur";
              const isParticipant = p.participants.some((x) => x.pseudo === monPseudo);

            return (
              <div
                key={p.id}
                style={{
                  border: "1px solid #2a2a2a",
                  borderRadius: 12,
                  padding: 16,
                  display: "grid",
                  gap: 12,
                  background: "#1f1f1f",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ fontWeight: 600, color: "#fff", fontSize: 16, marginBottom: 4 }}>
                      {p.groupeNom} — {p.format}
                    </div>
                    <div style={{ fontSize: 13, opacity: 0.7, color: "#fff" }}>
                      {p.zone} • {p.dateISO.replace("T", " ")}
                    </div>
                    {p.terrainId && (() => {
                      const terrain = terrains.find(t => t.id === p.terrainId);
                      return terrain ? (
                        <div style={{ fontSize: 13, opacity: 0.9, color: "#10b981", marginTop: 6, fontWeight: 500 }}>
                          🎾 {terrain.nom} — {terrain.ville}
                        </div>
                      ) : null;
                    })()}
                    <div style={{ fontSize: 13, opacity: 0.7, color: "#fff", marginTop: 4 }}>
                      Organisé par{" "}
                      <Link
                        href={`/joueurs/${encodeURIComponent(p.organisateurPseudo)}`}
                        style={{
                          color: "#10b981",
                          textDecoration: "none",
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.textDecoration = "underline";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.textDecoration = "none";
                        }}
                      >
                        {p.organisateurPseudo}
                      </Link>
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 600, color: "#fff", fontSize: 18 }}>
                      {inscrits}/{p.placesTotal}
                    </div>
                    <div style={{ fontSize: 13, opacity: 0.7, color: complete ? "#10b981" : "#fff" }}>
                      {complete ? "✅ Complète" : `⏳ Il manque ${manque}`}
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: 14, opacity: 0.9, color: "#fff" }}>
                  <b>Participants :</b>{" "}
                  {p.participants.map((x, idx) => (
                    <span key={x.pseudo}>
                      {idx > 0 && ", "}
                      <Link
                        href={`/joueurs/${encodeURIComponent(x.pseudo)}`}
                        style={{
                          color: "#10b981",
                          textDecoration: "none",
                          cursor: "pointer",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.textDecoration = "underline";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.textDecoration = "none";
                        }}
                      >
                        {x.pseudo}
                      </Link>
                    </span>
                  ))}
                </div>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {isParticipant && (
                    <button
                      onClick={() => router.push(`/match/${p.id}`)}
                      style={{
                        padding: "8px 12px",
                        borderRadius: 8,
                        border: "none",
                        background: "#10b981",
                        color: "#fff",
                        fontWeight: 600,
                        fontSize: 13,
                        cursor: "pointer",
                      }}
                    >
                      🎾 Voir le match
                    </button>
                  )}

                  <button
                    onClick={() => addPlayerTest(p.id)}
                    style={{
                      padding: "8px 12px",
                      borderRadius: 8,
                      border: "1px solid #2a2a2a",
                      background: "transparent",
                      color: "#fff",
                      fontSize: 13,
                      cursor: complete ? "not-allowed" : "pointer",
                      opacity: complete ? 0.5 : 1,
                    }}
                    disabled={complete}
                  >
                    + Ajouter un joueur (test)
                  </button>

                  {p.visibilite !== "profil" && p.organisateurPseudo === monPseudo && (
                    <button
                      onClick={() => toggleOpen(p.id)}
                      style={{
                        padding: "8px 12px",
                        borderRadius: 8,
                        border: "1px solid #2a2a2a",
                        background: p.visibilite === "communaute" ? "#10b981" : "transparent",
                        color: "#fff",
                        fontSize: 13,
                        cursor: complete ? "not-allowed" : "pointer",
                        opacity: complete ? 0.5 : 1,
                      }}
                      disabled={complete}
                    >
                      {p.visibilite === "communaute" ? "🌍 Ouverte à la communauté" : "🔒 Ouvrir à la communauté"}
                    </button>
                  )}

                  <button
                    onClick={() => {
                      if (!canRequest) {
                        alert('Passe en mode "Joueur" pour demander à rejoindre.');
                        return;
                      }
                      if (complete) return;

                      const monPseudo = getMonPseudo();
                      
                      // Vérifier si l'utilisateur peut rejoindre :
                      // 1. Si la partie est ouverte à la communauté
                      // 2. OU si c'est une partie profil et l'utilisateur est la cible
                      // 3. OU si c'est une partie groupe et l'utilisateur est membre du groupe
                      const peutRejoindre =
                        p.visibilite === "communaute" ||
                        (p.visibilite === "profil" && p.cibleProfilPseudo === monPseudo) ||
                        (p.visibilite === "groupe" && (() => {
                          // Chercher le groupe dans les groupes chargés depuis Firestore
                          const groupe = groupes.find(g => g.id === p.groupeId);
                          return groupe?.membres?.includes(monPseudo) ?? false;
                        })());

                      if (!peutRejoindre) {
                        if (p.visibilite === "profil") {
                          alert(`Cette partie est proposée uniquement à ${p.cibleProfilPseudo}.`);
                        } else if (p.visibilite === "groupe") {
                          alert("Vous ne faites pas partie du groupe de cette partie.");
                        } else {
                          alert("Cette partie est privée. Clique d'abord sur \"Ouvrir à la communauté\".");
                        }
                        return;
                      }
                      requestJoin(p.id);
                    }}
                    style={{
                      padding: "8px 12px",
                      borderRadius: 8,
                      border: "1px solid #2a2a2a",
                      background: "transparent",
                      color: "#fff",
                      fontSize: 13,
                      cursor: canRequest && !complete ? "pointer" : "not-allowed",
                      opacity: canRequest && !complete ? 1 : 0.5,
                    }}
                    disabled={complete}
                  >
                    🙋 Demander à rejoindre
                  </button>

                  <button
                    onClick={() => removePartie(p.id)}
                    style={{
                      padding: "8px 12px",
                      borderRadius: 8,
                      border: "1px solid #2a2a2a",
                      background: "transparent",
                      color: "#ef4444",
                      fontSize: 13,
                      cursor: "pointer",
                    }}
                  >
                    Supprimer
                  </button>
                </div>

                {canSeeRequests && p.ouverteCommunaute && p.demandes.length > 0 && (
                  <div style={{ marginTop: 12, fontSize: 14, color: "#fff" }}>
                    <b style={{ color: "#fff" }}>Demandes en attente :</b>
                    <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
                      {p.demandes.map((d) => (
                        <div
                          key={d.pseudo}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: 10,
                            border: "1px solid #2a2a2a",
                            borderRadius: 12,
                            padding: 12,
                            background: "#141414",
                          }}
                        >
                          <div style={{ color: "#fff", fontSize: 14 }}>
                            🙋{" "}
                            <Link
                              href={`/joueurs/${encodeURIComponent(d.pseudo)}`}
                              style={{
                                color: "#10b981",
                                textDecoration: "none",
                                cursor: "pointer",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.textDecoration = "underline";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.textDecoration = "none";
                              }}
                            >
                              {d.pseudo}
                            </Link>
                          </div>

                          <button
                            onClick={() => acceptRequest(p.id, d.pseudo)}
                            style={{
                              padding: "8px 12px",
                              borderRadius: 8,
                              border: "none",
                              background: complete ? "#2a2a2a" : "#10b981",
                              color: "#fff",
                              fontWeight: 600,
                              fontSize: 13,
                              cursor: complete ? "not-allowed" : "pointer",
                              opacity: complete ? 0.5 : 1,
                            }}
                            disabled={complete}
                          >
                            Accepter
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {p.ouverteCommunaute && !complete && (
                  <div
                    style={{
                      padding: 16,
                      borderRadius: 12,
                      background: "#141414",
                      display: "grid",
                      gap: 12,
                      border: "1px solid #2a2a2a",
                    }}
                  >
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>🌍 Candidats proposés</div>

                    <div style={{ display: "grid", gap: 8 }}>
                      {getCandidats(blocks, profilsGlobaux).map((j) => (
                        <div
                          key={j.pseudo}
                          style={{
                            background: "#1f1f1f",
                            border: "1px solid #2a2a2a",
                            borderRadius: 12,
                            padding: 12,
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: 12,
                            flexWrap: "wrap",
                          }}
                        >
                          <div style={{ flex: 1, minWidth: 150 }}>
                            <div style={{ fontSize: 14, marginBottom: 4 }}>
                              <Link
                                href={`/joueurs/${encodeURIComponent(j.pseudo)}`}
                                style={{
                                  fontWeight: 600,
                                  color: "#10b981",
                                  textDecoration: "none",
                                  cursor: "pointer",
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.textDecoration = "underline";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.textDecoration = "none";
                                }}
                              >
                                {j.pseudo}
                              </Link>
                            </div>
                            <div style={{ fontSize: 12, opacity: 0.7, color: "#fff" }}>
                               {j.niveau} • Friendly {j.friendlyScore}
                            </div>
                          </div>

                          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                            <button
                              style={{
                                padding: "8px 12px",
                                borderRadius: 8,
                                border: "1px solid #2a2a2a",
                                background: "transparent",
                                color: "#fff",
                                fontSize: 13,
                                cursor: "pointer",
                              }}
                              onClick={() => {
                                addBlock(j.pseudo);
                                setBlocks(loadBlocks());
                              }}
                            >
                              🚫 Ne plus proposer
                            </button>
                            <button
                              style={{
                                padding: "8px 12px",
                                borderRadius: 8,
                                border: "none",
                                background: "#10b981",
                                color: "#fff",
                                fontWeight: 600,
                                fontSize: 13,
                                cursor: "pointer",
                              }}
                              onClick={() => alert(`Invitation envoyée à ${j.pseudo} (MVP) ✅`)}
                            >
                              Inviter
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => shareWhatsApp(p)}
                      style={{
                        padding: "12px 16px",
                        borderRadius: 8,
                        border: "none",
                        background: "#10b981",
                        color: "#fff",
                        fontWeight: 600,
                        fontSize: 14,
                        cursor: "pointer",
                      }}
                    >
                      Partager sur WhatsApp
                    </button>

                    <div style={{ fontSize: 12, opacity: 0.6, color: "#fff", textAlign: "center" }}>
                      Prochaine étape : chat réservé aux joueurs acceptés + "soft block" (ne plus proposer).
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modal de connexion */}
      {showLoginModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}
          onClick={() => setShowLoginModal(false)}
        >
          <div
            style={{
              background: "#1f1f1f",
              borderRadius: 16,
              padding: 32,
              maxWidth: 400,
              width: "100%",
              border: "1px solid #2a2a2a",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12, color: "#fff" }}>
              🔒 Connexion requise
            </h2>
            <p style={{ fontSize: 14, opacity: 0.8, marginBottom: 24, color: "#fff", lineHeight: 1.6 }}>
              Vous devez être connecté pour créer un match. Connectez-vous ou créez un compte pour continuer.
            </p>
            <div style={{ display: "flex", gap: 12, flexDirection: "column" }}>
              <Link
                href="/"
                onClick={() => setShowLoginModal(false)}
                style={{
                  padding: "12px 20px",
                  borderRadius: 10,
                  border: "none",
                  background: "#10b981",
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: "pointer",
                  textDecoration: "none",
                  textAlign: "center",
                }}
              >
                Se connecter / S'inscrire
              </Link>
              <button
                onClick={() => setShowLoginModal(false)}
                style={{
                  padding: "12px 20px",
                  borderRadius: 10,
                  border: "1px solid #2a2a2a",
                  background: "transparent",
                  color: "#fff",
                  fontSize: 14,
                  cursor: "pointer",
                }}
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
