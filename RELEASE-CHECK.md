# Verification avant publication - 29 septembre 2026

## Controles effectues

- 11 tests de securite reussis : sessions, recuperation, liens a usage unique, cache prive.
- 28 scenarios de parcours reussis sur SQLite isole : invitations professeurs, deux prepas, connexion, PDF/photos, corrections, doublons, flashcards, pagination et progression. Les scenarios planning verifient aussi la conservation de tous les blocs, l'annulation, l'absence de doublon et le temps reporte au tableau de bord.
- Recette HTTP du vrai serveur Next reussie : connexion eleve/professeur, ressources isolees, pages professeur, recuperation indisponible explicite, refus d'origine etrangere.
- Build optimise et verification TypeScript reussis. Lint non execute par le build.
- Installation reproductible avec npm ci ; npm audit : aucune vulnerabilite signalee au moment du controle. Cela ne constitue pas un audit exhaustif du code.
- Stockage Supabase reel : envoi direct de 6 Mo, controle du fichier, lecture par URL signee, refus d'acces public et de validation par un autre compte. Fichier temporaire supprime.
- Migration additive prisma/production-auth.sql appliquee a la production et colonnes/tables verifiees. RLS active sur les deux nouvelles tables. Aucun compte ni document existant supprime.
- Point de sante du site existant : HTTP 200, base disponible apres remise en route de Supabase.
- Index de performance additifs appliques a Supabase sans suppression de donnees.
- Fonctions Vercel rapprochees de la base Supabase en region Stockholm (`arn1`).
- Les listes volumineuses de flashcards sont chargees par pages de 50 cartes et la navigation affiche desormais un etat de chargement immediat.
- Import Anki sans outil systeme, avec conservation des decks/sous-decks, medias et formules mathematiques. Le fichier reel de 1 528 cartes utilise pendant la mise au point et les cas synthetiques passent localement.
- Recette sur la vraie production reussie avec un compte temporaire : inscription, configuration, neuf pages eleve, deconnexion et reconnexion. Le compte et ses donnees ont ensuite ete supprimes.
- Controle de charge public reussi : 30 requetes avec une concurrence de 6, aucune erreur, mediane 105 ms et p95 1 026 ms.
- Audit anonyme de production : aucun professeur sans etablissement et aucun eleve sans configuration terminee.
- Nettoyage des doubles depots ajoute dans l'application. Un outil de nettoyage Supabase ne supprime que les fichiers anciens non references et fonctionne en apercu par defaut.

## Publication

La migration a ete appliquee via le pilote PostgreSQL Node avec verification du certificat et du nom du serveur, en utilisant le certificat officiel Supabase. Le CLI Prisma de ce Mac renvoie encore P1011 (bad certificate format), meme avec ce certificat explicite. La migration est deja faite : ne pas reinitialiser la base. Pour une autre installation, le SQL additif peut aussi etre execute dans le SQL Editor Supabase avant de deployer le code.

Chaque publication doit etre suivie de la verification du build Vercel puis de `/api/health`. La version n'est pas consideree comme disponible pour le pilote avant ces deux controles.

## Restant avant ouverture publique

- Recuperation par email : choisir un domaine, verifier l'adresse d'envoi dans Resend, configurer PASSWORD_RESET_MODE=email, RESEND_API_KEY et EMAIL_FROM dans Vercel. Verifier une reception reelle et le lien a usage unique. Les tests actuels simulent le fournisseur, aucun email reel n'a ete envoye.
- Renseigner une adresse de support et les informations legales reelles.
- Confirmer humainement l'identite du professeur existant. L'audit confirme que son compte est bien rattache a l'etablissement ; les nouvelles inscriptions exigent une invitation personnelle liee a l'email et a l'etablissement.
- Recette navigateur sur ordinateur et iPhone : inscription invitee, connexion, depot, ouverture du document, retour professeur, lecture par l'eleve et revision. Le lancement automatise de Chrome est bloque par les permissions de l'environnement ; aucune validation visuelle n'est revendiquee.
- Le planning dispose des vues semaine/jour et de la validation sur chaque ligne de la vue jour. Le script tests/planning-browser.mjs prepare la recette navigation, validation, annulation et largeur mobile sur la base jetable ; son execution navigateur reste bloquee dans cet environnement.
- Refaire l'import Anki volumineux depuis un compte pilote sur Vercel. Le traitement est compatible avec l'environnement serveur, mais la duree et la memoire doivent encore etre mesurees en conditions reelles.
- Prevoir le nettoyage des fichiers cloud abandonnes avant enregistrement et un test de charge. La charge simultanee de toute une classe et toutes les tailles de fichier ne sont pas encore validees.
- La connexion d'execution utilise encore le pool Supabase en mode session sur le port 5432. Passer au pool transactionnel recommande pour Vercel avant une ouverture a grande echelle.
- L'IA n'est pas activee sans configuration et credits du fournisseur.

Cette liste distingue les fonctions implementees, les tests reussis et ce qui reste a valider ; elle ne garantit pas l'absence de tout bug.
