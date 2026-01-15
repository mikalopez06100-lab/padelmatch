"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { getAllProfils } from "@/lib/firebase/firestore";
import type { Profil } from "@/lib/types";
import type { Niveau } from "@/lib/types";
import { getAllNiveaux, getCategorieNiveau, formatNiveau } from "@/lib/utils/niveau";

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

const NIVEAUX = getAllNiveaux();

export default function JoueursPage() {
  const [profils, setProfils] = useState<Profil[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterNiveau, setFilterNiveau] = useState<Niveau | null>(null);

  useEffect(() => {
    async function loadProfils() {
      try {
        setLoading(true);
        const profilsFirestore = await getAllProfils();
        setProfils(profilsFirestore);
      } catch (error) {
        console.error("Erreur lors du chargement des profils:", error);
      } finally {
        setLoading(false);
      }
    }
    loadProfils();
  }, []);

  // Recharger les profils périodiquement pour avoir les dernières mises à jour
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const profilsFirestore = await getAllProfils();
        setProfils(profilsFirestore);
      } catch (error) {
        console.error("Erreur lors du rechargement des profils:", error);
      }
    }, 5000); // Recharger toutes les 5 secondes
    return () => clearInterval(interval);
  }, []);

  const profilsFiltres = useMemo(() => {
    return profils.filter((p) => {
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
  }, [profils, searchTerm, filterNiveau]);

  return (
    <div style={{ background: "transparent", color: "#fff", minHeight: "100vh", padding: "16px", paddingBottom: 80, boxSizing: "border-box" }}>
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
            value={filterNiveau === null ? "" : filterNiveau}
            onChange={(e) => setFilterNiveau(e.target.value ? parseFloat(e.target.value) : null)}
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
            {NIVEAUX.map((n) => {
              const categorie = getCategorieNiveau(n);
              return (
                <option key={n} value={n} style={{ background: "#141414", color: "#fff" }}>
                  {formatNiveau(n)} - {categorie}
                </option>
              );
            })}
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
            {loading
              ? "Chargement des joueurs..."
              : profils.length === 0
                ? "Aucun joueur enregistré pour l'instant."
                : "Aucun joueur ne correspond à vos critères de recherche."}
          </div>
        ) : (
          profilsFiltres.map((p) => {
            // Utiliser un ID unique pour la clé React (email ou combinaison pseudo+email)
            const uniqueKey = (p as any).id || `${p.pseudo}-${p.email}`;
            return (
            <div
              key={uniqueKey}
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
                <Link
                  href={`/joueurs/${encodeURIComponent(p.pseudo)}`}
                  style={{
                    fontWeight: 600,
                    color: "#10b981",
                    fontSize: 16,
                    marginBottom: 4,
                    textDecoration: "none",
                    display: "inline-block",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.textDecoration = "underline";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.textDecoration = "none";
                  }}
                >
                  {p.pseudo}
                </Link>
                <div style={{ fontSize: 13, opacity: 0.8, color: "#fff", marginBottom: 4 }}>
                  🎾 {typeof p.niveau === "number" ? `${formatNiveau(p.niveau)} - ${getCategorieNiveau(p.niveau)}` : p.niveau}
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
                background: (() => {
                  const niveauNum = typeof p.niveau === "number" ? p.niveau : (p.niveau === "Compétitif" ? 6.5 : p.niveau === "Confirmé" ? 4.5 : p.niveau === "Intermédiaire" ? 2.5 : 1.0);
                  if (niveauNum >= 6.0) return "#ef4444"; // Expert
                  if (niveauNum >= 4.0) return "#f59e0b"; // Confirmé
                  if (niveauNum >= 2.0) return "#3b82f6"; // Intermédiaire
                  return "#10b981"; // Débutant
                })(),
                  color: "#fff",
                  flexShrink: 0,
                }}
              >
                  {typeof p.niveau === "number" ? `${formatNiveau(p.niveau)} - ${getCategorieNiveau(p.niveau)}` : p.niveau}
              </div>
            </div>
            );
          })
        )}
      </div>
    </div>
  );
}
