# Mecanova — Atelier interne (Firebase edition)

Application de pilotage d'atelier interne (ordres de réparation, planning,
véhicules, mécaniciens, stocks, présences). Le projet a été entièrement
refondu pour être **100 % compatible Vercel**, sans aucune dépendance à
PostgreSQL : toute la persistance des données passe désormais par
**Firebase** (Firestore + Firebase Storage), et l'authentification par
**Firebase Authentication**.

L'interface (menus, écrans, couleurs, ergonomie) est strictement identique
à la version d'origine — seule la couche technique (backend / persistance)
a changé.

## Stack technique

- **Next.js 15+ / React 19** (App Router)
- **Firebase Authentication** — prêt à l'emploi via `src/firebase.ts`
- **Firestore** — toutes les opérations CRUD (ordres, mécaniciens,
  véhicules, stock, sorties de stock, présences, paramètres)
- **Firebase Storage** — fichiers/documents (ex : import CSV archivé pour
  audit) via `uploadFileToStorage()`
- **Firebase Admin SDK** — utilisé côté serveur (route `/api/health`) sans
  jamais exposer de clé privée au client

Plus aucune trace de PostgreSQL, Drizzle ORM, Prisma, `pg`, `neon`, ni de
variable `DATABASE_URL` : les dossiers `src/db`, `drizzle` et `prisma` ont
été supprimés.

## Synchronisation avec RISE Presence (suiviconnexclts.netlify.app)

Chaque connexion/déconnexion à socob_GestAtelier est répercutée dans le
tableau de bord **RISE Presence**, en écrivant dans les collections
`presence` et `users` du projet Firebase **riseappli-prod** (un projet
Firebase distinct de celui de cette application), via `/api/presence`
et l'Admin SDK (voir `src/firebase-admin-rise.ts`).

C'est une fonctionnalité optionnelle et non bloquante : si les 3
variables `RISEAPPLI_FIREBASE_*` ne sont pas configurées, la
synchronisation est simplement ignorée, sans erreur.

Pour l'activer, générez une clé de compte de service **sur le projet
`riseappli-prod`** (pas `ateliergest-prod`) — Console Firebase → changez
de projet en haut à gauche → Project settings → Service accounts →
Generate new private key — puis renseignez dans Vercel :

```
RISEAPPLI_FIREBASE_PROJECT_ID=riseappli-prod
RISEAPPLI_FIREBASE_CLIENT_EMAIL=...
RISEAPPLI_FIREBASE_PRIVATE_KEY=...
```

⚠️ Les nouveaux utilisateurs créés depuis socob_GestAtelier sont
automatiquement rattachés à l'entreprise par défaut `rise-sasu` dans
RISE Presence (comportement identique à celui déjà en place pour les
autres applications tant qu'aucune entreprise dédiée n'est assignée
depuis le menu "Entreprises" de RISE Presence).

## Identité visuelle SOCOB

L'application reprend le logo et les couleurs de SOCOB :
- Logo affiché sur l'écran de connexion, dans le menu latéral, en icône
  d'onglet (favicon), et **en filigrane discret** en arrière-plan de
  chaque page (`public/socob-logo.png`).
- Palette de couleurs (variables `--navy`/`--orange` dans
  `globals.css`) recalée sur le vert et l'or du logo.

## Synchronisation temps réel (multi-utilisateurs)

Toutes les données (ordres, mécaniciens, véhicules, stock, présences,
paramètres) sont désormais **synchronisées en direct** avec Firestore
(`onSnapshot`), et non plus chargées une seule fois à l'ouverture de la
page. Concrètement : si un autre utilisateur modifie quelque chose sur
un autre appareil, ça apparaît instantanément sur votre écran, sans
recharger la page. C'est indispensable pour un usage par plusieurs
personnes en même temps.

## Audit "figé vs dynamique"

Avant la mise à disposition du client final, un audit complet a été
mené pour repérer tout élément de l'interface qui semblait interactif
mais ne faisait en réalité rien (ou l'inverse — une valeur censée être
dynamique mais écrite en dur). Éléments corrigés :
- Un bouton "Enregistrer le pointage" qui n'enregistrait rien (les
  present saisies sont déjà sauvegardées automatiquement) — supprimé.
- Un bouton "Actualiser" qui affichait un faux message sans jamais
  rafraîchir — remplacé par un indicateur "Temps réel" honnête.
- Un encart de suggestion citant des ordres de réparation figés en dur
  ("OR-2044", "OR-2041") avec un bouton non fonctionnel — supprimé.
- Un bouton "ajouté à la liste de commande" sans fonctionnalité réelle
  derrière — supprimé.
- Une date figée en dur ("24 oct. 2024") sur la version mobile —
  remplacée par la vraie date du jour.
- Un message de profil inventé — remplacé par les vraies informations
  du compte connecté.

## Export / import Excel

Chaque module (Ordres de réparation, Mécaniciens, Véhicules, Stocks,
Présences) propose des boutons **Exporter** et **Importer** qui
produisent/lisent de vrais fichiers **.xlsx** (via la librairie
`xlsx`/SheetJS), pas de simples CSV :

- **Exporter** télécharge un fichier `.xlsx` avec toutes les colonnes du
  module actif.
- **Importer** lit un fichier `.xlsx` (ou `.csv`) et crée réellement les
  enregistrements correspondants dans Firestore — ce n'est pas une
  prévisualisation. Les colonnes reconnues reprennent soit les noms de
  champs internes (ceux du fichier exporté), soit des libellés français
  courants (ex. "Marque", "Immatriculation", "Mécanicien"...). Les lignes
  sans les champs obligatoires (ex. plaque manquante pour un véhicule)
  sont ignorées et comptabilisées dans le message de fin d'import.
- Le fichier importé est aussi archivé dans Firebase Storage (dossier
  `imports/`) à titre d'audit.

## Authentification

L'application démarre désormais sur un écran de connexion / création de
compte (identifiant + mot de passe + fonction), géré par **Firebase
Authentication**. En coulisses, l'identifiant est transformé en une
adresse e-mail technique (`identifiant@socob-gestatelier.local`) pour
s'appuyer sur le fournisseur email/mot de passe de Firebase ; le profil
(identifiant, fonction, e-mail réel optionnel) est stocké dans Firestore
sous `users/{uid}`.

Une fois connecté, l'utilisateur voit son propre nom partout dans
l'application ("Bonjour {prénom}", menu utilisateur, profil dans le
menu latéral) et dispose d'un bouton **"Se déconnecter"** dans le menu
utilisateur (en haut à droite).

⚠️ **À activer dans la console Firebase avant le premier déploiement :**
Authentication → Sign-in method → activer le fournisseur **Email/Password**.

## Architecture des données

| Fichier | Rôle |
|---|---|
| `src/firebase.ts` | Configuration Firebase **côté client** (Auth, Firestore, Storage) — point d'entrée unique |
| `src/firebase-admin.ts` | Configuration Firebase Admin **côté serveur** (API routes) |
| `src/lib/data-service.ts` | Fonctions génériques de lecture/écriture Firestore + upload Storage |
| `src/app/dashboard-shell.tsx` | Interface (inchangée) branchée sur Firestore via `data-service.ts` |

Au premier lancement sur un projet Firebase vide, l'application **seed**
automatiquement Firestore avec le jeu de données de démonstration
(mêmes ordres, véhicules, mécaniciens, stocks qu'auparavant), afin que le
rendu initial soit identique à la version précédente. Toutes les actions
utilisateur (créer, modifier, supprimer un ordre, un véhicule, un
mécanicien, un article de stock, une sortie de stock, une présence, les
paramètres) sont ensuite écrites dans Firestore en temps réel.

Collections Firestore utilisées :

- `orders`
- `mechanics`
- `vehicles`
- `stock`
- `stockExits`
- `presence`
- `settings` (document unique `app`)

## Configuration Firebase requise

1. Créez un projet sur [console.firebase.google.com](https://console.firebase.google.com).
2. Activez **Authentication**, **Firestore Database** et **Storage**.
3. Récupérez la configuration Web (Project settings → Your apps) pour les
   variables `NEXT_PUBLIC_FIREBASE_*`.
4. Générez une clé de compte de service (Project settings → Service
   accounts → Generate new private key) pour les variables
   `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`.
5. Copiez `.env.example` vers `.env.local` et renseignez ces valeurs.
6. (Optionnel mais recommandé) Déployez `firestore.rules` et
   `storage.rules` fournis dans ce dépôt via la Firebase CLI.

## Variables d'environnement

Voir `.env.example`. Aucune variable `DATABASE_URL` n'est nécessaire.

```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
```

## Développement local

```bash
npm install
cp .env.example .env.local   # puis renseigner vos identifiants Firebase
npm run dev
```

## Build de production

```bash
npm run build
npm start
```

`npm run build` s'exécute sans erreur même sans variables Firebase
définies (utile pour les previews) ; en revanche, l'application a besoin
de variables valides à l'exécution pour lire/écrire dans Firestore.

## Déploiement sur Vercel

1. Importez le dépôt dans Vercel.
2. Renseignez les variables d'environnement ci-dessus dans
   *Project Settings → Environment Variables*.
3. Déployez — aucune autre configuration n'est nécessaire (pas de build
   command personnalisée, pas de base de données à provisionner).
