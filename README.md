# Agenda Frontend Application 💻

L'interface utilisateur Single-Page Application (SPA) moderne et ultra-responsive permettant de planifier, consulter et gérer des événements sur des calendriers dynamiques en temps réel.

## 🚀 Fonctionnalités
- **Calendrier Immersif** : Intégration complète de la bibliothèque **FullCalendar** (vues mois, semaine, jour).
- **Expérience Utilisateur** : Design fluide, moderne et adaptatif basé sur Bootstrap 5.
- **Gestion des Comptes** : Formulaires interactifs de Connexion, Inscription et édition complète du profil utilisateur (avec téléversement asynchrone d'avatars).
- **Architecture Typée** : Développement 100% robuste sous **TypeScript** et propulsé par la vitesse de build de **Vite**.
- **Consommation d'API Évolutive** : Routage dynamique vers l'API distante via des variables d'environnement.

## 🛠️ Stack Technique
- **Interface Core** : React 18, TypeScript, Vite
- **Composants Graphiques** : Bootstrap 5, Font-Awesome Icons
- **Moteur d'Agenda** : FullCalendar React Suite

## 📦 Installation Locale

### 1. Cloner le projet
```bash
git clone <URL_DE_VOTRE_NOUVEAU_DEPOT_FRONTEND>
cd agenda-frontend-app
```

### 2. Installer les dépendances
```bash
npm install
```

### 3. Configurer l'environnement de développement
Créez un fichier `.env` à la racine :
```env
VITE_API_URL=http://localhost:3000
```

### 4. Lancement de l'application
```bash
npm run dev
```
Accès local via : `http://localhost:5173`

## 🚀 Déploiement en Production
Compilé pour la production de manière optimisée via l'instruction `npm run build`. Le projet s'intègre parfaitement avec **Hostinger Web Apps** ou des serveurs de fichiers statiques en alimentant la clé `VITE_API_URL` avec l'adresse réseau de l'API de production.
