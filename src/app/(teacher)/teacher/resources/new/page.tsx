export const dynamic = "force-dynamic";

import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";
import { createTeacherResourceAction } from "@/app/actions/resources";
import { getTeacherResourcesData } from "@/lib/resources";

export default async function TeacherNewResourcePage() {
  const data = await getTeacherResourcesData();

  return (
    <div>
      <PageHeader
        title="Nouveau depot"
        description="Ajouter une ressource a la classe."
      />

      <SectionCard
        eyebrow="Formulaire"
        title="Ajouter une ressource"
        description="Cours, fiche, exercice ou correction."
      >
        <form action={createTeacherResourceAction} className="space-y-5">
          <div className="grid gap-4 lg:grid-cols-2">
            <label className="rounded-[22px] bg-sand p-4">
              <span className="text-sm font-semibold">Titre</span>
              <input
                name="title"
                placeholder="Ex. Cours ESH - Inflation"
                className="mt-3 w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-pine"
              />
            </label>

            <label className="rounded-[22px] bg-sand p-4">
              <span className="text-sm font-semibold">Matiere</span>
              <select
                name="subjectCode"
                className="mt-3 w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-pine"
              >
                {data.subjects.map((subject) => (
                  <option key={subject.code} value={subject.code}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="rounded-[22px] bg-sand p-4">
              <span className="text-sm font-semibold">Chapitre</span>
              <select
                name="chapterId"
                className="mt-3 w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-pine"
              >
                {data.chapters.map((chapter) => (
                  <option key={chapter.id} value={chapter.id}>
                    {chapter.subjectCode} - {chapter.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="rounded-[22px] bg-sand p-4">
              <span className="text-sm font-semibold">Type</span>
              <select
                name="resourceType"
                defaultValue="COURSE"
                className="mt-3 w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-pine"
              >
                <option value="COURSE">Cours</option>
                <option value="SUMMARY">Fiche</option>
                <option value="EXERCISE">Exercice</option>
                <option value="CORRECTION">Correction</option>
                <option value="METHOD">Methode</option>
                <option value="REPORT">Rapport</option>
              </select>
            </label>
          </div>

          <label className="block rounded-[22px] bg-sand p-4">
            <span className="text-sm font-semibold">Description courte</span>
            <textarea
              name="description"
              rows={3}
              placeholder="Quelques lignes pour aider l'eleve a comprendre ce qu'il va trouver."
              className="mt-3 w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-pine"
            />
          </label>

          <label className="block rounded-[22px] bg-sand p-4">
            <span className="text-sm font-semibold">Texte du cours</span>
            <textarea
              name="content"
              rows={14}
              placeholder="Colle ici le texte du cours si tu veux une ressource directement lisible dans l'application."
              className="mt-3 w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm leading-7 outline-none transition focus:border-pine"
            />
          </label>

          <label className="block rounded-[22px] bg-sand p-4">
            <span className="text-sm font-semibold">Fichier du cours</span>
            <input
              type="file"
              name="file"
              accept=".pdf,.png,.jpg,.jpeg,.txt,.md"
              className="mt-3 block w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm text-pine/80 file:mr-4 file:rounded-full file:border-0 file:bg-ink file:px-4 file:py-2 file:text-sm file:font-semibold file:text-sand"
            />
            <p className="mt-3 text-xs leading-6 text-pine/70">
              Tu peux deposer un PDF, une image ou un fichier texte. Il faut remplir au moins l'un
              des deux champs : texte ou fichier.
            </p>
          </label>

          <label className="flex items-center gap-3 rounded-[22px] bg-mist px-4 py-4 text-sm text-pine/85">
            <input type="checkbox" name="aiEnabled" defaultChecked className="size-4 rounded border-ink/20" />
            Autoriser les actions IA pour les eleves sur cette ressource
          </label>

          <div className="grid gap-3 md:grid-cols-3">
            {["Resume IA", "Creation de fiches", "Generation de flashcards"].map((option) => (
              <div key={option} className="rounded-[22px] bg-mist p-4 text-sm text-pine/85">
                {option}
              </div>
            ))}
          </div>

          <button
            type="submit"
            className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-sand transition hover:bg-pine"
          >
            Publier la ressource
          </button>
        </form>
      </SectionCard>
    </div>
  );
}
