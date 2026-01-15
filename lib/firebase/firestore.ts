// Fonctions Firestore pour gérer les données

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
} from "firebase/firestore";
import { db } from "./config";
import type { Partie, Groupe, Profil, Message, Terrain } from "@/lib/types";
import { convertOldNiveauToNew } from "@/lib/utils/niveau";

// ===== PROFILS =====

/**
 * Récupère un profil par userId
 */
export async function getProfil(userId: string): Promise<Profil | null> {
  try {
    const docRef = doc(db, "profils", userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      // Migration automatique : convertir les anciens niveaux string en nouveaux niveaux numériques
      const niveauMigre = typeof data.niveau === "string" 
        ? convertOldNiveauToNew(data.niveau) 
        : (typeof data.niveau === "number" ? data.niveau : 2.5);
      
      return {
        ...data,
        niveau: niveauMigre,
        // Convertir les timestamps en nombres si nécessaire
      } as Profil;
    }
    return null;
  } catch (error) {
    console.error("Erreur lors de la récupération du profil:", error);
    return null;
  }
}

/**
 * Met à jour un profil
 */
export async function updateProfil(userId: string, data: Partial<Profil>) {
  try {
    const docRef = doc(db, "profils", userId);
    
    // Migration automatique : convertir le niveau si c'est encore une string
    let dataMigre = { ...data };
    if (data.niveau !== undefined) {
      dataMigre.niveau = typeof data.niveau === "string" 
        ? convertOldNiveauToNew(data.niveau) 
        : data.niveau;
    }
    
    const cleanedData = cleanFirestoreData({
      ...dataMigre,
      updatedAt: Timestamp.now(),
    });
    await updateDoc(docRef, cleanedData);
    
    // Si le niveau a été migré, mettons à jour automatiquement dans Firestore pour les prochaines fois
    if (typeof data.niveau === "string") {
      console.log(`✅ Niveau migré pour ${userId}: "${data.niveau}" → ${dataMigre.niveau}`);
    }
  } catch (error) {
    console.error("Erreur lors de la mise à jour du profil:", error);
    throw error;
  }
}

/**
 * Récupère tous les profils
 */
export async function getAllProfils(): Promise<Profil[]> {
  try {
    console.log("🔄 Récupération de tous les profils depuis Firestore...");
    const querySnapshot = await getDocs(collection(db, "profils"));
    console.log(`✅ ${querySnapshot.docs.length} profils trouvés dans Firestore`);
    
    const profils = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      // Migration automatique : convertir les anciens niveaux string en nouveaux niveaux numériques
      const niveauMigre = typeof data.niveau === "string" 
        ? convertOldNiveauToNew(data.niveau) 
        : (typeof data.niveau === "number" ? data.niveau : 2.5);
      
      return {
        ...data,
        niveau: niveauMigre,
        // Inclure l'ID du document pour l'identification unique
        id: doc.id,
      } as Profil & { id: string };
    });
    
    console.log("📋 Profils récupérés:", profils.map(p => ({ pseudo: p.pseudo, email: p.email, id: (p as any).id })));
    return profils as Profil[];
  } catch (error: any) {
    console.error("❌ Erreur lors de la récupération des profils:", error);
    console.error("Code d'erreur:", error.code);
    console.error("Message:", error.message);
    if (error.code === "permission-denied") {
      console.error("⚠️ Permission refusée - Vérifiez les règles Firestore");
    }
    return [];
  }
}

// ===== PARTIES =====

/**
 * Récupère toutes les parties
 */
export async function getParties(): Promise<Partie[]> {
  try {
    console.log("🔄 Connexion à Firestore...");
    const q = query(collection(db, "parties"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    console.log("✅ Connexion Firestore réussie,", querySnapshot.docs.length, "parties trouvées");
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toMillis?.() || doc.data().createdAt || Date.now(),
    })) as Partie[];
  } catch (error: any) {
    console.error("❌ Erreur lors de la récupération des parties:", error);
    console.error("Code d'erreur:", error.code);
    console.error("Message:", error.message);
    
    // Si c'est un problème d'index, essayer sans orderBy
    if (error.code === "failed-precondition") {
      console.warn("⚠️ Index Firestore manquant, tentative sans tri...");
      try {
        const querySnapshot = await getDocs(collection(db, "parties"));
        const parties = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toMillis?.() || doc.data().createdAt || Date.now(),
        })) as Partie[];
        // Trier manuellement côté client
        parties.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        console.log("✅ Récupération réussie sans index,", parties.length, "parties trouvées");
        return parties;
      } catch (fallbackError: any) {
        console.error("❌ Erreur même sans tri:", fallbackError);
      }
    }
    
    if (error.code === "permission-denied") {
      console.error("⚠️ Permission refusée - Vérifiez les règles Firestore");
      console.error("👉 Déployez les règles: firebase deploy --only firestore:rules");
    }
    
    // En cas d'erreur, retourner un tableau vide mais afficher l'erreur
    throw error; // Propager l'erreur pour que l'app puisse l'afficher
  }
}

/**
 * Nettoie un objet en supprimant les valeurs undefined
 * Firestore n'accepte pas les valeurs undefined
 */
function cleanFirestoreData(data: any): any {
  const cleaned: any = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

/**
 * Récupère une partie par son ID
 */
export async function getPartie(partieId: string): Promise<Partie | null> {
  try {
    const docRef = doc(db, "parties", partieId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toMillis?.() || data.createdAt || Date.now(),
      } as Partie;
    }
    return null;
  } catch (error) {
    console.error("Erreur lors de la récupération de la partie:", error);
    return null;
  }
}

/**
 * Crée une nouvelle partie
 */
export async function createPartie(partie: Omit<Partie, "id" | "createdAt">): Promise<string> {
  try {
    console.log("🔄 Création de la partie dans Firestore:", partie);
    
    // Nettoyer les valeurs undefined (Firestore ne les accepte pas)
    const partieData = cleanFirestoreData({
      ...partie,
      createdAt: Timestamp.now(),
    });
    
    const docRef = await addDoc(collection(db, "parties"), partieData);
    console.log("✅ Partie créée avec succès, ID:", docRef.id);
    return docRef.id;
  } catch (error: any) {
    console.error("❌ Erreur lors de la création de la partie:", error);
    console.error("Code d'erreur:", error.code);
    console.error("Message:", error.message);
    if (error.code === "permission-denied") {
      console.error("⚠️ Permission refusée - Vérifiez les règles Firestore");
    }
    throw error;
  }
}

/**
 * Met à jour une partie
 */
export async function updatePartie(partieId: string, updates: Partial<Partie>) {
  try {
    const docRef = doc(db, "parties", partieId);
    // Nettoyer les valeurs undefined
    const cleanedUpdates = cleanFirestoreData(updates);
    await updateDoc(docRef, cleanedUpdates);
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la partie:", error);
    throw error;
  }
}

/**
 * Supprime une partie
 */
export async function deletePartie(partieId: string) {
  try {
    await deleteDoc(doc(db, "parties", partieId));
  } catch (error) {
    console.error("Erreur lors de la suppression de la partie:", error);
    throw error;
  }
}

/**
 * Écoute les changements de parties en temps réel
 */
export function subscribeToParties(callback: (parties: Partie[]) => void) {
  const q = query(collection(db, "parties"), orderBy("createdAt", "desc"));
  return onSnapshot(
    q,
    (snapshot) => {
      const parties = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toMillis?.() || doc.data().createdAt || Date.now(),
      })) as Partie[];
      callback(parties);
    },
    (error: any) => {
      console.error("❌ Erreur dans subscribeToParties:", error);
      if (error.code === "failed-precondition") {
        console.warn("⚠️ Index Firestore manquant pour orderBy, tentative sans tri...");
        // Fallback sans orderBy
        const qFallback = collection(db, "parties");
        onSnapshot(
          qFallback,
          (snapshot) => {
            const parties = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
              createdAt: doc.data().createdAt?.toMillis?.() || doc.data().createdAt || Date.now(),
            })) as Partie[];
            // Trier manuellement
            parties.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
            callback(parties);
          },
          (fallbackError: any) => {
            console.error("❌ Erreur même sans tri:", fallbackError);
            callback([]);
          }
        );
      } else {
        callback([]);
      }
    }
  );
}

// ===== GROUPES =====

/**
 * Récupère tous les groupes
 */
export async function getGroupes(): Promise<Groupe[]> {
  try {
    const querySnapshot = await getDocs(collection(db, "groupes"));
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toMillis?.() || doc.data().createdAt || Date.now(),
    })) as Groupe[];
  } catch (error) {
    console.error("Erreur lors de la récupération des groupes:", error);
    return [];
  }
}

/**
 * Crée un nouveau groupe
 */
export async function createGroupe(groupe: Omit<Groupe, "id" | "createdAt">): Promise<string> {
  try {
    const groupeData = cleanFirestoreData({
      ...groupe,
      createdAt: Timestamp.now(),
    });
    const docRef = await addDoc(collection(db, "groupes"), groupeData);
    return docRef.id;
  } catch (error) {
    console.error("Erreur lors de la création du groupe:", error);
    throw error;
  }
}

/**
 * Met à jour un groupe
 */
export async function updateGroupe(groupeId: string, updates: Partial<Groupe>) {
  try {
    const docRef = doc(db, "groupes", groupeId);
    const cleanedUpdates = cleanFirestoreData(updates);
    await updateDoc(docRef, cleanedUpdates);
  } catch (error) {
    console.error("Erreur lors de la mise à jour du groupe:", error);
    throw error;
  }
}

/**
 * Supprime un groupe
 */
export async function deleteGroupe(groupeId: string) {
  try {
    await deleteDoc(doc(db, "groupes", groupeId));
  } catch (error) {
    console.error("Erreur lors de la suppression du groupe:", error);
    throw error;
  }
}

// ===== MESSAGES =====

/**
 * Récupère les messages d'une partie
 */
export async function getMessages(partieId: string): Promise<Message[]> {
  try {
    const q = query(
      collection(db, "messages"),
      where("partieId", "==", partieId),
      orderBy("createdAt", "asc")
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toMillis?.() || doc.data().createdAt || Date.now(),
    })) as Message[];
  } catch (error) {
    console.error("Erreur lors de la récupération des messages:", error);
    return [];
  }
}

/**
 * Envoie un message
 */
export async function sendMessage(message: Omit<Message, "id" | "createdAt">): Promise<string> {
  try {
    const messageData = cleanFirestoreData({
      ...message,
      createdAt: Timestamp.now(),
    });
    const docRef = await addDoc(collection(db, "messages"), messageData);
    return docRef.id;
  } catch (error) {
    console.error("Erreur lors de l'envoi du message:", error);
    throw error;
  }
}

/**
 * Écoute les messages d'une partie en temps réel
 */
export function subscribeToMessages(partieId: string, callback: (messages: Message[]) => void) {
  const q = query(
    collection(db, "messages"),
    where("partieId", "==", partieId),
    orderBy("createdAt", "asc")
  );
  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toMillis?.() || doc.data().createdAt || Date.now(),
    })) as Message[];
    callback(messages);
  });
}

// ===== TERRAINS =====

/**
 * Récupère tous les terrains personnalisés depuis Firestore
 */
export async function getTerrainsPersonnalises(): Promise<Terrain[]> {
  try {
    const querySnapshot = await getDocs(collection(db, "terrains"));
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      estPersonnalise: true, // Tous les terrains dans Firestore sont personnalisés
    })) as Terrain[];
  } catch (error) {
    console.error("Erreur lors de la récupération des terrains:", error);
    return [];
  }
}

/**
 * Crée un nouveau terrain personnalisé
 */
export async function createTerrain(terrain: Omit<Terrain, "id">): Promise<string> {
  try {
    const terrainData = cleanFirestoreData({
      nom: terrain.nom,
      ville: terrain.ville,
      createdAt: Timestamp.now(),
    });
    const docRef = await addDoc(collection(db, "terrains"), terrainData);
    return docRef.id;
  } catch (error) {
    console.error("Erreur lors de la création du terrain:", error);
    throw error;
  }
}

/**
 * Met à jour un terrain personnalisé
 */
export async function updateTerrain(terrainId: string, updates: { nom?: string; ville?: string }) {
  try {
    const docRef = doc(db, "terrains", terrainId);
    const cleanedUpdates = cleanFirestoreData(updates);
    await updateDoc(docRef, cleanedUpdates);
  } catch (error) {
    console.error("Erreur lors de la mise à jour du terrain:", error);
    throw error;
  }
}

/**
 * Supprime un terrain personnalisé
 */
export async function deleteTerrain(terrainId: string) {
  try {
    await deleteDoc(doc(db, "terrains", terrainId));
  } catch (error) {
    console.error("Erreur lors de la suppression du terrain:", error);
    throw error;
  }
}
