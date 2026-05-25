# Undercover

Application web du jeu de société **Undercover** — pass-and-play sur un seul
appareil. Connexion via Google, profils de joueurs récurrents, historique par
personne, 400 paires de mots en français.

Construit avec **Next.js 16** (App Router, Turbopack), **React 19**,
**Prisma 7** (PostgreSQL), **Auth.js v5** et **Tailwind v4**.

## Prérequis

- **Node.js 20+**
- **Docker** (pour Postgres en local)
- Un projet Google Cloud avec OAuth 2.0 activé

## Installation

```bash
# 1. Cloner et installer
npm install

# 2. Démarrer Postgres
docker compose up -d

# 3. Configurer l'environnement
cp .env.example .env
# → éditer .env pour renseigner AUTH_GOOGLE_ID + AUTH_GOOGLE_SECRET
# (AUTH_SECRET peut être généré via : openssl rand -base64 32)

# 4. Appliquer les migrations Prisma
npx prisma migrate dev

# 5. Seeder les 400 paires de mots
npx prisma db seed

# 6. Lancer
npm run dev
```

L'app est disponible sur <http://localhost:3000>.

## Configurer Google OAuth

1. Aller sur <https://console.cloud.google.com/apis/credentials>
2. Créer des identifiants OAuth 2.0 (type : Application Web)
3. **URI de redirection autorisée** :
   `http://localhost:3000/api/auth/callback/google`
4. Copier le Client ID dans `AUTH_GOOGLE_ID` et le Client secret dans
   `AUTH_GOOGLE_SECRET` du fichier `.env`

## Scripts

| Commande                | Action                                          |
| ----------------------- | ----------------------------------------------- |
| `npm run dev`           | Dev server (port 3000)                          |
| `npm run build`         | Build prod (prisma generate + migrate deploy)   |
| `npm run start`         | Lance le build de prod                          |
| `npm run lint`          | ESLint                                          |
| `npm run prisma:studio` | Ouvre Prisma Studio (GUI base de données)       |
| `npm run db:reset`      | Reset complet de la BDD + ré-applique le seeder |

## Architecture

```
app/
├─ (auth)/login/                # Écran de connexion Google
├─ (game)/
│  ├─ home/                     # Accueil
│  ├─ play/                     # State machine (configure → reveal → debate → vote → result)
│  ├─ profile/                  # Profil + paramètres (banque de mots, couleur, déconnexion)
│  ├─ history/                  # Historique par joueur récurrent
│  └─ rules/                    # Règles du jeu
├─ api/auth/[...nextauth]/      # Auth.js handlers
auth.ts                         # Config NextAuth (provider Google + Prisma adapter)
proxy.ts                        # Middleware Next 16 (protection des routes)
prisma/
├─ schema.prisma                # 10 modèles (4 Auth.js + 6 jeu)
├─ seed.ts                      # 400 paires en 10 catégories
lib/
├─ prisma.ts                    # Singleton PrismaClient (adapter pg)
├─ game-logic.ts                # Pure : assignRoles, checkWinCondition
└─ actions/                     # Server Actions (game, players, words)
components/
├─ ui/                          # Composants design system
└─ game/                        # PlayClient, ProfileClient, CardStack
```

## Modèle de données

- **User** : compte Google (avec `color` d'avatar + toggle `noRepeat`).
- **Player** : profil de joueur récurrent (le user lui-même + les invités
  qu'il enregistre en tapant leur nom). Auto-complétion + historique.
- **WordPair** : 400 paires (civilianWord + undercoverWord + category).
- **UsedWordPair** : historique des paires tirées par user (pour le toggle
  anti-répétition).
- **Game** + **GameParticipant** : partie + rôles attribués + élimination par
  manche.
- Modèles Auth.js v5 (Account, Session, VerificationToken).

## Notes techniques

- **Next.js 16** : `params` / `cookies()` / `headers()` sont async,
  `proxy.ts` remplace `middleware.ts`. Tous les écrans tournent en App Router.
- **Prisma 7** : la datasource URL est dans `prisma.config.ts` (plus dans
  `schema.prisma`). PrismaClient utilise l'adapter `@prisma/adapter-pg`.
  Le seed est configuré dans `prisma.config.ts` sous `migrations.seed`.
- **Auth.js v5** : Session strategy `database` via l'adapter Prisma. Un Player
  `isOwner=true` est créé automatiquement à la première connexion via
  `events.createUser`.
- **Design system** : tokens définis dans `app/globals.css` via
  `@theme inline` (Tailwind v4). Fonts via `next/font/google`
  (Bricolage Grotesque + Geist Mono).

## Production (Neon)

Pour déployer sur Vercel + Neon :

1. Dans `.env`, remplacer `DATABASE_URL` par l'URL **pooled** Neon, et
   `DIRECT_URL` par l'URL non-poolée.
2. Sur Vercel, ajouter aussi `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`,
   `AUTH_SECRET`, `AUTH_URL=https://VOTRE-DOMAINE`,
   `AUTH_TRUST_HOST=true`.
3. Mettre à jour l'URI de redirection Google :
   `https://VOTRE-DOMAINE/api/auth/callback/google`.
4. `npm run build` lance automatiquement `prisma generate` + `prisma migrate
   deploy`.
