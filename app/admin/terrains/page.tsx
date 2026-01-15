"use client";

import { useEffect, useState } from "react";
import { loadTerrains, addTerrainPersonnalise, updateTerrainPersonnalise, removeTerrainPersonnalise, type Terrain } from "@/lib/data/terrains";

export default function AdminTerrainsPage() {
  const [terrains, setTerrains] = useState<Terrain[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNom, setEditNom] = useState("");
  const [editVille, setEditVille] = useState("");
  const [nouveauNom, setNouveauNom] = useState("");
  const [nouveauVille, setNouveauVille] = useState("");
  const [filterVille, setFilterVille] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    refreshTerrains();
  }, []);

  async function refreshTerrains() {
    try {
      setLoading(true);
      const terrainsData = await loadTerrains();
      setTerrains(terrainsData);
    } catch (error: any) {
      showMessage("error", error.message || "Erreur lors du chargement des terrains.");
    } finally {
      setLoading(false);
    }
  }

  function showMessage(type: "success" | "error", text: string) {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  }

  async function handleAddTerrain() {
    if (!nouveauNom.trim() || !nouveauVille.trim()) {
      showMessage("error", "Veuillez remplir le nom et la ville du terrain.");
      return;
    }

    try {
      setLoading(true);
      await addTerrainPersonnalise(nouveauNom.trim(), nouveauVille.trim());
      await refreshTerrains();
      setNouveauNom("");
      setNouveauVille("");
      showMessage("success", "Terrain ajouté avec succès ✅");
    } catch (error: any) {
      showMessage("error", error.message || "Erreur lors de l'ajout du terrain.");
    } finally {
      setLoading(false);
    }
  }

  function startEdit(terrain: Terrain) {
    if (!terrain.estPersonnalise) {
      showMessage("error", "Les terrains de base ne peuvent pas être modifiés.");
      return;
    }
    setEditingId(terrain.id);
    setEditNom(terrain.nom);
    setEditVille(terrain.ville);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditNom("");
    setEditVille("");
  }

  async function handleUpdateTerrain() {
    if (!editingId) return;
    if (!editNom.trim() || !editVille.trim()) {
      showMessage("error", "Veuillez remplir le nom et la ville du terrain.");
      return;
    }

    try {
      setLoading(true);
      await updateTerrainPersonnalise(editingId, editNom.trim(), editVille.trim());
      await refreshTerrains();
      cancelEdit();
      showMessage("success", "Terrain modifié avec succès ✅");
    } catch (error: any) {
      showMessage("error", error.message || "Erreur lors de la modification du terrain.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteTerrain(id: string, nom: string, estPersonnalise: boolean) {
    if (!estPersonnalise) {
      showMessage("error", "Les terrains de base ne peuvent pas être supprimés.");
      return;
    }

    if (!confirm(`Êtes-vous sûr de vouloir supprimer le terrain "${nom}" ?`)) {
      return;
    }

    try {
      setLoading(true);
      await removeTerrainPersonnalise(id);
      await refreshTerrains();
      showMessage("success", "Terrain supprimé avec succès ✅");
    } catch (error: any) {
      showMessage("error", error.message || "Erreur lors de la suppression du terrain.");
    } finally {
      setLoading(false);
    }
  }

  const villesUniques = Array.from(new Set(terrains.map((t) => t.ville))).sort();
  const terrainsFiltres = filterVille
    ? terrains.filter((t) => t.ville.toLowerCase().includes(filterVille.toLowerCase()))
    : terrains;

  const terrainsBase = terrainsFiltres.filter((t) => !t.estPersonnalise);
  const terrainsPersonnalises = terrainsFiltres.filter((t) => t.estPersonnalise);

  return (
    <div
      style={{
        background: "transparent", // Transparent pour voir l'image de fond
        color: "#fff",
        minHeight: "100vh",
        padding: "40px 20px",
        boxSizing: "border-box",
      }}
    >
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <h1 style={{ fontSize: 28, marginBottom: 10, color: "#10b981", textAlign: "center" }}>
          🎾 Gestion des terrains
        </h1>
        <p style={{ textAlign: "center", opacity: 0.8, marginBottom: 30, fontSize: 14 }}>
          Gérez les terrains de padel disponibles dans l'application
        </p>

        {message && (
          <div
            style={{
              background: message.type === "success" ? "#10b98120" : "#ef444420",
              border: `1px solid ${message.type === "success" ? "#10b981" : "#ef4444"}`,
              borderRadius: 12,
              padding: 15,
              marginBottom: 20,
              color: message.type === "success" ? "#10b981" : "#ef4444",
              textAlign: "center",
            }}
          >
            {message.text}
          </div>
        )}

        {/* Formulaire d'ajout */}
        <div
          style={{
            background: "#1f1f1f",
            border: "1px solid #2a2a2a",
            borderRadius: 12,
            padding: 20,
            marginBottom: 30,
          }}
        >
          <h2 style={{ fontSize: 18, marginTop: 0, marginBottom: 15 }}>➕ Ajouter un nouveau terrain</h2>
          <div style={{ display: "grid", gap: 12 }}>
            <input
              type="text"
              value={nouveauNom}
              onChange={(e) => setNouveauNom(e.target.value)}
              placeholder="Nom du terrain"
              disabled={loading}
              style={{
                padding: 12,
                borderRadius: 10,
                border: "1px solid #2a2a2a",
                background: "#141414",
                color: "#fff",
                fontSize: 14,
                outline: "none",
                opacity: loading ? 0.5 : 1,
              }}
            />
            <input
              type="text"
              value={nouveauVille}
              onChange={(e) => setNouveauVille(e.target.value)}
              placeholder="Ville"
              disabled={loading}
              style={{
                padding: 12,
                borderRadius: 10,
                border: "1px solid #2a2a2a",
                background: "#141414",
                color: "#fff",
                fontSize: 14,
                outline: "none",
                opacity: loading ? 0.5 : 1,
              }}
            />
            <button
              onClick={handleAddTerrain}
              disabled={loading}
              style={{
                padding: "12px 20px",
                borderRadius: 10,
                border: "1px solid #10b981",
                background: "#10b981",
                color: "#fff",
                fontSize: 14,
                fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.5 : 1,
              }}
            >
              {loading ? "Ajout en cours..." : "Ajouter le terrain"}
            </button>
          </div>
        </div>

        {/* Filtre par ville */}
        <div
          style={{
            background: "#1f1f1f",
            border: "1px solid #2a2a2a",
            borderRadius: 12,
            padding: 15,
            marginBottom: 20,
          }}
        >
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <label style={{ fontSize: 14, fontWeight: 500 }}>Filtrer par ville :</label>
            <select
              value={filterVille}
              onChange={(e) => setFilterVille(e.target.value)}
              style={{
                flex: 1,
                minWidth: 150,
                padding: 10,
                borderRadius: 10,
                border: "1px solid #2a2a2a",
                background: "#141414",
                color: "#fff",
                fontSize: 14,
              }}
            >
              <option value="" style={{ background: "#141414", color: "#fff" }}>
                Toutes les villes
              </option>
              {villesUniques.map((ville) => (
                <option key={ville} value={ville} style={{ background: "#141414", color: "#fff" }}>
                  {ville}
                </option>
              ))}
            </select>
            {filterVille && (
              <button
                onClick={() => setFilterVille("")}
                style={{
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: "1px solid #2a2a2a",
                  background: "transparent",
                  color: "#fff",
                  fontSize: 12,
                  cursor: "pointer",
                }}
              >
                Effacer
              </button>
            )}
          </div>
          <div style={{ fontSize: 13, opacity: 0.7, marginTop: 8 }}>
            {terrainsFiltres.length} terrain{terrainsFiltres.length > 1 ? "s" : ""} affiché
            {terrainsFiltres.length > 1 ? "s" : ""}
          </div>
        </div>

        {loading && terrains.length === 0 && (
          <div style={{ textAlign: "center", padding: 40, opacity: 0.7 }}>
            Chargement des terrains...
          </div>
        )}

        {/* Liste des terrains personnalisés */}
        {terrainsPersonnalises.length > 0 && (
          <div
            style={{
              background: "#1f1f1f",
              border: "1px solid #2a2a2a",
              borderRadius: 12,
              padding: 20,
              marginBottom: 20,
            }}
          >
            <h2 style={{ fontSize: 18, marginTop: 0, marginBottom: 15 }}>
              ✏️ Terrains personnalisés ({terrainsPersonnalises.length})
            </h2>
            <div style={{ display: "grid", gap: 12 }}>
              {terrainsPersonnalises.map((terrain) => (
                <div
                  key={terrain.id}
                  style={{
                    background: "#141414",
                    border: "1px solid #2a2a2a",
                    borderRadius: 10,
                    padding: 16,
                    display: "flex",
                    gap: 12,
                    alignItems: "center",
                    flexWrap: "wrap",
                  }}
                >
                  {editingId === terrain.id ? (
                    <>
                      <input
                        type="text"
                        value={editNom}
                        onChange={(e) => setEditNom(e.target.value)}
                        placeholder="Nom"
                        disabled={loading}
                        style={{
                          flex: 1,
                          minWidth: 150,
                          padding: 10,
                          borderRadius: 8,
                          border: "1px solid #2a2a2a",
                          background: "#141414",
                          color: "#fff",
                          fontSize: 14,
                          outline: "none",
                          opacity: loading ? 0.5 : 1,
                        }}
                      />
                      <input
                        type="text"
                        value={editVille}
                        onChange={(e) => setEditVille(e.target.value)}
                        placeholder="Ville"
                        disabled={loading}
                        style={{
                          flex: 1,
                          minWidth: 150,
                          padding: 10,
                          borderRadius: 8,
                          border: "1px solid #2a2a2a",
                          background: "#141414",
                          color: "#fff",
                          fontSize: 14,
                          outline: "none",
                          opacity: loading ? 0.5 : 1,
                        }}
                      />
                      <button
                        onClick={handleUpdateTerrain}
                        disabled={loading}
                        style={{
                          padding: "8px 16px",
                          borderRadius: 8,
                          border: "1px solid #10b981",
                          background: "#10b981",
                          color: "#fff",
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: loading ? "not-allowed" : "pointer",
                          opacity: loading ? 0.5 : 1,
                        }}
                      >
                        Valider
                      </button>
                      <button
                        onClick={cancelEdit}
                        disabled={loading}
                        style={{
                          padding: "8px 16px",
                          borderRadius: 8,
                          border: "1px solid #2a2a2a",
                          background: "transparent",
                          color: "#fff",
                          fontSize: 13,
                          cursor: loading ? "not-allowed" : "pointer",
                          opacity: loading ? 0.5 : 1,
                        }}
                      >
                        Annuler
                      </button>
                    </>
                  ) : (
                    <>
                      <div style={{ flex: 1, minWidth: 200 }}>
                        <div style={{ fontWeight: 600, marginBottom: 4 }}>{terrain.nom}</div>
                        <div style={{ fontSize: 13, opacity: 0.7 }}>📍 {terrain.ville}</div>
                      </div>
                      <button
                        onClick={() => startEdit(terrain)}
                        disabled={loading}
                        style={{
                          padding: "8px 16px",
                          borderRadius: 8,
                          border: "1px solid #3b82f6",
                          background: "#3b82f6",
                          color: "#fff",
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: loading ? "not-allowed" : "pointer",
                          opacity: loading ? 0.5 : 1,
                        }}
                      >
                        Modifier
                      </button>
                      <button
                        onClick={() => handleDeleteTerrain(terrain.id, terrain.nom, terrain.estPersonnalise)}
                        disabled={loading}
                        style={{
                          padding: "8px 16px",
                          borderRadius: 8,
                          border: "1px solid #ef4444",
                          background: "#ef4444",
                          color: "#fff",
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: loading ? "not-allowed" : "pointer",
                          opacity: loading ? 0.5 : 1,
                        }}
                      >
                        Supprimer
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Liste des terrains de base */}
        <div
          style={{
            background: "#1f1f1f",
            border: "1px solid #2a2a2a",
            borderRadius: 12,
            padding: 20,
          }}
        >
          <h2 style={{ fontSize: 18, marginTop: 0, marginBottom: 15 }}>
            📋 Terrains de base ({terrainsBase.length})
          </h2>
          <p style={{ fontSize: 13, opacity: 0.7, marginBottom: 15 }}>
            Les terrains de base sont prédéfinis et ne peuvent pas être modifiés ou supprimés.
          </p>
          <div style={{ display: "grid", gap: 12 }}>
            {terrainsBase.length === 0 ? (
              <div style={{ textAlign: "center", opacity: 0.5, padding: 20 }}>
                Aucun terrain de base (filtre actif)
              </div>
            ) : (
              terrainsBase.map((terrain) => (
                <div
                  key={terrain.id}
                  style={{
                    background: "#141414",
                    border: "1px solid #2a2a2a",
                    borderRadius: 10,
                    padding: 16,
                    display: "flex",
                    gap: 12,
                    alignItems: "center",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>{terrain.nom}</div>
                    <div style={{ fontSize: 13, opacity: 0.7 }}>📍 {terrain.ville}</div>
                  </div>
                  <div
                    style={{
                      padding: "6px 12px",
                      borderRadius: 6,
                      background: "#2a2a2a",
                      color: "#999",
                      fontSize: 12,
                    }}
                  >
                    Base
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div style={{ textAlign: "center", marginTop: 30 }}>
          <a
            href="/"
            style={{
              color: "#3b82f6",
              textDecoration: "underline",
              fontSize: 14,
            }}
          >
            ← Retour à l'accueil
          </a>
        </div>
      </div>
    </div>
  );
}
