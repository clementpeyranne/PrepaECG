# App prepa ECG

Cette application vise a aider les etudiants de prepa ECG a travailler mieux, plus regulierement et plus efficacement, tout en reconnectant le travail quotidien avec les professeurs.

L'idee centrale est simple : reunir dans un seul produit tous les outils vraiment utiles a un preparationnaire.

## Vision

Un eleve de prepa perd souvent du temps a cause de quatre problemes :

- il ne sait pas toujours quoi travailler au bon moment ;
- il travaille beaucoup mais pas toujours de la bonne facon ;
- il manque de suivi, de regularite et de feedback rapide ;
- les ressources, devoirs, methodes et corrections sont eparpilles.

L'application doit donc devenir le systeme de travail central de l'etudiant :

- planifier le travail ;
- centraliser les cours, fiches, exos, annales et corrections ;
- entrainer activement avec suivi des lacunes ;
- utiliser l'IA comme coach et non comme bequille ;
- donner aux professeurs un lien direct avec leurs eleves.

## Utilisateurs

Deux profils principaux :

- Etudiant ECG
- Professeur de prepa

Trois profils secondaires possibles plus tard :

- Administrateur de classe / etablissement
- Parent
- Tuteur / colleur

## MVP recommande

Le MVP ne doit pas essayer de tout faire. Il doit resoudre un probleme vital : aider l'etudiant a travailler chaque jour avec plus de clarte, plus d'intensite et un meilleur retour.

Modules MVP :

1. Tableau de bord de travail
2. Planning intelligent par matiere
3. Bibliotheque de ressources
4. Entrainement actif avec quiz, flashcards et exos
5. Suivi des lacunes et statistiques
6. Canal prof-eleve
7. Assistant IA de travail

## Differenciation

L'application ne doit pas etre un simple "Notion pour prepa" ni un "ChatGPT pour eleves".

Sa vraie valeur serait :

- une logique specialement pensee pour la prepa ECG ;
- un pilotage du volume de travail et de la regularite ;
- un lien direct entre progression de l'eleve et attentes du professeur ;
- une IA encadree par des outils de methode, de repetition et d'auto-evaluation.

## Modules IA utiles

L'IA peut etre integree a condition d'aider l'etudiant a produire un vrai travail.

Exemples de fonctions IA pertinentes :

- generer un plan de revision a partir des chapitres faibles ;
- transformer un cours en flashcards et quiz ;
- corriger une copie ou une reponse courte avec bareme ;
- expliquer une methode de dissertation, d'ESH ou de maths ;
- detecter les chapitres sous-travailles ;
- proposer un entrainement quotidien adapte au temps disponible.

## Risque principal

Le danger serait de creer un produit trop large trop vite.

Il faut donc construire dans cet ordre :

1. usage quotidien et discipline de travail ;
2. entrainement et mesure de progression ;
3. collaboration avec les profs ;
4. couches IA plus avancees.

## Suite du projet

Le document [product-spec.md](/Users/clementpeyranne/Documents/Codex/2026-04-18-salut-je-viens-de-finir-classe/product-spec.md) detaille :

- les problemes utilisateurs ;
- les fonctionnalites prioritaires ;
- une architecture technique ;
- une feuille de route de construction.

## Activer OpenAI

Le projet est deja branche pour utiliser l'API OpenAI via l'endpoint Responses.

1. Ouvre le fichier [.env](/Users/clementpeyranne/Documents/Codex/2026-04-18-salut-je-viens-de-finir-classe/.env).
2. Remplace la ligne `OPENAI_API_KEY=""` par ta vraie cle API OpenAI.
3. Verifie que ces lignes sont bien presentes :

```env
AI_PROVIDER="auto"
OPENAI_MODEL="gpt-5-mini"
OPENAI_API_KEY="sk-..."
```

4. Dans le terminal du projet, lance :

```bash
npm run ai:check
```

5. Si le test est bon, relance ensuite le site avec :

```bash
npm run dev
```

Avec cette activation, OpenAI sera utilise pour :

- les resumes de ressources ;
- la generation de fiches ;
- la creation de flashcards ;
- la correction de copies, y compris PDF et photos ;
- le chatbot assistant.

## Preparation du deploiement

Le projet dispose maintenant d'un vrai mode de demonstration et d'une base plus propre pour un futur deploiement.

Variables importantes :

```env
APP_MODE="demo"
DATABASE_URL="file:./dev.db"
AUTH_SECRET="change-me-before-production"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
PASSWORD_RESET_MODE="direct-link"
FILE_STORAGE_DRIVER="local"
NEXT_PUBLIC_SUPPORT_EMAIL="support@a-renseigner.fr"
NEXT_PUBLIC_LEGAL_NAME="Editeur a renseigner"
NEXT_PUBLIC_LEGAL_ADDRESS="Adresse a renseigner"
NEXT_PUBLIC_PUBLICATION_DIRECTOR="Responsable de publication a renseigner"
NEXT_PUBLIC_HOSTING_NAME="Hebergeur a renseigner"
NEXT_PUBLIC_HOSTING_ADDRESS="Adresse de l'hebergeur a renseigner"
SUPABASE_URL=""
SUPABASE_SERVICE_ROLE_KEY=""
SUPABASE_STORAGE_BUCKET="prepa-files"
STORAGE_SIGNED_URL_TTL_SEC="3600"
```

Principes :

- `APP_MODE="demo"` garde les donnees et automatismes de prototype local.
- `APP_MODE="production"` desactive ces automatismes de demonstration.
- `AUTH_SECRET` doit etre personnalise avant toute mise en ligne.
- `DATABASE_URL` devra pointer vers une base en ligne pour la vraie production.
- `PASSWORD_RESET_MODE="support"` est prefere pour une ouverture publique propre.
- `FILE_STORAGE_DRIVER="local"` convient au prototype, mais pas au deploiement final des fichiers.
- `FILE_STORAGE_DRIVER="supabase"` est la direction retenue pour stocker les PDF et les photos en production.
- `NEXT_PUBLIC_SUPPORT_EMAIL` et les champs legaux doivent etre completes avant ouverture publique.

Un exemple de configuration de production est disponible dans [.env.production.example](/Users/clementpeyranne/Documents/Codex/2026-04-18-salut-je-viens-de-finir-classe/.env.production.example).

Tu peux generer automatiquement un premier fichier `.env.production` avec un vrai secret :

```bash
npm run env:prepare:prod
```

Verifier l'etat de la configuration :

```bash
npm run deploy:check
```

Verifier ensuite le point de sante applicatif apres mise en ligne :

```bash
curl https://ton-domaine.fr/api/health
```

Ce point renvoie l'etat de :

- la connexion base de donnees ;
- le secret d'authentification ;
- l'URL publique ;
- le stockage de fichiers ;
- la configuration OpenAI.

Generer le schema Prisma pour PostgreSQL avant un deploiement :

```bash
npm run prisma:prepare:prod
npm run prisma:generate:prod
npm run db:push:prod
npm run storage:init:prod
```

Creer un etablissement reel avec son code d'acces :

```bash
npm run establishment:create -- --name "Ma prepa ECG" --code "MA-PREPA" --year "2026" --track "ECG"
```

Ce code d'acces sera ensuite celui que les eleves et professeurs saisiront a l'inscription.

## Installation comme application

Le projet est maintenant prepare comme application web installable.

- sur iPhone ou iPad :
  ouvre le site dans Safari, puis `Partager` > `Sur l'ecran d'accueil`
- sur Mac :
  ouvre le site dans Safari ou Chrome puis utilise l'option `Installer l'application`
- sur PC :
  ouvre le site dans Chrome ou Edge puis utilise l'icone d'installation dans la barre d'adresse

Les fichiers relies a cette installation sont :

- [src/app/manifest.ts](/Users/clementpeyranne/Documents/Codex/2026-04-18-salut-je-viens-de-finir-classe/src/app/manifest.ts)
- [public/sw.js](/Users/clementpeyranne/Documents/Codex/2026-04-18-salut-je-viens-de-finir-classe/public/sw.js)
- [src/components/pwa/register-service-worker.tsx](/Users/clementpeyranne/Documents/Codex/2026-04-18-salut-je-viens-de-finir-classe/src/components/pwa/register-service-worker.tsx)
- [src/components/pwa/install-app-prompt.tsx](/Users/clementpeyranne/Documents/Codex/2026-04-18-salut-je-viens-de-finir-classe/src/components/pwa/install-app-prompt.tsx)

Preparation d'une future vraie application mobile/desktop :

- [docs/native-apps.md](/Users/clementpeyranne/Documents/Codex/2026-04-18-salut-je-viens-de-finir-classe/docs/native-apps.md)
- [capacitor.config.example.ts](/Users/clementpeyranne/Documents/Codex/2026-04-18-salut-je-viens-de-finir-classe/capacitor.config.example.ts)
