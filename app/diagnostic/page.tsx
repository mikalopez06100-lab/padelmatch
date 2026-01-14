"use client";

import { useState, useEffect } from "react";
import { getCurrentUser, onAuthChange } from "@/lib/firebase/auth";
import { getProfil } from "@/lib/firebase/firestore";
import { loadCurrentProfilSync } from "@/lib/data/auth";
import Link from "next/link";

export default function DiagnosticPage() {
  const [authUser, setAuthUser] = useState<any>(null);
  const [firestoreProfil, setFirestoreProfil] = useState<any>(null);
  const [localProfil, setLocalProfil] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkStatus(user: any = null) {
      setLoading(true);
      setError(null);

      try {
        // 1. Vérifier l'utilisateur Firebase Auth
        const currentUser = user || getCurrentUser();
        setAuthUser(currentUser ? {
          uid: currentUser.uid,
          email: currentUser.email,
          emailVerified: currentUser.emailVerified,
        } : null);

        // 2. Vérifier le profil dans Firestore
        if (currentUser) {
          try {
            const profil = await getProfil(currentUser.uid);
            setFirestoreProfil(profil);
          } catch (err: any) {
            setError(`Erreur Firestore: ${err.message}`);
            setFirestoreProfil(null);
          }
        } else {
          setFirestoreProfil(null);
        }

        // 3. Vérifier le profil local (localStorage)
        const localProfilData = loadCurrentProfilSync();
        setLocalProfil(localProfilData);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    checkStatus();

    // Écouter les changements d'authentification
    const unsubscribe = onAuthChange((user) => {
      checkStatus(user);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const statusColor = (status: boolean) => status ? "#10b981" : "#ef4444";
  const statusIcon = (status: boolean) => status ? "✅" : "❌";

  return (
    <div
      style={{
        maxWidth: 900,
        margin: "0 auto",
        padding: "40px 20px",
        color: "#fff",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <h1 style={{ fontSize: 32, marginBottom: 8, fontWeight: 700 }}>
        🔍 Diagnostic Firebase
      </h1>
      <p style={{ fontSize: 16, opacity: 0.7, marginBottom: 32 }}>
        Vérification de la connexion Firebase et du profil utilisateur
      </p>

      {loading && (
        <div style={{ padding: 20, textAlign: "center", color: "#10b981" }}>
          ⏳ Chargement...
        </div>
      )}

      {error && (
        <div
          style={{
            padding: 16,
            background: "#1f1f1f",
            border: "1px solid #ef4444",
            borderRadius: 8,
            marginBottom: 24,
            color: "#ef4444",
          }}
        >
          <strong>❌ Erreur:</strong> {error}
        </div>
      )}

      {/* Firebase Auth Status */}
      <div
        style={{
          background: "#1a1a1a",
          border: "1px solid #2a2a2a",
          borderRadius: 12,
          padding: 24,
          marginBottom: 24,
        }}
      >
        <h2 style={{ fontSize: 20, marginBottom: 16, fontWeight: 600 }}>
          🔐 Firebase Authentication
        </h2>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <span style={{ fontSize: 24 }}>
            {statusIcon(!!authUser)}
          </span>
          <span style={{ fontSize: 18, fontWeight: 500 }}>
            {authUser ? "Utilisateur connecté" : "Aucun utilisateur connecté"}
          </span>
        </div>
        {authUser && (
          <div style={{ marginLeft: 36, fontSize: 14, opacity: 0.8 }}>
            <div style={{ marginBottom: 8 }}>
              <strong>UID:</strong> {authUser.uid}
            </div>
            <div style={{ marginBottom: 8 }}>
              <strong>Email:</strong> {authUser.email}
            </div>
            <div>
              <strong>Email vérifié:</strong>{" "}
              <span style={{ color: statusColor(authUser.emailVerified) }}>
                {authUser.emailVerified ? "Oui" : "Non"}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Firestore Profile Status */}
      <div
        style={{
          background: "#1a1a1a",
          border: "1px solid #2a2a2a",
          borderRadius: 12,
          padding: 24,
          marginBottom: 24,
        }}
      >
        <h2 style={{ fontSize: 20, marginBottom: 16, fontWeight: 600 }}>
          💾 Profil Firestore
        </h2>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <span style={{ fontSize: 24 }}>
            {statusIcon(!!firestoreProfil)}
          </span>
          <span style={{ fontSize: 18, fontWeight: 500 }}>
            {firestoreProfil ? "Profil trouvé dans Firestore" : "Profil non trouvé dans Firestore"}
          </span>
        </div>
        {firestoreProfil ? (
          <div style={{ marginLeft: 36, fontSize: 14, opacity: 0.8 }}>
            <div style={{ marginBottom: 8 }}>
              <strong>Pseudo:</strong> {firestoreProfil.pseudo}
            </div>
            <div style={{ marginBottom: 8 }}>
              <strong>Email:</strong> {firestoreProfil.email}
            </div>
            <div style={{ marginBottom: 8 }}>
              <strong>Niveau:</strong> {firestoreProfil.niveau}
            </div>
            {firestoreProfil.friendlyScore !== undefined && (
              <div style={{ marginBottom: 8 }}>
                <strong>Friendly Score:</strong> {firestoreProfil.friendlyScore}
              </div>
            )}
            {firestoreProfil.xp !== undefined && (
              <div style={{ marginBottom: 8 }}>
                <strong>XP:</strong> {firestoreProfil.xp}
              </div>
            )}
          </div>
        ) : authUser ? (
          <div style={{ marginLeft: 36, fontSize: 14, color: "#f59e0b" }}>
            ⚠️ Le profil n'existe pas dans Firestore pour cet utilisateur.
            <br />
            <br />
            <strong>Solutions possibles:</strong>
            <ul style={{ marginTop: 8, paddingLeft: 20 }}>
              <li>Utilisez la page <Link href="/migration" style={{ color: "#10b981", textDecoration: "underline" }}>Migration</Link> pour migrer vos données locales</li>
              <li>Créez un nouveau compte depuis la page d'accueil</li>
              <li>Vérifiez les règles Firestore dans Firebase Console</li>
            </ul>
          </div>
        ) : (
          <div style={{ marginLeft: 36, fontSize: 14, opacity: 0.7 }}>
            Connectez-vous d'abord avec Firebase Auth
          </div>
        )}
      </div>

      {/* Local Profile Status */}
      <div
        style={{
          background: "#1a1a1a",
          border: "1px solid #2a2a2a",
          borderRadius: 12,
          padding: 24,
          marginBottom: 24,
        }}
      >
        <h2 style={{ fontSize: 20, marginBottom: 16, fontWeight: 600 }}>
          💻 Profil Local (localStorage)
        </h2>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <span style={{ fontSize: 24 }}>
            {statusIcon(!!localProfil)}
          </span>
          <span style={{ fontSize: 18, fontWeight: 500 }}>
            {localProfil ? "Profil trouvé dans localStorage" : "Aucun profil dans localStorage"}
          </span>
        </div>
        {localProfil && (
          <div style={{ marginLeft: 36, fontSize: 14, opacity: 0.8 }}>
            <div style={{ marginBottom: 8 }}>
              <strong>Pseudo:</strong> {localProfil.pseudo}
            </div>
            <div style={{ marginBottom: 8 }}>
              <strong>Email:</strong> {localProfil.email}
            </div>
            {localProfil.niveau && (
              <div style={{ marginBottom: 8 }}>
                <strong>Niveau:</strong> {localProfil.niveau}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Recommendations */}
      <div
        style={{
          background: "#1a1a1a",
          border: "1px solid #2a2a2a",
          borderRadius: 12,
          padding: 24,
        }}
      >
        <h2 style={{ fontSize: 20, marginBottom: 16, fontWeight: 600 }}>
          💡 Recommandations
        </h2>
        <div style={{ fontSize: 14, opacity: 0.8, lineHeight: 1.6 }}>
          {!authUser && (
            <div style={{ marginBottom: 12, padding: 12, background: "#1f1f1f", borderRadius: 8 }}>
              <strong>1. Connectez-vous:</strong> Vous devez être connecté avec Firebase Auth pour utiliser l'application.
            </div>
          )}
          {authUser && !firestoreProfil && (
            <div style={{ marginBottom: 12, padding: 12, background: "#1f1f1f", borderRadius: 8 }}>
              <strong>2. Migrez votre profil:</strong> Votre profil n'existe pas dans Firestore. Utilisez la page <Link href="/migration" style={{ color: "#10b981", textDecoration: "underline" }}>Migration</Link> pour migrer vos données.
            </div>
          )}
          {authUser && firestoreProfil && localProfil && localProfil.pseudo !== firestoreProfil.pseudo && (
            <div style={{ marginBottom: 12, padding: 12, background: "#1f1f1f", borderRadius: 8 }}>
              <strong>3. Incohérence détectée:</strong> Le pseudo local ({localProfil.pseudo}) ne correspond pas au pseudo Firestore ({firestoreProfil.pseudo}).
            </div>
          )}
          {authUser && firestoreProfil && (
            <div style={{ padding: 12, background: "#1f1f1f", borderRadius: 8 }}>
              <strong>✅ Tout est OK!</strong> Votre profil est correctement configuré dans Firestore. Vous pouvez créer des parties.
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div style={{ marginTop: 32, display: "flex", gap: 12, flexWrap: "wrap" }}>
        <Link
          href="/"
          style={{
            padding: "12px 24px",
            background: "#10b981",
            color: "#fff",
            borderRadius: 8,
            textDecoration: "none",
            fontWeight: 500,
          }}
        >
          🏠 Accueil
        </Link>
        <Link
          href="/migration"
          style={{
            padding: "12px 24px",
            background: "#3b82f6",
            color: "#fff",
            borderRadius: 8,
            textDecoration: "none",
            fontWeight: 500,
          }}
        >
          📦 Migration
        </Link>
        <Link
          href="/parties"
          style={{
            padding: "12px 24px",
            background: "#8b5cf6",
            color: "#fff",
            borderRadius: 8,
            textDecoration: "none",
            fontWeight: 500,
          }}
        >
          🎾 Parties
        </Link>
      </div>
    </div>
  );
}
