import type { Route } from "next";

export type NavItem = {
  href: Route;
  label: string;
  badge?: string;
};

export const studentNavigation: NavItem[] = [
  { href: "/dashboard", label: "Tableau de bord" },
  { href: "/planning", label: "Planning" },
  { href: "/flashcards", label: "Flashcards" },
  { href: "/resources", label: "Ressources" },
  { href: "/annales", label: "Annales de maths" },
  { href: "/essays", label: "Copies" },
  { href: "/assistant", label: "Assistant IA" },
  { href: "/actualites", label: "Actualités" },
  { href: "/progress", label: "Progression" }
];

export const teacherNavigation: NavItem[] = [
  { href: "/teacher", label: "Accueil" },
  { href: "/teacher/essays", label: "Copies" },
  { href: "/teacher/resources", label: "Ressources" },
  { href: "/teacher/resources/new", label: "Nouveau dépôt" },
  { href: "/teacher/grades", label: "Notes" },
  { href: "/teacher/rubrics", label: "Grilles de correction" }
];

export const adminNavigation: NavItem[] = [
  { href: "/admin", label: "Vue d'ensemble" },
  { href: "/admin/users", label: "Utilisateurs" },
  { href: "/admin/establishments", label: "Établissements" },
  { href: "/admin/activity", label: "Connexions" },
  { href: "/admin/system", label: "Système" }
];
