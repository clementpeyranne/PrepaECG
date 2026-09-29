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
  { href: "/essays", label: "Copies" },
  { href: "/assistant", label: "Assistant IA" },
  { href: "/actualites", label: "Actualites" },
  { href: "/progress", label: "Progression" }
];

export const teacherNavigation: NavItem[] = [
  { href: "/teacher/resources", label: "Ressources" },
  { href: "/teacher/resources/new", label: "Nouveau depot" },
  { href: "/teacher/essays", label: "Copies" },
  { href: "/teacher/grades", label: "Notes" },
  { href: "/teacher/rubrics", label: "Grilles" }
];
