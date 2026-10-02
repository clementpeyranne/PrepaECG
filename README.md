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
OPENAI_MODEL_FAST="gpt-6-luna"
OPENAI_MODEL_QUALITY="gpt-6.1-sol"
OPENAI_API_KEY="sk-..."
AI_MONTHLY_BUDGET_USD="75"
AI_USER_MONTHLY_BUDGET_USD="5"
AI_USER_DAILY_REQUEST_LIMIT="120"
AI_DUPLICATE_WINDOW_SECONDS="20"
AI_GLOBAL_CONCURRENT_LIMIT="20"
AI_USER_CONCURRENT_LIMIT="2"
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
NEXT_PUBLIC_PRIVACY_EMAIL="privacy@a-renseigner.fr"
NEXT_PUBLIC_LEGAL_NAME="Editeur a renseigner"
NEXT_PUBLIC_LEGAL_STATUS="Statut juridique a renseigner"
NEXT_PUBLIC_LEGAL_ADDRESS="Adresse a renseigner"
NEXT_PUBLIC_LEGAL_PHONE="Telephone a renseigner"
NEXT_PUBLIC_LEGAL_REGISTRATION=""
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
- `PASSWORD_RESET_MODE="direct-link"` ne fonctionne qu'en demonstration sous `npm run dev`, hors Vercel. Il ne doit jamais etre utilise pour des comptes reels.
- La reinitialisation par email utilise Resend : `PASSWORD_RESET_MODE="email"`, `RESEND_API_KEY` et `EMAIL_FROM` (adresse seule, sur un domaine verifie). Tant que ces elements manquent, garder `support` : aucun envoi n'est annonce. Ne jamais mettre ces cles dans une variable `NEXT_PUBLIC_*`.
- `FILE_STORAGE_DRIVER="local"` convient au prototype, mais pas au deploiement final des fichiers.
- `FILE_STORAGE_DRIVER="supabase"` est la direction retenue pour stocker les PDF et les photos en production.
- `NEXT_PUBLIC_SUPPORT_EMAIL` et les champs legaux doivent etre completes avant ouverture publique.
- La politique de confidentialite, les CGU et la page cookies sont versionnees. Les nouvelles inscriptions enregistrent l'acceptation des CGU et la prise de connaissance de la politique applicable.

Securite des comptes : `npm run test:security` couvre les sessions, les liens de recuperation et le cache hors connexion avec des services simules. Un test de bout en bout avec PostgreSQL et le navigateur reste necessaire. Les sessions sont liees au mot de passe : changer celui-ci invalide les anciennes connexions. Le passage aux cookies v2 exige une reconnexion des comptes existants, sans modifier leurs donnees.

L'application installable ne conserve plus les pages privees en cache hors connexion. Elle affiche uniquement une page publique d'indisponibilite quand le reseau est coupe ; l'ancien cache est efface a l'activation du nouveau service worker.

### Mise a jour des comptes et des depots

Avant de deployer cette version, executer `npm run db:auth:prod`. Ce script ajoute uniquement les tables d'invitations/limitation et les colonnes anti-doublons ; il ne supprime pas de donnees. Il est relancable. Ne pas deployer le code tant que cette commande n'a pas reussi. En local, `npm run db:push` applique le schema SQLite.

Pour une base deja creee, appliquer aussi les index de performance additifs. La commande est relancable et ne supprime aucune donnee :

```bash
npm run db:indexes:prod
```

L'espace d'administration necessite sa migration additive, a appliquer avant le code qui contient les pages `/admin` :

```bash
npm run db:admin:prod
```

La preuve d'acceptation des textes legaux utilise egalement une migration additive a appliquer avant le deploiement correspondant :

```bash
npm run db:legal:prod
npm run db:ai-guardrails:prod
```

Creer ou promouvoir ensuite le compte du responsable de la plateforme :

```bash
npm run admin:create:prod -- --email "admin@exemple.fr" --first-name "Prenom" --last-name "Nom"
```

Cette commande ne modifie pas le mot de passe d'un compte existant. Pour un nouveau compte, elle affiche une seule fois un mot de passe temporaire. L'administration permet de suivre les connexions, suspendre ou reactiver les comptes, creer les environnements, renouveler leurs codes et inviter les professeurs. Elle ne donne pas acces au contenu pedagogique prive des eleves. Les adresses reseau ne sont jamais stockees en clair : une empreinte quotidienne est conservee au maximum 90 jours pour reperer les abus.

Les inscriptions professeurs exigent une invitation personnelle, y compris en demonstration. Pour creer une invitation apres verification de l'identite du professeur :

```bash
npm run teacher:invite:prod -- --email "prof@exemple.fr" --code "CODE-PREPA"
```

Le lien affiche est confidentiel, expire apres 7 jours et ne fonctionne qu'une fois pour cet email et cet etablissement. Le transmettre directement au professeur. L'option `--revoke` revoque les invitations en attente. Les comptes professeurs deja existants ne sont pas modifies : leur legitimite doit etre verifiee avant ouverture publique. Le premier visiteur ne peut plus creer un etablissement ; utiliser `establishment:create:prod`.

Les PDF, JPEG, PNG et WebP des copies et ressources passent directement du navigateur au bucket Supabase prive, puis sont controles et rattaches au compte cote serveur. Limite : 50 Mo par document. Le serveur ne distribue que des liens de lecture temporaires apres verification des droits. Les ressources acceptent aussi les fichiers texte. Les imports Anki `.apkg` sont lus sans outil systeme, conservent les decks et sous-decks, convertissent les syntaxes mathematiques historiques et integrent les images et sons aux cartes. Les envois abandonnes avant validation peuvent laisser des fichiers non rattaches ; prevoir leur nettoyage avant une utilisation a grande echelle.

Pour les emails, verifier le domaine et l'adresse d'envoi dans Resend, renseigner les variables dans Vercel, redeployer puis tester une reception reelle et l'utilisation unique du lien. Un retour HTTP positif du fournisseur ne prouve pas la livraison en boite de reception. Documentation : https://resend.com/docs/dashboard/domains/introduction et https://resend.com/docs/api-reference/emails/send-email.

### Verification des parcours

Le bilan de la recette et ses limites sont dans [RELEASE-CHECK.md](RELEASE-CHECK.md).

```bash
npm run test:security
npm run test:journeys
```

Les tests de parcours creent une base SQLite et des fichiers temporaires puis les suppriment. Ils exercent le vrai code applicatif et Prisma : inscriptions, invitations, connexion, isolation entre deux prepas, depots PDF/photos, lecture, corrections, doublons, decks/sous-decks, partage, progression des revisions et administration. Cookies/requetes Next, Resend et Supabase sont simules. Ils n'envoient aucun email reel et ne touchent pas a la production. Ils ne remplacent pas une recette navigateur, PostgreSQL, stockage cloud et boite mail en conditions reelles.

Sur Vercel, la limitation utilise son en-tete `x-forwarded-for` remplace par la plateforme, puis une limite par email. Source : https://vercel.com/docs/headers/request-headers. Sur un autre hebergeur, le repli partage doit etre adapte au proxy de confiance.

Next reste sur la branche 15. Les overrides de PostCSS (Next) et deepmerge-ts (configuration Prisma) remplacent des dependances signalees par l'audit de securite. Revalider `prisma:generate`, les tests et le build lors de leur mise a jour.

Pour la recette locale HTTP/navigateur, `PREPA_KEEP_TEST_FIXTURE=1 npm run test:journeys` conserve une base jetable dont le chemin est affiche. Lancer le serveur local avec cette `DATABASE_URL`, `APP_MODE=production`, `FILE_STORAGE_DRIVER=local`, `AUTH_SECRET=test-secret-only-not-production`, `PASSWORD_RESET_MODE=support`, `OPENAI_API_KEY` vide, puis executer `node tests/http-smoke.mjs` ou `node tests/browser-smoke.mjs` (Chrome requis). Ces scripts n'acceptent que localhost/127.0.0.1. Ne jamais utiliser les identifiants de test sur une vraie base. Supprimer uniquement le dossier temporaire affiche apres la recette. La recette navigateur n'est pas validee tant que Chrome ne peut pas etre lance par l'environnement d'execution.

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

Controler une phase pilote sans afficher de donnees personnelles :

```bash
npm run pilot:audit:prod
npm run pilot:load:prod
npm run pilot:smoke:prod
```

La derniere commande cree un eleve de recette sur le vrai site, verifie l'inscription, la configuration, tous les onglets et la reconnexion, puis supprime ce compte et ses donnees. Elle ne depose aucun document.

Le stockage peut etre controle sans suppression, puis nettoye uniquement pour les fichiers de plus de 24 heures qui ne sont lies a aucune copie ou ressource :

```bash
npm run storage:cleanup:prod
npm run storage:cleanup:prod -- --apply
```

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
