# Script de configuration Git pour PadelMatch
# Exécuter ce script dans PowerShell

Write-Host "=== Configuration Git pour PadelMatch ===" -ForegroundColor Cyan
Write-Host ""

# Vérifier si Git est installé
try {
    $gitVersion = git --version
    Write-Host "✅ Git est installé : $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Git n'est pas installé. Veuillez installer Git d'abord." -ForegroundColor Red
    Write-Host "Télécharger Git : https://git-scm.com/download/win" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "Configuration de votre identité Git..." -ForegroundColor Cyan
Write-Host ""

# Demander le nom
$userName = Read-Host "Entrez votre nom (ou pseudo GitHub)"
if ([string]::IsNullOrWhiteSpace($userName)) {
    Write-Host "❌ Le nom ne peut pas être vide" -ForegroundColor Red
    exit 1
}

# Demander l'email
$userEmail = Read-Host "Entrez votre email (associé à GitHub)"
if ([string]::IsNullOrWhiteSpace($userEmail)) {
    Write-Host "❌ L'email ne peut pas être vide" -ForegroundColor Red
    exit 1
}

# Configurer Git
Write-Host ""
Write-Host "Configuration de Git..." -ForegroundColor Cyan
git config --global user.name "$userName"
git config --global user.email "$userEmail"

Write-Host ""
Write-Host "✅ Git configuré avec succès !" -ForegroundColor Green
Write-Host "   Nom : $userName" -ForegroundColor Gray
Write-Host "   Email : $userEmail" -ForegroundColor Gray

Write-Host ""
Write-Host "Création du commit initial..." -ForegroundColor Cyan

# Aller dans le répertoire du projet
$projectPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $projectPath

# Vérifier le statut
git status --short | Out-Null
if ($LASTEXITCODE -eq 0) {
    # Ajouter tous les fichiers
    git add .
    
    # Créer le commit
    git commit -m "Initial commit - PadelMatch MVP

- Landing page avec inscription/login
- Gestion des groupes avec membres
- Création et gestion des parties
- Visibilité des matchs (profil/groupe/communauté)
- Photos de profil
- Chat réservé aux joueurs
- Notifications PWA
- Design sombre responsive"
    
    Write-Host ""
    Write-Host "✅ Commit initial créé avec succès !" -ForegroundColor Green
    Write-Host ""
    Write-Host "Prochaines étapes :" -ForegroundColor Cyan
    Write-Host "1. Créer un repository sur GitHub : https://github.com/new" -ForegroundColor Yellow
    Write-Host "2. Exécuter les commandes suivantes :" -ForegroundColor Yellow
    Write-Host "   git remote add origin https://github.com/VOTRE_USERNAME/padelmatch.git" -ForegroundColor Gray
    Write-Host "   git branch -M main" -ForegroundColor Gray
    Write-Host "   git push -u origin main" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Voir GIT_SETUP.md pour plus de détails." -ForegroundColor Cyan
} else {
    Write-Host "❌ Erreur lors de la vérification du statut Git" -ForegroundColor Red
}
