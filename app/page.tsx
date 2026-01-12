"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Niveau } from "@/lib/types";
import { authenticate, createProfil, emailExists, loadCurrentProfil, resetPassword } from "@/lib/data/auth";
import { Logo } from "./logo";

const NIVEAUX: Niveau[] = ["Débutant", "Intermédiaire", "Confirmé", "Compétitif"];

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function Home() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "inscription" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pseudo, setPseudo] = useState("");
  const [niveau, setNiveau] = useState<Niveau>("Débutant");
  const [newPassword, setNewPassword] = useState<string | null>(null);

  useEffect(() => {
    // Si un profil existe déjà, rediriger vers les parties
    const existing = loadCurrentProfil();
    if (existing) {
      router.push("/parties");
    }
  }, [router]);

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
    } else if (mode === "forgot") {
      // Réinitialisation de mot de passe
      const generatedPassword = resetPassword(cleanEmail);
      if (generatedPassword) {
        setNewPassword(generatedPassword);
      } else {
        alert("Aucun compte trouvé avec cet email.");
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
    <div
      style={{
        background: "#000",
        color: "#fff",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <Logo size="large" showTagline={true} />

      <div
        style={{
          width: "100%",
          maxWidth: 400,
          marginTop: 40,
          background: "#141414",
          borderRadius: 16,
          padding: 32,
          border: "1px solid #2a2a2a",
        }}
      >
        {mode !== "forgot" && (
          <div style={{ display: "flex", gap: 12, marginBottom: 32 }}>
            <button
              onClick={() => {
                setMode("login");
                setNewPassword(null);
              }}
              style={{
                flex: 1,
                padding: 12,
                borderRadius: 10,
                border: "none",
                background: mode === "login" ? "#10b981" : "#1f1f1f",
                color: "#fff",
                fontWeight: mode === "login" ? 600 : 400,
                fontSize: 14,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              Connexion
            </button>
            <button
              onClick={() => {
                setMode("inscription");
                setNewPassword(null);
              }}
              style={{
                flex: 1,
                padding: 12,
                borderRadius: 10,
                border: "none",
                background: mode === "inscription" ? "#10b981" : "#1f1f1f",
                color: "#fff",
                fontWeight: mode === "inscription" ? 600 : 400,
                fontSize: 14,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              Inscription
            </button>
          </div>
        )}

        {mode === "forgot" && (
          <div style={{ marginBottom: 32, textAlign: "center" }}>
            <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>Mot de passe oublié</h2>
            <p style={{ fontSize: 13, opacity: 0.7, marginBottom: 16 }}>
              Entrez votre email pour générer un nouveau mot de passe
            </p>
            <button
              onClick={() => {
                setMode("login");
                setNewPassword(null);
                setEmail("");
              }}
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                border: "1px solid #2a2a2a",
                background: "transparent",
                color: "#10b981",
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              ← Retour à la connexion
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: "grid", gap: 16 }}>
            <div style={{ display: "grid", gap: 8 }}>
              <label style={{ fontSize: 13, opacity: 0.7, color: "#fff", fontWeight: 500 }}>
                Email <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com"
                required
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

            {mode !== "forgot" && (
              <div style={{ display: "grid", gap: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <label style={{ fontSize: 13, opacity: 0.7, color: "#fff", fontWeight: 500 }}>
                    Mot de passe <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  {mode === "login" && (
                    <button
                      type="button"
                      onClick={() => {
                        setMode("forgot");
                        setPassword("");
                        setNewPassword(null);
                      }}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "#10b981",
                        fontSize: 12,
                        cursor: "pointer",
                        textDecoration: "underline",
                        padding: 0,
                      }}
                    >
                      Mot de passe oublié ?
                    </button>
                  )}
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
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
            )}

            {mode === "forgot" && newPassword && (
              <div
                style={{
                  padding: 16,
                  borderRadius: 10,
                  background: "#1a1a1a",
                  border: "1px solid #10b981",
                  marginTop: 8,
                }}
              >
                <p style={{ fontSize: 13, marginBottom: 12, color: "#10b981", fontWeight: 600 }}>
                  ✅ Nouveau mot de passe généré
                </p>
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
                  <input
                    type="text"
                    value={newPassword}
                    readOnly
                    style={{
                      flex: 1,
                      padding: 12,
                      borderRadius: 8,
                      border: "1px solid #2a2a2a",
                      background: "#141414",
                      color: "#fff",
                      fontSize: 14,
                      fontFamily: "monospace",
                      outline: "none",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(newPassword);
                      alert("Mot de passe copié dans le presse-papiers !");
                    }}
                    style={{
                      padding: "12px 16px",
                      borderRadius: 8,
                      border: "1px solid #10b981",
                      background: "transparent",
                      color: "#10b981",
                      fontSize: 13,
                      cursor: "pointer",
                    }}
                  >
                    📋 Copier
                  </button>
                </div>
                <p style={{ fontSize: 12, opacity: 0.7, marginBottom: 12 }}>
                  ⚠️ Notez bien ce mot de passe, il ne sera plus affiché.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setNewPassword(null);
                    setEmail("");
                  }}
                  style={{
                    width: "100%",
                    padding: 12,
                    borderRadius: 8,
                    border: "none",
                    background: "#10b981",
                    color: "#fff",
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Se connecter avec le nouveau mot de passe
                </button>
              </div>
            )}

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

            {mode !== "forgot" || !newPassword ? (
              <button
                type="submit"
                style={{
                  marginTop: 8,
                  padding: 14,
                  borderRadius: 10,
                  border: "none",
                  background: "#10b981",
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: 15,
                  cursor: "pointer",
                }}
              >
                {mode === "login" ? "Se connecter" : mode === "inscription" ? "S'inscrire" : "Générer un nouveau mot de passe"}
              </button>
            ) : null}
          </div>
        </form>
      </div>
    </div>
  );
}
