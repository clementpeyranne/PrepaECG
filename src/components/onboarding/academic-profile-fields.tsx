"use client";

import { useState, type ReactNode } from "react";
import { SectionCard } from "@/components/ui/section-card";
import { getActiveSubjectCodes, getAcademicSubjectLabel, type AcademicPath, type SecondLanguage } from "@/lib/academic-path";

type Props = {
  academicPath: AcademicPath;
  lv2Language: SecondLanguage;
  assessments?: { subjectAssessments?: Record<string, number | null>; bacSubjectAssessments?: Record<string, number | null>; bacAverage?: number | null; bacMention?: string | null };
  children: ReactNode;
};
const suffixes: Record<string, string> = { MATHS: "Maths", ESH: "Esh", HGG: "Hgg", ANG: "Ang", CG: "Cg", ESP: "Esp", ALL: "All", ITA: "Ita" };
const fieldClass = "w-full rounded-2xl border border-ink/10 bg-sand px-4 py-3 text-sm outline-none focus:border-pine";

export function AcademicProfileFields({ academicPath, lv2Language, assessments, children }: Props) {
  const [path, setPath] = useState(academicPath);
  const [language, setLanguage] = useState(lv2Language);
  const [grades, setGrades] = useState<Record<string, number | null>>(assessments?.subjectAssessments ?? {});
  const [bacGrades, setBacGrades] = useState<Record<string, number | null>>(assessments?.bacSubjectAssessments ?? {});
  const profile = { academicPath: path, languagePreferences: { lv2: language } };
  const codes = getActiveSubjectCodes(profile);
  return <>
    <SectionCard eyebrow="Parcours" title="Mes matières" accent="soft">
      <div className="grid gap-4 lg:grid-cols-2">
        <label><span className="mb-2 block text-sm font-medium">Spécialité</span>
          <select name="humanities" value={path.humanities} onChange={(event) => setPath({ ...path, humanities: event.target.value as AcademicPath["humanities"] })} className={fieldClass} required>
            <option value="ESH">ESH</option><option value="HGG">HGG</option>
          </select>
        </label>
        <label><span className="mb-2 block text-sm font-medium">Mathématiques</span>
          <select name="mathsOption" value={path.maths} onChange={(event) => setPath({ ...path, maths: event.target.value as AcademicPath["maths"] })} className={fieldClass} required>
            <option value="APPLIQUEES">Maths appliquées</option><option value="APPROFONDIES">Maths approfondies</option>
          </select>
        </label>
        <label><span className="mb-2 block text-sm font-medium">LV1</span><input value="Anglais" readOnly className={fieldClass} /></label>
        <label><span className="mb-2 block text-sm font-medium">LV2</span>
          <select name="lv2Language" value={language} onChange={(event) => setLanguage(event.target.value as SecondLanguage)} className={fieldClass} required>
            <option value="ESPAGNOL">Espagnol</option><option value="ITALIEN">Italien</option><option value="ALLEMAND">Allemand</option>
          </select>
        </label>
      </div>
      <p className="mt-4 text-sm text-ink/70">Culture générale fait également partie de ton parcours.</p>
    </SectionCard>
    {children}
    <SectionCard eyebrow="Résultats" title="Mes résultats antérieurs">
      <div className="grid gap-5 xl:grid-cols-2">
        <div className="rounded-[24px] bg-white/70 p-5">
          <h3 className="mb-4 text-sm font-semibold">Devoirs et concours blancs déjà passés</h3>
          <div className="grid gap-4 sm:grid-cols-2">{codes.map((code) => <label key={code}>
            <span className="mb-2 block text-sm font-medium">{getAcademicSubjectLabel(code, profile)}</span>
            <input name={`assessment${suffixes[code]}`} type="number" min="0" max="20" step="0.01" placeholder="Non renseigné" value={grades[code] ?? ""}
              onChange={(event) => setGrades({ ...grades, [code]: event.target.value === "" ? null : Number(event.target.value) })} className={fieldClass} />
          </label>)}</div>
        </div>
        <div className="rounded-[24px] bg-sand p-5">
          <h3 className="mb-4 text-sm font-semibold">Mes notes du bac, si j’entre en première année</h3>
          <div className="mb-4 grid gap-4 sm:grid-cols-2">
            <label><span className="mb-2 block text-sm font-medium">Moyenne au bac</span><input name="bacAverage" type="number" min="0" max="20" step="0.01" defaultValue={assessments?.bacAverage ?? ""} className={fieldClass} /></label>
            <label><span className="mb-2 block text-sm font-medium">Mention</span><select name="bacMention" defaultValue={assessments?.bacMention ?? ""} className={fieldClass}><option value="">Non renseignée</option><option value="TB">Très bien</option><option value="B">Bien</option><option value="AB">Assez bien</option></select></label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">{codes.map((code) => <label key={code}>
            <span className="mb-2 block text-sm font-medium">{code === "ESH" ? "SES" : code === "HGG" ? "Histoire-géographie / HGGSP" : code === "CG" ? "Philosophie / français" : code === "MATHS" ? "Mathématiques" : getAcademicSubjectLabel(code, profile)}</span>
            <input name={`bac${suffixes[code]}`} type="number" min="0" max="20" step="0.01" placeholder="Non renseigné" value={bacGrades[code] ?? ""}
              onChange={(event) => setBacGrades({ ...bacGrades, [code]: event.target.value === "" ? null : Number(event.target.value) })} className={fieldClass} />
          </label>)}</div>
        </div>
      </div>
    </SectionCard>
  </>;
}
