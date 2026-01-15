// Script pour uploader l'image de fond vers Firebase Storage
// Usage: node scripts/upload-background.js <chemin-vers-image>

const { initializeApp } = require("firebase/app");
const { getStorage, ref, uploadBytes, getDownloadURL } = require("firebase/storage");
const fs = require("fs");
const path = require("path");

// Configuration Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCelnZTQR1ACPayc1GxC4vQz93t1z0m3iM",
  authDomain: "padelmatch06.firebaseapp.com",
  projectId: "padelmatch06",
  storageBucket: "padelmatch06.firebasestorage.app",
  messagingSenderId: "248975894384",
  appId: "1:248975894384:web:b2d004851f1b4a9c5911b5",
};

// Initialiser Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

async function uploadBackgroundImage(imagePath) {
  try {
    // Vérifier que le fichier existe
    if (!fs.existsSync(imagePath)) {
      console.error(`❌ Erreur: Le fichier "${imagePath}" n'existe pas.`);
      process.exit(1);
    }

    // Lire le fichier
    const fileBuffer = fs.readFileSync(imagePath);
    const fileName = path.basename(imagePath);
    const fileExtension = path.extname(fileName).toLowerCase();

    // Vérifier que c'est une image
    const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp"];
    if (!allowedExtensions.includes(fileExtension)) {
      console.error(`❌ Erreur: Le fichier doit être une image (${allowedExtensions.join(", ")}).`);
      process.exit(1);
    }

    console.log(`📤 Upload de l'image "${fileName}"...`);

    // Créer une référence vers le fichier dans Storage
    const storageRef = ref(storage, "background/background-image.jpg");

    // Uploader le fichier
    await uploadBytes(storageRef, fileBuffer, {
      contentType: `image/${fileExtension.slice(1)}`,
    });

    // Récupérer l'URL de téléchargement
    const downloadURL = await getDownloadURL(storageRef);

    console.log("✅ Image uploadée avec succès !");
    console.log(`📎 URL: ${downloadURL}`);
    console.log("\n🎉 L'image de fond est maintenant disponible sur toutes les pages !");

    return downloadURL;
  } catch (error) {
    console.error("❌ Erreur lors de l'upload:", error.message);
    if (error.code === "storage/unauthorized") {
      console.error("\n⚠️  Erreur d'autorisation. Vérifiez que les règles Firebase Storage sont configurées.");
      console.error("   Allez sur: https://console.firebase.google.com/project/padelmatch06/storage/rules");
    }
    process.exit(1);
  }
}

// Récupérer le chemin de l'image depuis les arguments
const imagePath = process.argv[2];

if (!imagePath) {
  console.error("❌ Usage: node scripts/upload-background.js <chemin-vers-image>");
  console.error("   Exemple: node scripts/upload-background.js ./background.jpg");
  process.exit(1);
}

// Uploader l'image
uploadBackgroundImage(imagePath);
