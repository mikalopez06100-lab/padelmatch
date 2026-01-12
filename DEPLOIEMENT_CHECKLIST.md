# Checklist de déploiement - Fonctionnalités récentes

## ✅ Code vérifié

### Fonctionnalités ajoutées récemment :
1. ✅ **Page de profil utilisateur** (`/joueurs/[pseudo]`)
   - Fichier : `app/joueurs/[pseudo]/page.tsx`
   - Export : ✅ `export default function JoueurProfilPage()`
   - Imports : ✅ Tous corrects

2. ✅ **Statistiques de matchs**
   - Fichier : `lib/data/stats.ts`
   - Fonction : ✅ `calculateMatchStats()` exportée
   - Utilisée dans : `app/joueurs/[pseudo]/page.tsx`

3. ✅ **Réinitialisation de mot de passe**
   - Fichier : `lib/data/auth.ts`
   - Fonctions : ✅ `resetPassword()` et `generateNewPassword()` exportées
   - Utilisée dans : `app/page.tsx`

4. ✅ **Liens cliquables sur les pseudos**
   - Modifié dans : `app/joueurs/page.tsx`, `app/parties/page.tsx`, `app/match/[id]/page.tsx`

5. ✅ **Image de fond**
   - Modifié dans : `app/layout.tsx`, `app/header.tsx`

6. ✅ **Restriction d'accès aux parties complètes**
   - Modifié dans : `app/match/[id]/page.tsx`

## 🔍 Vérifications effectuées

- ✅ Build local réussi
- ✅ Aucune erreur TypeScript
- ✅ Aucune erreur de linting
- ✅ Tous les imports/exports corrects
- ✅ Routes dynamiques détectées par Next.js

## ⚠️ Problème détecté

Il y a un dossier mal formé dans `app/joueurs/` :
- `[pseudo\` (dossier invalide)
- `[pseudo]\` (dossier correct avec `page.tsx`)

**Solution** : Supprimer manuellement le dossier `[pseudo\` si possible, ou ignorer (Next.js utilise le bon dossier).

## 🚀 Actions à effectuer pour le déploiement

### 1. Vérifier que tous les fichiers sont commités
```bash
git status
git add .
git commit -m "Ajout des fonctionnalités : profils utilisateurs, statistiques, réinitialisation mot de passe"
git push
```

### 2. Vérifier le déploiement Vercel
- Aller sur https://vercel.com
- Vérifier que le dernier déploiement est réussi
- Vérifier les logs de build

### 3. Vider les caches
- **Cache navigateur** : `Ctrl + Shift + R` (ou `Cmd + Shift + R` sur Mac)
- **Cache Vercel** : Dans le dashboard Vercel → Settings → Clear Build Cache

### 4. Tester les nouvelles fonctionnalités
- [ ] Aller sur `/joueurs` et cliquer sur un pseudo → doit rediriger vers `/joueurs/[pseudo]`
- [ ] Vérifier que les statistiques s'affichent sur la page de profil
- [ ] Tester "Mot de passe oublié" sur la page d'accueil
- [ ] Vérifier que l'image de fond s'affiche sur toutes les pages
- [ ] Tester l'accès à une partie complète (doit être restreint)

### 5. Vérifier la console du navigateur
- Ouvrir F12 → Console
- Vérifier s'il y a des erreurs JavaScript
- Vérifier l'onglet Network pour des erreurs 404

## 🔧 Si les fonctionnalités ne sont toujours pas visibles

1. **Forcer un redéploiement** :
   ```bash
   git commit --allow-empty -m "Force redeploy"
   git push
   ```

2. **Vérifier les variables d'environnement** (si nécessaire)

3. **Vérifier la configuration Vercel** :
   - Framework : Next.js
   - Build Command : `npm run build`
   - Output Directory : `.next`

4. **Contacter le support** si le problème persiste

## 📝 Notes

- Le build local fonctionne correctement
- Tous les fichiers sont correctement structurés
- Le problème est probablement lié au cache ou à un déploiement incomplet
