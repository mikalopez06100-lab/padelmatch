"use client";

import { useEffect, useState } from "react";
import { getAllProfils } from "@/lib/firebase/firestore";
import type { Profil } from "@/lib/types";
import type { Groupe } from "@/lib/types";
import { getGroupes, createGroupe as createGroupeFirestore, updateGroupe as updateGroupeFirestore, deleteGroupe as deleteGroupeFirestore } from "@/lib/firebase/firestore";

export default function GroupesPage() {
  const [groupes, setGroupes] = useState<Groupe[]>([]);
  const [loading, setLoading] = useState(true);
  const [nom, setNom] = useState("");
  const [zone, setZone] = useState("Nice");
  const [membresSelectionnes, setMembresSelectionnes] = useState<string[]>([]);
  const [editingGroupeId, setEditingGroupeId] = useState<string | null>(null);
  const [profils, setProfils] = useState<Profil[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [groupesData, profilsData] = await Promise.all([
          getGroupes(),
          getAllProfils(),
        ]);
        setGroupes(groupesData);
        setProfils(profilsData);
      } catch (error) {
        console.error("Erreur lors du chargement:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  async function handleCreateGroupe() {
    const cleanName = nom.trim();
    if (cleanName.length < 2) return;

    try {
      const groupeId = await createGroupeFirestore({
        nom: cleanName,
        zone,
        membres: membresSelectionnes,
      });
      // Recharger les groupes
      const groupesData = await getGroupes();
      setGroupes(groupesData);
      setNom("");
      setZone("Nice");
      setMembresSelectionnes([]);
    } catch (error) {
      console.error("Erreur lors de la création du groupe:", error);
      alert("Erreur lors de la création du groupe");
    }
  }

  async function handleUpdateGroupeMembres(id: string, nouveauxMembres: string[]) {
    try {
      await updateGroupeFirestore(id, { membres: nouveauxMembres });
      // Recharger les groupes
      const groupesData = await getGroupes();
      setGroupes(groupesData);
      setEditingGroupeId(null);
    } catch (error) {
      console.error("Erreur lors de la mise à jour du groupe:", error);
      alert("Erreur lors de la mise à jour du groupe");
    }
  }

  async function handleRemoveGroupe(id: string) {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce groupe ?")) return;

    try {
      await deleteGroupeFirestore(id);
      // Recharger les groupes
      const groupesData = await getGroupes();
      setGroupes(groupesData);
    } catch (error) {
      console.error("Erreur lors de la suppression du groupe:", error);
      alert("Erreur lors de la suppression du groupe");
    }
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
    handleUpdateGroupeMembres(groupeId, nouveauxMembres);
  }

  if (loading) {
    return (
      <div style={{ background: "transparent", color: "#fff", minHeight: "100vh", padding: "16px", paddingBottom: 80, boxSizing: "border-box" }}>
        <div style={{ textAlign: "center", padding: 40 }}>
          <p style={{ color: "#fff", fontSize: 16 }}>Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: "#000", color: "#fff", minHeight: "100vh", padding: "16px", paddingBottom: 80, boxSizing: "border-box" }}>
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
            width: "100%",
            boxSizing: "border-box",
            padding: 12,
            borderRadius: 10,
            border: "1px solid #2a2a2a",
            background: "#141414",
            color: "#fff",
            fontSize: 14,
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleCreateGroupe();
            }
          }}
        />

        <select
          value={zone}
          onChange={(e) => setZone(e.target.value)}
          style={{
            width: "100%",
            boxSizing: "border-box",
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
            {profils.length === 0 ? (
              <div style={{ fontSize: 13, opacity: 0.6, color: "#fff", textAlign: "center", padding: 12 }}>
                Aucun profil disponible. Créez des profils via l'inscription pour les voir ici.
              </div>
            ) : (
              profils.map((p) => (
                <label
                  key={p.pseudo}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    cursor: "pointer",
                    padding: 8,
                    borderRadius: 8,
                    background: membresSelectionnes.includes(p.pseudo) ? "#1f1f1f" : "transparent",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={membresSelectionnes.includes(p.pseudo)}
                    onChange={() => toggleMembre(p.pseudo)}
                    style={{
                      width: 18,
                      height: 18,
                      cursor: "pointer",
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, color: "#fff", fontSize: 14 }}>{p.pseudo}</div>
                    <div style={{ fontSize: 12, opacity: 0.7, color: "#fff" }}>
                      {p.niveau}
                    </div>
                  </div>
                </label>
              ))
            )}
          </div>
          {membresSelectionnes.length > 0 && (
            <div style={{ fontSize: 12, opacity: 0.7, color: "#fff" }}>
              {membresSelectionnes.length} membre{membresSelectionnes.length > 1 ? "s" : ""} sélectionné
              {membresSelectionnes.length > 1 ? "s" : ""}
            </div>
          )}
        </div>

        <button
          onClick={handleCreateGroupe}
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
                    {g.membres && g.membres.length > 0 && (
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
                      onClick={() => handleRemoveGroupe(g.id)}
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
                    {profils.length === 0 ? (
                      <div style={{ fontSize: 13, opacity: 0.6, color: "#fff", textAlign: "center", padding: 12 }}>
                        Aucun profil disponible.
                      </div>
                    ) : (
                      profils.map((p) => (
                        <label
                          key={p.pseudo}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            cursor: "pointer",
                            padding: 8,
                            borderRadius: 8,
                            background: (g.membres || []).includes(p.pseudo) ? "#1f1f1f" : "transparent",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={(g.membres || []).includes(p.pseudo)}
                            onChange={() => toggleMembreEdit(g.id, p.pseudo, g.membres || [])}
                            style={{
                              width: 18,
                              height: 18,
                              cursor: "pointer",
                            }}
                          />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 500, color: "#fff", fontSize: 14 }}>{p.pseudo}</div>
                             <div style={{ fontSize: 12, opacity: 0.7, color: "#fff" }}>
                               {p.niveau}
                             </div>
                          </div>
                        </label>
                      ))
                    )}
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
