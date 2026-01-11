// Utilitaires pour le hash des mots de passe (MVP - localStorage)
// En production avec backend, utiliser bcrypt ou argon2

/**
 * Hash simple d'un mot de passe (pour MVP uniquement)
 * ⚠️ Ne pas utiliser en production - nécessite un backend sécurisé
 */
export function hashPassword(password: string): string {
  // Hash simple basé sur une combinaison
  // En production, utiliser bcrypt ou argon2 côté serveur
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  // Ajouter un salt basique (en production, utiliser un salt aléatoire)
  const salt = "padelmatch_salt_v1";
  let saltedHash = 0;
  const salted = password + salt;
  for (let i = 0; i < salted.length; i++) {
    const char = salted.charCodeAt(i);
    saltedHash = ((saltedHash << 5) - saltedHash) + char;
    saltedHash = saltedHash & saltedHash;
  }
  
  return Math.abs(hash).toString(36) + Math.abs(saltedHash).toString(36);
}

/**
 * Vérifie si un mot de passe correspond à un hash
 */
export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}
