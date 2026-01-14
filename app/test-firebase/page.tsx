"use client";

import { useEffect, useState } from "react";
import { getCurrentUser } from "@/lib/firebase/auth";
import { getProfil, getAllProfils } from "@/lib/firebase/firestore";
import { db } from "@/lib/firebase/config";
import { collection, getDocs } from "firebase/firestore";

export default function TestFirebasePage() {
  const [status, setStatus] = useState<{
    config: string;
    auth: string;
    firestore: string;
    profils: string;
    error?: string;
  }>({
    config: "⏳ Vérification...",
    auth: "⏳ Vérification...",
    firestore: "⏳ Vérification...",
    profils: "⏳ Vérification...",
  });

  useEffect(() => {
    async function testFirebase() {
      try {
        // 1. Test de la configuration
        setStatus((prev) => ({ ...prev, config: "✅ Configuration chargée" }));

        // 2. Test de l'authentification
        const user = getCurrentUser();
        if (user) {
          setStatus((prev) => ({
            ...prev,
            auth: `✅ Utilisateur connecté: ${user.email} (UID: ${user.uid})`,
          }));

          // 3. Test de récupération du profil
          try {
            const profil = await getProfil(user.uid);
            if (profil) {
              setStatus((prev) => ({
                ...prev,
                firestore: `✅ Profil trouvé: ${profil.pseudo} (${profil.email})`,
              }));
            } else {
              setStatus((prev) => ({
                ...prev,
                firestore: "⚠️ Profil non trouvé dans Firestore",
              }));
            }
          } catch (error: any) {
            setStatus((prev) => ({
              ...prev,
              firestore: `❌ Erreur Firestore: ${error.message}`,
              error: error.code,
            }));
          }

          // 4. Test de récupération de tous les profils
          try {
            const allProfils = await getAllProfils();
            setStatus((prev) => ({
              ...prev,
              profils: `✅ ${allProfils.length} profil(s) trouvé(s) dans Firestore`,
            }));
          } catch (error: any) {
            setStatus((prev) => ({
              ...prev,
              profils: `❌ Erreur: ${error.message} (code: ${error.code})`,
            }));
          }
        } else {
          setStatus((prev) => ({
            ...prev,
            auth: "⚠️ Aucun utilisateur connecté",
            firestore: "⚠️ Impossible de tester sans utilisateur",
            profils: "⚠️ Impossible de tester sans utilisateur",
          }));
        }
      } catch (error: any) {
        setStatus((prev) => ({
          ...prev,
          error: `Erreur générale: ${error.message}`,
        }));
      }
    }

    testFirebase();
  }, []);

  return (
    <div
      style={{
        background: "#000",
        color: "#fff",
        minHeight: "100vh",
        padding: "24px 16px",
        maxWidth: 800,
        margin: "0 auto",
      }}
    >
      <h1 style={{ fontSize: 28, marginBottom: 20, fontWeight: 700 }}>
        🔍 Test de connexion Firebase
      </h1>

      <div
        style={{
          background: "#1a1a1a",
          padding: 24,
          borderRadius: 12,
          marginBottom: 24,
          border: "1px solid #2a2a2a",
        }}
      >
        <h2 style={{ fontSize: 20, marginBottom: 16, fontWeight: 600 }}>
          État de la connexion
        </h2>

        <div style={{ display: "grid", gap: 16 }}>
          <div>
            <strong>Configuration Firebase:</strong>
            <div style={{ marginTop: 8, padding: 12, background: "#2a2a2a", borderRadius: 8 }}>
              {status.config}
            </div>
          </div>

          <div>
            <strong>Authentification:</strong>
            <div style={{ marginTop: 8, padding: 12, background: "#2a2a2a", borderRadius: 8 }}>
              {status.auth}
            </div>
          </div>

          <div>
            <strong>Firestore (profil utilisateur):</strong>
            <div style={{ marginTop: 8, padding: 12, background: "#2a2a2a", borderRadius: 8 }}>
              {status.firestore}
            </div>
          </div>

          <div>
            <strong>Firestore (tous les profils):</strong>
            <div style={{ marginTop: 8, padding: 12, background: "#2a2a2a", borderRadius: 8 }}>
              {status.profils}
            </div>
          </div>

          {status.error && (
            <div>
              <strong style={{ color: "#ef4444" }}>Erreur détectée:</strong>
              <div
                style={{
                  marginTop: 8,
                  padding: 12,
                  background: "#3a1a1a",
                  borderRadius: 8,
                  border: "1px solid #ef4444",
                  color: "#ef4444",
                }}
              >
                {status.error}
              </div>
            </div>
          )}
        </div>
      </div>

      <div
        style={{
          background: "#1a1a1a",
          padding: 24,
          borderRadius: 12,
          border: "1px solid #2a2a2a",
        }}
      >
        <h2 style={{ fontSize: 20, marginBottom: 16, fontWeight: 600 }}>
          Instructions
        </h2>
        <ol style={{ lineHeight: 1.8, marginLeft: 20 }}>
          <li>Ouvre la console du navigateur (F12) pour voir les logs détaillés</li>
          <li>Crée un nouveau compte depuis la page d'accueil</li>
          <li>Reviens sur cette page pour voir l'état de la connexion</li>
          <li>Vérifie dans la console Firebase que le profil apparaît dans la collection "profils"</li>
        </ol>
      </div>
    </div>
  );
}
