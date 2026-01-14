# 🚀 Déployer les nouvelles pages sur Vercel

## 📋 Pages à déployer

Ces nouvelles pages ont été créées mais ne sont pas encore sur Vercel :
- `/migration` - Migration des données vers Firebase
- `/export-data` - Export des données locales en JSON
- `/debug-firebase` - Outil de debug Firebase
- `/test-firebase` - Test de connexion Firebase

## ✅ Étapes pour déployer

### 1. Vérifier l'état Git

Ouvre PowerShell et va dans le dossier du projet :
```powershell
cd C:\Users\ppmpc\Documents\padelmatch
git status
```

### 2. Ajouter tous les nouveaux fichiers

```powershell
git add .
```

### 3. Créer un commit

```powershell
git commit -m "Ajout des pages de migration et export de données vers Firebase"
```

### 4. Pousser sur GitHub

```powershell
git push origin main
```

### 5. Attendre le déploiement Vercel

- Vercel déploiera automatiquement en 2-3 minutes
- Va sur https://vercel.com/dashboard pour voir le déploiement en cours
- Une fois terminé, les nouvelles pages seront accessibles sur ton URL Vercel

## 🔗 Accéder aux pages sur Vercel

Une fois déployé, tu pourras accéder à :
- `https://ton-url-vercel.vercel.app/export-data` - Export des données
- `https://ton-url-vercel.vercel.app/migration` - Migration vers Firebase
- `https://ton-url-vercel.vercel.app/debug-firebase` - Debug Firebase

## ⚠️ Important

Les données locales (localStorage) ne fonctionnent que dans le navigateur où elles ont été créées. Pour exporter tes données :
1. Ouvre l'URL Vercel dans ton navigateur
2. Va sur `/export-data`
3. Clique sur "Télécharger en JSON" pour sauvegarder tes données
