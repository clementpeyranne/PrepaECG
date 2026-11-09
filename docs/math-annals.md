# Catalogue des annales de mathematiques

La page `/annales` utilise `src/data/math-annals.json`, sans requete externe ni
requete de base supplementaire pour charger le catalogue. L'acces reste protege
par le layout etudiant. Les PDF restent chez leurs editeurs : seuls les liens,
leur provenance et les metadonnees sont conserves dans le projet.

## Perimetre

- ECG 2023-2026 ; archives ECE/ECS 2000-2022, signalees comme ancien programme.
- Ecricome, emlyon, EDHEC, HEC/ESSEC et Maths 2 ; anciennes epreuves ESSEC/ESCP incluses.
- Les trois versions EDHEC ECS 2018 sont distinctes, avec leur propre correction.
- Un corrige absent reste `null` : aucun faux bouton, document d'une autre annee ou corrige IA.

## Mise a jour

1. Executer `npm run annals:refresh` pour relire les index publics et verifier les liens.
2. Relire les changements du catalogue avant publication, notamment annee, filiere et epreuve.
3. Executer `npm run test:annals` puis `npm run build`.

Le controle teste l'accessibilite HTTP et le type du document, pas l'exactitude
mathematique de toutes ses pages. Les erreurs identifiees dans les index sources
sont exclues explicitement dans l'importeur. Les liens peuvent devenir
indisponibles apres verification. Aucun rafraichissement payant ou automatique
n'est active. Le plafond de session est 2026 ; le relever apres verification des
nouvelles sessions. Les fichiers de travail sont dans `/tmp`, hors du depot.

Au 9 novembre 2026 : corriges non trouves pour HEC/ESCP Maths 2 approfondies 2026,
HEC ECS 2009, ESSEC ECE 2000 et ESSEC Maths 2 ECE 2000. Ne pas assimiler les pages
Major Prepa "A venir" a des corriges disponibles.

## Tests navigateur

`tests/annals-browser.mjs` utilise uniquement un serveur local et la base jetable
conservee par `PREPA_KEEP_TEST_FIXTURE=1 npm run test:journeys`. Il controle l'acces,
les filtres, les filieres, la pagination, les liens et l'absence de debordement
a 320 et 390 pixels. Il ne doit jamais etre lance avec les comptes de vrais eleves.
