"use client";

import { useState } from "react";
import { createAccount } from "@/lib/firebase/auth";
import { getCurrentUser } from "@/lib/firebase/auth";
import { getProfil } from "@/lib/firebase/firestore";
import { db } from "@/lib/firebase/config";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";

export default function DebugFirebasePage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pseudo, setPseudo] = useState("");

  function addLog(message: string) {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, `[${timestamp}] ${message}`]);
    console.log(message);
  }

  async function testCreateProfil() {
    setLogs([]);
    addLog("🔍 Début du test de création de profil");

    try {
      // Vérifier l'utilisateur actuel
      const currentUser = getCurrentUser();
      if (currentUser) {
        addLog(`✅ Utilisateur déjà connecté: ${currentUser.email} (UID: ${currentUser.uid})`);
        
        // Tester la lecture
        try {
          const profil = await getProfil(currentUser.uid);
          if (profil) {
            addLog(`✅ Profil trouvé: ${profil.pseudo}`);
          } else {
            addLog(`⚠️ Profil non trouvé pour l'UID: ${currentUser.uid}`);
          }
        } catch (error: any) {
          addLog(`❌ Erreur lecture profil: ${error.message} (code: ${error.code})`);
        }
        return;
      }

      // Créer un nouveau compte
      if (!email || !password || !pseudo) {
        addLog("❌ Veuillez remplir tous les champs");
        return;
      }

      addLog(`🔄 Création du compte: ${email} / ${pseudo}`);
      
      const user = await createAccount(email, password, {
        pseudo,
        niveau: 2.5, // Niveau par défaut (Intermédiaire)
        friendlyScore: 50,
        xp: 0,
      });

      addLog(`✅ Compte créé: ${user.uid}`);

      // Attendre un peu pour la synchronisation
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Vérifier que le profil existe
      try {
        const profil = await getProfil(user.uid);
        if (profil) {
          addLog(`✅ Profil trouvé dans Firestore: ${profil.pseudo}`);
        } else {
          addLog(`❌ Profil non trouvé après création`);
        }
      } catch (error: any) {
        addLog(`❌ Erreur lors de la vérification: ${error.message} (code: ${error.code})`);
      }

      // Lister tous les profils
      try {
        const profilsSnapshot = await getDocs(collection(db, "profils"));
        addLog(`📊 Nombre total de profils dans Firestore: ${profilsSnapshot.size}`);
        profilsSnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          addLog(`  - ${data.pseudo} (${data.email}) - UID: ${docSnap.id}`);
        });
      } catch (error: any) {
        addLog(`❌ Erreur lors de la lecture des profils: ${error.message} (code: ${error.code})`);
      }

    } catch (error: any) {
      addLog(`❌ ERREUR: ${error.message}`);
      addLog(`Code d'erreur: ${error.code}`);
      if (error.code === "permission-denied") {
        addLog("⚠️ Erreur de permission - Les règles Firestore bloquent l'accès");
        addLog("👉 Solution: Déploie les règles dans Firebase Console → Firestore → Rules");
      }
    }
  }

  async function testReadAll() {
    setLogs([]);
    addLog("🔍 Test de lecture de tous les profils");

    try {
      const profilsSnapshot = await getDocs(collection(db, "profils"));
      addLog(`✅ Lecture réussie: ${profilsSnapshot.size} profil(s) trouvé(s)`);
      
      if (profilsSnapshot.size === 0) {
        addLog("⚠️ Aucun profil dans Firestore");
      } else {
        profilsSnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          addLog(`  📄 ${docSnap.id}: ${data.pseudo} (${data.email})`);
        });
      }
    } catch (error: any) {
      addLog(`❌ Erreur: ${error.message} (code: ${error.code})`);
      if (error.code === "permission-denied") {
        addLog("⚠️ Les règles Firestore bloquent la lecture");
      }
    }
  }

  return (
    <div
      style={{
        background: "transparent",
        color: "#fff",
        minHeight: "100vh",
        padding: "24px 16px",
        maxWidth: 900,
        margin: "0 auto",
      }}
    >
      <h1 style={{ fontSize: 28, marginBottom: 20, fontWeight: 700 }}>
        🔧 Debug Firebase
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
          Créer un profil de test
        </h2>

        <div style={{ display: "grid", gap: 12, marginBottom: 16 }}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            style={{
              padding: 12,
              borderRadius: 8,
              border: "1px solid #2a2a2a",
              background: "#141414",
              color: "#fff",
              fontSize: 14,
            }}
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mot de passe (min 6 caractères)"
            style={{
              padding: 12,
              borderRadius: 8,
              border: "1px solid #2a2a2a",
              background: "#141414",
              color: "#fff",
              fontSize: 14,
            }}
          />
          <input
            type="text"
            value={pseudo}
            onChange={(e) => setPseudo(e.target.value)}
            placeholder="Pseudo"
            style={{
              padding: 12,
              borderRadius: 8,
              border: "1px solid #2a2a2a",
              background: "#141414",
              color: "#fff",
              fontSize: 14,
            }}
          />
        </div>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button
            onClick={testCreateProfil}
            style={{
              padding: "12px 24px",
              borderRadius: 8,
              border: "none",
              background: "#10b981",
              color: "#fff",
              fontWeight: 600,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Créer un profil
          </button>
          <button
            onClick={testReadAll}
            style={{
              padding: "12px 24px",
              borderRadius: 8,
              border: "1px solid #2a2a2a",
              background: "transparent",
              color: "#fff",
              fontWeight: 600,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Lire tous les profils
          </button>
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
          Logs
        </h2>
        <div
          style={{
            background: "#0a0a0a",
            padding: 16,
            borderRadius: 8,
            fontFamily: "monospace",
            fontSize: 13,
            maxHeight: 500,
            overflowY: "auto",
            lineHeight: 1.6,
          }}
        >
          {logs.length === 0 ? (
            <div style={{ opacity: 0.5 }}>Aucun log pour l'instant...</div>
          ) : (
            logs.map((log, index) => (
              <div key={index} style={{ marginBottom: 4 }}>
                {log}
              </div>
            ))
          )}
        </div>
      </div>

      <div
        style={{
          background: "#2a1a0a",
          padding: 20,
          borderRadius: 12,
          marginTop: 24,
          border: "1px solid #f59e0b",
        }}
      >
        <h3 style={{ fontSize: 16, marginBottom: 12, color: "#f59e0b" }}>
          ⚠️ Instructions importantes
        </h3>
        <ol style={{ lineHeight: 1.8, marginLeft: 20 }}>
          <li>
            <strong>Vérifie que Firestore est activé</strong> dans Firebase Console
          </li>
          <li>
            <strong>Déploie les règles</strong> : Firebase Console → Firestore Database → Rules →
            Colle le contenu de <code>firestore.rules</code> → Publish
          </li>
          <li>
            <strong>Ouvre la console du navigateur</strong> (F12) pour voir les logs détaillés
          </li>
          <li>
            Si tu vois une erreur <code>permission-denied</code>, les règles ne sont pas
            déployées correctement
          </li>
        </ol>
      </div>
    </div>
  );
}
