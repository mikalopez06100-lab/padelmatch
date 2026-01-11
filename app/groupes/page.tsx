"use client";

import { useEffect, useState } from "react";

type Joueur = {
  id: string;
  pseudo: string;
  zone: string;
  niveau: "Débutant" | "Intermédiaire" | "Confirmé" | "Compétitif";
  friendlyScore: number;
};

const JOUEURS_FIXES: Joueur[] = [
  { id: "j1", pseudo: "Max", zone: "Nice", niveau: "Intermédiaire", friendlyScore: 82 },
  { id: "j2", pseudo: "Sarah", zone: "Antibes", niveau: "Confirmé", friendlyScore: 90 },
  { id: "j3", pseudo: "Nico", zone: "Nice", niveau: "Débutant", friendlyScore: 75 },
  { id: "j4", pseudo: "Leïla", zone: "Cagnes-sur-Mer", niveau: "Intermédiaire", friendlyScore: 88 },
  { id: "j5", pseudo: "Tom", zone: "Monaco", niveau: "Compétitif", friendlyScore: 79 },
  { id: "j6", pseudo: "Inès", zone: "Nice", niveau: "Confirmé", friendlyScore: 92 },
];

type Groupe = {
  id: string;
  nom: string;
  zone: string;
  membres: string[]; // Pseudos des membres
  createdAt: number;
};

const STORAGE_KEY = "padelmatch_groupes_v1";

function loadGroupes(): Groupe[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Migration : ajouter membres si absent
    return parsed.map((g: any) => ({
      ...g,
      membres: Array.isArray(g.membres) ? g.membres : [],
    }));
  } catch {
    return [];
  }
}

function saveGroupes(groupes: Groupe[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(groupes));
}

export default function GroupesPage() {
  const [groupes, setGroupes] = useState<Groupe[]>([]);
  const [nom, setNom] = useState("");
  const [zone, setZone] = useState("Nice");
  const [membresSelectionnes, setMembresSelectionnes] = useState<string[]>([]);
  const [editingGroupeId, setEditingGroupeId] = useState<string | null>(null);

  useEffect(() => {
    setGroupes(loadGroupes());
  }, []);

  function createGroupe() {
    const cleanName = nom.trim();
    if (cleanName.length < 2) return;

    const newGroupe: Groupe = {
      id: crypto.randomUUID(),
      nom: cleanName,
      zone,
      membres: membresSelectionnes,
      createdAt: Date.now(),
    };

    const next = [newGroupe, ...groupes];
    setGroupes(next);
    saveGroupes(next);

    setNom("");
    setZone("Nice");
    setMembresSelectionnes([]);
  }

  function updateGroupeMembres(id: string, nouveauxMembres: string[]) {
    const next = groupes.map((g) => (g.id === id ? { ...g, membres: nouveauxMembres } : g));
    setGroupes(next);
    saveGroupes(next);
    setEditingGroupeId(null);
  }

  function removeGroupe(id: string) {
    const next = groupes.filter((g) => g.id !== id);
    setGroupes(next);
    saveGroupes(next);
  }

  function toggleMembre(pseudo: string) {
    if (membresSelectionnes.includes(pseudo)) {
      setMembresSelectionnes(membresSelectionnes.filter((m) => m !== pseudo));
    } else {
      setMembresSelectionnes([...membresSelectionnes, pseudo]);
    }
  }

  function toggleMembreEdit(groupeId: string, pseudo: string, membresActuels: string[]) {
    const nouveauxMembres = membresActuels.includes(pseudo)
      ? membresActuels.filter((m) => m !== pseudo)
      : [...membresActuels, pseudo];
    updateGroupeMembres(groupeId, nouveauxMembres);
  }

  const joueursDisponibles = JOUEURS_FIXES.filter(
    (j) => !membresSelectionnes.includes(j.pseudo) || editingGroupeId !== null
  );

  return (
    <div style={{ background: "#000", color: "#fff", minHeight: "100vh", padding: "20px", paddingBottom: 80 }}>
      <h1 style={{ fontSize: 22, marginBottom: 8, color: "#fff" }}>👥 Mes groupes</h1>
      <p style={{ opacity: 0.7, marginTop: 0, color: "#fff", fontSize: 14 }}>
        Crée un groupe et sélectionne les profils à intégrer.
      </p>

      <div
        style={{
          marginTop: 20,
          padding: 16,
          border: "1px solid #2a2a2a",
          borderRadius: 12,
          display: "grid",
          gap: 12,
          background: "#1f1f1f",
          maxWidth: "100%",
        }}
      >
        <input
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          placeholder="Nom du groupe"
          style={{
            padding: 12,
            borderRadius: 10,
            border: "1px solid #2a2a2a",
            background: "#141414",
            color: "#fff",
            fontSize: 14,
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              createGroupe();
            }
          }}
        />

        <select
          value={zone}
          onChange={(e) => setZone(e.target.value)}
          style={{
            padding: 12,
            borderRadius: 10,
            border: "1px solid #2a2a2a",
            background: "#141414",
            color: "#fff",
            fontSize: 14,
          }}
        >
          <option style={{ background: "#141414", color: "#fff" }}>Nice</option>
          <option style={{ background: "#141414", color: "#fff" }}>Antibes</option>
          <option style={{ background: "#141414", color: "#fff" }}>Cagnes-sur-Mer</option>
          <option style={{ background: "#141414", color: "#fff" }}>Cannes</option>
          <option style={{ background: "#141414", color: "#fff" }}>Monaco</option>
          <option style={{ background: "#141414", color: "#fff" }}>Menton</option>
          <option style={{ background: "#141414", color: "#fff" }}>Autre</option>
        </select>

        <div style={{ display: "grid", gap: 8 }}>
          <label style={{ fontSize: 13, opacity: 0.7, color: "#fff" }}>Membres du groupe</label>
          <div
            style={{
              border: "1px solid #2a2a2a",
              borderRadius: 10,
              padding: 12,
              background: "#141414",
              maxHeight: 200,
              overflowY: "auto",
              display: "grid",
              gap: 8,
            }}
          >
            {JOUEURS_FIXES.map((j) => (
              <label
                key={j.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  cursor: "pointer",
                  padding: 8,
                  borderRadius: 8,
                  background: membresSelectionnes.includes(j.pseudo) ? "#1f1f1f" : "transparent",
                }}
              >
                <input
                  type="checkbox"
                  checked={membresSelectionnes.includes(j.pseudo)}
                  onChange={() => toggleMembre(j.pseudo)}
                  style={{
                    width: 18,
                    height: 18,
                    cursor: "pointer",
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, color: "#fff", fontSize: 14 }}>{j.pseudo}</div>
                  <div style={{ fontSize: 12, opacity: 0.7, color: "#fff" }}>
                    {j.zone} • {j.niveau}
                  </div>
                </div>
              </label>
            ))}
          </div>
          {membresSelectionnes.length > 0 && (
            <div style={{ fontSize: 12, opacity: 0.7, color: "#fff" }}>
              {membresSelectionnes.length} membre{membresSelectionnes.length > 1 ? "s" : ""} sélectionné
              {membresSelectionnes.length > 1 ? "s" : ""}
            </div>
          )}
        </div>

        <button
          onClick={createGroupe}
          style={{
            padding: "12px 16px",
            borderRadius: 10,
            border: "none",
            background: nom.trim().length >= 2 ? "#10b981" : "#2a2a2a",
            color: "#fff",
            fontWeight: 600,
            fontSize: 14,
            cursor: nom.trim().length >= 2 ? "pointer" : "not-allowed",
            opacity: nom.trim().length >= 2 ? 1 : 0.5,
          }}
          disabled={nom.trim().length < 2}
        >
          + Créer le groupe
        </button>
      </div>

      <div style={{ marginTop: 20, display: "grid", gap: 12, maxWidth: "100%" }}>
        {groupes.length === 0 ? (
          <div style={{ opacity: 0.7, marginTop: 10, color: "#fff", textAlign: "center", padding: 20 }}>
            Aucun groupe pour l'instant.
          </div>
        ) : (
          groupes.map((g) => {
            const isEditing = editingGroupeId === g.id;

            return (
              <div
                key={g.id}
                style={{
                  border: "1px solid #2a2a2a",
                  borderRadius: 12,
                  padding: 16,
                  display: "grid",
                  gap: 12,
                  background: "#1f1f1f",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 12, flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: 150 }}>
                    <div style={{ fontWeight: 600, color: "#fff", fontSize: 16, marginBottom: 4 }}>{g.nom}</div>
                    <div style={{ fontSize: 13, opacity: 0.7, color: "#fff" }}>{g.zone}</div>
                    {g.membres.length > 0 && (
                      <div style={{ fontSize: 13, opacity: 0.8, color: "#fff", marginTop: 8 }}>
                        <div style={{ marginBottom: 4 }}>👥 Membres ({g.membres.length}) :</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                          {g.membres.map((m) => (
                            <span
                              key={m}
                              style={{
                                padding: "4px 8px",
                                borderRadius: 6,
                                background: "#141414",
                                border: "1px solid #2a2a2a",
                                fontSize: 12,
                                color: "#fff",
                              }}
                            >
                              {m}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button
                      onClick={() => setEditingGroupeId(isEditing ? null : g.id)}
                      style={{
                        padding: "8px 12px",
                        borderRadius: 8,
                        border: "1px solid #2a2a2a",
                        background: isEditing ? "#10b981" : "transparent",
                        color: "#fff",
                        fontSize: 13,
                        cursor: "pointer",
                      }}
                    >
                      {isEditing ? "✕ Annuler" : "✏️ Modifier"}
                    </button>
                    <button
                      onClick={() => removeGroupe(g.id)}
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
                </div>

                {isEditing && (
                  <div
                    style={{
                      border: "1px solid #2a2a2a",
                      borderRadius: 10,
                      padding: 12,
                      background: "#141414",
                      maxHeight: 250,
                      overflowY: "auto",
                      display: "grid",
                      gap: 8,
                    }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", marginBottom: 4 }}>
                      Sélectionner les membres :
                    </div>
                    {JOUEURS_FIXES.map((j) => (
                      <label
                        key={j.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          cursor: "pointer",
                          padding: 8,
                          borderRadius: 8,
                          background: g.membres.includes(j.pseudo) ? "#1f1f1f" : "transparent",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={g.membres.includes(j.pseudo)}
                          onChange={() => toggleMembreEdit(g.id, j.pseudo, g.membres)}
                          style={{
                            width: 18,
                            height: 18,
                            cursor: "pointer",
                          }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 500, color: "#fff", fontSize: 14 }}>{j.pseudo}</div>
                          <div style={{ fontSize: 12, opacity: 0.7, color: "#fff" }}>
                            {j.zone} • {j.niveau}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
