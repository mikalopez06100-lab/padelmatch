"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getAllProfils } from "@/lib/firebase/firestore";
import type { Profil } from "@/lib/types";
import { calculateMatchStats } from "@/lib/data/stats";
import type { MatchStats } from "@/lib/data/stats";
import { loadCurrentProfilSync } from "@/lib/data/auth";

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
    "#10b981", // green
    "#3b82f6", // blue
    "#8b5cf6", // purple
    "#f59e0b", // amber
    "#ef4444", // red
    "#ec4899", // pink
    "#06b6d4", // cyan
    "#84cc16", // lime
  ];
  const hash = pseudo.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
}

export default function JoueurProfilPage() {
  const params = useParams();
  const router = useRouter();
  const pseudo = typeof params.pseudo === "string" ? params.pseudo : "";
  const [profil, setProfil] = useState<Profil | null>(null);
  const [stats, setStats] = useState<MatchStats | null>(null);
  const [isCurrentUser, setIsCurrentUser] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!pseudo) return;

    async function loadProfil() {
      try {
        setLoading(true);
        const profils = await getAllProfils();
        const profilTrouve = profils.find((p) => p.pseudo.toLowerCase() === pseudo.toLowerCase());
        
        if (!profilTrouve) {
          alert("Profil non trouvé");
          router.push("/joueurs");
          return;
        }

        setProfil(profilTrouve);

        // Calculer les statistiques
        const statistiques = calculateMatchStats(pseudo);
        setStats(statistiques);

        // Vérifier si c'est le profil de l'utilisateur connecté
        const currentProfil = loadCurrentProfilSync();
        setIsCurrentUser(currentProfil?.pseudo.toLowerCase() === pseudo.toLowerCase());
      } catch (error) {
        console.error("Erreur lors du chargement du profil:", error);
        alert("Erreur lors du chargement du profil");
        router.push("/joueurs");
      } finally {
        setLoading(false);
      }
    }

    loadProfil();
  }, [pseudo, router]);

  if (loading || !profil || !stats) {
    return (
      <div style={{ background: "#000", color: "#fff", minHeight: "100vh", padding: "16px", paddingBottom: 80, boxSizing: "border-box" }}>
        <div style={{ textAlign: "center", padding: 40 }}>
          <p style={{ color: "#fff", fontSize: 16 }}>Chargement...</p>
        </div>
      </div>
    );
  }

  return (
      <div style={{ background: "#000", color: "#fff", minHeight: "100vh", padding: "16px", paddingBottom: 80, boxSizing: "border-box" }}>
      <button
        onClick={() => router.back()}
        style={{
          marginBottom: 20,
          padding: "8px 16px",
          borderRadius: 8,
          border: "1px solid #2a2a2a",
          background: "transparent",
          color: "#10b981",
          fontSize: 14,
          cursor: "pointer",
        }}
      >
        ← Retour
      </button>

      <div
        style={{
          border: "1px solid #2a2a2a",
          borderRadius: 16,
          padding: 24,
          background: "#1f1f1f",
          marginBottom: 20,
        }}
      >
        {/* En-tête du profil */}
        <div style={{ display: "flex", gap: 20, alignItems: "center", marginBottom: 24, flexWrap: "wrap" }}>
          <div
            style={{
              width: 100,
              height: 100,
              borderRadius: "50%",
              overflow: "hidden",
              flexShrink: 0,
              background: profil.photoUrl ? "transparent" : getAvatarColor(profil.pseudo),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {profil.photoUrl ? (
              <img
                src={profil.photoUrl}
                alt={`Photo de ${profil.pseudo}`}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <div style={{ color: "#fff", fontWeight: 600, fontSize: 36 }}>{getInitials(profil.pseudo)}</div>
            )}
          </div>

          <div style={{ flex: 1, minWidth: 200 }}>
            <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8, color: "#fff" }}>{profil.pseudo}</h1>
            <div
              style={{
                display: "inline-block",
                padding: "6px 12px",
                borderRadius: 20,
                fontSize: 13,
                fontWeight: 600,
                background:
                  profil.niveau === "Compétitif"
                    ? "#ef4444"
                    : profil.niveau === "Confirmé"
                      ? "#f59e0b"
                      : profil.niveau === "Intermédiaire"
                        ? "#3b82f6"
                        : "#10b981",
                color: "#fff",
                marginBottom: 12,
              }}
            >
              🎾 {profil.niveau}
            </div>
            <div style={{ fontSize: 14, opacity: 0.8, color: "#fff", display: "flex", gap: 16, flexWrap: "wrap" }}>
              <span>⭐ Friendly {profil.friendlyScore}/100</span>
              {profil.xp > 0 && <span>✨ {profil.xp} XP</span>}
            </div>
          </div>
        </div>

        {/* Statistiques de matchs */}
        <div
          style={{
            borderTop: "1px solid #2a2a2a",
            paddingTop: 20,
            marginTop: 20,
          }}
        >
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16, color: "#fff" }}>📊 Statistiques</h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
              gap: 12,
            }}
          >
            <div
              style={{
                padding: 16,
                borderRadius: 12,
                border: "1px solid #2a2a2a",
                background: "#141414",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 32, fontWeight: 700, color: "#10b981", marginBottom: 4 }}>
                {stats.matchsJouesCetteSemaine}
              </div>
              <div style={{ fontSize: 12, opacity: 0.7, color: "#fff" }}>Cette semaine</div>
            </div>

            <div
              style={{
                padding: 16,
                borderRadius: 12,
                border: "1px solid #2a2a2a",
                background: "#141414",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 32, fontWeight: 700, color: "#3b82f6", marginBottom: 4 }}>
                {stats.matchsJouesCeMois}
              </div>
              <div style={{ fontSize: 12, opacity: 0.7, color: "#fff" }}>Ce mois</div>
            </div>

            <div
              style={{
                padding: 16,
                borderRadius: 12,
                border: "1px solid #2a2a2a",
                background: "#141414",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 32, fontWeight: 700, color: "#8b5cf6", marginBottom: 4 }}>
                {stats.matchsJouesTotal}
              </div>
              <div style={{ fontSize: 12, opacity: 0.7, color: "#fff" }}>Total joués</div>
            </div>

            <div
              style={{
                padding: 16,
                borderRadius: 12,
                border: "1px solid #2a2a2a",
                background: "#141414",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 32, fontWeight: 700, color: "#f59e0b", marginBottom: 4 }}>
                {stats.matchsOrganises}
              </div>
              <div style={{ fontSize: 12, opacity: 0.7, color: "#fff" }}>Organisés</div>
            </div>
          </div>
        </div>
      </div>

      {isCurrentUser && (
        <div
          style={{
            border: "1px solid #2a2a2a",
            borderRadius: 12,
            padding: 16,
            background: "#1f1f1f",
            textAlign: "center",
          }}
        >
          <p style={{ fontSize: 14, opacity: 0.7, color: "#fff", marginBottom: 12 }}>
            C'est votre profil. Vous pouvez le modifier depuis la page Profil.
          </p>
          <button
            onClick={() => router.push("/profil")}
            style={{
              padding: "10px 20px",
              borderRadius: 8,
              border: "none",
              background: "#10b981",
              color: "#fff",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Modifier mon profil
          </button>
        </div>
      )}
    </div>
  );
}
