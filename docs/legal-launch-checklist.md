# Checklist juridique et RGPD avant ouverture publique

Ce document est une checklist operationnelle, pas une consultation juridique. Les textes publics doivent etre relus apres chaque changement important du produit.

## Identite de l'editeur

- Choisir la forme d'exploitation : personne physique, micro-entreprise, association ou societe.
- Renseigner le nom legal, le statut, l'adresse, le telephone, l'email et le directeur de publication.
- Ajouter le SIREN ou l'immatriculation lorsqu'elle existe.
- Eviter de publier une adresse personnelle avant d'avoir choisi une solution de domiciliation adaptee.

## Donnees personnelles

- Tenir un registre des traitements : comptes, progression, copies, ressources, IA, securite et support.
- Identifier les bases legales et verifier les durees de conservation au moins une fois par an.
- Conserver une procedure d'acces, rectification, portabilite, opposition et effacement.
- Documenter tout incident dans un registre de violations et evaluer la notification CNIL sous 72 heures.
- Evaluer la necessite d'une AIPD avant une utilisation a grande echelle, compte tenu du suivi pedagogique et de la presence possible de mineurs.

## Prestataires

- Accepter et archiver les accords de traitement de Vercel et Supabase.
- Verifier la region Supabase et la liste des sous-traitants.
- Avant d'activer Resend ou OpenAI, verifier leur DPA, les transferts internationaux, les durees de conservation et la configuration du compte.
- Ne pas activer de mesure d'audience, publicite ou traceur tiers sans audit et, lorsque requis, consentement prealable.

## Etablissements et contenus

- Conclure un accord pilote ecrit avec chaque etablissement : roles, support, securite, duree et fin de pilote.
- Definir qui est responsable de traitement pour les notes, copies et retours saisis par les professeurs.
- Informer les professeurs qu'ils ne doivent deposer que des contenus qu'ils sont autorises a partager.
- Prevoir la fermeture d'un environnement et la restitution ou suppression des donnees.

## Exploitation

- Appliquer `npm run db:legal:prod` avant de deployer la collecte des acceptations.
- Completer les variables publiques legales dans Vercel puis redeployer.
- Tester les liens CGU, confidentialite, cookies, support et CNIL sur mobile et ordinateur.
- Verifier que chaque nouvelle inscription enregistre la version acceptee.
- Nettoyer regulierement les journaux de plus de 90 jours depuis l'administration.

## Sources de reference

- CNIL, informer les personnes : https://www.cnil.fr/fr/informer-les-personnes
- CNIL, documenter la conformite : https://www.cnil.fr/fr/documenter-la-conformite
- CNIL, cookies et traceurs : https://www.cnil.fr/fr/cookies-et-autres-traceurs
- Service-Public, obligations RGPD : https://entreprendre.service-public.fr/vosdroits/F24270
- Loi pour la confiance dans l'economie numerique, article 6 : https://www.legifrance.gouv.fr/loda/article_lc/LEGIARTI000044067469

