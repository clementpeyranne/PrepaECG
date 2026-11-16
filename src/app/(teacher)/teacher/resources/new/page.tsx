export const dynamic = "force-dynamic";

import Link from "next/link";
import type { Route } from "next";

import { PendingSubmitButton } from "@/components/forms/pending-submit-button";
import { Notice } from "@/components/ui/notice";
import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";
import { createTeacherResourceAction } from "@/app/actions/resources";
import { getTeacherResourcesData } from "@/lib/resources";
import { randomUUID } from "node:crypto";
import { DocumentUploadForm } from "@/components/forms/document-upload-form";
import { SubjectChapterFields } from "@/components/forms/subject-chapter-fields";
import { getFileStorageDriver } from "@/lib/app-config";

export default async function TeacherNewResourcePage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const data = await getTeacherResourcesData();
  const status = (await searchParams)?.status;
  const message = status === "created" ? { tone: "success" as const, text: "Ressource publiée dans ta prépa." }
    : status === "already_exists" ? { tone: "warning" as const, text: "Cette ressource est déjà enregistrée. Aucun doublon n'a été créé." }
    : status === "invalid" ? { tone: "error" as const, text: "Dépôt non enregistré. Vérifie le titre, la matière, le chapitre et le contenu (texte ou fichier), puis réessaie." } : null;

  return (
    <div>
      <PageHeader
        title="Nouveau dépôt"
        description="Publier un cours, une fiche, un exercice ou une correction pour les élèves de la prépa."
      />

      <SectionCard
        eyebrow="Ressource"
        title="Informations et contenu"
      >
        {message ? (
          <Notice tone={message.tone} className="mb-5">
            {message.text}
            {message.tone === "success" ? (
              <Link href={"/teacher/resources" as Route} className="ml-2 font-semibold underline underline-offset-4">Voir les ressources</Link>
            ) : null}
          </Notice>
        ) : null}
        <DocumentUploadForm action={createTeacherResourceAction} folder="resources" cloud={getFileStorageDriver() === "supabase"}>
          <input type="hidden" name="submissionKey" value={randomUUID()} />
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
              <span className="text-sm font-semibold">Type de ressource</span>
              <select
                name="resourceType"
                defaultValue="COURSE"
                className="mt-3 w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-pine"
              >
                <option value="COURSE">Cours</option>
                <option value="SUMMARY">Fiche</option>
                <option value="EXERCISE">Exercice</option>
                <option value="CORRECTION">Correction</option>
                <option value="METHOD">Méthode</option>
                <option value="REPORT">Rapport</option>
              </select>
            </label>

            <SubjectChapterFields subjects={data.subjects} chapters={data.chapters} />
          </div>

          <label className="block rounded-[22px] bg-sand p-4">
            <span className="text-sm font-semibold">Description courte</span>
            <textarea
              name="description"
              rows={3}
              placeholder="Quelques lignes pour aider l'élève à comprendre ce qu'il va trouver."
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
            <p className="mt-3 text-xs leading-6 text-pine/80">
              Tu peux déposer un PDF, une image ou un fichier texte. Il faut remplir au moins l'un
              des deux champs : texte ou fichier.
            </p>
          </label>

          <label className="flex items-start gap-3 rounded-[22px] bg-mist px-4 py-4 text-sm text-ink">
            <input type="checkbox" name="aiEnabled" defaultChecked className="mt-0.5 size-4 rounded border-ink/20" />
            <span>
              <span className="font-semibold">Autoriser les actions IA pour les élèves sur cette ressource</span>
              <span className="mt-1 block leading-6 text-pine/85">
                Les élèves pourront en tirer un résumé, une fiche de révision ou des flashcards. Le document d’origine reste inchangé.
              </span>
            </span>
          </label>

          <PendingSubmitButton
            label="Publier la ressource"
            pendingLabel="Publication..."
            className="btn-primary rounded-full px-6 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          />
        </DocumentUploadForm>
      </SectionCard>
    </div>
  );
}
