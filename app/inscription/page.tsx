"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import type { Profil, Zone, Niveau } from "@/lib/types";

const PROFIL_KEY = "padelmatch_profil_v1";

const ZONES: Zone[] = ["Nice", "Antibes", "Cagnes-sur-Mer", "Cannes", "Monaco", "Menton", "Autre"];
const NIVEAUX: Niveau[] = ["Débutant", "Intermédiaire", "Confirmé", "Compétitif"];

function loadProfil(): Profil | null {
  try {
    const raw = localStorage.getItem(PROFIL_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.pseudo) return null;
    return parsed as Profil;
  } catch {
    return null;
  }
}

function saveProfil(p: Profil) {
  localStorage.setItem(PROFIL_KEY, JSON.stringify(p));
}

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

export default function InscriptionPage() {
  const router = useRouter();
  const [pseudo, setPseudo] = useState("");
  const [zone, setZone] = useState<Zone>("Nice");
  const [niveau, setNiveau] = useState<Niveau>("Débutant");
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Si un profil existe déjà, rediriger vers le profil
    const existing = loadProfil();
    if (existing) {
      router.push("/profil");
    }
  }, [router]);

  function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Veuillez sélectionner une image.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("L'image est trop volumineuse (max 5 MB).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === "string") {
        setPhotoUrl(result);
      }
    };
    reader.readAsDataURL(file);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const clean = pseudo.trim();
    if (clean.length < 2) {
      alert("Pseudo trop court (min 2 caractères).");
      return;
    }

    // Vérifier qu'un profil n'existe pas déjà
    const existing = loadProfil();
    if (existing) {
      alert("Un profil existe déjà. Vous serez redirigé vers votre profil.");
      router.push("/profil");
      return;
    }

    const profil: Profil = {
      pseudo: clean,
      zone,
      niveau,
      friendlyScore: 50,
      xp: 0,
      photoUrl,
    };

    saveProfil(profil);
    alert("Inscription réussie ✅\nBienvenue sur PadelMatch !");
    router.push("/parties");
  }

  function removePhoto() {
    setPhotoUrl(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  return (
    <div style={{ background: "#000", color: "#fff", minHeight: "100vh", padding: "20px", paddingBottom: 80, maxWidth: "100%" }}>
      <div style={{ maxWidth: 500, margin: "0 auto", paddingTop: 20 }}>
        <h1 style={{ fontSize: 28, marginBottom: 8, color: "#fff", fontWeight: 700 }}>Inscription</h1>
        <p style={{ opacity: 0.7, marginTop: 0, color: "#fff", fontSize: 14, marginBottom: 32 }}>
          Crée ton profil pour commencer à trouver des joueurs et compléter tes parties.
        </p>

        <form onSubmit={handleSubmit}>
          <div
            style={{
              border: "1px solid #2a2a2a",
              borderRadius: 12,
              padding: 20,
              display: "grid",
              gap: 16,
              background: "#1f1f1f",
            }}
          >
            {/* Photo de profil */}
            <div style={{ display: "grid", gap: 8 }}>
              <label style={{ fontSize: 13, opacity: 0.7, color: "#fff" }}>Photo de profil (optionnel)</label>
              <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                <div
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: "50%",
                    overflow: "hidden",
                    flexShrink: 0,
                    background: photoUrl ? "transparent" : getAvatarColor(pseudo || "User"),
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {photoUrl ? (
                    <img src={photoUrl} alt="Photo de profil" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ color: "#fff", fontWeight: 600, fontSize: 24 }}>{getInitials(pseudo || "User")}</div>
                  )}
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <label
                    style={{
                      padding: "10px 16px",
                      borderRadius: 10,
                      border: "1px solid #2a2a2a",
                      background: "#141414",
                      color: "#fff",
                      fontSize: 14,
                      cursor: "pointer",
                      display: "inline-block",
                    }}
                  >
                    {photoUrl ? "Changer" : "Ajouter"}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      style={{ display: "none" }}
                    />
                  </label>
                  {photoUrl && (
                    <button
                      type="button"
                      onClick={removePhoto}
                      style={{
                        padding: "10px 16px",
                        borderRadius: 10,
                        border: "1px solid #2a2a2a",
                        background: "transparent",
                        color: "#ef4444",
                        fontSize: 14,
                        cursor: "pointer",
                      }}
                    >
                      Supprimer
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gap: 8 }}>
              <label style={{ fontSize: 13, opacity: 0.7, color: "#fff" }}>
                Pseudo <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input
                value={pseudo}
                onChange={(e) => setPseudo(e.target.value)}
                placeholder="Ex : Mickaël"
                required
                minLength={2}
                style={{
                  padding: 12,
                  borderRadius: 10,
                  border: "1px solid #2a2a2a",
                  background: "#141414",
                  color: "#fff",
                  fontSize: 14,
                }}
              />
            </div>

            <div style={{ display: "grid", gap: 8 }}>
              <label style={{ fontSize: 13, opacity: 0.7, color: "#fff" }}>
                Zone <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <select
                value={zone}
                onChange={(e) => setZone(e.target.value as Zone)}
                required
                style={{
                  padding: 12,
                  borderRadius: 10,
                  border: "1px solid #2a2a2a",
                  background: "#141414",
                  color: "#fff",
                  fontSize: 14,
                }}
              >
                {ZONES.map((z) => (
                  <option key={z} value={z} style={{ background: "#141414", color: "#fff" }}>
                    {z}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: "grid", gap: 8 }}>
              <label style={{ fontSize: 13, opacity: 0.7, color: "#fff" }}>
                Niveau <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <select
                value={niveau}
                onChange={(e) => setNiveau(e.target.value as Niveau)}
                required
                style={{
                  padding: 12,
                  borderRadius: 10,
                  border: "1px solid #2a2a2a",
                  background: "#141414",
                  color: "#fff",
                  fontSize: 14,
                }}
              >
                {NIVEAUX.map((n) => (
                  <option key={n} value={n} style={{ background: "#141414", color: "#fff" }}>
                    {n}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              style={{
                padding: "14px 20px",
                borderRadius: 10,
                border: "none",
                background: "#10b981",
                color: "#fff",
                fontWeight: 600,
                fontSize: 16,
                cursor: "pointer",
                marginTop: 8,
              }}
            >
              Créer mon profil
            </button>
          </div>
        </form>

        <div style={{ marginTop: 24, textAlign: "center" }}>
          <p style={{ fontSize: 13, opacity: 0.6, color: "#fff", margin: 0 }}>
            Déjà un compte ?{" "}
            <button
              onClick={() => router.push("/profil")}
              style={{
                background: "transparent",
                border: "none",
                color: "#10b981",
                textDecoration: "underline",
                cursor: "pointer",
                fontSize: 13,
              }}
            >
              Accéder au profil
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
