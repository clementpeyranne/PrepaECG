# Pilote Prepa ECG - 80 eleves

Document de travail du 26 octobre 2026. Le nom commercial reste a choisir.

## Objectif

Verifier que les eleves reviennent spontanement pour organiser leur journee, reviser et exploiter leurs cours/corrections. Un pilote de quelques semaines ne prouve pas une hausse des resultats aux concours.

## Preparation et criteres d'ouverture

| Sujet | Situation | Preuve attendue |
| --- | --- | --- |
| Base et site | Base redevenue accessible apres un incident ; cause non confirmee | Controle de sante et parcours complet reussis apres le nouveau deploiement |
| Connexions simultanees | Passage au pool transactionnel prepare pour Vercel | Mesures en production sur pages publiques ET pages eleve connecte |
| PDF et photos vers l'IA | Branchement et gestion des echecs prepares | Tests simules + lecture reelle avec un compte fournisseur credite |
| Qualite pedagogique | Non validee par un professeur | Un professeur relit au moins 10 copies et 20 sorties de cours representatives |
| Import Anki | Tests locaux existants | Import reel depuis un compte pilote sur Vercel, medias et formules inclus |
| Recuperation du compte | Envoi d'email inactif | Reception et utilisation unique d'un vrai email de recuperation |
| Domaine et nom | A choisir par le fondateur | Domaine enregistre puis adresse d'envoi verifiee |
| Identite legale | Informations manquantes | Identite/coordonnees publiees et cadre du pilote valide avec la prepa |
| Sauvegardes | Restauration non testee | Sauvegarde base + fichiers, restauration sur un environnement distinct |
| Surveillance | Point de sante disponible | Alerte externe effectivement recue lors d'un test d'incident |
| Acces pilote | Code d'etablissement existant | Liste des participants et invitations individuelles avant ouverture a 80 |
| Mobile | Recette manuelle non terminee | Safari iPhone et Android : inscription, PDF/photos, revisions, planning |

Ne pas annoncer le pilote ouvert tant que les points necessaires a son perimetre ne sont pas valides. Les fonctions IA peuvent etre exclues d'une toute premiere recette interne, mais ne doivent pas etre presentees comme operationnelles avant leur test reel.

## Deploiement progressif propose

1. Recette interne : fondateur, 2 professeurs referents et 5 eleves volontaires.
2. Premiere semaine : 15 eleves, entretien court apres deux jours puis a la fin de semaine.
3. Deuxieme vague : 40 eleves si aucun incident bloquant ne reste ouvert.
4. Extension a 80 si les comptes, imports, depots et corrections restent fiables.
5. Bilan apres quatre a six semaines d'usage, sans ajout de fonctions hors besoins observes.

Les dates seront fixees avec la prepa apres fermeture des blocages. Ne pas imposer l'inscription aux eleves ni exporter leur liste sans accord de l'etablissement.

## Proposition a presenter a la prepa

- Test gratuit limite dans le temps, sur volontariat.
- Un professeur referent et un interlocuteur dans la direction.
- Presentation de 20 minutes, guide eleve d'une page et guide professeur d'une page.
- Support tenu par le fondateur les jours de lancement ; objectif de premiere reponse sous un jour ouvre.
- Les professeurs recoivent les copies qui leur sont adressees et leurs propres ressources. Ils ne surveillent pas les temps de revision individuels.
- Les notes IA restent indicatives ; aucune decision d'evaluation scolaire n'est automatisee.
- Bilan agrege du pilote ; aucun temoignage, logo ou nom d'etablissement publie sans autorisation.
- Acces aux donnees/export et devenir des comptes definis avant la fin du pilote.

## Mesures et seuils proposes

Ces seuils sont des hypotheses de decision a discuter, pas des engagements commerciaux.

| Indicateur | Definition | Cible de depart |
| --- | --- | --- |
| Activation | Profil termine + premiere revision ou bloc valide sous 48 h | 70 % des inscrits |
| Usage hebdomadaire | Au moins une action de travail dans la semaine | 50 % des inscrits en semaine 3 |
| Usage recurrent | Trois jours distincts avec une action de travail | 30 % des inscrits en semaine 3 |
| Fiabilite | Parcours bloquants ouverts et erreurs serveur | Aucun bloquant pendant une extension de vague |
| Performance | Temps de reponse des parcours mesures | p95 sous 3 s, hors generations IA et gros imports |
| Cout | Depense IA / eleve actif et cout par correction | Mesure reelle avant de fixer le tarif |
| Utilite | Entretiens : gain concret de temps, abandon d'un outil, besoin non couvert | 10 entretiens eleves + 3 professeurs |
| Intention de payer | Eleve ou etablissement accepte un prix explicite | Entretien de bilan avec le decideur |

Les connexions seules ne prouvent pas le travail effectue. Les blocs valides sont declaratifs ; les revisions de cartes et depots apportent des signaux complementaires. Ne pas transformer ces mesures en surveillance individuelle.

## Decisions business a prendre

1. Identifier qui paie : eleve, etablissement ou financement mixte. Tester la piste etablissement, sans la tenir pour acquise.
2. Interviewer le decideur sur son budget, son calendrier d'achat et les validations requises.
3. Definir une offre pilote, un cout mensuel maximum et le contenu du bilan.
4. Faire la marge avec le cout complet : IA, hebergement, stockage, support et maintenance.
5. Ne fixer le prix qu'apres les premiers couts mesures et les entretiens.

## Actions attendues du fondateur

- Choisir le nom et autoriser l'achat du domaine souhaite.
- Fournir les informations legales publiables.
- Crediter le compte API et autoriser son activation quand le budget est choisi ; ne pas envoyer de cle dans le chat.
- Identifier la prepa, son interlocuteur, les professeurs volontaires et une fenetre de test.

## Suivi technique

- `npm run pilot:ready:prod` : verifie les services publics et liste les blocages du perimetre complet.
- `npm run pilot:smoke:prod` : parcours sur un compte temporaire, ensuite supprime.
- `PILOT_AUTH_CONCURRENCY=20 npm run pilot:smoke:prod` : ajoute une mesure sur des pages authentifiees du compte temporaire. Ce n'est pas 20 eleves distincts ni un test de depots simultanes.
- `PILOT_REQUESTS=160 PILOT_CONCURRENCY=20 npm run pilot:load:prod` : charge publique legere ; ne valide pas a elle seule 80 eleves connectes.

Apres chaque publication : attendre le succes Vercel, verifier la sante et relancer la recette. Garder le commit precedent pour revenir en arriere en cas de regression.
