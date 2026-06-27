import type { Route } from "next";

export type NavItem = {
  href: Route;
  label: string;
  badge?: string;
};

export type StudySession = {
  id: string;
  title: string;
  subject: string;
  duration: number;
  time: string;
  status: "planned" | "completed";
  reason: string;
};

export type Deck = {
  id: string;
  title: string;
  subject: string;
  chapter: string;
  due: number;
  newCards: number;
  retention: number;
  total: number;
};

export type Resource = {
  id: string;
  title: string;
  subject: string;
  chapter: string;
  type: string;
  teacher: string;
  summary: string;
  actions: string[];
};

export type Essay = {
  id: string;
  title: string;
  subject: string;
  examType: string;
  targetExam: string;
  status: string;
  scoreRange: string;
  strengths: string[];
  mistakes: string[];
  nextSteps: string[];
};

export const studentNavigation: NavItem[] = [
  { href: "/dashboard", label: "Tableau de bord" },
  { href: "/planning", label: "Planning" },
  { href: "/flashcards", label: "Flashcards", badge: "74" },
  { href: "/resources", label: "Ressources" },
  { href: "/essays", label: "Copies" },
  { href: "/assistant", label: "Assistant IA" },
  { href: "/actualites", label: "Actualites" },
  { href: "/progress", label: "Progression" }
];

export const teacherNavigation: NavItem[] = [
  { href: "/teacher/resources", label: "Ressources" },
  { href: "/teacher/resources/new", label: "Nouveau depot" },
  { href: "/teacher/essays", label: "Copies" },
  { href: "/teacher/rubrics", label: "Grilles" }
];

export const dailyStats = [
  { label: "Sessions cette semaine", value: "6", helper: "+2 vs semaine passee" },
  { label: "Cartes revisees", value: "124", helper: "81% de retention" },
  { label: "Heures utiles", value: "9h40", helper: "Objectif hebdo : 16h" },
  { label: "Lacunes actives", value: "3", helper: "1 en amelioration" }
];

export const todayFocus = {
  title: "Session recommandee maintenant",
  subtitle: "Un bloc dense mais realiste pour faire monter ta semaine.",
  tasks: [
    "45 min de probabilites sur les lois usuelles",
    "20 min de flashcards ESH en retard",
    "15 min de relecture de correction HGG"
  ]
};

export const weakPoints = [
  { label: "Probabilites", severity: "Forte", reason: "3 oublis successifs sur les lois" },
  { label: "Dissertation ESH", severity: "Moyenne", reason: "Problematique trop descriptive" },
  { label: "Dates HGG", severity: "Moyenne", reason: "Retention en baisse depuis 8 jours" }
];

export const deadlines = [
  { label: "DS de maths", when: "dans 3 jours" },
  { label: "Colle HGG", when: "demain" },
  { label: "Devoir ESH", when: "dimanche" }
];

export const studySessions: StudySession[] = [
  {
    id: "session-1",
    title: "Revision chapitre fragile",
    subject: "Maths approfondies",
    duration: 45,
    time: "17:00",
    status: "planned",
    reason: "DS proche + baisse recente"
  },
  {
    id: "session-2",
    title: "Flashcards du jour",
    subject: "ESH",
    duration: 20,
    time: "18:00",
    status: "planned",
    reason: "20 cartes en retard"
  },
  {
    id: "session-3",
    title: "Relecture active de correction",
    subject: "HGG",
    duration: 25,
    time: "20:15",
    status: "planned",
    reason: "Copie recente a consolider"
  }
];

export const planningReasons = [
  "DS de maths dans 3 jours",
  "20 cartes ESH dues aujourd'hui",
  "Baisse recente sur le chapitre Probabilites",
  "HGG sous-travaillee cette semaine"
];

export const decks: Deck[] = [
  {
    id: "deck-maths-proba",
    title: "Lois usuelles",
    subject: "Maths",
    chapter: "Probabilites",
    due: 12,
    newCards: 5,
    retention: 78,
    total: 42
  },
  {
    id: "deck-esh-croissance",
    title: "Auteurs de la croissance",
    subject: "ESH",
    chapter: "Croissance",
    due: 20,
    newCards: 7,
    retention: 82,
    total: 58
  },
  {
    id: "deck-hgg-dates",
    title: "Dates a haut rendement",
    subject: "HGG",
    chapter: "Mondialisation",
    due: 35,
    newCards: 6,
    retention: 76,
    total: 90
  }
];

export const flashcardPreview = {
  question: "Donner la definition d'une variable aleatoire discrete.",
  answer:
    "Une variable aleatoire discrete prend un nombre fini ou denombrable de valeurs, chacune associee a une probabilite.",
  choices: ["Tres facile", "Facile", "Moyen", "Difficile", "A revoir"]
};

export const resources: Resource[] = [
  {
    id: "resource-esh-growth",
    title: "Cours ESH - Les theories de la croissance",
    subject: "ESH",
    chapter: "Croissance",
    type: "Cours",
    teacher: "Mme Laurent",
    summary:
      "Une synthese dense sur Solow, Romer, Lucas et les enjeux de croissance endogene avec exemples mobilisables en dissertation.",
    actions: ["Resumer", "Faire une fiche", "Generer 20 flashcards", "Poser une question"]
  },
  {
    id: "resource-esh-globalization",
    title: "Fiche ESH - Mondialisation financiere",
    subject: "ESH",
    chapter: "Mondialisation",
    type: "Fiche",
    teacher: "Mme Laurent",
    summary:
      "Une fiche concise sur la liberalisation financiere, les flux de capitaux, les crises et les arguments mobilisables en copie.",
    actions: ["Resumer", "Faire une fiche express", "Generer des flashcards", "Poser une question"]
  },
  {
    id: "resource-maths-ch8",
    title: "Correction Maths - Chapitre 8",
    subject: "Maths",
    chapter: "Probabilites",
    type: "Correction",
    teacher: "M. Dumas",
    summary:
      "Une correction pas a pas sur les lois usuelles, variables discretes et manipulations de probabilites conditionnelles.",
    actions: ["Expliquer un passage", "Extraire les erreurs classiques", "Generer des flashcards"]
  },
  {
    id: "resource-maths-laws",
    title: "Cours Maths - Lois usuelles et esperance",
    subject: "Maths",
    chapter: "Probabilites",
    type: "Cours",
    teacher: "M. Dumas",
    summary:
      "Le cours central sur Bernoulli, binomiale, geometrique et Poisson, avec points de methode et demonstrations utiles.",
    actions: ["Resumer", "Creer 20 flashcards", "Faire une fiche", "Expliquer un passage"]
  },
  {
    id: "resource-maths-method",
    title: "Methode Maths - Rediger un raisonnement propre",
    subject: "Maths",
    chapter: "Methodologie",
    type: "Methode",
    teacher: "M. Dumas",
    summary:
      "Des attentes claires sur la redaction, les justifications et les erreurs de copie les plus penalisees.",
    actions: ["Faire une checklist", "Resumer", "Extraire les erreurs classiques"]
  },
  {
    id: "resource-hgg-method",
    title: "Methode dissertation HGG",
    subject: "HGG",
    chapter: "Methodologie",
    type: "Methode",
    teacher: "Mme Caron",
    summary:
      "Les attendus exacts sur la problematique, le plan dialectique, les transitions et l'usage des references.",
    actions: ["Resumer", "Faire une checklist", "Creer un quiz"]
  },
  {
    id: "resource-hgg-dates",
    title: "Chronologie HGG - Dates incontournables",
    subject: "HGG",
    chapter: "Mondialisation",
    type: "Fiche",
    teacher: "Mme Caron",
    summary:
      "Une chronologie des dates qui reviennent souvent en colle et en dissertation, avec contexte et utilisation possible.",
    actions: ["Generer des flashcards", "Creer un quiz", "Resumer"]
  },
  {
    id: "resource-hgg-bce",
    title: "Sujet BCE HGG 2024 + piste de correction",
    subject: "HGG",
    chapter: "Geopolitique",
    type: "Sujet",
    teacher: "Mme Caron",
    summary:
      "Le sujet, une piste de problematique, des references attendues et les erreurs de cadrage les plus frequentes.",
    actions: ["Analyser le sujet", "Faire une fiche de references", "Poser une question"]
  },
  {
    id: "resource-english-vocab",
    title: "Vocabulary list - Inequalities and labor market",
    subject: "Anglais",
    chapter: "Civilisation",
    type: "Fiche",
    teacher: "Mr Smith",
    summary:
      "Une liste de vocabulaire thematique avec expressions idiomatiques et exemples d'utilisation pour themes et essays.",
    actions: ["Generer des flashcards", "Resumer", "Creer un quiz"]
  },
  {
    id: "resource-philo-method",
    title: "Methode culture generale - Construire une introduction",
    subject: "Culture generale",
    chapter: "Methodologie",
    type: "Methode",
    teacher: "M. Bernard",
    summary:
      "Un guide tres concret pour poser un sujet, faire apparaitre la tension philosophique et annoncer un plan propre.",
    actions: ["Resumer", "Faire une checklist", "Poser une question"]
  }
];

export const essays: Essay[] = [
  {
    id: "essay-esh-1",
    title: "Dissertation ESH - Croissance et innovation",
    subject: "ESH",
    examType: "Dissertation",
    targetExam: "BCE",
    status: "Feedback IA disponible",
    scoreRange: "11 - 12",
    strengths: ["Introduction propre", "Quelques auteurs bien places"],
    mistakes: ["Problematique trop vague", "Plan encore descriptif", "Exemples pas assez precis"],
    nextSteps: [
      "Revoir la methode dissertation ESH",
      "Creer 15 flashcards auteurs + dates",
      "Refaire un plan guide en 25 minutes"
    ]
  },
  {
    id: "essay-maths-1",
    title: "Exercice type concours - Probabilites",
    subject: "Maths",
    examType: "Probleme",
    targetExam: "Ecricome",
    status: "En attente de relecture prof",
    scoreRange: "non evalue",
    strengths: ["Bonne mise en route"],
    mistakes: ["Erreur sur l'independance", "Calcul final incomplet"],
    nextSteps: ["Revoir le cours", "Faire les cartes de definitions", "Refaire l'exercice sans correction"]
  }
];

export const progressSnapshots = [
  { label: "Regularite", value: "5 jours / 6" },
  { label: "Matiere la plus stable", value: "ESH" },
  { label: "Zone la plus fragile", value: "Probabilites" },
  { label: "Copies deposees", value: "4" }
];

export const teacherResources = [
  {
    title: "Cours ESH croissance",
    audience: "ECG 2 - classe complete",
    type: "Cours",
    uploadedAt: "aujourd'hui"
  },
  {
    title: "Correction DS maths 4",
    audience: "Groupe A",
    type: "Correction",
    uploadedAt: "hier"
  },
  {
    title: "Grille dissertation HGG",
    audience: "ECG 1 et ECG 2",
    type: "Methode",
    uploadedAt: "cette semaine"
  }
];

export const teacherRubrics = [
  {
    title: "Dissertation ESH - BCE",
    focus: "Problematique, structure, auteurs, precision",
    usage: "6 copies relues"
  },
  {
    title: "Probleme Maths approfondies",
    focus: "Rigueur, redaction, exactitude",
    usage: "3 copies relues"
  }
];

export function getDeck(deckId: string) {
  return decks.find((deck) => deck.id === deckId);
}

export function getResource(resourceId: string) {
  return resources.find((resource) => resource.id === resourceId);
}

export function getEssay(essayId: string) {
  return essays.find((essay) => essay.id === essayId);
}
