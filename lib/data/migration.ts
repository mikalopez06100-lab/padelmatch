// Script de migration des profils locaux vers Firebase
// Migre les profils stockés dans localStorage vers Firebase Auth + Firestore

import { loadProfilsGlobaux, type ProfilGlobal } from "./profils-globaux";
import { createAccount, login } from "../firebase/auth";
import { getProfil, updateProfil } from "../firebase/firestore";
import type { Profil } from "../types";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../firebase/config";

export interface MigrationResult {
  success: boolean;
  migrated: number;
  failed: number;
  errors: string[];
}

/**
 * Migre tous les profils locaux vers Firebase
 * Crée un compte Firebase Auth pour chaque profil et le profil dans Firestore
 */
export async function migrateProfilsToFirebase(): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: true,
    migrated: 0,
    failed: 0,
    errors: [],
  };

  try {
    // Charger tous les profils depuis localStorage
    const profilsLocaux = loadProfilsGlobaux();
    
    if (profilsLocaux.length === 0) {
      return {
        ...result,
        success: true,
      };
    }

    console.log(`Début de la migration de ${profilsLocaux.length} profils...`);

    // Migrer chaque profil
    for (const profilLocal of profilsLocaux) {
      try {
        // Vérifier si le profil existe déjà dans Firebase (par email)
        // On ne peut pas vérifier directement, donc on essaie de créer le compte
        // Si l'email existe déjà, Firebase renverra une erreur
        
        // Extraire le mot de passe depuis le passwordHash n'est pas possible
        // On doit générer un nouveau mot de passe temporaire ou demander à l'utilisateur
        // Pour l'instant, on génère un mot de passe temporaire basé sur l'email
        
        // Générer un mot de passe temporaire (l'utilisateur devra le réinitialiser)
        const tempPassword = generateTempPassword(profilLocal.email);
        
        try {
          // Créer le compte Firebase Auth
          const user = await createAccount(
            profilLocal.email,
            tempPassword,
            {
              pseudo: profilLocal.pseudo,
              niveau: profilLocal.niveau,
              friendlyScore: profilLocal.friendlyScore ?? 50,
              xp: profilLocal.xp ?? 0,
              photoUrl: profilLocal.photoUrl,
            }
          );

          // Le profil a été créé par createAccount dans Firestore
          result.migrated++;
          console.log(`✅ Profil migré: ${profilLocal.pseudo} (${profilLocal.email})`);
        } catch (error: any) {
          // Si l'email existe déjà dans Firebase Auth, on essaie de se connecter
          if (error.code === "auth/email-already-in-use") {
            try {
              // Essayer de se connecter avec le mot de passe temporaire
              // Si ça ne fonctionne pas, on note l'erreur
              const user = await login(profilLocal.email, tempPassword);
              if (user) {
                // Mettre à jour le profil dans Firestore
                const existingProfil = await getProfil(user.uid);
                const profilData: Partial<Profil> = {
                  pseudo: profilLocal.pseudo,
                  niveau: profilLocal.niveau,
                  friendlyScore: profilLocal.friendlyScore ?? 50,
                  xp: profilLocal.xp ?? 0,
                  photoUrl: profilLocal.photoUrl,
                };
                
                if (existingProfil) {
                  await updateProfil(user.uid, profilData);
                  result.migrated++;
                  console.log(`✅ Profil mis à jour (compte existant): ${profilLocal.pseudo} (${profilLocal.email})`);
                } else {
                  // Le compte existe mais pas le profil Firestore, on le crée avec setDoc
                  await setDoc(doc(db, "profils", user.uid), {
                    ...profilData,
                    email: profilLocal.email,
                  });
                  result.migrated++;
                  console.log(`✅ Profil créé (compte existant): ${profilLocal.pseudo} (${profilLocal.email})`);
                }
              }
            } catch (loginError: any) {
              // Le compte existe mais on ne peut pas se connecter
              // L'utilisateur devra réinitialiser son mot de passe
              result.failed++;
              const errorMsg = `Compte existant pour ${profilLocal.email} - réinitialisation du mot de passe nécessaire`;
              result.errors.push(errorMsg);
              console.warn(`⚠️ ${errorMsg}`);
            }
          } else {
            result.failed++;
            const errorMsg = `Erreur pour ${profilLocal.email}: ${error.message}`;
            result.errors.push(errorMsg);
            console.error(`❌ ${errorMsg}`);
          }
        }
      } catch (error: any) {
        result.failed++;
        const errorMsg = `Erreur lors de la migration de ${profilLocal.pseudo}: ${error.message}`;
        result.errors.push(errorMsg);
        console.error(`❌ ${errorMsg}`);
      }
    }

    console.log(`Migration terminée: ${result.migrated} migrés, ${result.failed} échoués`);
    result.success = result.failed === 0;

    return result;
  } catch (error: any) {
    result.success = false;
    result.errors.push(`Erreur générale: ${error.message}`);
    return result;
  }
}

/**
 * Génère un mot de passe temporaire basé sur l'email
 * Note: Ce n'est pas sécurisé, mais nécessaire pour la migration
 * L'utilisateur devra réinitialiser son mot de passe après la migration
 */
function generateTempPassword(email: string): string {
  // Utiliser une partie de l'email + un suffixe fixe pour la migration
  // L'utilisateur devra réinitialiser son mot de passe
  const emailPart = email.split("@")[0].substring(0, 6);
  const randomPart = Math.random().toString(36).substring(2, 8);
  return `${emailPart}${randomPart}Mig2024!`;
}
