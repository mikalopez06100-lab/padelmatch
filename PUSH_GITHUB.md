# ⬆️ ÉTAPE 3 : Mettre votre code sur GitHub

## ✅ Repository GitHub créé !

Votre repository est prêt : https://github.com/mikalopez06100-lab/padelmatch

Maintenant, nous devons "pousser" (envoyer) votre code sur GitHub.

---

## 📋 Instructions

J'ai connecté votre repository local à GitHub. 

**Il reste maintenant à pousser le code.**

### Option 1 : Je le fais automatiquement (si vous me donnez l'autorisation)

Je peux exécuter la commande `git push` pour vous.

**ATTENTION** : GitHub vous demandera peut-être de vous authentifier.

---

### Option 2 : Vous le faites vous-même

**Ouvrez PowerShell** et exécutez :

```powershell
cd "C:\Users\ppmpc\Documents\padelmatch"
git push -u origin main
```

**Si GitHub vous demande de vous authentifier :**

GitHub n'accepte plus les mots de passe. Vous devez utiliser un **Personal Access Token** :

1. **Créer un token** : https://github.com/settings/tokens
2. Cliquez sur **"Generate new token"** > **"Generate new token (classic)"**
3. **Nom** : `padelmatch-deployment`
4. **Durée** : 90 days (ou No expiration)
5. **Permissions** : Cochez uniquement **`repo`** (tout en bas, section "repo")
6. Cliquez sur **"Generate token"** (bouton vert)
7. **COPIER LE TOKEN** (vous ne le verrez qu'une fois ! Il commence par `ghp_...`)
8. Lors du `git push`, utilisez :
   - **Username** : `mikalopez06100-lab`
   - **Password** : Collez le token que vous venez de créer

---

## ⏭️ Quand le code est poussé sur GitHub

**Dites-moi** : "Code sur GitHub" ou "Push réussi"

Et je vous guiderai pour déployer sur Vercel ! 🚀
