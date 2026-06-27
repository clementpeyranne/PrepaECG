# Base locale simple

Pour le demarrage, le projet utilise maintenant `SQLite` avec Prisma.

## Pourquoi ce choix

Pour un prototype local, c'est beaucoup plus simple :

- rien a installer en plus ;
- pas de serveur de base de donnees a lancer ;
- toutes les donnees sont stockees dans un simple fichier local ;
- parfait pour un premier vrai passage du prototype a une application qui enregistre.

## Fichier important

La base sera creee automatiquement dans :

`prisma/dev.db`

## Mise en route

1. Creer le fichier `.env`
2. Y mettre :

```bash
DATABASE_URL="file:./dev.db"
```

3. Lancer :

```bash
npm run db:init
```

Cette commande cree la base locale a partir du schema actuel.

4. Puis lancer :

```bash
npm run prisma:generate
```

Cette commande prepare Prisma pour que l'application puisse parler a la base.

## Outil visuel utile

Pour voir la base de donnees dans une interface simple :

```bash
npm run db:studio
```

Puis ouvrir l'URL proposee dans le navigateur.

## Et plus tard

Plus tard, on pourra passer de SQLite local a PostgreSQL ou Supabase sans changer la vision produit.
SQLite sert juste a rendre le demarrage beaucoup plus simple.
