"use client";

import { useState, useEffect } from "react";
import { loadProfilsGlobaux } from "@/lib/data/profils-globaux";
import { STORAGE_KEYS, loadFromStorage } from "@/lib/data/storage";

export default function ExportDataPage() {
  const [profils, setProfils] = useState<any[]>([]);
  const [parties, setParties] = useState<any[]>([]);
  const [groupes, setGroupes] = useState<any[]>([]);
  const [messages, setMessages] = useState<any>({});

  useEffect(() => {
    // Charger toutes les données locales
    const profilsData = loadProfilsGlobaux();
    setProfils(profilsData);

    const partiesData = loadFromStorage<any[]>(STORAGE_KEYS.parties, []);
    setParties(partiesData);

    const groupesData = loadFromStorage<any[]>(STORAGE_KEYS.groupes, []);
    setGroupes(groupesData);

    const messagesData = loadFromStorage<Record<string, any[]>>(STORAGE_KEYS.messages, {});
    setMessages(messagesData);
  }, []);

  function exportToJSON() {
    const dataToExport = {
      profils,
      parties,
      groupes,
      messages,
      exportedAt: new Date().toISOString(),
    };

    const json = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `padelmatch-export-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    alert("✅ Données exportées avec succès !");
  }

  function copyToClipboard() {
    const dataToExport = {
      profils,
      parties,
      groupes,
      messages,
      exportedAt: new Date().toISOString(),
    };

    const json = JSON.stringify(dataToExport, null, 2);
    navigator.clipboard.writeText(json);
    alert("✅ Données copiées dans le presse-papiers !");
  }

  const totalItems = profils.length + parties.length + groupes.length + Object.values(messages).reduce((sum: number, msgs: any) => sum + (Array.isArray(msgs) ? msgs.length : 0), 0);

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
        💾 Export des données locales
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
          📊 Résumé des données
        </h2>
        <div style={{ display: "grid", gap: 12 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: 12,
              background: "#2a2a2a",
              borderRadius: 8,
            }}
          >
            <span>👥 Profils :</span>
            <strong>{profils.length}</strong>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: 12,
              background: "#2a2a2a",
              borderRadius: 8,
            }}
          >
            <span>🎾 Parties :</span>
            <strong>{parties.length}</strong>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: 12,
              background: "#2a2a2a",
              borderRadius: 8,
            }}
          >
            <span>👥 Groupes :</span>
            <strong>{groupes.length}</strong>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: 12,
              background: "#2a2a2a",
              borderRadius: 8,
            }}
          >
            <span>💬 Messages :</span>
            <strong>
              {Object.values(messages).reduce(
                (sum: number, msgs: any) => sum + (Array.isArray(msgs) ? msgs.length : 0),
                0
              )}
            </strong>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: 12,
              background: "#10b981",
              borderRadius: 8,
              fontWeight: 600,
            }}
          >
            <span>📦 Total :</span>
            <strong>{totalItems} éléments</strong>
          </div>
        </div>
      </div>

      {profils.length > 0 && (
        <div
          style={{
            background: "#1a1a1a",
            padding: 24,
            borderRadius: 12,
            marginBottom: 24,
            border: "1px solid #2a2a2a",
          }}
        >
          <h2 style={{ fontSize: 20, marginBottom: 16, fontWeight: 600 }}>👥 Profils</h2>
          <div style={{ display: "grid", gap: 8, maxHeight: 200, overflowY: "auto" }}>
            {profils.map((profil, index) => (
              <div
                key={index}
                style={{
                  padding: 12,
                  background: "#2a2a2a",
                  borderRadius: 8,
                  fontSize: 14,
                }}
              >
                <strong>{profil.pseudo}</strong> ({profil.email}) - {profil.niveau}
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <button
          onClick={exportToJSON}
          disabled={totalItems === 0}
          style={{
            padding: "16px 28px",
            borderRadius: 10,
            border: "none",
            background: totalItems === 0 ? "#2a2a2a" : "#10b981",
            color: "#fff",
            fontWeight: 600,
            fontSize: 16,
            cursor: totalItems === 0 ? "not-allowed" : "pointer",
            opacity: totalItems === 0 ? 0.6 : 1,
            flex: 1,
            minWidth: 200,
          }}
        >
          💾 Télécharger en JSON
        </button>
        <button
          onClick={copyToClipboard}
          disabled={totalItems === 0}
          style={{
            padding: "16px 28px",
            borderRadius: 10,
            border: "1px solid #2a2a2a",
            background: totalItems === 0 ? "#2a2a2a" : "transparent",
            color: "#fff",
            fontWeight: 600,
            fontSize: 16,
            cursor: totalItems === 0 ? "not-allowed" : "pointer",
            opacity: totalItems === 0 ? 0.6 : 1,
            flex: 1,
            minWidth: 200,
          }}
        >
          📋 Copier dans le presse-papiers
        </button>
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
          💡 Comment utiliser ces données
        </h3>
        <ol style={{ lineHeight: 1.8, marginLeft: 20 }}>
          <li>
            Clique sur <strong>"Télécharger en JSON"</strong> pour sauvegarder toutes tes données
          </li>
          <li>
            Tu auras un fichier JSON avec tous tes profils, parties, groupes et messages
          </li>
          <li>
            Ce fichier peut servir de sauvegarde ou être utilisé pour migrer vers Firebase plus tard
          </li>
        </ol>
      </div>
    </div>
  );
}
