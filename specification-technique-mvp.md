# Specification technique MVP

## 1. Objet du document

Ce document traduit le cahier des charges produit en architecture technique exploitable pour construire un MVP.

Le MVP vise a valider une boucle d'usage quotidienne forte pour les etudiants de prepa ECG :

- comprendre quoi travailler ;
- planifier des sessions utiles ;
- reviser activement avec repetition espacee ;
- acceder aux ressources pedagogiques ;
- obtenir un soutien IA contextualise ;
- recevoir un premier niveau de feedback sur leurs copies.

Le centre du systeme reste l'etudiant. Le role professeur est de nourrir l'ecosysteme pedagogique, pas de surveiller.

## 2. Objectifs techniques du MVP

Le MVP doit permettre de livrer rapidement :

- une web app utilisable sur desktop et mobile ;
- une architecture simple, lisible et evolutive ;
- des modules IA integrables sans coupler toute l'application a un seul fournisseur ;
- une base de donnees propre pour supporter planning, flashcards, ressources et copies ;
- une separation nette entre logique metier, stockage et interface.

## 3. Perimetre du MVP

### Inclus

- authentification eleve / professeur ;
- onboarding eleve ;
- tableau de bord quotidien ;
- planning intelligent version 1 ;
- sessions de travail ;
- flashcards avec repetition espacee ;
- bibliotheque de ressources ;
- actions IA sur document : resume, fiche, flashcards, question-reponse ;
- depot de copies ;
- feedback IA version 1 ;
- espace professeur simple pour deposer des contenus et des grilles ;
- ecran progression version 1.

### Exclus du MVP

- OCR manuscrit avance ;
- correction experte "niveau professeur" sur copie longue ;
- systeme temps reel complexe de chat prof-eleve ;
- marketplace de contenus ;
- application mobile native ;
- analytics avancees multi-etablissements ;
- fine-tuning de modele des la v1.

## 4. Hypotheses structurantes

- Le produit commence par une application web.
- Le volume initial d'utilisateurs est faible a moyen.
- Les enseignants deposent surtout des PDF et documents simples.
- Les copies soumises en v1 seront preferentiellement numeriques ou lisibles.
- L'IA sera branchee via API externe.
- La personnalisation se fera d'abord par RAG, regles metier et historique utilisateur, pas par modele entraine en interne.

## 5. Stack technique recommandee

### Frontend

- Next.js 15
- TypeScript
- App Router
- Tailwind CSS
- shadcn/ui pour accelerer la construction de composants
- React Hook Form + Zod pour les formulaires
- TanStack Query si necessaire pour la gestion fine de cache cote client

### Backend

- Next.js server actions et route handlers pour le MVP
- PostgreSQL
- Prisma ORM
- Auth.js ou solution auth integree avec gestion de session

### Stockage

- stockage objet pour PDF, scans et documents
- table de metadonnees en base

### IA

- API de modele de langage
- pipeline RAG simple pour ressources et grilles de correction
- service d'orchestration interne pour factoriser prompts, contexte et tracing

### Infra MVP

- Vercel pour le front et les routes applicatives si souhaité
- base PostgreSQL managée
- stockage compatible S3

## 6. Architecture logique

Le systeme peut etre structure en cinq couches :

### 1. Interface utilisateur

- pages eleve
- pages professeur
- composants de tableau de bord
- lecteur de document
- revision de flashcards
- ecrans de copie et feedback

### 2. Couche applicative

- gestion auth et permissions
- orchestration des cas d'usage
- validation des entrees
- composition des reponses UI

### 3. Couche metier

- moteur de planning
- moteur de repetition espacee
- analyse des lacunes
- gestion des ressources
- logique de correction
- logique de recommandations

### 4. Couche donnees

- PostgreSQL
- stockage fichiers
- index de recherche simple sur ressources
- eventuels embeddings stockes en base ou service associe

### 5. Couche IA

- prompts par cas d'usage
- contextualisation RAG
- post-traitement structure
- logs de generations

## 7. Architecture applicative recommandee

Structure de projet cible :

```text
src/
  app/
    (public)/
    (student)/
      dashboard/
      planning/
      flashcards/
      resources/
      essays/
      assistant/
      progress/
    (teacher)/
      resources/
      essays/
      rubrics/
    api/
  components/
    ui/
    dashboard/
    planning/
    flashcards/
    resources/
    essays/
    assistant/
  lib/
    auth/
    db/
    ai/
    planning/
    flashcards/
    essays/
    resources/
    analytics/
    validation/
  prisma/
    schema.prisma
```

Principe :

- `app/` contient la composition de pages ;
- `components/` contient les briques UI ;
- `lib/` contient la logique metier reusable ;
- `api/` contient les points d'entree externes ou appels client necessaires ;
- `prisma/` contient le modele de donnees.

## 8. Roles et permissions

### Roles MVP

- `student`
- `teacher`
- `admin` technique minimum

### Regles d'acces

- un etudiant voit ses donnees, ses sessions, ses cartes, ses copies et les ressources accessibles a sa classe ;
- un professeur peut deposer des ressources, creer des grilles, consulter les copies qu'on lui a explicitement affectees et voir ses propres contenus ;
- un admin peut gerer classes, associations et moderation minimale.

Important :

Le systeme doit eviter de donner au professeur un tableau de surveillance comportementale trop detaille. En v1, on privilegie les contenus et corrections plutot que l'inspection fine de l'activite.

## 9. Modele de donnees

### Tables coeur identite

#### `users`

- `id`
- `email`
- `password_hash` ou equivalent provider
- `first_name`
- `last_name`
- `role`
- `created_at`
- `updated_at`

#### `classes`

- `id`
- `name`
- `year_label`
- `track` ex. `ECG`
- `created_at`

#### `class_memberships`

- `id`
- `user_id`
- `class_id`
- `role_in_class`
- `created_at`

### Tables onboarding et profil eleve

#### `student_profiles`

- `id`
- `user_id`
- `class_id`
- `prep_year`
- `target_exams` JSON
- `weekly_goal_hours`
- `energy_profile` JSON nullable
- `strengths_text`
- `weaknesses_text`
- `created_at`
- `updated_at`

#### `student_availability_slots`

- `id`
- `student_id`
- `day_of_week`
- `start_time`
- `end_time`
- `slot_type` ex. `class`, `study`, `rest`

### Tables academiques

#### `subjects`

- `id`
- `code`
- `name`

#### `chapters`

- `id`
- `subject_id`
- `name`
- `slug`
- `exam_tags` JSON nullable

### Tables ressources

#### `resources`

- `id`
- `uploader_id`
- `class_id` nullable
- `subject_id`
- `chapter_id` nullable
- `title`
- `description`
- `resource_type` ex. `course`, `summary`, `exercise`, `correction`, `method`
- `storage_key`
- `mime_type`
- `source_kind` ex. `teacher_upload`, `student_upload`, `ai_generated`
- `is_ai_actions_enabled`
- `created_at`

#### `resource_access`

- `id`
- `resource_id`
- `user_id` nullable
- `class_id` nullable

#### `resource_ai_outputs`

- `id`
- `resource_id`
- `user_id`
- `output_type` ex. `summary`, `flashcards`, `notes`, `qa`
- `content_json`
- `created_at`

### Tables flashcards

#### `flashcard_decks`

- `id`
- `owner_user_id`
- `class_id` nullable
- `subject_id`
- `chapter_id` nullable
- `source_resource_id` nullable
- `title`
- `description`
- `created_by_type` ex. `manual`, `teacher`, `ai`
- `created_at`

#### `flashcards`

- `id`
- `deck_id`
- `front_text`
- `back_text`
- `hint_text` nullable
- `tags` JSON
- `position`
- `created_at`

#### `flashcard_reviews`

- `id`
- `flashcard_id`
- `user_id`
- `rating` ex. `very_easy`, `easy`, `medium`, `hard`, `again`
- `reviewed_at`
- `next_review_at`
- `stability_score`
- `difficulty_score`
- `interval_days`

#### `flashcard_states`

- `id`
- `flashcard_id`
- `user_id`
- `status` ex. `new`, `learning`, `review`, `lapsed`
- `last_review_at` nullable
- `next_review_at` nullable
- `repetition_count`
- `lapse_count`
- `ease_score`
- `stability_score`
- `difficulty_score`

### Tables planning et travail

#### `tasks`

- `id`
- `student_id`
- `subject_id` nullable
- `chapter_id` nullable
- `title`
- `description`
- `task_type` ex. `homework`, `revision`, `essay`, `flashcards`
- `due_at` nullable
- `priority_score`
- `status`
- `source_type` ex. `manual`, `ai`, `teacher`
- `created_at`

#### `study_sessions`

- `id`
- `student_id`
- `subject_id` nullable
- `chapter_id` nullable
- `task_id` nullable
- `planned_start_at` nullable
- `planned_duration_min`
- `actual_duration_min` nullable
- `session_type` ex. `revision`, `flashcards`, `exercise`, `essay`
- `goal_text`
- `status` ex. `planned`, `in_progress`, `completed`, `missed`, `cancelled`
- `difficulty_feedback` nullable
- `usefulness_feedback` nullable
- `created_by_type` ex. `planner`, `manual`
- `created_at`

#### `weak_points`

- `id`
- `student_id`
- `subject_id`
- `chapter_id` nullable
- `source_type` ex. `flashcards`, `essay`, `quiz`, `self_assessment`, `ai_inference`
- `severity_score`
- `label`
- `description`
- `status` ex. `active`, `improving`, `resolved`
- `last_detected_at`

### Tables copies et correction

#### `essays`

- `id`
- `student_id`
- `teacher_id` nullable
- `subject_id`
- `chapter_id` nullable
- `title`
- `exam_type`
- `target_exam`
- `storage_key`
- `mime_type`
- `submission_type` ex. `pdf`, `image`, `text`
- `status` ex. `submitted`, `ai_reviewed`, `teacher_reviewed`
- `created_at`

#### `grading_rubrics`

- `id`
- `creator_id`
- `subject_id`
- `title`
- `description`
- `criteria_json`
- `created_at`

#### `essay_feedback`

- `id`
- `essay_id`
- `reviewer_type` ex. `ai`, `teacher`
- `reviewer_user_id` nullable
- `rubric_id` nullable
- `score_min` nullable
- `score_max` nullable
- `feedback_json`
- `created_at`

### Tables IA et traçabilite

#### `ai_generations`

- `id`
- `user_id`
- `feature_name`
- `source_entity_type`
- `source_entity_id`
- `model_name`
- `status`
- `input_summary`
- `output_summary`
- `cost_estimate` nullable
- `created_at`

## 10. Flux fonctionnels clefs

### Flux 1. Onboarding eleve

1. L'utilisateur cree un compte.
2. Il choisit son role `student`.
3. Il renseigne classe, matieres, disponibilites et objectifs.
4. Le systeme cree :
   - `student_profile`
   - `student_availability_slots`
   - premiers `tasks` de decouverte si besoin
5. Le tableau de bord initial est genere.

### Flux 2. Ressource professeur -> usage eleve

1. Un professeur depose un document.
2. Le fichier est stocke et les metadonnees sont sauvees dans `resources`.
3. Le document devient visible aux eleves autorises.
4. Un eleve demande :
   - un resume ;
   - une fiche ;
   - des flashcards ;
   - une question sur le document.
5. Le service IA recupere le document et le contexte.
6. Le resultat est stocke dans `resource_ai_outputs`.
7. Si l'action est `generate_flashcards`, un `flashcard_deck` et des `flashcards` peuvent etre crees.

### Flux 3. Revision flashcards

1. L'etudiant ouvre un deck ou la file quotidienne.
2. Le systeme charge les cartes dues selon `flashcard_states.next_review_at`.
3. L'etudiant repond et choisit son ressenti.
4. Le moteur SRS calcule le prochain intervalle.
5. `flashcard_reviews` enregistre l'evenement.
6. `flashcard_states` est mis a jour.
7. Les cartes en retard ou fragiles peuvent alimenter `weak_points`.

### Flux 4. Planning intelligent

1. Le moteur recupere :
   - disponibilites
   - sessions futures
   - taches a echeance
   - weak points actifs
   - cartes a revoir
   - copies recentes et feedbacks
2. Il calcule un score de priorite par besoin de travail.
3. Il transforme ces besoins en `study_sessions` planifiees.
4. Le tableau de bord affiche la meilleure action immediate.
5. Quand l'etudiant modifie ou complete une session, le planning est recalcule.

### Flux 5. Depot de copie -> feedback IA

1. L'etudiant depose un document.
2. Le systeme cree une entree `essays`.
3. Le moteur de feedback recupere :
   - sujet et contexte
   - grilles pertinentes
   - attentes par matiere
   - contenu de la copie
4. L'IA produit un retour structure.
5. Le resultat est stocke dans `essay_feedback`.
6. Les points faibles identifiés peuvent creer ou renforcer des `weak_points`.
7. Le tableau de bord et le planning peuvent proposer des actions correctives.

## 11. Logique du planning intelligent v1

La v1 ne doit pas chercher a faire un "planning magique". Elle doit faire un planning credible.

### Signaux d'entree

- disponibilite horaire ;
- echeances proches ;
- cartes dues ;
- weak points actifs ;
- matieres sous-travaillees ;
- copies recentes mal reussies ;
- sessions manquées ;
- objectifs hebdomadaires.

### Modele simple recommande

Attribuer un score a chaque besoin de travail.

Exemple de formule de priorite :

```text
priority =
  urgency_score
  + weak_point_score
  + spaced_repetition_score
  + underworked_subject_score
  + exam_alignment_score
  - fatigue_penalty
```

Chaque besoin prioritaire devient une session planifiee de 20, 45 ou 60 minutes selon le type.

### Types de sessions v1

- `flashcards_review`
- `chapter_revision`
- `exercise_training`
- `essay_practice`
- `correction_review`

### Contraintes

- ne pas depasser la disponibilite quotidienne ;
- reserver de petites plages pour la repetition espacee ;
- eviter une surcharge d'une seule matiere ;
- remonter en haut les urgences reelles sans ecraser la memorisation long terme.

## 12. Logique du moteur flashcards v1

Objectif :

Proposer une experience proche d'Anki sans recreer toute sa complexite des le MVP.

### Strategie recommande

Utiliser un modele simplifie de repetition espacee avec etat par carte :

- `new`
- `learning`
- `review`
- `lapsed`

### Ratings utilisateur

- `again`
- `hard`
- `medium`
- `easy`
- `very_easy`

### Regles v1

- une carte nouvelle entre en `learning` ;
- un mauvais score la fait revenir rapidement ;
- un score moyen augmente l'intervalle modestement ;
- un score facile augmente l'intervalle significativement ;
- une carte oubliée devient `lapsed`.

Exemple d'intervalles de depart :

```text
again      -> 10 minutes / meme jour
hard       -> 1 jour
medium     -> 3 jours
easy       -> 7 jours
very_easy  -> 12 jours
```

Puis ajustement selon :

- repetition_count ;
- difficulty_score ;
- lapses precedents ;
- performance recente.

La v1 doit surtout etre stable, lisible et cohérente. On pourra affiner ensuite vers un modele plus avance.

## 13. Strategie IA

L'IA doit etre encapsulee dans un service interne pour eviter la dispersion des appels.

### Service central recommande

`lib/ai/` avec sous-modules :

- `summarizeResource`
- `generateFlashcards`
- `answerResourceQuestion`
- `planStudyDay`
- `reviewEssay`
- `extractWeakPoints`

### Structure d'un appel IA

1. construire un contexte metier ;
2. recuperer les documents utiles ;
3. injecter matiere, chapitre, niveau, type d'exercice ;
4. appeler le modele ;
5. valider ou parser la sortie ;
6. stocker le resultat ;
7. declencher eventuellement des effets metier.

### Formats de sortie

Toutes les sorties critiques doivent etre demandees en JSON structure.

Exemples :

- resume : `title`, `sections`, `key_points`, `pitfalls`
- flashcards : liste `front`, `back`, `tags`
- feedback copie : `scores`, `strengths`, `mistakes`, `next_steps`
- weak points : `label`, `severity`, `subject`, `chapter`

### RAG MVP

Le RAG v1 peut rester simple :

- extraction texte des ressources texte/PDF ;
- segmentation en chunks ;
- embeddings sur chunks ;
- recuperation top-k par requete ;
- injection dans le prompt.

Corpus prioritaire :

- ressources deposees par profs ;
- grilles de correction ;
- methodes ;
- feedbacks types.

## 14. Gestion des fichiers

### Types de fichiers MVP

- PDF
- images
- texte enrichi simple

### Processus upload

1. upload du fichier ;
2. controle MIME et taille ;
3. stockage objet ;
4. creation metadonnees ;
5. extraction texte si possible ;
6. indexation pour RAG si activable.

### Regles

- conserver la trace du proprietaire et des droits d'acces ;
- eviter d'exposer les URLs de stockage brut ;
- utiliser des URLs signeees ou proxy applicatif.

## 15. API et actions serveur

### Domaines API MVP

#### Auth

- `POST /api/auth/...` selon solution choisie

#### Dashboard

- `GET /api/dashboard`

#### Planning

- `GET /api/planning`
- `POST /api/planning/recompute`
- `PATCH /api/study-sessions/:id`

#### Flashcards

- `GET /api/flashcards/due`
- `GET /api/decks`
- `POST /api/decks`
- `POST /api/flashcards/review`
- `POST /api/flashcards/generate-from-resource`

#### Resources

- `GET /api/resources`
- `POST /api/resources`
- `GET /api/resources/:id`
- `POST /api/resources/:id/summarize`
- `POST /api/resources/:id/flashcards`
- `POST /api/resources/:id/questions`

#### Essays

- `POST /api/essays`
- `GET /api/essays`
- `GET /api/essays/:id`
- `POST /api/essays/:id/review-ai`
- `POST /api/essays/:id/review-teacher`

#### Progress

- `GET /api/progress`

### Note implementation

Si on reste full Next.js, une partie de ces points d'entree peut etre implémentée via server actions plutot que via REST stricte. L'important est de garder une separation claire des domaines.

## 16. Pages MVP a developper

### Eleve

- `/login`
- `/onboarding`
- `/dashboard`
- `/planning`
- `/flashcards`
- `/flashcards/[deckId]`
- `/resources`
- `/resources/[resourceId]`
- `/essays`
- `/essays/new`
- `/essays/[essayId]`
- `/assistant`
- `/progress`

### Professeur

- `/teacher/resources`
- `/teacher/resources/new`
- `/teacher/essays`
- `/teacher/rubrics`

## 17. Composants UI majeurs

- `DailyPriorityCard`
- `WeeklyPlanningGrid`
- `StudySessionCard`
- `FlashcardReviewPanel`
- `DeckStatsCard`
- `ResourceList`
- `ResourceAIActionsPanel`
- `EssayUploadForm`
- `EssayFeedbackView`
- `WeakPointsPanel`
- `ProgressCharts`

## 18. Observabilite et analytics produit

Le MVP doit mesurer les usages sans basculer dans une logique de surveillance.

Evenements utiles :

- onboarding complete ;
- session commencee ;
- session terminee ;
- cartes revisees ;
- ressource ouverte ;
- action IA lancee ;
- copie deposee ;
- feedback consulte ;
- planning reoptimise.

Ces evenements servent a ameliorer le produit, pas a noter les eleves.

## 19. Securite et conformite minimum

- mots de passe hashes ou auth provider securise ;
- autorisation stricte par role et appartenance de classe ;
- fichiers proteges par acces applicatif ;
- validation serveur de toutes les entrees ;
- limitation basique du rate limit sur endpoints IA et upload ;
- journalisation sobre des actions sensibles.

## 20. Strategie de developpement

### Sprint 1. Fondations

- bootstrap Next.js + TypeScript + Tailwind
- auth
- modele Prisma initial
- layout et navigation
- onboarding eleve

### Sprint 2. Noyau eleve

- dashboard v1
- tasks
- study_sessions
- progress widget simple

### Sprint 3. Flashcards

- decks
- cartes
- moteur de review
- ecran de revision quotidienne

### Sprint 4. Ressources

- upload professeur
- listing ressources
- lecteur simple
- permissions de classe

### Sprint 5. IA ressources

- resume
- fiche
- generation de flashcards
- question-reponse sur document

### Sprint 6. Copies

- upload copies
- affichage liste et detail
- feedback IA structure

### Sprint 7. Planning intelligent

- agregation signaux
- score de priorite
- generation sessions
- recalcul dashboard

## 21. Definition of done MVP

Le MVP est considere comme pret pour un pilote lorsque :

- un etudiant peut s'inscrire et configurer son profil ;
- il voit des priorites quotidiennes pertinentes ;
- il peut reviser ses flashcards avec un vrai suivi de repetition ;
- il peut consulter des ressources et les transformer via l'IA ;
- il peut deposer une copie et recevoir un feedback structure ;
- un professeur peut deposer des contenus et des grilles simplement ;
- les flux principaux sont utilisables sans intervention manuelle du developpement.

## 22. Recommandation finale

La meilleure facon de construire ce produit est de ne pas commencer par le module le plus impressionnant techniquement. Il faut commencer par le noyau d'usage qui rend l'application indispensable.

Ordre de priorite recommande :

1. onboarding + dashboard ;
2. flashcards ;
3. ressources ;
4. IA sur ressources ;
5. copies ;
6. planning intelligent.

Le planning intelligent depend en effet de tous les autres signaux. On peut afficher une version simple tres tot, mais la vraie valeur apparait quand flashcards, ressources et feedbacks commencent deja a alimenter le systeme.
