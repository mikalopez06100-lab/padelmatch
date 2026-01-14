"use client";

import { useState } from "react";
import { db } from "@/lib/firebase/config";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";

export default function CleanDatabasePage() {
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [counts, setCounts] = useState<{ profils: number; parties: number; groupes: number; messages: number } | null>(null);

  function addLog(message: string) {
    setLogs((prev) => [...prev, message]);
    console.log(message);
  }

  async function countDocuments() {
    setLogs([]);
    addLog("📊 Comptage des documents dans Firestore...");

    try {
      const profilsSnapshot = await getDocs(collection(db, "profils"));
      const partiesSnapshot = await getDocs(collection(db, "parties"));
      const groupesSnapshot = await getDocs(collection(db, "groupes"));
      const messagesSnapshot = await getDocs(collection(db, "messages"));

      const counts = {
        profils: profilsSnapshot.size,
        parties: partiesSnapshot.size,
        groupes: groupesSnapshot.size,
        messages: messagesSnapshot.size,
      };

      setCounts(counts);
      addLog(`✅ Profils: ${counts.profils}`);
      addLog(`✅ Parties: ${counts.parties}`);
      addLog(`✅ Groupes: ${counts.groupes}`);
      addLog(`✅ Messages: ${counts.messages}`);
      addLog(`📊 TOTAL: ${counts.profils + counts.parties + counts.groupes + counts.messages} documents`);
    } catch (error: any) {
      addLog(`❌ Erreur: ${error.message}`);
    }
  }

  async function deleteAllFromCollection(collectionName: string) {
    try {
      const snapshot = await getDocs(collection(db, collectionName));
      const deletePromises = snapshot.docs.map((docSnap) => deleteDoc(doc(db, collectionName, docSnap.id)));
      await Promise.all(deletePromises);
      return snapshot.size;
    } catch (error: any) {
      addLog(`❌ Erreur lors de la suppression de ${collectionName}: ${error.message}`);
      throw error;
    }
  }

  async function cleanAllData() {
    const total =
      (counts?.profils || 0) + (counts?.parties || 0) + (counts?.groupes || 0) + (counts?.messages || 0);

    if (total === 0) {
      addLog("⚠️ Aucun document à supprimer. Cliquez d'abord sur 'Compter les documents'.");
      return;
    }

    const confirmMessage = `⚠️ ATTENTION : Cette opération va supprimer TOUS les documents de Firestore !\n\n` +
      `- ${counts?.profils || 0} profils\n` +
      `- ${counts?.parties || 0} parties\n` +
      `- ${counts?.groupes || 0} groupes\n` +
      `- ${counts?.messages || 0} messages\n\n` +
      `TOTAL: ${total} documents\n\n` +
      `Cette action est IRREVERSIBLE !\n\n` +
      `Êtes-vous sûr de vouloir continuer ?`;

    if (!confirm(confirmMessage)) {
      addLog("❌ Opération annulée par l'utilisateur.");
      return;
    }

    setLoading(true);
    setLogs([]);
    addLog("🗑️ DÉBUT DU NETTOYAGE COMPLET DE LA BASE DE DONNÉES...");

    try {
      // Supprimer dans l'ordre : messages, parties, groupes, profils
      // (pour respecter les dépendances)

      addLog("📋 Suppression des messages...");
      const messagesCount = await deleteAllFromCollection("messages");
      addLog(`✅ ${messagesCount} message(s) supprimé(s)`);

      addLog("📋 Suppression des parties...");
      const partiesCount = await deleteAllFromCollection("parties");
      addLog(`✅ ${partiesCount} partie(s) supprimée(s)`);

      addLog("📋 Suppression des groupes...");
      const groupesCount = await deleteAllFromCollection("groupes");
      addLog(`✅ ${groupesCount} groupe(s) supprimé(s)`);

      addLog("📋 Suppression des profils...");
      const profilsCount = await deleteAllFromCollection("profils");
      addLog(`✅ ${profilsCount} profil(s) supprimé(s)`);

      addLog(`🎉 NETTOYAGE TERMINÉ !`);
      addLog(`📊 Total supprimé: ${profilsCount + partiesCount + groupesCount + messagesCount} documents`);

      setCounts({ profils: 0, parties: 0, groupes: 0, messages: 0 });
    } catch (error: any) {
      addLog(`❌ ERREUR: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        background: "#000",
        color: "#fff",
        minHeight: "100vh",
        padding: "40px 20px",
        boxSizing: "border-box",
      }}
    >
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <h1 style={{ fontSize: 28, marginBottom: 10, color: "#ef4444", textAlign: "center" }}>
          🗑️ Nettoyage de la base de données
        </h1>
        <p style={{ textAlign: "center", opacity: 0.8, marginBottom: 30, fontSize: 14 }}>
          Cette page permet de supprimer TOUTES les données de Firestore.
        </p>

        <div
          style={{
            background: "#ef444420",
            border: "1px solid #ef4444",
            borderRadius: 12,
            padding: 20,
            marginBottom: 30,
          }}
        >
          <h2 style={{ fontSize: 18, marginTop: 0, marginBottom: 10, color: "#ef4444" }}>
            ⚠️ ATTENTION
          </h2>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6 }}>
            Cette opération va supprimer <strong>TOUS</strong> les profils, parties, groupes et messages de Firestore.
            Cette action est <strong>IRRÉVERSIBLE</strong>.
          </p>
        </div>

        {counts && (
          <div
            style={{
              background: "#1f1f1f",
              border: "1px solid #2a2a2a",
              borderRadius: 12,
              padding: 20,
              marginBottom: 30,
            }}
          >
            <h2 style={{ fontSize: 18, marginTop: 0, marginBottom: 15 }}>📊 État actuel</h2>
            <div style={{ display: "grid", gap: 10, fontSize: 14 }}>
              <div>Profils: <strong>{counts.profils}</strong></div>
              <div>Parties: <strong>{counts.parties}</strong></div>
              <div>Groupes: <strong>{counts.groupes}</strong></div>
              <div>Messages: <strong>{counts.messages}</strong></div>
              <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid #2a2a2a" }}>
                TOTAL: <strong>{counts.profils + counts.parties + counts.groupes + counts.messages}</strong> documents
              </div>
            </div>
          </div>
        )}

        <div style={{ display: "grid", gap: 15, marginBottom: 30 }}>
          <button
            onClick={countDocuments}
            disabled={loading}
            style={{
              padding: "14px 20px",
              borderRadius: 10,
              border: "1px solid #3b82f6",
              background: "#3b82f6",
              color: "#fff",
              fontSize: 16,
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.5 : 1,
            }}
          >
            📊 Compter les documents
          </button>

          <button
            onClick={cleanAllData}
            disabled={loading || !counts || (counts.profils === 0 && counts.parties === 0 && counts.groupes === 0 && counts.messages === 0)}
            style={{
              padding: "14px 20px",
              borderRadius: 10,
              border: "1px solid #ef4444",
              background: "#ef4444",
              color: "#fff",
              fontSize: 16,
              fontWeight: 600,
              cursor: loading || !counts || (counts.profils === 0 && counts.parties === 0 && counts.groupes === 0 && counts.messages === 0) ? "not-allowed" : "pointer",
              opacity: loading || !counts || (counts.profils === 0 && counts.parties === 0 && counts.groupes === 0 && counts.messages === 0) ? 0.5 : 1,
            }}
          >
            {loading ? "🗑️ Suppression en cours..." : "🗑️ SUPPRIMER TOUTES LES DONNÉES"}
          </button>
        </div>

        {logs.length > 0 && (
          <div
            style={{
              background: "#1f1f1f",
              border: "1px solid #2a2a2a",
              borderRadius: 12,
              padding: 20,
              maxHeight: 400,
              overflowY: "auto",
            }}
          >
            <h2 style={{ fontSize: 18, marginTop: 0, marginBottom: 15 }}>📋 Journal</h2>
            <div style={{ display: "grid", gap: 8, fontSize: 13, fontFamily: "monospace" }}>
              {logs.map((log, index) => (
                <div key={index} style={{ opacity: 0.9 }}>
                  {log}
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ textAlign: "center", marginTop: 30 }}>
          <a
            href="/"
            style={{
              color: "#3b82f6",
              textDecoration: "underline",
              fontSize: 14,
            }}
          >
            ← Retour à l'accueil
          </a>
        </div>
      </div>
    </div>
  );
}
