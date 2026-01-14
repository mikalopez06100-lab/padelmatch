"use client";

import { useEffect, useState, useRef } from "react";
import type { Profil as ProfilType, Niveau } from "@/lib/types";
import { updateProfil } from "@/lib/data/auth";

const PROFIL_KEY = "padelmatch_profil_v1";
const BLOCKS_KEY = "padelmatch_blocks_v1";

const NIVEAUX: Niveau[] = ["Débutant", "Intermédiaire", "Confirmé", "Compétitif"];

function loadProfil(): ProfilType | null {
  try {
    const raw = localStorage.getItem(PROFIL_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.pseudo) return null;
    return parsed as ProfilType;
  } catch {
    return null;
  }
}

function saveProfil(p: ProfilType) {
  localStorage.setItem(PROFIL_KEY, JSON.stringify(p));
  // Mettre à jour dans la liste globale des profils (avec gestion du passwordHash)
  updateProfil(p);
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

function removeBlock(pseudo: string) {
  const blocks = loadBlocks();
  const updated = blocks.filter((p) => p !== pseudo);
  localStorage.setItem(BLOCKS_KEY, JSON.stringify(updated));
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

export default function ProfilPage() {
  const [pseudo, setPseudo] = useState("");
  const [niveau, setNiveau] = useState<Niveau>("Débutant");
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(undefined);
  const [saved, setSaved] = useState<ProfilType | null>(null);
  const [blocks, setBlocks] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const existing = loadProfil();
    if (existing) {
      setPseudo(existing.pseudo);
      setNiveau(existing.niveau);
      setPhotoUrl(existing.photoUrl);
      setSaved(existing);
    }
    setBlocks(loadBlocks());
  }, []);

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

  function onSave() {
    const clean = pseudo.trim();
    if (clean.length < 2) {
      alert("Pseudo trop court (min 2 caractères).");
      return;
    }

    if (!saved?.email) {
      alert("Erreur : Email manquant. Veuillez vous reconnecter.");
      return;
    }

    const profil: ProfilType = {
      pseudo: clean,
      email: saved.email,
      niveau,
      friendlyScore: saved?.friendlyScore ?? 50,
      xp: saved?.xp ?? 0,
      photoUrl,
    };

    saveProfil(profil);
    setSaved(profil);
    alert("Profil enregistré ✅");
  }

  function onReset() {
    localStorage.removeItem(PROFIL_KEY);
    setPseudo("");
    setNiveau("Débutant");
    setPhotoUrl(undefined);
    setSaved(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    alert("Profil supprimé ✅");
  }

  function removePhoto() {
    setPhotoUrl(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  return (
    <div style={{ background: "#000", color: "#fff", minHeight: "100vh", padding: "16px", paddingBottom: 80, maxWidth: "100%", boxSizing: "border-box" }}>
      <h1 style={{ fontSize: 22, marginBottom: 8, color: "#fff" }}>🙂 Mon profil</h1>
      <p style={{ opacity: 0.7, marginTop: 0, color: "#fff", fontSize: 14 }}>
        Gère ton profil, ajoute ta photo et paramètre tes préférences.
      </p>

      <div
        style={{
          marginTop: 20,
          border: "1px solid #2a2a2a",
          borderRadius: 12,
          padding: 16,
          display: "grid",
          gap: 12,
          background: "#1f1f1f",
        }}
      >
        {/* Photo de profil */}
        <div style={{ display: "grid", gap: 8 }}>
          <label style={{ fontSize: 13, opacity: 0.7, color: "#fff" }}>Photo de profil</label>
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
          <label style={{ fontSize: 13, opacity: 0.7, color: "#fff" }}>Pseudo</label>
          <input
            value={pseudo}
            onChange={(e) => setPseudo(e.target.value)}
            placeholder="Ex : Mickaël"
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
          />
        </div>

        <div style={{ display: "grid", gap: 8 }}>
          <label style={{ fontSize: 13, opacity: 0.7, color: "#fff" }}>Niveau</label>
          <select
            value={niveau}
            onChange={(e) => setNiveau(e.target.value as Niveau)}
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
            {NIVEAUX.map((n) => (
              <option key={n} value={n} style={{ background: "#141414", color: "#fff" }}>
                {n}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={onSave}
          style={{
            padding: "12px 16px",
            borderRadius: 10,
            border: "none",
            background: "#10b981",
            color: "#fff",
            fontWeight: 600,
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          Enregistrer
        </button>

        <button
          onClick={onReset}
          style={{
            padding: "12px 16px",
            borderRadius: 10,
            border: "1px solid #2a2a2a",
            background: "transparent",
            color: "#ef4444",
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          Supprimer le profil (test)
        </button>
      </div>

      {saved && (
        <div
          style={{
            marginTop: 20,
            border: "1px solid #2a2a2a",
            borderRadius: 12,
            padding: 16,
            background: "#1f1f1f",
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 12, color: "#fff", fontSize: 16 }}>Aperçu</div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: "50%",
                overflow: "hidden",
                flexShrink: 0,
                background: saved.photoUrl ? "transparent" : getAvatarColor(saved.pseudo),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {saved.photoUrl ? (
                <img src={saved.photoUrl} alt="Photo de profil" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <div style={{ color: "#fff", fontWeight: 600, fontSize: 20 }}>{getInitials(saved.pseudo)}</div>
              )}
            </div>
            <div style={{ opacity: 0.9, color: "#fff", display: "grid", gap: 4, fontSize: 14 }}>
              <div style={{ fontWeight: 600 }}>👤 {saved.pseudo}</div>
              <div>🎚️ {saved.niveau}</div>
            </div>
          </div>
          <div style={{ opacity: 0.9, color: "#fff", display: "grid", gap: 8, fontSize: 14 }}>
            <div>🤝 Friendly score : {saved.friendlyScore}</div>
            <div>⭐ Points : {saved.xp}</div>
          </div>
        </div>
      )}

      {/* Gestion des blocs */}
      <div
        style={{
          marginTop: 20,
          border: "1px solid #2a2a2a",
          borderRadius: 12,
          padding: 16,
          background: "#1f1f1f",
        }}
      >
        <h2 style={{ fontSize: 18, marginBottom: 12, color: "#fff" }}>🚫 Joueurs bloqués</h2>
        <p style={{ fontSize: 13, opacity: 0.7, marginBottom: 12, color: "#fff" }}>
          Les joueurs bloqués ne seront plus proposés dans les candidats. Aucun message de refus n'est envoyé.
        </p>

        {blocks.length === 0 ? (
          <div style={{ fontSize: 14, opacity: 0.6, padding: 12, textAlign: "center", color: "#fff" }}>
            Aucun joueur bloqué pour l'instant.
          </div>
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            {blocks.map((blockedPseudo) => (
              <div
                key={blockedPseudo}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: 12,
                  borderRadius: 10,
                  border: "1px solid #2a2a2a",
                  background: "#141414",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                <div style={{ fontWeight: 600, color: "#fff", fontSize: 14 }}>{blockedPseudo}</div>
                <button
                  onClick={() => {
                    removeBlock(blockedPseudo);
                    setBlocks(loadBlocks());
                  }}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 8,
                    border: "1px solid #2a2a2a",
                    background: "transparent",
                    color: "#10b981",
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  Débloquer
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
