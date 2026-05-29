# LBP Records — charllys-site

Plateforme web pour **LBP Records** : catalogue audio, achats Mobile Money, envoi de maquettes aux experts musicaux et administration.

Construite avec [Next.js](https://nextjs.org) (App Router), [Supabase](https://supabase.com) et [Fedapay](https://fedapay.com) (sandbox).

## Fonctionnalités

- **Catalogue public** — parcourir les audios par catégorie, écouter un extrait (~20 % du morceau)
- **Achat Mobile Money** — paiement Fedapay, téléchargement sécurisé après validation
- **Extraits serveur** — découpés avec ffmpeg à l’upload (fichier complet privé, extrait public)
- **Comptes utilisateurs** — inscription, connexion, tableau de bord
- **Envoi aux experts** — soumission de maquettes et réception d’avis
- **Panel admin** — publication catalogue, gestion utilisateurs et fichiers

## Stack

- Next.js 16 · React 19 · TypeScript · Tailwind CSS 4
- Supabase (Auth, PostgreSQL, Storage)
- Fedapay · WaveSurfer.js · ffmpeg (extraits audio)

## Prérequis

- Node.js 20+
- Un projet [Supabase](https://supabase.com)
- Compte [Fedapay](https://fedapay.com) (sandbox pour les tests)
- **ffmpeg** embarqué via `ffmpeg-static` (installé avec les dépendances npm)

## Installation

```bash
npm install --legacy-peer-deps
cp .env.local.example .env   # puis renseigner les variables
npm run setup:supabase
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

## Variables d’environnement

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL du projet Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé anonyme Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé service (API serveur, webhooks) |
| `DATABASE_URL` | URL PostgreSQL (migrations / setup) |
| `NEXT_PUBLIC_FEDAPAY_PUBLIC_KEY` | Clé publique Fedapay |
| `FEDAPAY_SECRET_KEY` | Clé secrète Fedapay |
| `FEDAPAY_WEBHOOK_SECRET` | Secret de vérification webhook |
| `NEXT_PUBLIC_SITE_URL` | URL publique du site (callbacks, ngrok en local) |

## Scripts

| Commande | Description |
|----------|-------------|
| `npm run dev` | Serveur de développement |
| `npm run build` | Build production |
| `npm run start` | Démarrer le build production |
| `npm run lint` | ESLint |
| `npm run setup:supabase` | Migrations SQL + buckets Storage |
| `npm run previews:regenerate` | Régénérer les extraits des audios existants |

## Branches

| Branche | Rôle |
|---------|------|
| `main` | Production |
| `dev` | Intégration — les features arrivent ici avant release |

## Structure des routes principales

| Route | Accès |
|-------|-------|
| `/` | Accueil |
| `/audios` | Catalogue public |
| `/login` · `/register` | Authentification |
| `/dashboard` | Espace utilisateur |
| `/dashboard/upload` | Publication catalogue (admin) |
| `/dashboard/admin` | Panel administrateur |
| `/dashboard/submit` | Envoi aux experts |

## Déploiement

Build standard Next.js (`npm run build` puis `npm run start`).  
Configurer toutes les variables d’environnement sur l’hébergeur et pointer le webhook Fedapay vers `/api/payments/webhook`.

Repo : [github.com/romeoagbo/charllys_beat](https://github.com/romeoagbo/charllys_beat)
