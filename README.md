# <img src="frontend/reactJS/public/favicon.png" width="40" height="40" alt="Ascendia Logo"> Ascendia

> **Optimisez votre présence digitale avec l'intelligence artificielle.**

Ascendia est une plateforme moderne de gestion de réseaux sociaux conçue pour centraliser, planifier et analyser vos contenus sur Facebook, Instagram et Twitter. Grâce à une architecture microservices robuste et une intégration poussée de l'IA, elle offre aux créateurs et aux entreprises un outil puissant pour booster leur engagement.

[![React](https://img.shields.io/badge/Frontend-React%2018-61DAFB?style=flat-square&logo=react)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js%20%2F%20Express-339933?style=flat-square&logo=node.js)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB-47A248?style=flat-square&logo=mongodb)](https://www.mongodb.com/)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind%20CSS%204-06B6D4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![Docker](https://img.shields.io/badge/DevOps-Docker-2496ED?style=flat-square&logo=docker)](https://www.docker.com/)

---

## ✨ Fonctionnalités Clés

- 📱 **Multi-plateforme** : Connectez et gérez vos comptes Facebook, Instagram et Twitter/X.
- 📅 **Calendrier Interactif** : Planifiez vos publications avec une vue hebdomadaire et mensuelle intuitive (FullCalendar).
- 🧠 **IA Intégrée** (OpenRouter) :
  - **Traduction intelligente** : Adaptez vos messages pour une audience globale.
  - **Correction & Optimisation** : Améliorez le ton et l'engagement de vos textes.
  - **Analyse de Sentiment** : Comprenez l'humeur de votre communauté via l'analyse des commentaires.
- 📊 **Analytics Avancés** : Visualisez vos performances avec des graphiques dynamiques (Recharts).
- 🛡️ **Sécurité** : Authentification sécurisée via JWT et OAuth (Passport.js).

---

## 🛠️ Stack Technique

### **Frontend**
- **Framework** : React 18 avec Vite
- **Gestion d'état & Routage** : React Router 7
- **Styling** : Tailwind CSS 4 & Framer Motion (animations)
- **Composants UI** : Lucide React, HeroIcons

### **Backend (Microservices)**
- **Runtime** : Node.js & Express
- **Services** :
  - `Gateway` : Point d'entrée unique de l'API.
  - `Users` : Gestion des profils et de l'authentification.
  - `Posts` : Gestion des publications et de la logique IA.
  - `SocialAuth` : Gestion des tokens OAuth et connexions réseaux sociaux.
- **Base de données** : MongoDB avec Mongoose
- **IA** : DeepSeek-V3 & GPT-3.5 via OpenRouter

---

## 🚀 Installation rapide

### 1. Pré-requis
- Node.js (v18+)
- Docker & Docker Compose
- Clés API (Facebook/Instagram Developer, Twitter API, OpenRouter)

### 2. Clonage et configuration
```bash
git clone https://github.com/votre-username/ascendia.git
cd ascendia
```

### 3. Lancement des services
L'architecture utilise Docker pour simplifier le déploiement.

```bash
# Lancer la base de données et les services principaux
cd backend
docker-compose up -d

# Lancer le frontend
cd ../frontend/reactJS
npm install
npm run dev
```

---

## 🏗️ Architecture du Projet

```text
ascendia/
├── backend/            # Microservices (Node.js/Express)
│   ├── gateway/        # API Gateway
│   ├── services/       # Services spécialisés (Users, Posts, SocialAuth)
│   └── docker-compose.yml  # Orchestration des conteneurs
├── frontend/           # Application React (Vite/Tailwind)

```

---

## 👥 Équipe

Développé par **Sami CHBICHEB**, **Samir EL KHOUMRI**, **Aly HACHEM REDA** et **Sofiane HAMMAR**  dans le cadre de la Licence 3 Informatique.

Ce projet est à usage pédagogique.

---
