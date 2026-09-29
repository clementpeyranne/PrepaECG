export const AI_TASK_DEFINITIONS = {
  assistant_reply: {
    featureName: "assistant_reply",
    label: "Assistant prepa",
    purpose: "Repondre a une question en utilisant uniquement le contexte autorise de l'etudiant.",
    inputSources: ["profil", "cours selectionne", "copie selectionnee", "corrections", "notes", "flashcards", "taches"],
    outputs: ["reponse", "sources utilisees"],
    writes: ["historique technique IA"],
    systemInstructions:
      "Tu es le chatbot central d'un etudiant de prepa ECG. Tu reponds en francais, de maniere directe, concrete et utile. Tu aides surtout sur les cours, les documents, les copies, les flashcards et la methode de concours. Tu distingues les faits presents dans les sources de tes explications et tu n'inventes jamais une information absente du contexte."
  },
  essay_review: {
    featureName: "essay_review",
    label: "Correction de copie",
    purpose: "Corriger une copie selon la matiere, l'epreuve et le concours vises.",
    inputSources: ["copie", "matiere", "epreuve", "concours", "grille de correction"],
    outputs: ["note indicative", "points forts", "erreurs", "prochaines etapes", "signaux planning"],
    writes: ["correction IA", "point faible", "tache de progression"],
    systemInstructions:
      "Tu es un correcteur exigeant de prepa ECG. Tu rends un feedback utile, structure, concret et actionnable. Tu n'inventes pas d'informations non visibles dans la copie. La note IA reste indicative et les prochaines etapes doivent pouvoir devenir des taches de travail precises."
  },
  planning_guidance: {
    featureName: "planning_guidance",
    label: "Planning adaptatif",
    purpose: "Transformer les lacunes et les echeances en priorites sans abandonner une matiere.",
    inputSources: ["objectifs concours", "notes", "corrections", "points faibles", "flashcards", "blocs valides"],
    outputs: ["priorites", "raisons pedagogiques", "prochaine action"],
    writes: ["historique technique IA"],
    systemInstructions:
      "Tu es un coach de prepa ECG. Tu ajustes les priorites d'un planning hebdomadaire pour faire progresser l'etudiant sans abandonner aucune matiere. Tu respectes les disponibilites, les echeances et les retours reels des professeurs."
  },
  resource_summary: {
    featureName: "resource_summary",
    label: "Resume de ressource",
    purpose: "Produire un resume fiable et directement revisable.",
    inputSources: ["ressource selectionnee", "matiere", "chapitre"],
    outputs: ["resume structure"],
    writes: ["sortie de ressource"],
    systemInstructions:
      "Tu es un coach de prepa ECG. Produis un resume en francais, concret, fiable et directement utile pour reviser. N'ajoute aucun fait absent du document."
  },
  resource_sheet: {
    featureName: "resource_sheet",
    label: "Fiche de revision",
    purpose: "Transformer un cours en fiche concise et mobilisable en copie.",
    inputSources: ["ressource selectionnee", "matiere", "chapitre"],
    outputs: ["fiche structuree"],
    writes: ["sortie de ressource"],
    systemInstructions:
      "Tu es un coach de prepa ECG. Produis une fiche de revision concise, mobilisable en copie et sans remplissage. N'ajoute aucun fait absent du document."
  },
  resource_flashcards: {
    featureName: "resource_flashcards",
    label: "Generation de flashcards",
    purpose: "Transformer une ressource en cartes simples et atomiques.",
    inputSources: ["ressource selectionnee", "matiere", "chapitre"],
    outputs: ["cartes recto verso"],
    writes: ["deck", "flashcards"],
    systemInstructions:
      "Tu es un coach de prepa ECG. Cree des flashcards simples, courtes et utiles pour une revision type Anki. Une seule idee par carte, aucun indice, question au recto et reponse au verso."
  },
  assistant_snapshot: {
    featureName: "assistant_snapshot",
    label: "Synthese de suivi",
    purpose: "Resumer les donnees utiles avant une conversation.",
    inputSources: ["points faibles", "flashcards", "derniere ressource", "derniere copie"],
    outputs: ["synthese courte"],
    writes: ["historique technique IA"],
    systemInstructions:
      "Tu es l'assistant central d'un etudiant de prepa ECG. Tu fournis une synthese courte, factuelle et concrete sans repeter les conseils deja presents dans le planning."
  },
  weekly_review: {
    featureName: "weekly_review",
    label: "Bilan hebdomadaire",
    purpose: "Synthetiser le travail reel et les priorites de la semaine suivante.",
    inputSources: ["blocs valides", "notes", "corrections", "flashcards", "taches"],
    outputs: ["bilan", "progres", "points de vigilance", "actions suivantes"],
    writes: ["historique technique IA"],
    systemInstructions:
      "Tu etablis un bilan hebdomadaire factuel pour un etudiant de prepa ECG. Tu valorises le travail reel, identifies au maximum trois priorites et relies chaque conseil a une donnee disponible."
  },
  news_insight: {
    featureName: "news_insight",
    label: "Actualites en langues",
    purpose: "Relier un article recent au programme et aux epreuves de langue.",
    inputSources: ["article", "langue", "programme"],
    outputs: ["resume", "interet pour la prepa", "question d'oral"],
    writes: ["selection quotidienne"],
    systemInstructions:
      "Tu es un coach de prepa ECG specialise en langues vivantes. Tu relies l'article aux essais, aux oraux et a la culture generale sans inventer d'elements absents de la source."
  }
} as const;

export type AITaskId = keyof typeof AI_TASK_DEFINITIONS;

export function getAITaskDefinition(taskId: AITaskId) {
  return AI_TASK_DEFINITIONS[taskId];
}

export function getAITaskCatalog() {
  return Object.entries(AI_TASK_DEFINITIONS).map(([id, definition]) => ({ id: id as AITaskId, ...definition }));
}
