# 🚀 Comment démarrer le serveur local

## Étape 1 : Ouvrir un terminal

1. Appuie sur `Windows + R`
2. Tape `powershell` et appuie sur Entrée
3. Navigue vers le dossier du projet :
   ```powershell
   cd C:\Users\ppmpc\Documents\padelmatch
   ```

## Étape 2 : Démarrer le serveur

Tape cette commande :
```powershell
npm run dev
```

Tu devrais voir quelque chose comme :
```
> padelmatch@0.1.0 dev
> next dev

   ▲ Next.js 16.1.1
   - Local:        http://localhost:3000
   - Ready in 2.3s
```

## Étape 3 : Ouvrir dans le navigateur

1. Ouvre ton navigateur (Chrome, Firefox, Edge...)
2. Va sur : **http://localhost:3000**

## ✅ Vérifications

Si tout fonctionne, tu devrais voir :
- La page d'accueil de PadelMatch
- Pas d'erreur dans le terminal
- Le terminal reste ouvert (ne pas le fermer)

## 🔧 Si ça ne fonctionne pas

### Erreur "port 3000 déjà utilisé"
Si tu vois cette erreur, un autre processus utilise le port 3000 :
```powershell
# Tuer les processus Node.js
Get-Process -Name node | Stop-Process -Force
```
Puis relance `npm run dev`

### Erreur "npm n'est pas reconnu"
Node.js n'est pas installé. Installe-le depuis https://nodejs.org/

### Erreur de dépendances manquantes
```powershell
npm install
```
Puis relance `npm run dev`

## 📋 Pages disponibles

Une fois le serveur démarré, tu peux accéder à :
- http://localhost:3000 - Page d'accueil
- http://localhost:3000/migration - Migration vers Firebase
- http://localhost:3000/export-data - Export des données
- http://localhost:3000/debug-firebase - Debug Firebase
- http://localhost:3000/parties - Mes parties
- http://localhost:3000/groupes - Mes groupes
- http://localhost:3000/joueurs - Tous les joueurs
- http://localhost:3000/profil - Mon profil

## ⚠️ Important

- **Ne ferme pas le terminal** pendant que tu utilises l'application
- Le serveur doit rester en cours d'exécution
- Pour arrêter le serveur : Appuie sur `Ctrl + C` dans le terminal
