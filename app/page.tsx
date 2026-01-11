"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Niveau } from "@/lib/types";
import { authenticate, createProfil, emailExists, loadCurrentProfil } from "@/lib/data/auth";
import { loadTerrains, type Terrain } from "@/lib/data/terrains";
import { Logo } from "./logo";

const NIVEAUX: Niveau[] = ["Débutant", "Intermédiaire", "Confirmé", "Compétitif"];

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function Home() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "inscription">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pseudo, setPseudo] = useState("");
  const [terrains, setTerrains] = useState<Terrain[]>([]);
  const [terrainId, setTerrainId] = useState<string>("");
  const [niveau, setNiveau] = useState<Niveau>("Débutant");

  useEffect(() => {
    // Charger les terrains
    const terrainsList = loadTerrains();
    setTerrains(terrainsList);
    if (terrainsList.length > 0 && !terrainId) {
      setTerrainId(terrainsList[0].id);
    }
    
    // Si un profil existe déjà, rediriger vers les parties
    const existing = loadCurrentProfil();
    if (existing) {
      router.push("/parties");
    }
  }, [router, terrainId]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();
    const cleanPseudo = pseudo.trim();

    // Validation email
    if (!isValidEmail(cleanEmail)) {
      alert("Veuillez entrer une adresse email valide.");
      return;
    }

    if (mode === "login") {
      // Login : authentifier avec email/mot de passe
      const profil = authenticate(cleanEmail, cleanPassword);
      if (profil) {
        router.push("/parties");
        router.refresh();
      } else {
        alert("Email ou mot de passe incorrect.");
      }
    } else {
      // Inscription : créer un nouveau profil
      if (cleanPseudo.length < 2) {
        alert("Pseudo trop court (min 2 caractères).");
        return;
      }

      if (cleanPassword.length < 6) {
        alert("Le mot de passe doit contenir au moins 6 caractères.");
        return;
      }

      // Vérifier si l'email existe déjà
      if (emailExists(cleanEmail)) {
        alert("Cet email est déjà utilisé. Connectez-vous ou utilisez un autre email.");
        setMode("login");
        return;
      }

      try {
        createProfil({
          pseudo: cleanPseudo,
          email: cleanEmail,
          password: cleanPassword,
          terrainId,
          niveau,
        });
        alert("Inscription réussie ✅\nBienvenue sur PadelMatch !");
        router.push("/parties");
        router.refresh();
      } catch (error) {
        alert("Erreur lors de l'inscription. Veuillez réessayer.");
        console.error(error);
      }
    }
  }

  return (
    <main style={{ background: "#000", color: "#fff", minHeight: "100vh", padding: "20px", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ maxWidth: 450, width: "100%", paddingTop: 40 }}>
        {/* Logo et titre */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ marginBottom: 16 }}>
            <Logo size="large" showTagline />
          </div>
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
                Email <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="exemple@email.com"
                required
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

            <div style={{ display: "grid", gap: 8 }}>
              <label style={{ fontSize: 13, opacity: 0.7, color: "#fff", fontWeight: 500 }}>
                Mot de passe <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === "login" ? "Votre mot de passe" : "Minimum 6 caractères"}
                required
                minLength={mode === "inscription" ? 6 : undefined}
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
                    Pseudo <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={pseudo}
                    onChange={(e) => setPseudo(e.target.value)}
                    placeholder="Ex : Mickaël"
                    required
                    minLength={2}
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
