export type AcademicPath = { humanities: "ESH" | "HGG"; maths: "APPLIQUEES" | "APPROFONDIES" };
export type SecondLanguage = "ESPAGNOL" | "ALLEMAND" | "ITALIEN";

export function getAcademicPath(profile: unknown): AcademicPath {
  const value = (profile as { academicPath?: Partial<AcademicPath> } | null)?.academicPath;
  return { humanities: value?.humanities === "HGG" ? "HGG" : "ESH", maths: value?.maths === "APPROFONDIES" ? "APPROFONDIES" : "APPLIQUEES" };
}

export function getActiveSubjectCodes(profile: unknown): string[] {
  const language = (profile as { languagePreferences?: { lv2?: string } } | null)?.languagePreferences?.lv2;
  return ["MATHS", getAcademicPath(profile).humanities, "ANG", language === "ALLEMAND" ? "ALL" : language === "ITALIEN" ? "ITA" : "ESP", "CG"];
}

export function getAcademicSubjectLabel(code: string, profile: unknown) {
  const labels: Record<string, string> = { ESH: "ESH", HGG: "HGG", ANG: "Anglais", ESP: "Espagnol", ALL: "Allemand", ITA: "Italien", CG: "Culture générale" };
  return code === "MATHS" ? `Maths ${getAcademicPath(profile).maths === "APPROFONDIES" ? "approfondies" : "appliquées"}` : labels[code] ?? code;
}

// Suggestions are routines, not invented teacher assignments or chapter numbers.
export function getPrepTask(code: string, kind: string, variation = 0) {
  if (kind === "FLASHCARDS_REVIEW" || kind === "FLASHCARDS") return "Réviser tes cartes arrivées à échéance";
  const written = kind === "ESSAY_PRACTICE" || kind === "ESSAY";
  const tasks: Record<string, string[]> = {
    MATHS: written
      ? ["Résoudre et rédiger un exercice du chapitre en cours", "Travailler une partie d’annale puis comparer avec le corrigé"]
      : ["Restituer les définitions et théorèmes du cours sans support", "Reprendre les exercices corrigés du chapitre en cours", "Reproduire puis expliquer un programme Python du cours"],
    ESH: written
      ? ["Construire un plan détaillé sur un sujet du chapitre en cours", "Rédiger un paragraphe avec un mécanisme, un auteur et un exemple"]
      : ["Restituer les mécanismes et définitions du chapitre en cours", "Préparer les auteurs et exemples à mobiliser en dissertation"],
    HGG: written
      ? ["Construire un plan détaillé sur un sujet du chapitre en cours", "Rédiger un paragraphe argumenté avec des exemples précis"]
      : ["Restituer les repères et notions du chapitre en cours", "Préparer des exemples géopolitiques pour une dissertation"],
    CG: written
      ? ["Analyser un sujet et formuler une problématique", "Rédiger une introduction et un plan détaillé de dissertation"]
      : ["Expliquer une référence du cours et son intérêt pour un sujet", "Relire un passage étudié puis reconstruire son argumentation"]
  };
  const languageTasks = written
    ? ["Traduire un passage de thème puis reprendre les erreurs", "Rédiger un essai argumenté à partir d’un sujet étudié"]
    : ["Revoir le vocabulaire et les erreurs de grammaire du cours", "Préparer le résumé et le commentaire oral d’un article"];
  const choices = tasks[code] ?? languageTasks;
  return choices[Math.abs(variation) % choices.length];
}

export function isLegacyPlanningTitle(title: string) {
  return /^(Bloc de (progression|consolidation)|File de flashcards|Travail type concours|Travail d'entretien|Repetition active|Consolider .+ sans desequilibrer|Faire tourner la repetition|Garder .+ actif)/i.test(title);
}
