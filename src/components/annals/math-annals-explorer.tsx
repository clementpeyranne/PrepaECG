"use client";

import { useState } from "react";
import { ArrowUpRight, BookOpen, Search } from "lucide-react";
import { annalSourceName, filterMathAnnals, mathExamCategories, type AnnalDocument, type AnnalsFilters, type MathAnnal } from "@/lib/math-annals";

const pageSize = 12;
const initialFilters: AnnalsFilters = { track: "appliquees", category: "all", year: "all", query: "", correctedOnly: false };
const focusRing = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-pine";

function DocumentLink({ document, label, title }: { document: AnnalDocument | null; label: string; title: string }) {
  if (!document) return <span className="flex min-h-11 items-center justify-center rounded-xl border border-ink/10 px-3 text-xs text-ink/75">{label} indisponible</span>;
  return (
    <div className="min-w-0">
      <a
        href={document.url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${label} : ${title} (nouvel onglet)`}
        className={`flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition ${focusRing} ${label === "Sujet" ? "bg-ink text-sand hover:bg-pine" : "border border-ink/15 bg-mist text-ink hover:border-pine/40"}`}
      >
        {label}<ArrowUpRight size={15} aria-hidden="true" />
      </a>
      <p className="mt-1.5 truncate text-center text-[11px] text-ink/75" title={annalSourceName(document.url)}>
        {document.format === "pdf" ? "PDF" : "Page"} · {annalSourceName(document.url)}
      </p>
    </div>
  );
}

export function MathAnnalsExplorer({ records }: { records: MathAnnal[] }) {
  const [filters, setFilters] = useState(initialFilters);
  const [page, setPage] = useState(1);
  const results = filterMathAnnals(records, filters);
  const years = [...new Set(records.map((record) => record.year))].sort((a, b) => b - a);
  const pageCount = Math.max(1, Math.ceil(results.length / pageSize));
  const visible = results.slice((page - 1) * pageSize, page * pageSize);

  function updateFilters(update: Partial<AnnalsFilters>) {
    setFilters((current) => ({ ...current, ...update }));
    setPage(1);
  }

  return (
    <div className="space-y-5">
      <section className="panel-surface-strong rounded-[26px] p-4 sm:p-6" aria-label="Choisir les annales">
        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-sand p-1.5" role="group" aria-label="Filière de mathématiques">
          {([['appliquees', 'Maths appliquées'], ['approfondies', 'Maths approfondies']] as const).map(([id, label]) => (
            <button key={id} type="button" aria-pressed={filters.track === id} onClick={() => updateFilters({ track: id })}
              className={`min-h-12 rounded-xl px-2 py-3 text-sm font-semibold transition sm:text-base ${focusRing} ${filters.track === id ? "bg-ink text-sand shadow-sm" : "text-ink/80 hover:bg-mist"}`}>
              {label}
            </button>
          ))}
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6" role="group" aria-label="Concours et écoles">
          {[{ id: "all", label: "Tous les sujets" }, ...mathExamCategories].map((category) => {
            const count = records.filter((record) => record.track === filters.track && (category.id === "all" || record.category === category.id)).length;
            return (
              <button key={category.id} type="button" aria-pressed={filters.category === category.id}
                onClick={() => updateFilters({ category: category.id as AnnalsFilters["category"] })}
                className={`min-h-16 rounded-2xl border p-3 text-left transition ${focusRing} ${filters.category === category.id ? "border-pine bg-mist text-ink" : "border-ink/10 text-ink/75 hover:border-pine/40"}`}>
                <span className="block text-sm font-semibold">{category.label}</span>
                <span className="mt-1 block text-xs text-current/65">{count} sujets</span>
              </button>
            );
          })}
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_180px]">
          <label className="min-w-0">
            <span className="mb-2 block text-sm font-medium">Rechercher un sujet</span>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-3.5 text-ink/75" size={18} aria-hidden="true" />
              <input type="search" value={filters.query} onChange={(event) => updateFilters({ query: event.target.value })}
                placeholder="École, année, ECE, ECS…" className={`min-h-12 w-full rounded-xl border border-ink/15 bg-sand py-3 pl-10 pr-3 text-sm ${focusRing}`} />
            </div>
          </label>
          <div>
            <label htmlFor="annals-year" className="mb-2 block text-sm font-medium">Année</label>
            <select id="annals-year" value={filters.year} onChange={(event) => updateFilters({ year: event.target.value })}
              className={`min-h-12 w-full rounded-xl border border-ink/15 bg-sand px-3 py-3 text-sm ${focusRing}`}>
              <option value="all">Toutes les années</option>
              {years.map((year) => <option key={year} value={year}>{year}</option>)}
            </select>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm text-ink/80">
            <input type="checkbox" checked={filters.correctedOnly} onChange={(event) => updateFilters({ correctedOnly: event.target.checked })} className="h-4 w-4 accent-pine" />
            Avec un corrigé disponible
          </label>
          <button type="button" onClick={() => updateFilters({ ...initialFilters, track: filters.track })} className={`min-h-11 rounded-lg px-2 text-sm underline underline-offset-4 text-ink/75 ${focusRing}`}>Réinitialiser les filtres</button>
        </div>
      </section>

      <p className="px-1 text-xs leading-6 text-ink/75">
        Avant 2023 : archives ECE en appliquées, ECS en approfondies. Certains exercices relèvent de l’ancien programme.
        Les anciens sujets ESSEC 1 sont regroupés avec HEC ; les épreuves Maths 2 sont séparées.
      </p>

      <section className="panel-surface-strong overflow-hidden rounded-[26px]" aria-labelledby="annals-results">
        <div className="flex items-center justify-between gap-3 border-b border-ink/10 px-4 py-5 sm:px-6">
          <h2 id="annals-results" className="font-display text-2xl tracking-tight">Sujets et corrigés</h2>
          <span className="text-sm text-ink/75" role="status">{results.length} résultat{results.length !== 1 ? "s" : ""}</span>
        </div>
        {visible.length ? (
          <ul className="divide-y divide-ink/10">
            {visible.map((record) => (
              <li key={record.id} className="grid gap-4 p-4 sm:grid-cols-[1fr_260px] sm:items-center sm:px-6">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="flex h-12 w-14 shrink-0 items-center justify-center rounded-xl bg-sand font-display text-xl">{record.year}</span>
                  <div className="min-w-0">
                    <h3 className="font-semibold leading-6">{record.title}</h3>
                    <p className="mt-1 text-xs text-ink/75">{record.legacy ? `Archive ${record.legacy}` : "ECG"} · Maths {record.track === "appliquees" ? "appliquées" : "approfondies"}</p>
                    {!record.subject && <a className="mt-2 inline-block text-xs underline" href={record.sourcePage} target="_blank" rel="noopener noreferrer">Consulter la page d’archive</a>}
                  </div>
                </div>
                <div className="grid grid-cols-2 items-start gap-2">
                  <DocumentLink document={record.subject} label="Sujet" title={`${record.title} ${record.year}`} />
                  <DocumentLink document={record.correction} label="Corrigé" title={`${record.title} ${record.year}`} />
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="px-6 py-12 text-center">
            <BookOpen size={28} aria-hidden="true" className="mx-auto mb-3 text-ink/75" />
            <p>Aucun sujet ne correspond à ces filtres.</p>
            <button type="button" onClick={() => updateFilters({ ...initialFilters, track: filters.track })} className={`mt-4 min-h-11 rounded-xl bg-ink px-4 text-sm text-sand ${focusRing}`}>Afficher tous les sujets</button>
          </div>
        )}
        {pageCount > 1 && (
          <nav aria-label="Pagination des annales" className="flex items-center justify-between gap-2 border-t border-ink/10 p-4 sm:px-6">
            <button type="button" disabled={page === 1} onClick={() => setPage((current) => current - 1)} className={`min-h-11 rounded-xl border border-ink/15 px-3 text-sm disabled:opacity-35 ${focusRing}`}>Précédent</button>
            <span className="text-xs text-ink/75" aria-live="polite">{page} / {pageCount}</span>
            <button type="button" disabled={page === pageCount} onClick={() => setPage((current) => current + 1)} className={`min-h-11 rounded-xl border border-ink/15 px-3 text-sm disabled:opacity-35 ${focusRing}`}>Suivant</button>
          </nav>
        )}
      </section>
      <p className="px-1 text-xs leading-6 text-ink/75">Les documents s’ouvrent sur le site de leur éditeur. Les corrigés peuvent être des propositions d’enseignants, et non des corrigés officiels.</p>
    </div>
  );
}
