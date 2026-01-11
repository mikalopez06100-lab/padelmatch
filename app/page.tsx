"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Profil, Zone, Niveau } from "@/lib/types";
import { addOrUpdateProfilGlobal } from "@/lib/data/profils-globaux";

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
  // Ajouter/mettre à jour dans la liste globale des profils
  addOrUpdateProfilGlobal(p);
}

export default function Home() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "inscription">("login");
  const [pseudo, setPseudo] = useState("");
  const [zone, setZone] = useState<Zone>("Nice");
  const [niveau, setNiveau] = useState<Niveau>("Débutant");

  useEffect(() => {
    // Si un profil existe déjà, rediriger vers les parties
    const existing = loadProfil();
    if (existing) {
      router.push("/parties");
    }
  }, [router]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const clean = pseudo.trim();
    if (clean.length < 2) {
      alert("Pseudo trop court (min 2 caractères).");
      return;
    }

    if (mode === "login") {
      // Login : vérifier si le pseudo existe
      const existing = loadProfil();
      if (existing && existing.pseudo.toLowerCase() === clean.toLowerCase()) {
        // Le profil existe, on le charge (déjà chargé en localStorage)
        router.push("/parties");
      } else {
        alert("Pseudo non trouvé. Vérifiez votre pseudo ou créez un compte.");
        setMode("inscription");
      }
    } else {
      // Inscription : créer un nouveau profil
      const existing = loadProfil();
      if (existing) {
        alert("Un profil existe déjà. Veuillez vous connecter.");
        setMode("login");
        return;
      }

      const profil: Profil = {
        pseudo: clean,
        zone,
        niveau,
        friendlyScore: 50,
        xp: 0,
      };

      saveProfil(profil);
      router.push("/parties");
    }
  }

  return (
    <main style={{ background: "#000", color: "#fff", minHeight: "100vh", padding: "20px", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ maxWidth: 450, width: "100%", paddingTop: 40 }}>
        {/* Logo et titre */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <h1 style={{ fontSize: 40, marginBottom: 12, color: "#fff", fontWeight: 700, letterSpacing: -0.5 }}>
            🎾 PadelMatch
          </h1>
          <p style={{ fontSize: 16, opacity: 0.8, color: "#fff", margin: 0 }}>
            Nice & alentours — Trouve des joueurs et complète tes parties en 2 clics.
          </p>
        </div>

        {/* Tabs Login/Inscription */}
        <div
          style={{
            display: "flex",
            gap: 8,
            marginBottom: 24,
            borderBottom: "1px solid #2a2a2a",
            paddingBottom: 8,
          }}
        >
          <button
            onClick={() => setMode("login")}
            style={{
              flex: 1,
              padding: "12px 16px",
              borderRadius: 10,
              border: "none",
              background: mode === "login" ? "#10b981" : "transparent",
              color: "#fff",
              fontWeight: 600,
              fontSize: 15,
              cursor: "pointer",
              transition: "background 0.2s",
            }}
          >
            Connexion
          </button>
          <button
            onClick={() => setMode("inscription")}
            style={{
              flex: 1,
              padding: "12px 16px",
              borderRadius: 10,
              border: "none",
              background: mode === "inscription" ? "#10b981" : "transparent",
              color: "#fff",
              fontWeight: 600,
              fontSize: 15,
              cursor: "pointer",
              transition: "background 0.2s",
            }}
          >
            Inscription
          </button>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit}>
          <div
            style={{
              border: "1px solid #2a2a2a",
              borderRadius: 16,
              padding: 24,
              display: "grid",
              gap: 16,
              background: "#1f1f1f",
            }}
          >
            <div style={{ display: "grid", gap: 8 }}>
              <label style={{ fontSize: 13, opacity: 0.7, color: "#fff", fontWeight: 500 }}>
                Pseudo <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input
                type="text"
                value={pseudo}
                onChange={(e) => setPseudo(e.target.value)}
                placeholder="Ex : Mickaël"
                required
                minLength={2}
                autoFocus
                style={{
                  padding: 14,
                  borderRadius: 10,
                  border: "1px solid #2a2a2a",
                  background: "#141414",
                  color: "#fff",
                  fontSize: 15,
                  outline: "none",
                }}
              />
            </div>

            {mode === "inscription" && (
              <>
                <div style={{ display: "grid", gap: 8 }}>
                  <label style={{ fontSize: 13, opacity: 0.7, color: "#fff", fontWeight: 500 }}>
                    Zone <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <select
                    value={zone}
                    onChange={(e) => setZone(e.target.value as Zone)}
                    required
                    style={{
                      padding: 14,
                      borderRadius: 10,
                      border: "1px solid #2a2a2a",
                      background: "#141414",
                      color: "#fff",
                      fontSize: 15,
                      outline: "none",
                      cursor: "pointer",
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
                  <label style={{ fontSize: 13, opacity: 0.7, color: "#fff", fontWeight: 500 }}>
                    Niveau <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <select
                    value={niveau}
                    onChange={(e) => setNiveau(e.target.value as Niveau)}
                    required
                    style={{
                      padding: 14,
                      borderRadius: 10,
                      border: "1px solid #2a2a2a",
                      background: "#141414",
                      color: "#fff",
                      fontSize: 15,
                      outline: "none",
                      cursor: "pointer",
                    }}
                  >
                    {NIVEAUX.map((n) => (
                      <option key={n} value={n} style={{ background: "#141414", color: "#fff" }}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            <button
              type="submit"
              style={{
                padding: "16px 24px",
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
              {mode === "login" ? "Se connecter" : "Créer mon compte"}
            </button>
          </div>
        </form>

        {/* Footer info */}
        <div style={{ textAlign: "center", marginTop: 32, fontSize: 13, opacity: 0.6, color: "#fff" }}>
          {mode === "login" ? (
            <p style={{ margin: 0 }}>
              Pas encore de compte ?{" "}
              <button
                onClick={() => setMode("inscription")}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#10b981",
                  textDecoration: "underline",
                  cursor: "pointer",
                  fontSize: 13,
                  padding: 0,
                }}
              >
                S'inscrire
              </button>
            </p>
          ) : (
            <p style={{ margin: 0 }}>
              Déjà un compte ?{" "}
              <button
                onClick={() => setMode("login")}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#10b981",
                  textDecoration: "underline",
                  cursor: "pointer",
                  fontSize: 13,
                  padding: 0,
                }}
              >
                Se connecter
              </button>
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
