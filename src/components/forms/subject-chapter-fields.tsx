"use client";
import { useState } from "react";

export function SubjectChapterFields({ subjects, chapters }: {
  subjects: Array<{ code: string; name: string }>;
  chapters: Array<{ id: string; name: string; subjectCode: string }>;
}) {
  const [subject, setSubject] = useState(subjects[0]?.code ?? "");
  const options = chapters.filter((chapter) => chapter.subjectCode === subject);
  const style = "mt-3 w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-pine";
  return <>
    <label className="rounded-[22px] bg-sand p-4">
      <span className="text-sm font-semibold">Matiere</span>
      <select name="subjectCode" value={subject} onChange={(event) => setSubject(event.target.value)} className={style} required>
        {subjects.map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}
      </select>
    </label>
    <label className="rounded-[22px] bg-sand p-4">
      <span className="text-sm font-semibold">Chapitre ou theme</span>
      <select name="chapterId" key={subject} defaultValue={options[0]?.id ?? ""} className={style} required>
        {!options.length ? <option value="">Aucun chapitre disponible</option> : null}
        {options.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
      </select>
    </label>
  </>;
}
