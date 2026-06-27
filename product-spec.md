# Product spec

## 1. Problemes a resoudre

### Cote etudiant

- Difficultes a tenir un rythme de travail regulier des le debut de l'annee
- Manque de visibilite sur les priorites quotidiennes
- Ressources eparpillees entre PDF, mails, groupes de classe, drive et cahiers
- Impression de travailler beaucoup sans savoir si le travail est vraiment rentable
- Peu de feedback immediat entre deux devoirs
- Difficultes a identifier ses lacunes exactes par chapitre, matiere et competence

### Cote professeur

- Difficulte a suivre finement le travail hors classe
- Difficulte a envoyer le bon exercice au bon groupe d'eleves
- Peu de visibilite sur les chapitres mal maitrises collectivement
- Outils souvent disperses entre messagerie, drive, ENT et papier

## 2. Proposition de valeur

Creer une plateforme unique pour la prepa ECG qui combine :

- organisation du travail ;
- entrainement ;
- feedback ;
- centralisation des ressources ;
- communication pedagogique ;
- assistance IA utile et cadree.

## 3. Fonctionnalites principales

### A. Tableau de bord eleve

Objectif : dire clairement a l'etudiant quoi faire aujourd'hui.

Contenu :

- taches du jour ;
- heures de travail realisees ;
- matieres en retard ;
- chapitres faibles ;
- prochains devoirs / colles / kholles ;
- suggestions intelligentes de seances de travail.

### B. Planning intelligent

L'etudiant indique :

- ses horaires ;
- son emploi du temps fixe ;
- ses matieres ;
- ses devoirs a venir ;
- ses points faibles ;
- son temps disponible.

L'application construit ensuite :

- un planning quotidien ;
- des sessions courtes ou longues selon la fatigue ;
- des rappels de revision espacee ;
- des priorites reequilibrees selon les echeances.

Le planning doit surtout s'appuyer sur trois signaux :

- la charge reelle de la semaine ;
- la progression de l'etudiant ;
- ses lacunes observees dans les flashcards, quiz, copies et devoirs.

### C. Bibliotheque centralisee

Fonctions :

- depot de cours, fiches, sujets, corrections ;
- classement par matiere, chapitre, type de document ;
- recherche rapide ;
- sauvegarde de favoris ;
- partage professeur -> classe ou groupe.

Extension cle :

- un onglet professeurs ou les enseignants deposent directement leurs cours, supports, methodes, sujets et corrections ;
- un bouton cote eleve pour demander un resume, une fiche, une liste de notions ou des flashcards generees a partir du document.

### D. Entrainement actif

Fonctions :

- quiz ;
- flashcards ;
- exos par difficulte ;
- sujets type concours ;
- mini-tests chronometres ;
- suivi des erreurs recurrentes.

Le systeme de flashcards doit etre pense comme un vrai moteur de repetition espacee, proche de l'experience Anki :

- carte recto / verso ;
- niveaux de reponse de type "tres facile", "facile", "moyen", "difficile", "a revoir" ;
- recalcul automatique de la prochaine revision ;
- historique de memoire par carte ;
- paquets par matiere, chapitre, source et professeur ;
- creation manuelle et generation assistee par IA.

### E. Analyse de progression

Fonctions :

- score par matiere ;
- score par chapitre ;
- courbe de regularite ;
- heatmap de travail ;
- taux de reussite par type d'exercice ;
- historique des lacunes corrigees / non corrigees.

### F. Espace professeur

Fonctions :

- envoi de ressources ;
- assignation d'exercices ;
- suivi de completion ;
- lecture de statistiques de classe ;
- messages ciblés a des eleves ou groupes ;
- recommandation de travail personnalisee ;
- correction de copies soumises par les etudiants ;
- parametrage de grilles de correction et d'attendus.

### G. Assistant IA

Regle cle : l'IA doit aider a travailler, pas travailler a la place de l'etudiant.

Fonctions utiles :

- convertir un cours en questions de revision ;
- expliquer une correction pas a pas ;
- proposer un exercice analogue ;
- evaluer une reponse courte via une grille simple ;
- construire un plan de travail quotidien ;
- reformuler une methode de concours.

Nouveaux cas d'usage centraux :

- generer des flashcards a partir d'un cours depose ;
- resumer un polycopie selon un format demande ;
- repondre a une question de methode ou de comprehension ;
- proposer une correction de copie respectant une grille de concours ;
- pointer les lacunes qui doivent remonter dans le planning intelligent.

Fonctions a encadrer fortement :

- redaction complete de dissertations ;
- resolution directe d'exercices notés ;
- generation de devoirs "prets a rendre".

Positionnement IA :

L'IA n'est pas un simple module isole. Elle constitue une couche transversale de personnalisation dans l'ensemble du produit :

- planification ;
- revision ;
- question reponse ;
- transformation des ressources ;
- correction ;
- suivi individuel.

Elle doit cependant rester gouvernee par des contraintes pedagogiques fortes :

- expliciter son raisonnement ou ses criteres quand elle evalue ;
- signaler son niveau de confiance ;
- laisser une place de validation au professeur sur les usages sensibles ;
- ne pas encourager la triche ni la delegation totale du travail.

### H. Copies et correction

Fonctions :

- depot de copies scannees ou numeriques ;
- choix du type d'epreuve et du concours cible ;
- correction IA selon grille, bareme et attentes ;
- possibilite de correction par le professeur ;
- comparaison entre correction IA et correction prof ;
- annotation par competence : methode, structure, precision, connaissances, rigueur.

Cas d'usage important :

Le systeme ne doit pas seulement donner une note. Il doit produire un feedback exploitable :

- points forts ;
- erreurs recurrentes ;
- conseils prioritaires ;
- renvoi vers chapitres, fiches ou flashcards a reprendre.

## 4. MVP concret

Si on veut lancer vite, le MVP ideal contient seulement :

### Version 1

- authentification eleve / professeur ;
- tableau de bord eleve ;
- gestion des taches et devoirs ;
- planning intelligent ;
- bibliotheque de ressources professeur -> eleves ;
- systeme de flashcards avec repetition espacee ;
- messagerie ou annonces prof -> eleves ;
- premier assistant IA de revision ;
- premiere version de depot et feedback sur copies.

### Ce qu'on repousse

- correction automatisee tres fine de copies longues au niveau expert ;
- marketplace de contenus ;
- classement national ;
- visio integree ;
- reseau social etudiant ;
- mode parent ;
- app ultra-complete multi-prepa des le jour 1.

## 5. Parcours utilisateurs

### Parcours eleve

1. L'etudiant cree son compte et choisit sa classe.
2. Il renseigne ses matieres, ses horaires et ses objectifs.
3. Il voit son tableau de bord du jour.
4. Il ouvre une session de travail recommandee.
5. Il revise via ressources, quiz ou flashcards.
6. Il recoit un feedback sur ses lacunes.
7. Le professeur peut lui pousser un exercice ou une consigne.

### Parcours professeur

1. Le professeur cree sa classe.
2. Il depose cours, fiches, exos ou annonces.
3. Il cible une classe, un groupe ou des eleves.
4. Il consulte les zones de faiblesse.
5. Il ajuste ses recommandations ou devoirs.

## 6. Architecture technique recommandee

Pour un produit moderne, rapide a lancer et evolutif :

### Frontend

- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui ou design system maison

### Backend

- Supabase ou PostgreSQL + API Next.js
- Auth integree
- Stockage fichiers
- Realtime pour messages / notifications

### IA

- API de modele de langage pour :
  - quiz ;
  - fiches ;
  - flashcards ;
  - feedback ;
  - aide methodologique ;
  - correction assistee ;
  - planification.

### Briques IA a prevoir

- RAG sur les cours, fiches, corrections et methodes de professeurs ;
- systeme de prompts specialises par usage ;
- traces de feedback utilisateur pour ameliorer les sorties ;
- validation humaine sur les corrections sensibles ;
- modele de scoring ou regles metier pour la repetition espacee ;
- pipeline OCR pour lire les copies manuscrites si besoin.

### Donnees principales

Tables de base :

- users
- classes
- enrollments
- subjects
- chapters
- resources
- assignments
- study_sessions
- flashcard_decks
- flashcards
- flashcard_reviews
- quiz_attempts
- weak_points
- essays
- essay_feedback
- grading_rubrics
- messages

## 6 bis. Donnees pedagogiques et "entrainement" de l'IA

Le mot "entrainer" peut vouloir dire deux choses tres differentes :

### Ce qu'il faut faire au debut

- constituer une base de connaissances de qualite ;
- fournir de bons prompts ;
- injecter les cours, corrections, rapports de jury, methodes et baremes ;
- recueillir des exemples de bonnes corrections de professeurs ;
- specialiser les sorties par matiere, type d'epreuve et niveau de l'etudiant.

### Ce qu'il ne faut probablement pas faire au debut

- fine-tuner un modele des la version 1 ;
- construire un modele maison ;
- promettre une correction "equivalente a un professeur" sans garde-fous.

Ordre recommande :

1. RAG + prompts + grilles de correction ;
2. boucle de feedback prof / eleve ;
3. eventuel ajustement ou fine-tuning quand beaucoup de donnees auront ete accumulees.

## 7. KPI produit

Pour savoir si l'application aide vraiment :

- nombre de sessions de travail par semaine ;
- temps de travail effectif ;
- regularite ;
- taux de completion des taches ;
- progression sur chapitres faibles ;
- usage recurrent par les professeurs ;
- retention hebdomadaire.

## 8. Feuille de route

### Phase 1 - cadrage

- choisir le coeur du probleme ;
- interviewer 10 a 20 etudiants ;
- interviewer 5 a 10 professeurs ;
- prioriser les besoins.

### Phase 2 - prototype

- faire des maquettes ;
- tester les parcours eleve et professeur ;
- valider le tableau de bord et le planning.

### Phase 3 - MVP

- construire web app ;
- lancer sur une ou deux classes pilotes ;
- mesurer usage reel ;
- simplifier sans pitié.

### Phase 4 - extension

- mobile ;
- analytics avances ;
- personnalisation plus fine ;
- IA plus poussee ;
- partenariats avec prepas.

## 9. Angle strategique fort

Le meilleur positionnement n'est probablement pas "l'application qui fait tout".

Le meilleur positionnement est plutot :

"le systeme d'exploitation du travail en prepa ECG"

Si on tient cette promesse, l'application peut ensuite absorber d'autres outils autour d'un noyau tres fort :

- discipline ;
- priorisation ;
- entrainement ;
- feedback ;
- lien pedagogique.

## 10. Prochaine etape recommandee

La meilleure suite n'est pas encore de coder toute l'application.

La meilleure suite est de choisir un point d'entree ultra-fort, par exemple :

1. tableau de bord de travail + planning intelligent ;
2. flashcards type Anki + suivi des lacunes ;
3. onglet professeurs + ressources + IA de resume ;
4. copies + correction assistee.

Mon conseil : commencer par le couple "planning intelligent + flashcards + suivi des lacunes", car c'est la boucle d'usage la plus quotidienne, la plus defensible et la plus facile a rendre vraiment utile.
