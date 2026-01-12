# Checklist de migration Firebase

## ✅ Préparation

- [ ] Créer un compte Firebase
- [ ] Créer un projet Firebase
- [ ] Enregistrer l'application web
- [ ] Copier la configuration Firebase

## ✅ Installation

- [ ] Installer Firebase : `npm install firebase`
- [ ] Créer `lib/firebase/config.ts`
- [ ] Créer `.env.local` avec les variables d'environnement
- [ ] Ajouter `.env.local` au `.gitignore`

## ✅ Configuration Firebase

- [ ] Activer Authentication (Email/Password)
- [ ] Créer la base Firestore
- [ ] Configurer les règles de sécurité Firestore
- [ ] Tester les règles en mode test

## ✅ Création des services

- [ ] Créer `lib/firebase/auth.ts`
- [ ] Créer `lib/firebase/firestore.ts`
- [ ] Implémenter les fonctions d'authentification
- [ ] Implémenter les fonctions Firestore

## ✅ Migration du code

- [ ] Migrer `lib/data/auth.ts`
- [ ] Migrer `lib/data/parties.ts`
- [ ] Migrer `lib/data/groupes.ts`
- [ ] Migrer `lib/data/messages.ts`
- [ ] Migrer `lib/data/profils-globaux.ts`

## ✅ Mise à jour des composants

- [ ] Mettre à jour `app/page.tsx` (login/inscription)
- [ ] Mettre à jour `app/parties/page.tsx`
- [ ] Mettre à jour `app/groupes/page.tsx`
- [ ] Mettre à jour `app/match/[id]/page.tsx`
- [ ] Mettre à jour `app/profil/page.tsx`

## ✅ Tests

- [ ] Tester la création de compte
- [ ] Tester la connexion
- [ ] Tester la création de partie
- [ ] Tester la synchronisation entre appareils
- [ ] Tester le mode hors ligne

## ✅ Migration des données

- [ ] Créer le script de migration
- [ ] Sauvegarder les données localStorage
- [ ] Exécuter la migration
- [ ] Vérifier les données dans Firestore

## ✅ Déploiement

- [ ] Ajouter les variables d'environnement sur Vercel
- [ ] Mettre à jour les règles Firestore pour production
- [ ] Déployer l'application
- [ ] Tester en production

## ✅ Post-déploiement

- [ ] Vérifier que tout fonctionne
- [ ] Surveiller les erreurs dans Firebase Console
- [ ] Optimiser les requêtes si nécessaire
- [ ] Documenter les changements

---

## 📝 Notes

- Faites une migration progressive (une fonctionnalité à la fois)
- Testez chaque étape avant de passer à la suivante
- Gardez localStorage comme fallback pendant la transition
- Documentez les changements pour l'équipe
