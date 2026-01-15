// Fonctions pour Firebase Storage

import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import app from "./config";

const storage = getStorage(app);

/**
 * Upload une image de fond et retourne son URL
 */
export async function uploadBackgroundImage(file: File): Promise<string> {
  try {
    // Créer une référence vers le fichier dans Storage
    const storageRef = ref(storage, "background/background-image.jpg");
    
    // Uploader le fichier
    await uploadBytes(storageRef, file);
    
    // Récupérer l'URL de téléchargement
    const downloadURL = await getDownloadURL(storageRef);
    
    return downloadURL;
  } catch (error: any) {
    console.error("❌ Erreur lors de l'upload de l'image de fond:", error);
    throw new Error(`Erreur lors de l'upload: ${error.message}`);
  }
}

/**
 * Récupère l'URL de l'image de fond depuis Storage
 */
export async function getBackgroundImageUrl(): Promise<string | null> {
  try {
    const storageRef = ref(storage, "background/background-image.jpg");
    const url = await getDownloadURL(storageRef);
    return url;
  } catch (error: any) {
    // Si l'image n'existe pas encore, retourner null
    if (error.code === "storage/object-not-found") {
      return null;
    }
    console.error("❌ Erreur lors de la récupération de l'image de fond:", error);
    return null;
  }
}
