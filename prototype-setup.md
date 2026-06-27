# Prototype setup

Le prototype web MVP a ete scaffolde dans ce workspace avec une structure `Next.js App Router`, des pages principales, des donnees mockees et un schema Prisma.

## Ce qui est deja pose

- configuration de projet `Next.js + TypeScript + Tailwind`
- layouts eleve et professeur
- routes principales du MVP
- composants UI de base
- jeu de donnees mockees coherentes avec le produit
- schema Prisma de depart

## Pages disponibles dans le scaffold

- `/`
- `/dashboard`
- `/planning`
- `/flashcards`
- `/flashcards/[deckId]`
- `/resources`
- `/resources/[resourceId]`
- `/essays`
- `/essays/new`
- `/essays/[essayId]`
- `/assistant`
- `/progress`
- `/teacher/resources`
- `/teacher/resources/new`
- `/teacher/essays`
- `/teacher/rubrics`

## Installation a faire sur une machine avec gestionnaire de paquets JS

Comme l'environnement courant ne fournit ni `npm`, ni `pnpm`, ni `yarn`, je n'ai pas pu installer les dependances ni lancer le serveur local.

Quand un gestionnaire de paquets sera disponible, la suite est :

```bash
npm install
npm run dev
```

Ou equivalent avec `pnpm` / `yarn`.

## Prochaine etape recommande

La meilleure suite est de brancher le scaffold a un vrai backend minimal dans cet ordre :

1. auth ;
2. Prisma + base locale ;
3. onboarding eleve ;
4. dashboard alimente par vraies donnees ;
5. moteur flashcards ;
6. upload ressources ;
7. actions IA.
