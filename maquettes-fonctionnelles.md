# Maquettes fonctionnelles

## 1. Objectif

Ces maquettes fonctionnelles definissent les ecrans principaux de l'application, leur role, leur contenu et les actions attendues. Elles ne decrivent pas encore le design visuel final. Leur but est de valider la logique produit et l'experience utilisateur avant le developpement.

Le principe directeur reste le meme :

"aider l'etudiant de prepa ECG a savoir quoi faire, comment le faire et comment progresser"

## 2. Structure generale de l'application

### Navigation principale cote eleve

- Tableau de bord
- Planning
- Flashcards
- Ressources
- Copies
- Assistant IA
- Profil / progression

### Navigation principale cote professeur

- Ressources
- Copies
- Grilles de correction
- Classes
- Profil

## 3. Ecran 1 - Onboarding eleve

### Objectif

Recuperer les informations minimales pour personnaliser l'experience des le premier jour.

### Donnees a collecter

- prenom / nom ;
- classe ;
- annee de prepa ;
- concours vises ;
- matieres suivies ;
- emploi du temps fixe ;
- temps de travail disponible hors cours ;
- points forts perçus ;
- points faibles perçus ;
- objectifs personnels.

### Structure de l'ecran

```text
[Logo]
Bienvenue
Configure ton espace de travail prepa

[Etape 1] Informations generales
[Etape 2] Classe et matieres
[Etape 3] Emploi du temps
[Etape 4] Objectifs et lacunes
[Etape 5] Resume de configuration
```

### Actions principales

- continuer ;
- revenir en arriere ;
- terminer l'onboarding.

### Exigence UX

L'onboarding doit etre rapide, comprehensible et segmenté. Il faut donner une impression immediate de personnalisation et non d'administration.

## 4. Ecran 2 - Tableau de bord eleve

### Objectif

Faire du tableau de bord le centre du travail quotidien.

### Question a laquelle l'ecran doit repondre

"Qu'est-ce que je dois faire aujourd'hui pour progresser le plus ?"

### Structure fonctionnelle

```text
[Header]
Bonjour Clement
Mardi 18 avril

[Bloc prioritaire]
Session recommandee maintenant
- 45 min Maths approfondies
- 20 flashcards ESH en retard
- 1 copie a relire
[Bouton] Commencer

[Bloc planning du jour]
- 17h00-17h45 Maths
- 18h00-18h20 Flashcards ESH
- 20h00-21h00 HGG dissertation

[Bloc lacunes]
- Probabilites
- Methodologie dissertation ESH
- Dates HGG

[Bloc echeances]
- DS de maths dans 3 jours
- Colle HGG demain
- Devoir ESH dimanche

[Bloc progression]
- 3 sessions realisees cette semaine
- 82 cartes revisees
- regularite : 5 jours sur 6

[Bloc ressources utiles]
- Cours de maths chapitre 8
- Fiche ESH croissance
- Resume IA du cours HGG
```

### Actions principales

- demarrer une session ;
- consulter le planning complet ;
- lancer les flashcards ;
- ouvrir une ressource ;
- deposer une copie ;
- demander une nouvelle recommandation IA.

### Regles de priorisation

Le haut de l'ecran doit toujours afficher une action concrete. On ne veut pas un tableau de statistiques passif, mais un tableau de mise en mouvement.

## 5. Ecran 3 - Planning intelligent

### Objectif

Transformer les contraintes de l'etudiant en plan de travail realiste.

### Structure fonctionnelle

```text
[Vue semaine]
Lundi   Mardi   Mercredi   Jeudi   Vendredi   Samedi   Dimanche

[Colonne jour selectionne]
Disponibilite du jour
Charge prevue
Charge realisee

[Liste des sessions proposees]
- 45 min revision chapitre fragile
- 25 min flashcards en retard
- 60 min sujet type concours
- 20 min relecture correction

[Bloc explication IA]
Pourquoi ce planning ?
- DS proche
- cartes en retard
- baisse recente en probabilites

[Bloc ajustements]
Temps dispo
Niveau d'energie
Priorite concours / devoir / revision
```

### Fonctionnalites attendues

- affichage jour / semaine ;
- glisser-deposer ou deplacer une session ;
- recalcul automatique du planning ;
- bouton "reoptimiser ma semaine" ;
- prise en compte des cartes a revoir ;
- prise en compte des copies corrigees et des lacunes detectees ;
- affichage de la logique de recommandation.

### Actions principales

- accepter une session ;
- deplacer une session ;
- supprimer une session ;
- demander une version plus intense ;
- demander une version plus legere.

## 6. Ecran 4 - Session de travail

### Objectif

Transformer une intention en travail effectif, sans friction.

### Structure fonctionnelle

```text
[Header]
Session en cours - Probabilites
Temps prevu : 45 min

[Objectif de session]
Revoir les lois usuelles et refaire 3 exercices

[Checklist]
[ ] Revoir fiche
[ ] Faire flashcards
[ ] Resoudre exercice 1
[ ] Resoudre exercice 2
[ ] Resoudre exercice 3

[Bloc ressources associees]
- Cours professeur
- Resume IA
- Flashcards du chapitre

[Timer]
00:24:18

[Fin de session]
Comment s'est passee la session ?
- facile
- utile
- difficile
- a refaire
```

### Actions principales

- lancer la session ;
- mettre en pause ;
- ouvrir une ressource ;
- marquer la session comme terminee ;
- signaler une difficultée.

### Interet produit

Cet ecran est crucial, car il fait le lien entre le planning theorique et le travail reel.

## 7. Ecran 5 - Flashcards

### Objectif

Faire de la repetition espacee un reflexe quotidien.

### Structure fonctionnelle - vue decks

```text
[Header]
Flashcards

[Statistiques]
Cartes a revoir aujourd'hui : 74
Nouvelles cartes : 18
Taux de retention : 81%

[Liste des decks]
- Maths / Probabilites / 42 cartes / 12 a revoir
- ESH / Croissance / 58 cartes / 20 a revoir
- HGG / Dates / 90 cartes / 35 a revoir

[Actions]
[Bouton] Reviser maintenant
[Bouton] Creer un deck
[Bouton] Generer depuis un document
```

### Structure fonctionnelle - vue revision

```text
[Carte]
Question : Donner la definition d'une variable aleatoire discrete

[Bouton] Afficher la reponse

Reponse :
...

Comment tu l'as eue ?
[Tres facile] [Facile] [Moyen] [Difficile] [A revoir]
```

### Fonctionnalites attendues

- revision fluide et rapide ;
- algorithme de repartition des cartes ;
- historique par carte ;
- cartes creees a la main ou generees par IA ;
- tags par matiere, chapitre, source ;
- lien entre cartes faibles et planning.

### Regle produit

Le module doit etre assez bon pour qu'un eleve qui utilise deja Anki puisse accepter de migrer ou au moins l'utiliser en complement sans sensation de downgrade.

## 8. Ecran 6 - Ressources

### Objectif

Centraliser les supports de travail et permettre leur transformation immediate en outils de revision.

### Structure fonctionnelle

```text
[Header]
Ressources

[Recherche]
Rechercher un cours, une fiche, un sujet...

[Filtres]
Matiere | Chapitre | Type | Professeur | Classe

[Liste]
- Cours ESH - La croissance
- Correction Maths - Chapitre 8
- Methode dissertation HGG
- Sujet BCE ESH 2024

[Panneau lateral sur document selectionne]
Informations du document
Actions IA :
- Resumer
- Faire une fiche
- Generer des flashcards
- Expliquer un passage
- Poser une question
```

### Actions principales

- ouvrir le document ;
- l'enregistrer en favori ;
- lancer une action IA ;
- ajouter le document a une session ;
- partager si autorise.

## 9. Ecran 7 - Lecteur de document avec IA

### Objectif

Permettre une interaction intelligente avec un cours ou un support.

### Structure fonctionnelle

```text
[Document a gauche]
PDF / cours / fiche

[Panneau IA a droite]
Que veux-tu faire avec ce document ?
- resume court
- fiche detaillee
- 20 flashcards
- notions a retenir
- explication d'un passage
- questions types concours
```

### Resultat attendu

Le resultat IA doit etre structuré, reutilisable et actionnable.

Exemples de formats :

- fiche par parties ;
- liste de notions ;
- flashcards ;
- points de vigilance ;
- quiz rapide.

## 10. Ecran 8 - Depot de copie

### Objectif

Permettre a l'etudiant de soumettre une copie pour obtenir un feedback utile.

### Structure fonctionnelle

```text
[Header]
Nouvelle copie

[Zone d'upload]
Deposer PDF / image / scan

[Champs]
Matiere
Type d'epreuve
Concours cible
Chapitre ou theme
Consignes eventuelles
Correction souhaitee :
- IA
- Professeur
- IA puis professeur

[Bouton] Envoyer
```

### Actions principales

- importer un document ;
- completer le contexte ;
- choisir le type de correction ;
- soumettre.

## 11. Ecran 9 - Feedback de correction

### Objectif

Afficher une correction structurée, exploitable et pedagogiquement utile.

### Structure fonctionnelle

```text
[Header]
Feedback copie - Dissertation ESH

[Bloc synthese]
Note indicative : 11-12
Niveau global : correct mais trop descriptif

[Bloc evaluation par criteres]
- Problematique : 2/4
- Structure : 3/4
- Precision des connaissances : 2/4
- Qualite des exemples : 2/4
- Style / rigueur : 3/4

[Bloc points forts]
- Bonne introduction
- Quelques references pertinentes

[Bloc erreurs majeures]
- Problematique trop vague
- Plan peu dialectique
- Manque d'auteurs precis

[Bloc suite recommandee]
- Revoir methode dissertation ESH
- Faire 15 flashcards sur auteurs de croissance
- Travailler 1 plan guide supplementaire
```

### Fonctionnalites attendues

- lecture claire des forces et faiblesses ;
- feedback par criteres ;
- actionnabilite immediate ;
- creation automatique de taches ou flashcards si pertinent ;
- integration des lacunes dans le profil eleve.

## 12. Ecran 10 - Assistant IA

### Objectif

Offrir une porte d'entree libre pour les besoins ponctuels, sans concurrencer les modules centraux.

### Structure fonctionnelle

```text
[Header]
Assistant IA

[Suggestions]
- Fais-moi mon planning de ce soir
- Resume ce cours
- Cree 20 flashcards sur ce chapitre
- Explique cette correction
- Aide-moi sur ma methode de dissertation

[Zone de chat]
Question utilisateur
Reponse structuree IA

[Contexte]
Matiere
Chapitre
Document lie
Niveau
```

### Regle produit

L'assistant doit rester connecte au reste de l'application :

- il peut s'appuyer sur les documents ;
- il peut creer des taches ;
- il peut generer des flashcards ;
- il peut alimenter le planning ;
- il peut renvoyer vers des ressources.

## 13. Ecran 11 - Profil et progression

### Objectif

Donner a l'etudiant une vision claire de sa progression reelle.

### Structure fonctionnelle

```text
[Header]
Ma progression

[Blocs statistiques]
- regularite hebdomadaire
- temps de travail
- cartes revisees
- matieres les plus travaillees
- chapitres fragiles
- copies envoyees

[Graphiques]
- evolution de la regularite
- evolution des lacunes
- revision par matiere

[Bloc recommandations]
- Tu progresses bien en HGG
- Les probabilites restent fragiles
- Recommandation de focus cette semaine
```

### Interet produit

Cet ecran doit encourager, orienter et rendre visible la progression, pas culpabiliser.

## 14. Ecran 12 - Espace professeur

### Objectif

Donner au professeur un espace simple pour nourrir l'ecosysteme de travail des eleves.

### Structure fonctionnelle

```text
[Header]
Ressources professeur

[Actions rapides]
- Deposer un cours
- Deposer une correction
- Ajouter une grille d'evaluation
- Corriger une copie

[Liste des contenus]
- Cours ESH croissance
- Correction DS maths 4
- Grille dissertation HGG

[Parametrage]
Classe
Matiere
Chapitre
Type de document
```

### Regle produit

L'interface professeur doit etre rapide, sobre et sans logique de surveillance lourde.

## 15. Ecran 13 - Ajout de ressource professeur

### Objectif

Permettre un depot ultra-rapide d'un contenu pedagogique.

### Structure fonctionnelle

```text
[Upload]
Document

[Metadonnees]
Titre
Matiere
Chapitre
Classe
Type
Description courte

[Options]
Autoriser :
- resume IA
- creation de fiches
- creation de flashcards

[Bouton] Publier
```

## 16. Architecture d'information recommandee

### Hierarchie produit cote eleve

1. Tableau de bord
2. Planning
3. Flashcards
4. Ressources
5. Copies
6. Assistant IA
7. Progression

### Pourquoi cet ordre

- le tableau de bord ouvre l'usage quotidien ;
- le planning organise ;
- les flashcards ancrent la repetition ;
- les ressources nourrissent le travail ;
- les copies apportent le feedback ;
- l'IA relie le tout ;
- la progression donne du recul.

## 17. Priorite de maquettage pour la suite

Si on passe ensuite a des maquettes plus detaillees ou a un prototype cliquable, je recommande de commencer par :

1. tableau de bord ;
2. planning intelligent ;
3. flashcards ;
4. ressources + lecteur IA ;
5. depot de copie + feedback.

Ce sont les cinq briques qui definissent le coeur de l'experience produit.

## 18. Conclusion

Ces maquettes fonctionnelles posent la logique de l'application. Elles montrent que le produit ne doit pas etre un assemblage d'outils, mais une experience continue :

- l'etudiant voit quoi faire ;
- il travaille ;
- il revise activement ;
- il consulte des ressources ;
- il recoit du feedback ;
- l'application apprend de ses besoins et reajuste ses priorites.

La suite logique est maintenant de transformer ces maquettes fonctionnelles en maquettes produit plus precises, avec la structure de chaque page, les composants UI et les parcours complets desktop + mobile.
