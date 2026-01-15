"use client";

import { useState, useEffect } from "react";
import { migrateProfilsToFirebase, type MigrationResult } from "@/lib/data/migration";
import { loadProfilsGlobaux } from "@/lib/data/profils-globaux";
import { migrateAllDataToFirestore, countLocalData, type MigrationDataResult } from "@/lib/data/migrate-data";
import { STORAGE_KEYS, loadFromStorage } from "@/lib/data/storage";

export default function MigrationPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MigrationResult | null>(null);
  const [profilsCount, setProfilsCount] = useState(0);
  const [loadingData, setLoadingData] = useState(false);
  const [dataResult, setDataResult] = useState<MigrationDataResult | null>(null);
  const [dataCounts, setDataCounts] = useState({ parties: 0, groupes: 0, messages: 0 });
  const [logs, setLogs] = useState<string[]>([]);
  const [profilsData, setProfilsData] = useState<any[]>([]);

  // Charger le nombre de profils locaux et afficher les données
  useEffect(() => {
    const profils = loadProfilsGlobaux();
    setProfilsCount(profils.length);
    setProfilsData(profils);
    
    // Compter les données locales
    const counts = countLocalData();
    setDataCounts(counts);
  }, []);

  function addLog(message: string) {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, `[${timestamp}] ${message}`]);
    console.log(message);
  }

  async function handleMigration() {
    if (!confirm(`Êtes-vous sûr de vouloir migrer ${profilsCount} profils vers Firebase ?\n\nNote: Les utilisateurs devront réinitialiser leur mot de passe après la migration.`)) {
      return;
    }

    setLoading(true);
    setResult(null);
    setLogs([]);
    addLog(`🚀 Début de la migration de ${profilsCount} profils...`);

    try {
      const migrationResult = await migrateProfilsToFirebase();
      setResult(migrationResult);
      
      if (migrationResult.success) {
        addLog(`✅ Migration réussie : ${migrationResult.migrated} profils migrés`);
      } else {
        addLog(`⚠️ Migration terminée avec des erreurs : ${migrationResult.migrated} migrés, ${migrationResult.failed} échoués`);
      }
    } catch (error: any) {
      addLog(`❌ Erreur lors de la migration : ${error.message}`);
      setResult({
        success: false,
        migrated: 0,
        failed: 0,
        errors: [`Erreur: ${error.message}`],
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleDataMigration() {
    const total = dataCounts.parties + dataCounts.groupes + dataCounts.messages;
    if (total === 0) {
      alert("Aucune donnée locale à migrer.");
      return;
    }
    
    if (!confirm(`Êtes-vous sûr de vouloir migrer les données vers Firestore ?\n\n- ${dataCounts.parties} parties\n- ${dataCounts.groupes} groupes\n- ${dataCounts.messages} messages\n\nCette opération peut prendre quelques instants.`)) {
      return;
    }

    setLoadingData(true);
    setDataResult(null);
    setLogs([]);
    addLog(`🚀 Début de la migration des données...`);
    addLog(`📊 Parties: ${dataCounts.parties}, Groupes: ${dataCounts.groupes}, Messages: ${dataCounts.messages}`);

    try {
      const migrationResult = await migrateAllDataToFirestore();
      setDataResult(migrationResult);
      
      addLog(`✅ Migration terminée :`);
      addLog(`  - Parties: ${migrationResult.parties.migrated} migrées, ${migrationResult.parties.failed} échouées`);
      addLog(`  - Groupes: ${migrationResult.groupes.migrated} migrés, ${migrationResult.groupes.failed} échoués`);
      addLog(`  - Messages: ${migrationResult.messages.migrated} migrés, ${migrationResult.messages.failed} échoués`);
      
      // Recompter après migration
      const newCounts = countLocalData();
      setDataCounts(newCounts);
    } catch (error: any) {
      addLog(`❌ Erreur lors de la migration : ${error.message}`);
      setDataResult({
        success: false,
        parties: { migrated: 0, failed: 0, errors: [`Erreur: ${error.message}`] },
        groupes: { migrated: 0, failed: 0, errors: [] },
        messages: { migrated: 0, failed: 0, errors: [] },
      });
    } finally {
      setLoadingData(false);
    }
  }

  async function handleFullMigration() {
    if (!confirm(`Migration complète de TOUTES les données vers Firebase ?\n\n- ${profilsCount} profils\n- ${dataCounts.parties} parties\n- ${dataCounts.groupes} groupes\n- ${dataCounts.messages} messages\n\nCette opération peut prendre plusieurs minutes.`)) {
      return;
    }

    setLoading(true);
    setLoadingData(true);
    setResult(null);
    setDataResult(null);
    setLogs([]);
    addLog(`🚀 DÉBUT DE LA MIGRATION COMPLÈTE`);

    try {
      // 1. Migrer les profils d'abord
      addLog(`📋 Étape 1/2 : Migration des profils...`);
      const profilsResult = await migrateProfilsToFirebase();
      setResult(profilsResult);
      addLog(`✅ Profils : ${profilsResult.migrated} migrés, ${profilsResult.failed} échoués`);

      // 2. Attendre un peu pour la synchronisation
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // 3. Migrer les données (parties, groupes, messages)
      addLog(`📋 Étape 2/2 : Migration des parties, groupes et messages...`);
      const dataResult = await migrateAllDataToFirestore();
      setDataResult(dataResult);
      addLog(`✅ Données : Parties ${dataResult.parties.migrated}, Groupes ${dataResult.groupes.migrated}, Messages ${dataResult.messages.migrated}`);

      addLog(`🎉 MIGRATION COMPLÈTE TERMINÉE !`);
      
      // Recompter
      const newCounts = countLocalData();
      setDataCounts(newCounts);
      const newProfils = loadProfilsGlobaux();
      setProfilsCount(newProfils.length);
    } catch (error: any) {
      addLog(`❌ ERREUR : ${error.message}`);
    } finally {
      setLoading(false);
      setLoadingData(false);
    }
  }

  return (
    <div
      style={{
        background: "transparent",
        color: "#fff",
        minHeight: "100vh",
        padding: "24px 16px",
        maxWidth: 800,
        margin: "0 auto",
      }}
    >
      <h1 style={{ fontSize: 28, marginBottom: 20, fontWeight: 700 }}>🚀 Migration vers Firebase</h1>

      {/* Résumé des données locales */}
      <div
        style={{
          background: "#1a1a1a",
          padding: 24,
          borderRadius: 12,
          marginBottom: 24,
          border: "1px solid #2a2a2a",
        }}
      >
        <h2 style={{ fontSize: 20, marginBottom: 16, fontWeight: 600 }}>📊 Données locales disponibles</h2>
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", padding: 12, background: "#2a2a2a", borderRadius: 8 }}>
            <span>👥 Profils :</span>
            <strong>{profilsCount}</strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: 12, background: "#2a2a2a", borderRadius: 8 }}>
            <span>🎾 Parties :</span>
            <strong>{dataCounts.parties}</strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: 12, background: "#2a2a2a", borderRadius: 8 }}>
            <span>👥 Groupes :</span>
            <strong>{dataCounts.groupes}</strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: 12, background: "#2a2a2a", borderRadius: 8 }}>
            <span>💬 Messages :</span>
            <strong>{dataCounts.messages}</strong>
          </div>
        </div>
      </div>

      {/* Liste des profils */}
      {profilsData.length > 0 && (
        <div
          style={{
            background: "#1a1a1a",
            padding: 24,
            borderRadius: 12,
            marginBottom: 24,
            border: "1px solid #2a2a2a",
          }}
        >
          <h2 style={{ fontSize: 20, marginBottom: 16, fontWeight: 600 }}>👥 Profils à migrer</h2>
          <div style={{ display: "grid", gap: 8, maxHeight: 300, overflowY: "auto" }}>
            {profilsData.map((profil, index) => (
              <div key={index} style={{ padding: 12, background: "#2a2a2a", borderRadius: 8, fontSize: 14 }}>
                <strong>{profil.pseudo}</strong> ({profil.email}) - {profil.niveau}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bouton migration complète */}
      <button
        onClick={handleFullMigration}
        disabled={loading || loadingData || (profilsCount === 0 && dataCounts.parties === 0 && dataCounts.groupes === 0)}
        style={{
          padding: "16px 28px",
          borderRadius: 10,
          border: "none",
          background: loading || loadingData || (profilsCount === 0 && dataCounts.parties === 0 && dataCounts.groupes === 0) ? "#2a2a2a" : "#10b981",
          color: "#fff",
          fontWeight: 700,
          fontSize: 16,
          cursor: loading || loadingData || (profilsCount === 0 && dataCounts.parties === 0 && dataCounts.groupes === 0) ? "not-allowed" : "pointer",
          opacity: loading || loadingData || (profilsCount === 0 && dataCounts.parties === 0 && dataCounts.groupes === 0) ? 0.6 : 1,
          width: "100%",
          marginBottom: 16,
        }}
      >
        {loading || loadingData
          ? "⏳ Migration en cours..."
          : profilsCount === 0 && dataCounts.parties === 0 && dataCounts.groupes === 0
          ? "Aucune donnée à migrer"
          : `🚀 MIGRATION COMPLÈTE (${profilsCount + dataCounts.parties + dataCounts.groupes} éléments)`}
      </button>

      {/* Boutons de migration séparés */}
      <div style={{ display: "grid", gap: 12, marginBottom: 24 }}>
        <button
          onClick={handleMigration}
          disabled={loading || profilsCount === 0}
          style={{
            padding: "14px 28px",
            borderRadius: 10,
            border: "none",
            background: loading || profilsCount === 0 ? "#2a2a2a" : "#3b82f6",
            color: "#fff",
            fontWeight: 600,
            fontSize: 14,
            cursor: loading || profilsCount === 0 ? "not-allowed" : "pointer",
            opacity: loading || profilsCount === 0 ? 0.6 : 1,
            width: "100%",
          }}
        >
          {loading ? "Migration en cours..." : profilsCount === 0 ? "Aucun profil à migrer" : `Migrer ${profilsCount} profils uniquement`}
        </button>

        <button
          onClick={handleDataMigration}
          disabled={loadingData || (dataCounts.parties === 0 && dataCounts.groupes === 0 && dataCounts.messages === 0)}
          style={{
            padding: "14px 28px",
            borderRadius: 10,
            border: "none",
            background: loadingData || (dataCounts.parties === 0 && dataCounts.groupes === 0 && dataCounts.messages === 0) ? "#2a2a2a" : "#8b5cf6",
            color: "#fff",
            fontWeight: 600,
            fontSize: 14,
            cursor: loadingData || (dataCounts.parties === 0 && dataCounts.groupes === 0 && dataCounts.messages === 0) ? "not-allowed" : "pointer",
            opacity: loadingData || (dataCounts.parties === 0 && dataCounts.groupes === 0 && dataCounts.messages === 0) ? 0.6 : 1,
            width: "100%",
          }}
        >
          {loadingData
            ? "Migration en cours..."
            : dataCounts.parties === 0 && dataCounts.groupes === 0 && dataCounts.messages === 0
            ? "Aucune donnée à migrer"
            : `Migrer parties/groupes/messages uniquement`}
        </button>
      </div>

      {/* Logs */}
      {logs.length > 0 && (
        <div
          style={{
            background: "#1a1a1a",
            padding: 24,
            borderRadius: 12,
            marginBottom: 24,
            border: "1px solid #2a2a2a",
          }}
        >
          <h2 style={{ fontSize: 20, marginBottom: 16, fontWeight: 600 }}>📋 Logs de migration</h2>
          <div
            style={{
              background: "#0a0a0a",
              padding: 16,
              borderRadius: 8,
              fontFamily: "monospace",
              fontSize: 12,
              maxHeight: 300,
              overflowY: "auto",
              lineHeight: 1.6,
            }}
          >
            {logs.map((log, index) => (
              <div key={index} style={{ marginBottom: 4 }}>
                {log}
              </div>
            ))}
          </div>
        </div>
      )}

      <div
        style={{
          background: "#1a1a1a",
          padding: 24,
          borderRadius: 12,
          marginBottom: 24,
          border: "1px solid #2a2a2a",
        }}
      >
        <h2 style={{ fontSize: 20, marginBottom: 16, fontWeight: 600 }}>ℹ️ Informations</h2>
        <ul style={{ marginLeft: 20, marginBottom: 16, lineHeight: 1.8 }}>
          <li>Chaque profil sera créé dans Firebase Auth avec un mot de passe temporaire</li>
          <li>Les utilisateurs devront réinitialiser leur mot de passe après la migration</li>
          <li>Les profils existants dans Firebase ne seront pas écrasés</li>
        </ul>
        <div
          style={{
            background: "#2a2a2a",
            padding: 16,
            borderRadius: 8,
            marginTop: 16,
            borderLeft: "4px solid #f59e0b",
          }}
        >
          <strong style={{ color: "#f59e0b" }}>⚠️ Important :</strong>
          <p style={{ marginTop: 8, marginBottom: 0, lineHeight: 1.6 }}>
            Les mots de passe locaux ne peuvent pas être récupérés. Chaque utilisateur devra utiliser la fonctionnalité "Mot de passe oublié" pour réinitialiser son mot de passe après la migration.
          </p>
        </div>
      </div>

      <button
        onClick={handleMigration}
        disabled={loading || profilsCount === 0}
        style={{
          padding: "14px 28px",
          borderRadius: 10,
          border: "none",
          background: loading || profilsCount === 0 ? "#2a2a2a" : "#10b981",
          color: "#fff",
          fontWeight: 600,
          fontSize: 16,
          cursor: loading || profilsCount === 0 ? "not-allowed" : "pointer",
          opacity: loading || profilsCount === 0 ? 0.6 : 1,
          width: "100%",
          marginBottom: 24,
        }}
      >
        {loading ? "Migration en cours..." : profilsCount === 0 ? "Aucun profil à migrer" : `Migrer ${profilsCount} profils`}
      </button>

      {result && (
        <div
          style={{
            background: result.success ? "#1a3a2a" : "#3a1a1a",
            padding: 24,
            borderRadius: 12,
            border: `1px solid ${result.success ? "#10b981" : "#ef4444"}`,
          }}
        >
          <h2
            style={{
              fontSize: 20,
              marginBottom: 16,
              fontWeight: 600,
              color: result.success ? "#10b981" : "#ef4444",
            }}
          >
            {result.success ? "✅ Migration réussie" : "❌ Migration terminée avec des erreurs"}
          </h2>

          <div style={{ marginBottom: 16 }}>
            <p>
              <strong>Profils migrés :</strong> {result.migrated}
            </p>
            <p>
              <strong>Profils échoués :</strong> {result.failed}
            </p>
          </div>

          {result.errors.length > 0 && (
            <div
              style={{
                background: "#2a2a2a",
                padding: 16,
                borderRadius: 8,
                marginTop: 16,
              }}
            >
              <strong style={{ color: "#ef4444", display: "block", marginBottom: 8 }}>Erreurs :</strong>
              <ul style={{ marginLeft: 20, lineHeight: 1.8 }}>
                {result.errors.map((error, index) => (
                  <li key={index} style={{ marginBottom: 4 }}>
                    {error}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.migrated > 0 && (
            <div
              style={{
                background: "#1a3a2a",
                padding: 16,
                borderRadius: 8,
                marginTop: 16,
                borderLeft: "4px solid #10b981",
              }}
            >
              <p style={{ margin: 0, lineHeight: 1.6 }}>
                <strong>✅ Prochaines étapes :</strong>
              </p>
              <ul style={{ marginLeft: 20, marginTop: 8, lineHeight: 1.8 }}>
                <li>Les utilisateurs migrés doivent utiliser "Mot de passe oublié" pour réinitialiser leur mot de passe</li>
                <li>Ils recevront un email de réinitialisation de Firebase</li>
                <li>Une fois le mot de passe réinitialisé, ils pourront se connecter normalement</li>
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
