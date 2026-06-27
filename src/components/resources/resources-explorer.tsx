"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { SectionCard } from "@/components/ui/section-card";
import type { ResourceExplorerItem } from "@/lib/resources";

function uniqueValues(
  items: ResourceExplorerItem[],
  key: keyof Pick<ResourceExplorerItem, "subject" | "teacher" | "chapter" | "type">
) {
  return Array.from(new Set(items.map((item) => item[key]))).sort((a, b) => a.localeCompare(b));
}

type ResourcesExplorerProps = {
  resources: ResourceExplorerItem[];
};

export function ResourcesExplorer({ resources }: ResourcesExplorerProps) {
  const [search, setSearch] = useState("");
  const [subject, setSubject] = useState("Toutes les matieres");
  const [teacher, setTeacher] = useState("Tous les profs");
  const [chapter, setChapter] = useState("Tous les chapitres");
  const [type, setType] = useState("Tous les types");

  const subjects = useMemo(() => ["Toutes les matieres", ...uniqueValues(resources, "subject")], []);
  const teachers = useMemo(() => ["Tous les profs", ...uniqueValues(resources, "teacher")], []);
  const chapters = useMemo(() => ["Tous les chapitres", ...uniqueValues(resources, "chapter")], []);
  const types = useMemo(() => ["Tous les types", ...uniqueValues(resources, "type")], []);

  const filteredResources = useMemo(() => {
    const query = search.trim().toLowerCase();

    return resources.filter((resource) => {
      const matchesSearch =
        !query ||
        [resource.title, resource.summary, resource.subject, resource.chapter, resource.teacher]
          .join(" ")
          .toLowerCase()
          .includes(query);

      const matchesSubject = subject === "Toutes les matieres" || resource.subject === subject;
      const matchesTeacher = teacher === "Tous les profs" || resource.teacher === teacher;
      const matchesChapter = chapter === "Tous les chapitres" || resource.chapter === chapter;
      const matchesType = type === "Tous les types" || resource.type === type;

      return matchesSearch && matchesSubject && matchesTeacher && matchesChapter && matchesType;
    });
  }, [chapter, search, subject, teacher, type]);

  return (
    <div className="space-y-5">
      <SectionCard
        eyebrow="Cloud"
        title="Bibliotheque par matiere"
        accent="soft"
      >
        <div className="flex flex-wrap gap-3">
          {subjects.map((option) => {
            const count =
              option === "Toutes les matieres"
                ? resources.length
                : resources.filter((resource) => resource.subject === option).length;

            return (
              <button
                key={option}
                type="button"
                onClick={() => setSubject(option)}
                className={`rounded-full px-4 py-3 text-sm transition ${
                  subject === option
                    ? "bg-ink text-sand"
                    : "bg-white text-pine hover:bg-mist"
                }`}
              >
                {option} <span className="text-current/70">{count}</span>
              </button>
            );
          })}
        </div>
      </SectionCard>

      <div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
        <SectionCard
          eyebrow="Vue rapide"
          title="Le cloud de cours"
          accent="soft"
        >
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-white/75 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-pine/55">Documents</p>
              <p className="mt-3 font-display text-3xl text-ink">{resources.length}</p>
            </div>
            <div className="rounded-2xl bg-white/75 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-pine/55">Profs</p>
              <p className="mt-3 font-display text-3xl text-ink">{teachers.length - 1}</p>
            </div>
            <div className="rounded-2xl bg-white/75 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-pine/55">Chapitres</p>
              <p className="mt-3 font-display text-3xl text-ink">{chapters.length - 1}</p>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          eyebrow="Recherche"
          title="Filtres rapides"
        >
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <label className="md:col-span-2 xl:col-span-3">
              <span className="mb-2 block text-sm font-medium text-pine/80">Recherche libre</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Ex. probabilites, Mme Laurent, dissertation..."
                className="w-full rounded-2xl border border-ink/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-pine"
              />
            </label>

            <SelectFilter label="Matiere" value={subject} options={subjects} onChange={setSubject} />
            <SelectFilter label="Prof" value={teacher} options={teachers} onChange={setTeacher} />
            <SelectFilter label="Chapitre" value={chapter} options={chapters} onChange={setChapter} />
            <SelectFilter label="Type" value={type} options={types} onChange={setType} />

            <button
              type="button"
              onClick={() => {
                setSearch("");
                setSubject("Toutes les matieres");
                setTeacher("Tous les profs");
                setChapter("Tous les chapitres");
                setType("Tous les types");
              }}
              className="self-end rounded-2xl bg-ink px-4 py-3 text-sm font-medium text-sand transition hover:bg-pine"
            >
              Reinitialiser
            </button>
          </div>
        </SectionCard>
      </div>

      <SectionCard
        eyebrow="Bibliotheque"
        title={`${filteredResources.length} document${filteredResources.length > 1 ? "s" : ""} affiche${filteredResources.length > 1 ? "s" : ""}`}
      >
        {filteredResources.length === 0 ? (
          <div className="rounded-[24px] bg-sand p-8 text-center text-sm text-pine/75">
            Aucun document ne correspond a ces filtres.
          </div>
        ) : (
          <div className="space-y-4">
            {filteredResources.map((resource) => (
              <Link
                key={resource.id}
                href={`/resources/${resource.id}`}
                className="block rounded-[24px] border border-ink/8 bg-white p-5 transition hover:border-pine/25 hover:bg-sand"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">{resource.title}</p>
                    <p className="mt-1 text-sm text-pine/75">
                      {resource.subject} - {resource.chapter} - {resource.teacher}
                    </p>
                  </div>
                  <span className="rounded-full bg-mist px-3 py-1 text-xs text-pine">
                    {resource.type}
                  </span>
                </div>
                <p className="mt-4 max-w-4xl text-sm leading-7 text-pine/78">{resource.summary}</p>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {resource.aiEnabled ? (
                    <>
                      <span className="rounded-full border border-ink/10 bg-sand px-3 py-1 text-xs text-pine/80">
                        Resume IA
                      </span>
                      <span className="rounded-full border border-ink/10 bg-sand px-3 py-1 text-xs text-pine/80">
                        Fiche
                      </span>
                      <span className="rounded-full border border-ink/10 bg-sand px-3 py-1 text-xs text-pine/80">
                        Flashcards
                      </span>
                    </>
                  ) : null}
                  <span className="rounded-full bg-mist px-3 py-1 text-xs text-pine">
                    {resource.generatedOutputs} sortie{resource.generatedOutputs > 1 ? "s" : ""} generee
                    {resource.generatedOutputs > 1 ? "s" : ""}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}

type SelectFilterProps = {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
};

function SelectFilter({ label, value, options, onChange }: SelectFilterProps) {
  return (
    <label>
      <span className="mb-2 block text-sm font-medium text-pine/80">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-ink/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-pine"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}
