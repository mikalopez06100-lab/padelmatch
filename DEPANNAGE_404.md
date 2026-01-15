# 🔧 Dépannage : Erreur 404 sur /admin/background-image

## ✅ Vérifications à faire

### 1. L'URL est-elle correcte ?

L'URL exacte doit être :
- ✅ **https://votre-url-vercel.vercel.app/admin/background-image** (avec un tiret)
- ❌ **https://votre-url-vercel.vercel.app/admin/background_image** (avec un underscore)
- ❌ **https://votre-url-vercel.vercel.app/admin/backgroundimage** (sans séparateur)

**Remplacez `votre-url-vercel.vercel.app` par votre vraie URL Vercel !**

### 2. La page a-t-elle été déployée ?

Si vous venez de créer la page, elle doit être déployée sur Vercel :

1. **Poussez vos changements sur GitHub** :
   ```powershell
   git add .
   git commit -m "Ajout page admin background-image"
   git push origin main
   ```

2. **Attendez le déploiement Vercel** (2-3 minutes)
   - Allez sur https://vercel.com/dashboard
   - Vérifiez que le déploiement est terminé

3. **Essayez à nouveau l'URL** après le déploiement

### 3. Vérifier que le fichier existe dans le code

Le fichier doit être exactement ici :
```
app/admin/background-image/page.tsx
```

Vérifiez avec :
```powershell
Test-Path app\admin\background-image\page.tsx
```

Si le fichier n'existe pas, créez-le ou vérifiez qu'il a été commité et poussé sur GitHub.

### 4. Vider le cache Vercel

Parfois le cache Vercel pose problème :

1. Allez sur https://vercel.com/dashboard
2. Sélectionnez votre projet
3. Allez dans "Settings" → "General"
4. Cliquez sur "Clear Build Cache"
5. Redéployez (ou faites un commit vide pour déclencher un redéploiement)

### 5. Vérifier les erreurs dans la console du navigateur

1. Ouvrez la console du navigateur (F12)
2. Allez sur l'onglet "Console"
3. Essayez d'accéder à `/admin/background-image`
4. Regardez s'il y a des erreurs JavaScript

### 6. Vérifier les logs de déploiement Vercel

1. Allez sur https://vercel.com/dashboard
2. Sélectionnez votre projet
3. Allez dans l'onglet "Deployments"
4. Cliquez sur le dernier déploiement
5. Vérifiez s'il y a des erreurs de build

## 🔍 Solutions spécifiques

### Si vous voyez "404 - This page could not be found"

1. **Vérifiez l'orthographe de l'URL** : `/admin/background-image` (avec un tiret)
2. **Vérifiez que la page a été déployée** sur Vercel (voir étape 2)
3. **Attendez quelques minutes** après le push sur GitHub pour que Vercel déploie
4. **Vérifiez les logs de déploiement** dans Vercel Dashboard

### Si la page se charge mais est blanche

1. Ouvrez la console du navigateur (F12)
2. Regardez les erreurs dans l'onglet "Console"
3. Vérifiez s'il y a des erreurs d'import ou de compilation

### Si vous voyez une erreur de module

Vérifiez que tous les imports sont corrects dans `app/admin/background-image/page.tsx` :
- `@/lib/firebase/storage` doit exister
- Tous les imports doivent être valides

## 📝 Test rapide

Pour tester si le routage fonctionne, essayez d'accéder à :
- `https://votre-url-vercel.vercel.app/admin/terrains` → Devrait fonctionner
- `https://votre-url-vercel.vercel.app/admin/clean-db` → Devrait fonctionner
- `https://votre-url-vercel.vercel.app/admin/background-image` → Devrait fonctionner aussi

Si les deux premières fonctionnent mais pas la troisième, il y a un problème spécifique avec cette page ou elle n'a pas été déployée.

## 🆘 Si rien ne fonctionne

1. **Vérifiez que le fichier existe** dans votre code local
2. **Vérifiez que le fichier est commité** : `git status`
3. **Poussez sur GitHub** : `git push origin main`
4. **Vérifiez les logs de déploiement** dans Vercel Dashboard
5. **Attendez 2-3 minutes** après le push pour que Vercel déploie
6. **Vérifiez que le build Vercel réussit** (pas d'erreurs de compilation)
