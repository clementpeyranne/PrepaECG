# Verification avant publication - 28 septembre 2026

## Controles effectues

- 11 tests de securite reussis : sessions, recuperation, liens a usage unique, cache prive.
- 20 scenarios de parcours reussis sur SQLite isole : invitations professeurs, deux prepas, connexion, PDF/photos, corrections, doublons, flashcards et progression. Les trois scenarios planning verifient aussi la conservation de tous les blocs, l'annulation, l'absence de doublon et le temps reporte au tableau de bord.
- Recette HTTP du vrai serveur Next reussie : connexion eleve/professeur, ressources isolees, pages professeur, recuperation indisponible explicite, refus d'origine etrangere.
- Build optimise et verification TypeScript reussis. Lint non execute par le build.
- Installation reproductible avec npm ci ; npm audit : aucune vulnerabilite signalee au moment du controle. Cela ne constitue pas un audit exhaustif du code.
- Stockage Supabase reel : envoi direct de 6 Mo, controle du fichier, lecture par URL signee, refus d'acces public et de validation par un autre compte. Fichier temporaire supprime.
- Migration additive prisma/production-auth.sql appliquee a la production et colonnes/tables verifiees. RLS active sur les deux nouvelles tables. Aucun compte ni document existant supprime.
- Point de sante du site existant : HTTP 200, base disponible apres remise en route de Supabase.

## Publication

La migration a ete appliquee via le pilote PostgreSQL Node avec verification du certificat et du nom du serveur, en utilisant le certificat officiel Supabase. Le CLI Prisma de ce Mac renvoie encore P1011 (bad certificate format), meme avec ce certificat explicite. La migration est deja faite : ne pas reinitialiser la base. Pour une autre installation, le SQL additif peut aussi etre execute dans le SQL Editor Supabase avant de deployer le code.

Le push automatique n'a pas pu s'authentifier a GitHub. Apres git push origin main depuis une session authentifiee, attendre le nouveau deploiement Vercel, puis verifier /api/health et les parcours ci-dessous. La nouvelle version n'est pas consideree comme deployee avant cette verification.

## Restant avant ouverture publique

- Recuperation par email : choisir un domaine, verifier l'adresse d'envoi dans Resend, configurer PASSWORD_RESET_MODE=email, RESEND_API_KEY et EMAIL_FROM dans Vercel. Verifier une reception reelle et le lien a usage unique. Les tests actuels simulent le fournisseur, aucun email reel n'a ete envoye.
- Renseigner une adresse de support et les informations legales reelles.
- Verifier la legitimite des comptes professeurs deja existants. Les nouvelles inscriptions exigent une invitation personnelle liee a l'email et a l'etablissement ; les anciens comptes ne sont pas modifies.
- Recette navigateur sur ordinateur et iPhone : inscription invitee, connexion, depot, ouverture du document, retour professeur, lecture par l'eleve et revision. Le lancement automatise de Chrome est bloque par les permissions de l'environnement ; aucune validation visuelle n'est revendiquee.
- Le planning dispose des vues semaine/jour et de la validation sur chaque ligne de la vue jour. Le script tests/planning-browser.mjs prepare la recette navigation, validation, annulation et largeur mobile sur la base jetable ; son execution navigateur reste bloquee dans cet environnement.
- Rejouer ces parcours sur PostgreSQL avec des comptes de recette dedies apres deploiement. Les tests automatisees de parcours utilisent SQLite, pas la base de production.
- Adapter et tester l'import Anki volumineux sur Vercel : le parcours utilise encore des outils systeme et des fichiers locaux, contrairement aux nouveaux depots PDF/photos directs. Ne pas le presenter comme valide en production.
- Prevoir le nettoyage des fichiers cloud abandonnes avant enregistrement et un test de charge. Ni la charge simultanee ni toutes les tailles de fichier ne sont validees.
- L'IA n'est pas activee sans configuration et credits du fournisseur.

Cette liste distingue les fonctions implementees, les tests reussis et ce qui reste a valider ; elle ne garantit pas l'absence de tout bug.
