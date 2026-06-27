# Feuille de route de deploiement

Ce document fixe une direction technique simple pour transformer le prototype en application reellement deployee, sans perdre la version de demonstration locale.

## Principe cle

Le projet garde deux usages en parallele :

- une version `demo` locale pour montrer le produit, faire des essais et prospecter ;
- une version `production` pour preparer le vrai lancement.

Le mode demo deja en place n'est donc pas supprime. Il reste utile pour :

- montrer l'application a une prepa ;
- presenter les fonctionnalites sans dependre d'une infrastructure complete ;
- tester rapidement des idees ;
- continuer a developper sans risquer les futures donnees reelles.

## Stack recommandee

Pour ce projet, la direction la plus cohérente est :

- Frontend et serveur Next.js : Vercel
- Base de donnees PostgreSQL : Supabase Postgres
- Stockage fichiers PDF / photos : Supabase Storage
- IA : OpenAI plus tard, quand le budget et le branchement seront prets

## Pourquoi cette direction

### 1. Vercel pour heberger Next.js

Le projet est deja construit avec Next.js. Vercel est la plateforme la plus naturelle pour le deployer, avec une integration simple et peu de friction pour le MVP.

### 2. Supabase pour Postgres

Le projet utilise Prisma. Supabase documente explicitement l'usage de Prisma avec Postgres, ce qui rend la migration plus claire pour un futur deploiement reel.

### 3. Supabase Storage pour les copies et ressources

L'application manipule des fichiers lourds et sensibles : PDF, photos de copies, documents de cours. Supabase Storage est adapte a ce besoin et s'integre bien avec une logique de permissions par utilisateur et par etablissement.

## Ce qu'on garde en demo

On garde :

- la base locale SQLite pour les demonstrations ;
- le mode `APP_MODE="demo"` ;
- les donnees de demonstration utiles au prototype ;
- le lancement local avec `npm run dev`.

Autrement dit : continuer a preparer la production ne casse pas la demo.

## Ce qu'on preparera ensuite

### Etape 1. Finaliser la configuration de production

- definir les variables d'environnement de production ;
- preparer le schema Prisma pour PostgreSQL ;
- verifier la separation demo / production.

### Etape 2. Brancher une vraie base PostgreSQL

- creer un projet Supabase ;
- recuperer la vraie `DATABASE_URL` ;
- pousser le schema de production ;
- creer le premier etablissement reel.

### Etape 3. Sortir les fichiers du stockage local

- connecter le stockage des PDF et photos a un bucket distant ;
- preparer les permissions d'acces ;
- arreter de dependre du dossier `public/uploads` pour la prod.

### Etape 4. Premier deploiement prive

- deployer l'application sur Vercel ;
- ajouter les variables d'environnement ;
- tester avec quelques comptes reels ;
- verifier les copies, ressources, flashcards et connexions.

## Ce qu'il ne faut pas faire trop tot

- ne pas lancer tout de suite a grande echelle ;
- ne pas brancher toute l'IA avant d'avoir une base et un stockage stables ;
- ne pas supprimer la demo tant qu'elle est utile pour montrer le produit.

## Decision retenue

La direction retenue pour la suite du projet est donc :

- demo locale conservee ;
- production preparee avec Vercel + Supabase ;
- migration progressive sans casser le prototype.
