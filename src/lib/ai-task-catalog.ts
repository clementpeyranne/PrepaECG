export const AI_TASK_DEFINITIONS = {
  assistant_reply: {
    featureName: "assistant_reply",
    label: "Assistant prépa",
    purpose: "Repondre a une question en utilisant uniquement le contexte autorise de l'étudiant.",
    inputSources: ["profil", "cours sélectionné", "copie sélectionnée", "corrections", "notes", "flashcards", "taches"],
    outputs: ["reponse", "sources utilisees"],
    writes: ["historique technique IA"],
    systemInstructions:
      "Tu es le chatbot central d'un étudiant de prépa ECG. Tu réponds en français, de manière directe, concrète et utile. Tu aides surtout sur les cours, les documents, les copies, les flashcards et la méthode de concours. Tu distingues les faits présents dans les sources de tes explications et tu n'inventes jamais une information absente du contexte."
  },
  essay_review: {
    featureName: "essay_review",
    label: "Correction de copie",
    purpose: "Corriger une copie selon la matière, l'épreuve et le concours visés.",
    inputSources: ["copie", "matiere", "epreuve", "concours", "grille de correction"],
    outputs: ["note indicative", "points forts", "erreurs", "prochaines étapes", "signaux planning"],
    writes: ["correction IA", "point faible", "tâche de progression"],
    systemInstructions:
      "Tu es un correcteur exigeant de prépa ECG. Tu rends un feedback utile, structure, concret et actionnable. Tu n'inventes pas d'informations non visibles dans la copie. La note IA reste indicative et les prochaines étapes doivent pouvoir devenir des tâches de travail précises."
  },
  planning_guidance: {
    featureName: "planning_guidance",
    label: "Planning adaptatif",
    purpose: "Transformer les lacunes et les échéances en priorités sans abandonner une matière.",
    inputSources: ["objectifs concours", "notes", "corrections", "points faibles", "flashcards", "blocs valides"],
    outputs: ["priorites", "raisons pedagogiques", "prochaine action"],
    writes: ["historique technique IA"],
    systemInstructions:
      "Tu es un coach de prépa ECG. Tu ajustes les priorités d'un planning hebdomadaire pour faire progresser l'étudiant sans abandonner aucune matière. Tu respectes les disponibilités, les échéances et les retours réels des professeurs."
  },
  resource_summary: {
    featureName: "resource_summary",
    label: "Resume de ressource",
    purpose: "Produire un résumé fiable et directement révisable.",
    inputSources: ["ressource sélectionnée", "matiere", "chapitre"],
    outputs: ["résumé structure"],
    writes: ["sortie de ressource"],
    systemInstructions:
      "Tu es un coach de prépa ECG. Produis un résumé en français, concret, fiable et directement utile pour réviser. N'ajoute aucun fait absent du document."
  },
  resource_sheet: {
    featureName: "resource_sheet",
    label: "Fiche de révision",
    purpose: "Transformer un cours en fiche concise et mobilisable en copie.",
    inputSources: ["ressource sélectionnée", "matiere", "chapitre"],
    outputs: ["fiche structuree"],
    writes: ["sortie de ressource"],
    systemInstructions:
      "Tu es un coach de prépa ECG. Produis une fiche de révision concise, mobilisable en copie et sans remplissage. N'ajoute aucun fait absent du document."
  },
  resource_flashcards: {
    featureName: "resource_flashcards",
    label: "Generation de flashcards",
    purpose: "Transformer une ressource en cartes simples et atomiques.",
    inputSources: ["ressource sélectionnée", "matiere", "chapitre"],
    outputs: ["cartes recto verso"],
    writes: ["deck", "flashcards"],
    systemInstructions:
      "Tu es un coach de prépa ECG. Crée des flashcards simples, courtes et utiles pour une révision type Anki. Une seule idée par carte, aucun indice, question au recto et réponse au verso."
  },
  assistant_snapshot: {
    featureName: "assistant_snapshot",
    label: "Synthese de suivi",
    purpose: "Résumer les données utiles avant une conversation.",
    inputSources: ["points faibles", "flashcards", "derniere ressource", "derniere copie"],
    outputs: ["synthèse courte"],
    writes: ["historique technique IA"],
    systemInstructions:
      "Tu es l'assistant central d'un étudiant de prépa ECG. Tu fournis une synthèse courte, factuelle et concrète sans répéter les conseils déjà présents dans le planning."
  },
  weekly_review: {
    featureName: "weekly_review",
    label: "Bilan hebdomadaire",
    purpose: "Synthétiser le travail réel et les priorités de la semaine suivante.",
    inputSources: ["blocs valides", "notes", "corrections", "flashcards", "taches"],
    outputs: ["bilan", "progres", "points de vigilance", "actions suivantes"],
    writes: ["historique technique IA"],
    systemInstructions:
      "Tu établis un bilan hebdomadaire factuel pour un étudiant de prépa ECG. Tu valorises le travail réel, identifies au maximum trois priorités et relies chaque conseil a une donnée disponible."
  },
  news_insight: {
    featureName: "news_insight",
    label: "Actualites en langues",
    purpose: "Relier un article recent au programme et aux epreuves de langue.",
    inputSources: ["article", "langue", "programme"],
    outputs: ["resume", "intérêt pour la prépa", "question d'oral"],
    writes: ["selection quotidienne"],
    systemInstructions:
      "Tu es un coach de prépa ECG spécialisé en langues vivantes. Tu relies l'article aux essais, aux oraux et a la culture générale sans inventer d'éléments absents de la source."
  }
} as const;

export type AITaskId = keyof typeof AI_TASK_DEFINITIONS;

export function getAITaskDefinition(taskId: AITaskId) {
  return AI_TASK_DEFINITIONS[taskId];
}

export function getAITaskCatalog() {
  return Object.entries(AI_TASK_DEFINITIONS).map(([id, definition]) => ({ id: id as AITaskId, ...definition }));
}
