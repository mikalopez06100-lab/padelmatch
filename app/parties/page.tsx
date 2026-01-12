"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { showNotification } from "../utils/notifications";
import { loadProfilsGlobaux } from "@/lib/data/profils-globaux";
import type { ProfilGlobal } from "@/lib/data/profils-globaux";
import { loadTerrains, addTerrainPersonnalise, type Terrain } from "@/lib/data/terrains";
import { loadCurrentProfil } from "@/lib/data/auth";

type Groupe = {
  id: string;
  nom: string;
  zone: string;
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
    const gs = load<Groupe[]>(GROUPES_KEY, []);
    setGroupes(gs);
    setGroupeId(gs[0]?.id ?? "");

    // Charger les blocs
    setBlocks(loadBlocks());

    // Charger les profils globaux
    setProfilsGlobaux(loadProfilsGlobaux());

    // Charger les terrains
    setTerrains(loadTerrains());

    // ✅ Migration/réparation des anciennes données
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

        organisateurPseudo: orga,
        participants,

        visibilite: (p.visibilite === "profil" || p.visibilite === "groupe" || p.visibilite === "communaute"
          ? p.visibilite
          : (p.ouverteCommunaute ? "communaute" : "groupe")) as VisibilitePartie,
        cibleProfilPseudo: p.cibleProfilPseudo ? String(p.cibleProfilPseudo) : undefined,
        ouverteCommunaute: Boolean(p.ouverteCommunaute ?? false), // DEPRECATED
        demandes,

        createdAt: Number(p.createdAt ?? Date.now()),
      };
    });

    setParties(repaired);
    save(PARTIES_KEY, repaired);
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
    save(PARTIES_KEY, next);
  }

  function createPartie() {
    // Vérifier si l'utilisateur est connecté
    const profilConnecte = loadCurrentProfil();
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

    const newPartie: Partie = {
      id: crypto.randomUUID(),
      groupeId: groupeSelectionne.id,
      groupeNom: groupeSelectionne.nom,
      zone: groupeSelectionne.zone,
      dateISO,
      format,
      placesTotal: Number(placesTotal) || 4,
      terrainId: terrainId || undefined,

      organisateurPseudo: orgaPseudo,
      participants: [{ pseudo: orgaPseudo, role: "organisateur" as const }],

      visibilite,
      cibleProfilPseudo: visibilite === "profil" ? cibleProfilPseudo : undefined,
      ouverteCommunaute: visibilite === "communaute", // DEPRECATED
      demandes: [],

      createdAt: Date.now(),
    };

    persist([newPartie, ...parties]);

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

  function handleAddTerrain() {
    if (!nouveauTerrainNom.trim() || !nouveauTerrainVille.trim()) {
      alert("Veuillez remplir le nom et la ville du terrain.");
      return;
    }

    try {
      const nouveauTerrain = addTerrainPersonnalise(nouveauTerrainNom.trim(), nouveauTerrainVille.trim());
      setTerrains(loadTerrains());
      setTerrainId(nouveauTerrain.id);
      setTerrainTab("select");
      setNouveauTerrainNom("");
      setNouveauTerrainVille("");
      alert("Terrain ajouté avec succès ✅");
    } catch (error: any) {
      alert(error.message || "Erreur lors de l'ajout du terrain.");
    }
  }

  function toggleOpen(id: string) {
    const partie = parties.find((p) => p.id === id);
    if (!partie) return;

    const nouvelleVisibilite: VisibilitePartie =
      partie.visibilite === "communaute" ? "groupe" : "communaute";
    const isOpening = nouvelleVisibilite === "communaute";

    persist(
      parties.map((p) =>
        p.id === id
          ? {
              ...p,
              visibilite: nouvelleVisibilite,
              ouverteCommunaute: nouvelleVisibilite === "communaute", // DEPRECATED
            }
          : p
      )
    );

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

  function requestJoin(id: string) {
    const monPseudo = getMonPseudo();

    persist(
      parties.map((p) => {
        if (p.id !== id) return p;
        // Vérifier la visibilité : on ne peut rejoindre que si communaute ou si c'est pour notre profil
        if (p.visibilite !== "communaute" && !(p.visibilite === "profil" && p.cibleProfilPseudo === monPseudo))
          return p;
        if (p.participants.length >= p.placesTotal) return p;

        // Si déjà dedans ou déjà demandé, on ne refait pas
        if (p.participants.some((x) => x.pseudo === monPseudo)) return p;
        if (p.demandes.some((d) => d.pseudo === monPseudo)) return p;

        return { ...p, demandes: [...p.demandes, { pseudo: monPseudo, createdAt: Date.now() }] };
      })
    );
  }

  function acceptRequest(matchId: string, pseudo: string) {
    const partie = parties.find((p) => p.id === matchId);
    persist(
      parties.map((p) => {
        if (p.id !== matchId) return p;
        if (p.participants.length >= p.placesTotal) return p;

        const demandes = p.demandes.filter((d) => d.pseudo !== pseudo);
        const participants = [...p.participants, { pseudo, role: "joueur" as const }];

        return { ...p, demandes, participants };
      })
    );

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

  function removePartie(id: string) {
    persist(parties.filter((p) => p.id !== id));
  }

  return (
    <div style={{ background: "#000", color: "#fff", minHeight: "100vh", padding: "20px", paddingBottom: 80 }}>
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
        <div style={{ display: "grid", gap: 8 }}>
          <label style={{ fontSize: 13, opacity: 0.7, color: "#fff" }}>Groupe</label>
          <select
            value={groupeId}
            onChange={(e) => setGroupeId(e.target.value)}
            style={{
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

        <div style={{ display: "grid", gap: 8 }}>
          <label style={{ fontSize: 13, opacity: 0.7, color: "#fff" }}>Date & heure</label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: 8 }}>
            <input
              type="date"
              value={datePart}
              onChange={(e) => {
                setDatePart(e.target.value);
                updateDateISO(e.target.value, heurePart, minutesPart);
              }}
              style={{
                padding: 10,
                borderRadius: 10,
                border: "1px solid #2a2a2a",
                background: "#141414",
                color: "#fff",
                fontSize: 14,
              }}
            />
            <select
              value={heurePart}
              onChange={(e) => {
                setHeurePart(e.target.value);
                updateDateISO(datePart, e.target.value, minutesPart);
              }}
              style={{
                padding: 10,
                borderRadius: 10,
                border: "1px solid #2a2a2a",
                background: "#141414",
                color: "#fff",
                fontSize: 14,
                minWidth: 70,
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
                padding: 10,
                borderRadius: 10,
                border: "1px solid #2a2a2a",
                background: "#141414",
                color: "#fff",
                fontSize: 14,
                minWidth: 70,
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

        <div style={{ display: "grid", gap: 8 }}>
          <label style={{ fontSize: 13, opacity: 0.7, color: "#fff" }}>Format</label>
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value as any)}
            style={{
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

        <div style={{ display: "grid", gap: 8 }}>
          <label style={{ fontSize: 13, opacity: 0.7, color: "#fff" }}>Places</label>
          <input
            type="number"
            min={2}
            max={4}
            value={placesTotal}
            onChange={(e) => setPlacesTotal(Number(e.target.value))}
            style={{
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
        <div style={{ display: "grid", gap: 8 }}>
          <label style={{ fontSize: 13, opacity: 0.7, color: "#fff" }}>Terrain</label>
          
          {/* Onglets */}
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <button
              type="button"
              onClick={() => setTerrainTab("select")}
              style={{
                flex: 1,
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
                        <div style={{ fontSize: 13, opacity: 0.7, color: "#10b981", marginTop: 4 }}>
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

                  {p.visibilite !== "profil" && (
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
                      const peutRejoindre =
                        p.visibilite === "communaute" || (p.visibilite === "profil" && p.cibleProfilPseudo === monPseudo);

                      if (!peutRejoindre) {
                        if (p.visibilite === "profil") {
                          alert(`Cette partie est proposée uniquement à ${p.cibleProfilPseudo}.`);
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
