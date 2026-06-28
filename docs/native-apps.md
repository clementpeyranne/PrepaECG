# Preparation native

Le site est deja prepare comme application web installable.

## iPhone et Android

La voie la plus simple pour une vraie application mobile est `Capacitor`.

Base retenue :

- le site reste heberge sur Vercel ;
- l'application mobile ouvre l'URL publique securisee ;
- l'authentification, la base et les fichiers restent centralises ;
- les evolutions du site profitent aussi a l'application.

Un exemple de configuration est disponible dans [capacitor.config.example.ts](/Users/clementpeyranne/Documents/Codex/2026-04-18-salut-je-viens-de-finir-classe/capacitor.config.example.ts).

Avant de l'activer vraiment, il faudra :

1. fixer l'URL publique finale ;
2. installer Capacitor dans le projet ;
3. creer les projets iOS et Android ;
4. tester l'authentification, l'upload PDF/photo et les liens professeurs-eleves sur mobile.

## Mac et PC

Deux options propres existent ensuite :

- garder l'installation PWA, deja fonctionnelle pour la plupart des usages ;
- ajouter plus tard un shell desktop dedie via `Tauri` ou `Electron` si tu veux une vraie application telechargeable avec icone, fenetre et packaging natif.

## Recommandation

Ordre conseille :

1. finaliser le deploiement Vercel public ;
2. stabiliser l'usage beta avec de vrais comptes ;
3. lancer ensuite le shell mobile Capacitor ;
4. ne faire un shell desktop dedie que si le besoin reste reel apres les tests.
