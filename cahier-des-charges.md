# Cahier des charges

## 1. Contexte

Les etudiants de prepa ECG travaillent dans un environnement exigeant, dense et peu lisible au quotidien. Le volume de travail est important, les attentes des concours sont elevees, les ressources sont dispersees, et les etudiants ne savent pas toujours comment transformer leurs efforts en progression mesurable.

L'objectif du projet est de creer une application complete qui devient le centre du travail quotidien des preparationnaires. L'application doit aider les eleves a mieux s'organiser, mieux reviser, mieux identifier leurs lacunes et mieux progresser vers les concours.

Le produit ne doit pas etre pense comme un outil de surveillance du travail par les professeurs. Le role des enseignants dans l'application est d'alimenter l'ecosysteme de travail de l'etudiant : deposer des ressources, transmettre des attentes, corriger si besoin, et enrichir la qualite pedagogique du suivi. Le centre du produit reste l'etudiant.

## 2. Vision produit

L'application doit devenir le systeme d'exploitation du travail en prepa ECG.

Elle doit permettre a un etudiant de :

- savoir quoi travailler aujourd'hui ;
- prioriser selon ses concours, ses lacunes et ses echeances ;
- memoriser durablement grace a une repetition espacee rigoureuse ;
- acceder facilement aux cours, fiches, sujets et corrections ;
- recevoir un accompagnement personnalise via l'IA ;
- obtenir un feedback exploitable sur ses copies ;
- gagner en regularite, en clarte et en efficacite.

## 3. Objectifs du projet

### Objectifs pedagogiques

- augmenter la regularite de travail ;
- ameliorer la memorisation long terme ;
- accelerer l'identification et la correction des lacunes ;
- rapprocher les entrainements des attentes reelles des concours ;
- offrir un accompagnement personnalise sans dependre en permanence d'un echange humain synchrone.

### Objectifs produit

- devenir un outil utilise quotidiennement par les preparationnaires ;
- centraliser les outils essentiels de travail dans une seule interface ;
- creer une boucle d'usage forte entre planning, revision, progression et feedback ;
- proposer une valeur immediate meme avec un nombre limite de professeurs actifs au lancement.

### Objectifs business a long terme

- valider l'adoption dans une ou plusieurs classes pilotes ;
- demontrer un impact concret sur la regularite et la progression ;
- construire une solution specialiste et defensible sur le segment prepa ECG.

## 4. Principes directeurs

Le produit devra respecter les principes suivants :

- `Eleve-first` : chaque fonctionnalite doit d'abord simplifier la vie du preparationnaire.
- `Aide active` : l'application doit faire gagner du temps utile, pas ajouter de la complexite.
- `IA encadree` : l'IA aide a comprendre, reviser, planifier et corriger, sans faire le travail a la place de l'etudiant.
- `Progression mesurable` : l'application doit transformer les actions en signaux de progression.
- `Exigence concours` : les contenus, feedbacks et corrections doivent etre alignes avec les attendus reels de la prepa.
- `Simplicite d'usage` : le produit doit rester clair et actionnable meme dans une periode de fatigue ou de surcharge.

## 5. Cibles utilisateurs

### Cible principale

- Etudiants de prepa ECG de premiere et deuxieme annee

### Cibles secondaires

- Professeurs de prepa ECG
- Colleurs ou intervenants
- Administrateurs d'etablissement a plus long terme

## 6. Problemes a resoudre

### Problemes cote etudiant

- difficulte a garder un rythme de travail regulier sur la duree ;
- manque de clarte sur les priorites quotidiennes ;
- ressources eparpillees sur plusieurs canaux ;
- revision souvent passive au lieu d'etre active ;
- faible visibilite sur les vraies lacunes ;
- manque de feedback frequent entre deux devoirs ;
- tendance a travailler beaucoup sans toujours travailler de la bonne facon.

### Problemes cote professeur

- difficulte a transmettre simplement des supports centralises ;
- difficulte a partager des attendus de correction et des methodes ;
- manque d'outils pour apporter un appui ponctuel et cible ;
- outils actuels disperses entre mails, drive, ENT et papier.

## 7. Proposition de valeur

L'application doit reunir dans un seul environnement :

- l'organisation du travail ;
- la revision active ;
- l'acces aux ressources pedagogiques ;
- l'analyse des lacunes ;
- le feedback sur les productions ;
- une couche d'IA de personnalisation.

La promesse produit peut se formuler ainsi :

"Aider chaque preparationnaire ECG a savoir quoi travailler, comment le travailler et comment progresser plus vite vers les concours."

## 8. Perimetre fonctionnel

### Module 1. Tableau de bord quotidien

Le tableau de bord constitue la page centrale de l'application.

Il doit afficher :

- les priorites du jour ;
- les taches et devoirs a faire ;
- les revisions en retard ;
- les cartes a revoir ;
- les chapitres fragiles ;
- les prochains concours blancs, devoirs et colles ;
- des recommandations de sessions de travail.

Le tableau de bord doit toujours repondre a une question simple :

"Qu'est-ce que je dois faire maintenant pour maximiser ma progression ?"

### Module 2. Planning intelligent

Le planning doit generer des recommandations de travail personnalisees a partir de :

- l'emploi du temps fixe ;
- le temps disponible reel ;
- la charge de travail declarative ;
- les echeances a venir ;
- l'historique de travail ;
- les performances sur flashcards, quiz et copies ;
- les lacunes identifiees par matiere, chapitre et competence.

Fonctionnalites attendues :

- construction d'un planning quotidien ou hebdomadaire ;
- proposition de seances de travail adaptees a la disponibilite ;
- ajustement automatique selon les retards ou les lacunes ;
- integrer la repetition espacee dans la planification ;
- prise en compte de la fatigue ou du niveau d'intensite souhaite ;
- recalcul dynamique apres une session terminee ou manquee.

### Module 3. Flashcards avec repetition espacee

Ce module doit reproduire l'efficacite d'un systeme type Anki tout en etant integre au reste du produit.

Fonctionnalites attendues :

- creation de decks par matiere, chapitre, source ou professeur ;
- cartes recto / verso ;
- reponses de type `tres facile`, `facile`, `moyen`, `difficile`, `a revoir` ;
- recalcul automatique de la prochaine apparition d'une carte ;
- gestion des nouvelles cartes, cartes en apprentissage et cartes matures ;
- historique de revision par carte ;
- statistiques par deck et par chapitre ;
- creation manuelle de cartes ;
- generation de cartes a partir de cours ou fiches via l'IA.

Exigence forte :

Le moteur de repetition espacee devra etre assez solide pour devenir un vrai outil de memorisation long terme, pas un simple questionnaire.

### Module 4. Bibliotheque de ressources

L'application doit proposer un espace central de ressources dans lequel les professeurs peuvent deposer :

- cours ;
- polycopies ;
- fiches ;
- sujets ;
- corriges ;
- methodes ;
- rapports ou grilles de correction.

Fonctionnalites attendues :

- classement par matiere, chapitre et type de document ;
- recherche ;
- filtres ;
- favoris ;
- consultation web et mobile ;
- partage vers une classe ou un groupe.

Fonctionnalites IA associees :

- demander un resume ;
- demander une fiche ;
- demander une liste de notions ;
- generer des flashcards ;
- poser une question sur le document ;
- demander une explication simplifiee ou plus exigeante.

### Module 5. Espace copies et correction

L'application doit permettre aux etudiants de deposer des copies ou productions pour recevoir un feedback.

Formats vises :

- copie numerique ;
- PDF ;
- scan de copie manuscrite ;
- reponse courte saisie dans l'application.

Fonctionnalites attendues :

- depot de copie ;
- choix de la matiere, du type d'epreuve et du concours cible ;
- correction assistee par IA ;
- correction possible par le professeur ;
- grilles de correction parametrees ;
- feedback structure par criteres ;
- archivage des copies et historique de progression.

Le feedback doit inclure si possible :

- note ou fourchette indicative ;
- points forts ;
- erreurs majeures ;
- conseils concrets ;
- priorites de progression ;
- renvoi vers ressources, chapitres ou flashcards a retravailler.

### Module 6. Assistant IA transversal

L'IA ne doit pas etre un simple chat decoratif. Elle doit agir comme une couche transversale de personnalisation.

Usages attendus :

- planifier le travail ;
- repondre a une question de cours ou de methode ;
- resumer un document ;
- generer des fiches et flashcards ;
- expliquer une correction ;
- identifier les lacunes recurrentes ;
- proposer des exercices ou pistes d'entrainement ;
- produire un feedback sur copie ou reponse courte.

Regles de conception :

- ne pas faire a la place de l'etudiant ;
- expliciter les criteres de correction quand elle evalue ;
- rester alignee avec les attendus de la prepa ;
- signaler les limites ou le niveau de confiance sur les usages sensibles ;
- permettre une validation humaine lorsque necessaire.

### Module 7. Espace professeur

Le role du professeur dans l'application n'est pas de surveiller.

Le module professeur doit surtout permettre de :

- deposer des contenus ;
- partager des exigences de methode ;
- proposer un exercice ou une consigne ;
- corriger une copie si souhaite ;
- fournir des grilles de correction ;
- enrichir la base pedagogique qui nourrit l'experience eleve.

Ce module doit rester simple et rapide a utiliser afin de limiter la charge supplementaire pour les enseignants.

## 9. Parcours utilisateurs prioritaires

### Parcours eleve quotidien

1. L'etudiant ouvre l'application.
2. Il consulte son tableau de bord.
3. Il lance une session recommandee.
4. Il revise ses flashcards ou travaille sur une tache prioritaire.
5. Il consulte un cours ou demande un resume/fiche.
6. Il termine sa session et met a jour son avancement.
7. Le planning et les priorites se recalculent.

### Parcours eleve sur une lacune

1. L'application detecte une faiblesse recurrente.
2. Elle remonte cette lacune dans le tableau de bord.
3. Elle recommande une ressource.
4. Elle propose une session de revision et des flashcards.
5. L'etudiant retravaille puis est re-evalue.

### Parcours eleve sur une copie

1. L'etudiant depose une copie.
2. Il choisit le contexte de correction.
3. Il recoit un feedback structure.
4. Les lacunes detectees alimentent son suivi et son planning.

### Parcours professeur

1. Le professeur depose un cours ou une correction.
2. Il l'associe a une classe, une matiere et un chapitre.
3. Les eleves peuvent le consulter ou le transformer via l'IA.
4. Le professeur peut ajouter une grille de correction ou corriger une copie.

## 10. Priorisation produit

### MVP recommande

Le MVP doit viser une boucle d'usage quotidienne forte.

Fonctionnalites a inclure :

- authentification eleve / professeur ;
- onboarding eleve avec emploi du temps, matieres et objectifs ;
- tableau de bord quotidien ;
- planning intelligent version 1 ;
- flashcards avec repetition espacee ;
- bibliotheque de ressources ;
- IA de resume, fiche et generation de flashcards ;
- depot de copies et feedback assiste version 1 ;
- espace professeur simple de depot de contenus.

### Hors MVP

- correction experte totalement automatisee sur copies longues ;
- moteur OCR ultra-robuste des le lancement ;
- analytics d'etablissement avances ;
- fonctions communautaires ou sociales ;
- mode parent ;
- marketplace de contenus ;
- extension a toutes les filieres des la premiere version.

## 11. Exigences fonctionnelles

### Exigences eleve

- un etudiant doit pouvoir connaitre ses priorites du jour en moins de 30 secondes ;
- un etudiant doit pouvoir lancer une session de revision en moins de 2 clics ;
- un etudiant doit pouvoir reviser ses cartes sans friction ;
- un etudiant doit pouvoir deposer une copie facilement ;
- un etudiant doit pouvoir transformer un cours en support de revision via l'IA ;
- un etudiant doit pouvoir retrouver ses ressources, copies et statistiques simplement.

### Exigences professeur

- un professeur doit pouvoir deposer une ressource rapidement ;
- un professeur doit pouvoir associer un document a une classe et un chapitre ;
- un professeur doit pouvoir definir des attentes de correction ;
- un professeur doit pouvoir corriger ponctuellement sans workflow complexe.

### Exigences IA

- les reponses doivent etre contextualisees par matiere et usage ;
- les sorties sensibles doivent etre structurees et explicables ;
- les feedbacks doivent pouvoir se transformer en actions de travail ;
- le systeme doit eviter les formulations trop generiques ;
- le systeme doit prendre appui sur des ressources pedagogiques de reference.

## 12. Exigences non fonctionnelles

- interface rapide et lisible sur mobile et desktop ;
- temps de chargement faible sur les parcours quotidiens ;
- stockage securise des documents et copies ;
- gestion claire des droits eleve / professeur ;
- architecture capable d'evoluer vers plusieurs classes ou etablissements ;
- journalisation minimale pour comprendre l'usage sans tomber dans la surveillance.

## 13. Donnees principales

Entites a prevoir :

- utilisateurs ;
- roles ;
- classes ;
- matieres ;
- chapitres ;
- ressources ;
- decks de flashcards ;
- cartes ;
- historiques de revision ;
- sessions de travail ;
- taches et echeances ;
- copies ;
- feedbacks de correction ;
- grilles de correction ;
- lacunes ;
- messages ou annonces.

## 14. IA et donnees pedagogiques

Le produit devra etre concu pour s'adapter finement aux exigences de la prepa, mais cela ne signifie pas necessairement entrainer un modele maison des le debut.

Strategie recommandee au lancement :

- constituer une base de ressources de qualite ;
- structurer les usages par matiere et type d'epreuve ;
- utiliser du RAG sur les cours, corriges, methodes et grilles de correction ;
- concevoir des prompts specialises par cas d'usage ;
- collecter les retours utilisateurs et validations professeurs ;
- ameliorer progressivement la pertinence des sorties.

Ce qu'il faut eviter au debut :

- promettre une equivalence parfaite avec un correcteur humain ;
- fine-tuner trop tot sans corpus suffisant ;
- construire une IA generaliste sans cadre pedagogique.

## 15. Architecture technique recommandee

### Frontend

- Next.js
- TypeScript
- design system sobre, rapide et centre sur l'action

### Backend

- PostgreSQL
- couche API applicative
- auth et gestion de permissions
- stockage de fichiers

### IA

- modele de langage pour generation, explication et feedback ;
- pipeline RAG pour contextualiser les sorties ;
- eventuel OCR pour les copies manuscrites a partir d'une phase ulterieure.

## 16. Indicateurs de succes

Le projet devra mesurer en priorite :

- frequence d'usage hebdomadaire ;
- nombre de sessions de travail lancees ;
- volume de revisions de flashcards ;
- taux de completion des sessions planifiees ;
- taux de reutilisation de l'application ;
- usage des ressources deposees ;
- nombre de copies deposees ;
- evolution des lacunes identifiees.

Des indicateurs plus ambitieux pourront ensuite etre observes :

- progression des notes ;
- ressenti de maitrise ;
- regularite sur la duree ;
- impact percu sur la preparation des concours.

## 17. Risques principaux

- perimetre trop large des la v1 ;
- systeme de planning trop complexe ou peu credible ;
- flashcards mal executees donc peu adoptees ;
- correction IA insuffisamment fiable ;
- dependance excessive a l'IA sans cadre pedagogique ;
- charge trop forte pour les professeurs.

## 18. Feuille de route recommandee

### Phase 1. Cadrage

- affiner la promesse produit ;
- interviewer des etudiants ECG ;
- interviewer quelques professeurs ;
- valider les usages quotidiens prioritaires.

### Phase 2. Prototype

- maquetter les ecrans principaux ;
- tester le tableau de bord, le planning et les flashcards ;
- simuler les usages IA principaux.

### Phase 3. MVP

- developper l'application web ;
- lancer sur une ou deux classes pilotes ;
- mesurer l'usage reel ;
- simplifier en continu.

### Phase 4. Montée en puissance

- ameliorer la correction ;
- enrichir les ressources ;
- affiner la personnalisation ;
- etendre le produit a davantage d'utilisateurs.

## 19. Recommandation strategique

Le meilleur point d'entree n'est pas "l'application qui fait tout pour la prepa".

Le meilleur point d'entree est :

"l'outil qui aide chaque preparationnaire a savoir quoi faire chaque jour, a memoriser durablement et a progresser plus vite."

Autrement dit, le coeur du produit doit etre la boucle suivante :

- detection des lacunes ;
- priorisation ;
- planification ;
- revision active ;
- feedback ;
- progression.

## 20. Livrables immediats recommandes

Apres ce cahier des charges, les livrables suivants sont recommandes :

1. maquettes fonctionnelles des ecrans ;
2. specification technique ;
3. prototype web MVP ;
4. tests utilisateurs avec preparationnaires.
