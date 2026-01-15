"use client";

import { useEffect, useState, useRef } from "react";
import type { Profil as ProfilType, Niveau, PreferenceCommunication, MainDominante, PositionTerrain, Terrain } from "@/lib/types";
import { updateProfil, loadCurrentProfil } from "@/lib/data/auth";
import { getCurrentUser } from "@/lib/firebase/auth";
import { getProfil } from "@/lib/firebase/firestore";
import { getAllNiveaux, getCategorieNiveau, formatNiveau, convertOldNiveauToNew } from "@/lib/utils/niveau";
import { loadTerrains } from "@/lib/data/terrains";

const PROFIL_KEY = "padelmatch_profil_v1";
const BLOCKS_KEY = "padelmatch_blocks_v1";

const NIVEAUX = getAllNiveaux();

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

async function saveProfil(p: ProfilType) {
  localStorage.setItem(PROFIL_KEY, JSON.stringify(p));
  // Mettre à jour dans Firestore et la liste globale des profils (avec gestion du passwordHash)
  try {
    await updateProfil(p);
    console.log("✅ Profil sauvegardé dans Firestore");
  } catch (error) {
    console.error("❌ Erreur lors de la sauvegarde dans Firestore:", error);
    // On continue quand même car localStorage est déjà sauvegardé
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
  const [niveau, setNiveau] = useState<Niveau>(2.5);
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(undefined);
  const [telephone, setTelephone] = useState("");
  const [preferenceCommunication, setPreferenceCommunication] = useState<PreferenceCommunication>("notification");
  const [mainDominante, setMainDominante] = useState<MainDominante | "">("");
  const [positionTerrain, setPositionTerrain] = useState<PositionTerrain | "">("");
  const [terrainFavoriId, setTerrainFavoriId] = useState<string>("");
  const [terrains, setTerrains] = useState<Terrain[]>([]);
  const [saved, setSaved] = useState<ProfilType | null>(null);
  const [blocks, setBlocks] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadProfile() {
      // Charger les terrains
      try {
        const terrainsList = await loadTerrains();
        setTerrains(terrainsList);
      } catch (error) {
        console.error("Erreur lors du chargement des terrains:", error);
      }

      // Charger depuis Firestore si l'utilisateur est connecté
      try {
        const user = getCurrentUser();
        if (user) {
          const profilFirestore = await getProfil(user.uid);
          if (profilFirestore) {
            setPseudo(profilFirestore.pseudo);
            const existingNiveau = typeof profilFirestore.niveau === "string" 
              ? convertOldNiveauToNew(profilFirestore.niveau as any)
              : profilFirestore.niveau || 2.5;
            setNiveau(existingNiveau);
            setPhotoUrl(profilFirestore.photoUrl);
            setTelephone(profilFirestore.telephone || "");
            setPreferenceCommunication(profilFirestore.preferenceCommunication || "notification");
            setMainDominante(profilFirestore.mainDominante || "");
            setPositionTerrain(profilFirestore.positionTerrain || "");
            setTerrainFavoriId(profilFirestore.terrainFavoriId || "");
            setSaved(profilFirestore);
            return;
          }
        }
      } catch (error) {
        console.warn("⚠️ Impossible de charger depuis Firestore, utilisation du localStorage:", error);
      }

      // Fallback : charger depuis localStorage
      const existing = loadProfil();
      if (existing) {
        setPseudo(existing.pseudo);
        const existingNiveau = typeof existing.niveau === "string" 
          ? convertOldNiveauToNew(existing.niveau as any)
          : existing.niveau || 2.5;
        setNiveau(existingNiveau);
        setPhotoUrl(existing.photoUrl);
        setTelephone(existing.telephone || "");
        setPreferenceCommunication(existing.preferenceCommunication || "notification");
        setMainDominante(existing.mainDominante || "");
        setPositionTerrain(existing.positionTerrain || "");
        setTerrainFavoriId(existing.terrainFavoriId || "");
        setSaved(existing);
      }
      setBlocks(loadBlocks());
    }
    loadProfile();
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

  async function onSave() {
    const clean = pseudo.trim();
    if (clean.length < 2) {
      alert("Pseudo trop court (min 2 caractères).");
      return;
    }

    if (!saved?.email) {
      alert("Erreur : Email manquant. Veuillez vous reconnecter.");
      return;
    }

    const cleanTelephone = telephone.trim();

    const profil: ProfilType = {
      pseudo: clean,
      email: saved.email,
      niveau,
      friendlyScore: saved?.friendlyScore ?? 50,
      xp: saved?.xp ?? 0,
      photoUrl,
      telephone: cleanTelephone || undefined,
      preferenceCommunication,
      mainDominante: mainDominante || undefined,
      positionTerrain: positionTerrain || undefined,
      terrainFavoriId: terrainFavoriId || undefined,
    };

    try {
      await saveProfil(profil);
      setSaved(profil);
      
      // Recharger depuis Firestore pour s'assurer que tout est synchronisé
      try {
        const user = getCurrentUser();
        if (user) {
          const updatedProfil = await getProfil(user.uid);
          if (updatedProfil) {
            setSaved(updatedProfil);
            // Mettre à jour les champs si nécessaire
            const existingNiveau = typeof updatedProfil.niveau === "string" 
              ? convertOldNiveauToNew(updatedProfil.niveau as any)
              : updatedProfil.niveau || 2.5;
            setNiveau(existingNiveau);
            setTelephone(updatedProfil.telephone || "");
            setPreferenceCommunication(updatedProfil.preferenceCommunication || "notification");
            setMainDominante(updatedProfil.mainDominante || "");
            setPositionTerrain(updatedProfil.positionTerrain || "");
            setTerrainFavoriId(updatedProfil.terrainFavoriId || "");
            console.log("✅ Profil mis à jour depuis Firestore:", updatedProfil);
          }
        }
      } catch (reloadError) {
        console.warn("⚠️ Impossible de recharger depuis Firestore:", reloadError);
      }
      
      alert("Profil enregistré ✅");
    } catch (error) {
      console.error("Erreur lors de l'enregistrement:", error);
      alert("Erreur lors de l'enregistrement. Vérifiez la console pour plus de détails.");
    }
  }

  function onReset() {
    localStorage.removeItem(PROFIL_KEY);
    setPseudo("");
    setNiveau(2.5);
    setPhotoUrl(undefined);
    setTelephone("");
    setPreferenceCommunication("notification");
    setMainDominante("");
    setPositionTerrain("");
    setTerrainFavoriId("");
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
    <div style={{ background: "transparent", color: "#fff", minHeight: "100vh", padding: "16px", paddingBottom: 80, maxWidth: "100%", boxSizing: "border-box" }}>
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
            onChange={(e) => setNiveau(parseFloat(e.target.value))}
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
            {NIVEAUX.map((n) => {
              const categorie = getCategorieNiveau(n);
              return (
                <option key={n} value={n} style={{ background: "#141414", color: "#fff" }}>
                  {formatNiveau(n)} - {categorie}
                </option>
              );
            })}
          </select>
          <p style={{ fontSize: 12, opacity: 0.6, color: "#fff", margin: 0 }}>
            Classement : {getCategorieNiveau(niveau)} ({formatNiveau(niveau)}/8)
          </p>
        </div>

        <div style={{ display: "grid", gap: 8 }}>
          <label style={{ fontSize: 13, opacity: 0.7, color: "#fff" }}>Main dominante</label>
          <select
            value={mainDominante}
            onChange={(e) => setMainDominante(e.target.value as MainDominante | "")}
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
            <option value="" style={{ background: "#141414", color: "#fff" }}>Non spécifié</option>
            <option value="droitier" style={{ background: "#141414", color: "#fff" }}>Droitier</option>
            <option value="gaucher" style={{ background: "#141414", color: "#fff" }}>Gaucher</option>
          </select>
        </div>

        <div style={{ display: "grid", gap: 8 }}>
          <label style={{ fontSize: 13, opacity: 0.7, color: "#fff" }}>Position sur le terrain</label>
          <select
            value={positionTerrain}
            onChange={(e) => setPositionTerrain(e.target.value as PositionTerrain | "")}
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
            <option value="" style={{ background: "#141414", color: "#fff" }}>Non spécifié</option>
            <option value="droite" style={{ background: "#141414", color: "#fff" }}>Joueur à droite</option>
            <option value="gauche" style={{ background: "#141414", color: "#fff" }}>Joueur à gauche</option>
          </select>
          <p style={{ fontSize: 12, opacity: 0.6, color: "#fff", margin: 0 }}>
            Facultatif - Indique ta position préférée en double
          </p>
        </div>

        <div style={{ display: "grid", gap: 8 }}>
          <label style={{ fontSize: 13, opacity: 0.7, color: "#fff" }}>Téléphone</label>
          <input
            type="tel"
            value={telephone}
            onChange={(e) => setTelephone(e.target.value)}
            placeholder="Ex : 06 12 34 56 78"
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
          <p style={{ fontSize: 12, opacity: 0.6, color: "#fff", margin: 0 }}>
            Facultatif - Permet aux autres joueurs de vous contacter facilement
          </p>
        </div>

        <div style={{ display: "grid", gap: 8 }}>
          <label style={{ fontSize: 13, opacity: 0.7, color: "#fff" }}>
            Terrain favori / Club
          </label>
          <select
            value={terrainFavoriId}
            onChange={(e) => setTerrainFavoriId(e.target.value)}
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: 12,
              borderRadius: 10,
              border: "1px solid #2a2a2a",
              background: "#141414",
              color: "#fff",
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            <option value="" style={{ background: "#141414", color: "#fff" }}>Non spécifié</option>
            {terrains.map((terrain) => (
              <option key={terrain.id} value={terrain.id} style={{ background: "#141414", color: "#fff" }}>
                {terrain.nom} - {terrain.ville}
              </option>
            ))}
          </select>
          <p style={{ fontSize: 12, opacity: 0.6, color: "#fff", margin: 0 }}>
            Facultatif - Indique ton terrain ou club préféré
          </p>
        </div>

        <div style={{ display: "grid", gap: 8 }}>
          <label style={{ fontSize: 13, opacity: 0.7, color: "#fff" }}>
            Préférences de communication
          </label>
          <select
            value={preferenceCommunication}
            onChange={(e) => setPreferenceCommunication(e.target.value as PreferenceCommunication)}
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
            <option value="notification" style={{ background: "#141414", color: "#fff" }}>
              🔔 Notifications uniquement
            </option>
            <option value="email" style={{ background: "#141414", color: "#fff" }}>
              📧 Email uniquement
            </option>
            <option value="notification_email" style={{ background: "#141414", color: "#fff" }}>
              🔔📧 Notifications + Email
            </option>
            <option value="whatsapp" style={{ background: "#141414", color: "#fff" }}>
              💬 WhatsApp (si numéro fourni)
            </option>
          </select>
          <p style={{ fontSize: 12, opacity: 0.6, color: "#fff", margin: 0 }}>
            Choisissez comment vous souhaitez être notifié des nouveaux matchs de votre groupe
          </p>
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
              <div>🎚️ {getCategorieNiveau(saved.niveau)} ({formatNiveau(saved.niveau)}/8)</div>
              {saved.mainDominante && <div>✋ Main : {saved.mainDominante === "droitier" ? "Droitier" : "Gaucher"}</div>}
              {saved.positionTerrain && <div>📍 Position : {saved.positionTerrain === "droite" ? "Droite" : "Gauche"}</div>}
            </div>
          </div>
          <div style={{ opacity: 0.9, color: "#fff", display: "grid", gap: 8, fontSize: 14 }}>
            <div>🤝 Friendly score : {saved.friendlyScore}</div>
            <div>⭐ Points : {saved.xp}</div>
            {saved.telephone && <div>📞 Téléphone : {saved.telephone}</div>}
            {saved.preferenceCommunication && (
              <div>
                📢 Communication :{" "}
                {saved.preferenceCommunication === "notification" && "🔔 Notifications uniquement"}
                {saved.preferenceCommunication === "email" && "📧 Email uniquement"}
                {saved.preferenceCommunication === "notification_email" && "🔔📧 Notifications + Email"}
                {saved.preferenceCommunication === "whatsapp" && "💬 WhatsApp"}
              </div>
            )}
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
