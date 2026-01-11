"use client";

import { useEffect, useState, useMemo } from "react";
import { loadProfilsGlobaux } from "@/lib/data/profils-globaux";
import type { ProfilGlobal } from "@/lib/data/profils-globaux";
import type { Niveau } from "@/lib/types";

function getInitials(pseudo: string): string {
  return pseudo
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getAvatarColor(pseudo: string): string {
  const colors = [
    "#10b981",
    "#3b82f6",
    "#8b5cf6",
    "#f59e0b",
    "#ef4444",
    "#ec4899",
    "#06b6d4",
    "#84cc16",
  ];

  let hash = 0;
  for (let i = 0; i < pseudo.length; i++) {
    hash = pseudo.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
}

const NIVEAUX: Niveau[] = ["Débutant", "Intermédiaire", "Confirmé", "Compétitif"];

export default function JoueursPage() {
  const [profilsGlobaux, setProfilsGlobaux] = useState<ProfilGlobal[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterNiveau, setFilterNiveau] = useState<Niveau | "">("");

  useEffect(() => {
    setProfilsGlobaux(loadProfilsGlobaux());
  }, []);

  // Recharger les profils globaux périodiquement pour avoir les dernières mises à jour
  useEffect(() => {
    const interval = setInterval(() => {
      setProfilsGlobaux(loadProfilsGlobaux());
    }, 2000); // Recharger toutes les 2 secondes
    return () => clearInterval(interval);
  }, []);

  const profilsFiltres = useMemo(() => {
    return profilsGlobaux.filter((p) => {
      // Filtre par recherche (pseudo)
      if (searchTerm && !p.pseudo.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }

      // Filtre par niveau
      if (filterNiveau && p.niveau !== filterNiveau) {
        return false;
      }

      return true;
    });
  }, [profilsGlobaux, searchTerm, filterNiveau]);

  return (
    <div style={{ background: "#000", color: "#fff", minHeight: "100vh", padding: "20px", paddingBottom: 80 }}>
      <h1 style={{ fontSize: 22, marginBottom: 8, color: "#fff" }}>👥 Tous les joueurs</h1>
      <p style={{ opacity: 0.7, marginTop: 0, color: "#fff", fontSize: 14, marginBottom: 20 }}>
        Découvre tous les joueurs enregistrés sur PadelMatch.
      </p>

      {/* Filtres */}
      <div
        style={{
          marginBottom: 20,
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
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="🔍 Rechercher un joueur..."
          style={{
            padding: 12,
            borderRadius: 10,
            border: "1px solid #2a2a2a",
            background: "#141414",
            color: "#fff",
            fontSize: 14,
            outline: "none",
          }}
        />

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <select
            value={filterNiveau}
            onChange={(e) => setFilterNiveau(e.target.value as Niveau | "")}
            style={{
              flex: 1,
              minWidth: 150,
              padding: 12,
              borderRadius: 10,
              border: "1px solid #2a2a2a",
              background: "#141414",
              color: "#fff",
              fontSize: 14,
            }}
          >
            <option value="" style={{ background: "#141414", color: "#fff" }}>
              Tous les niveaux
            </option>
            {NIVEAUX.map((n) => (
              <option key={n} value={n} style={{ background: "#141414", color: "#fff" }}>
                {n}
              </option>
            ))}
          </select>
        </div>

        {(searchTerm || filterNiveau) && (
          <div style={{ fontSize: 13, opacity: 0.7, color: "#fff" }}>
            {profilsFiltres.length} joueur{profilsFiltres.length > 1 ? "s" : ""} trouvé
            {profilsFiltres.length > 1 ? "s" : ""}
          </div>
        )}
      </div>

      {/* Liste des joueurs */}
      <div style={{ display: "grid", gap: 12, maxWidth: "100%" }}>
        {profilsFiltres.length === 0 ? (
          <div
            style={{
              opacity: 0.7,
              marginTop: 20,
              color: "#fff",
              textAlign: "center",
              padding: 40,
              border: "1px solid #2a2a2a",
              borderRadius: 12,
              background: "#1f1f1f",
            }}
          >
            {profilsGlobaux.length === 0
              ? "Aucun joueur enregistré pour l'instant."
              : "Aucun joueur ne correspond à vos critères de recherche."}
          </div>
        ) : (
          profilsFiltres.map((p) => (
            <div
              key={p.pseudo}
              style={{
                border: "1px solid #2a2a2a",
                borderRadius: 12,
                padding: 16,
                display: "flex",
                gap: 16,
                alignItems: "center",
                background: "#1f1f1f",
                flexWrap: "wrap",
              }}
            >
              {/* Avatar */}
              <div
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 20,
                  fontWeight: 600,
                  color: "#fff",
                  background: p.photoUrl
                    ? `url(${p.photoUrl}) center/cover`
                    : getAvatarColor(p.pseudo),
                  flexShrink: 0,
                }}
              >
                {!p.photoUrl && getInitials(p.pseudo)}
              </div>

              {/* Infos */}
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontWeight: 600, color: "#fff", fontSize: 16, marginBottom: 4 }}>{p.pseudo}</div>
                <div style={{ fontSize: 13, opacity: 0.8, color: "#fff", marginBottom: 4 }}>
                  🎾 {p.niveau}
                </div>
                <div style={{ fontSize: 12, opacity: 0.7, color: "#fff", display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <span>⭐ Friendly {p.friendlyScore}/100</span>
                  {p.xp > 0 && <span>✨ {p.xp} XP</span>}
                </div>
              </div>

              {/* Badge niveau */}
              <div
                style={{
                  padding: "6px 12px",
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 600,
                  background:
                    p.niveau === "Compétitif"
                      ? "#ef4444"
                      : p.niveau === "Confirmé"
                        ? "#f59e0b"
                        : p.niveau === "Intermédiaire"
                          ? "#3b82f6"
                          : "#10b981",
                  color: "#fff",
                  flexShrink: 0,
                }}
              >
                {p.niveau}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
