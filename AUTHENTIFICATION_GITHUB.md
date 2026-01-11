# 🔐 Authentification GitHub - Créer un Token

## ⚠️ GitHub demande une authentification

GitHub n'accepte plus les mots de passe. Vous devez créer un **Personal Access Token** (jeton d'accès personnel).

---

## 📋 Instructions pour créer un token

### Étape 1 : Créer le token

1. **Allez sur** : https://github.com/settings/tokens
   (Ou : GitHub > Votre profil (icône en haut à droite) > Settings > Developer settings > Personal access tokens > Tokens (classic))

2. **Cliquez sur** : **"Generate new token"** > **"Generate new token (classic)"**

3. **Remplissez le formulaire** :
   - **Note** (nom) : Tapez `padelmatch-deployment`
   - **Expiration** : Choisissez `90 days` (ou `No expiration` si vous préférez)
   - **Select scopes** (permissions) : 
     - ✅ Cochez **`repo`** (tout en bas, section "repo")
     - ⚠️ **Ne cochez rien d'autre** pour la sécurité

4. **Cliquez sur** : **"Generate token"** (bouton vert en bas)

5. **COPIER LE TOKEN** :
   - GitHub affichera un token qui commence par `ghp_...`
   - **⚠️ COPIEZ-LE MAINTENANT !** (Vous ne le verrez qu'une seule fois)
   - **Sauvegardez-le dans un endroit sûr** (NotePad, fichier texte...)

---

## 📤 Étape 2 : Utiliser le token pour pousser le code

**Ouvrez PowerShell** et exécutez :

```powershell
cd "C:\Users\ppmpc\Documents\padelmatch"
git push -u origin main
```

**Quand GitHub vous demande de vous authentifier :**

1. **Username** : Tapez `mikalopez06100-lab`
2. **Password** : **Collez le token** que vous venez de créer (pas votre mot de passe GitHub !)
3. **Appuyez sur Entrée**

✅ **Le code sera poussé sur GitHub !**

---

## ⏭️ Quand le code est sur GitHub

**Dites-moi** : "Code sur GitHub" ou "Push réussi"

Et je vous guiderai pour déployer sur Vercel ! 🚀

---

## ❓ Questions

**Q : Le token a expiré ?**
R : Créez-en un nouveau sur https://github.com/settings/tokens

**Q : Je n'arrive pas à me connecter ?**
R : Vérifiez que vous avez bien coché `repo` dans les permissions du token

**Q : Je ne trouve pas où créer le token ?**
R : Allez directement sur : https://github.com/settings/tokens/new
