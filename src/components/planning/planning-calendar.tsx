"use client";

import { useState } from "react";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";

import { TodayPlanChecklist, type TodayPlanEntry } from "./today-plan-checklist";

type PlanningDay = {
  dayLabel: string;
  dateLabel: string;
  isToday: boolean;
  availableHours: number;
  entries: TodayPlanEntry[];
};

export function PlanningCalendar({ week }: { week: PlanningDay[] }) {
  const todayIndex = Math.max(0, week.findIndex((day) => day.isToday));
  const [view, setView] = useState<"week" | "day">("week");
  const [selectedIndex, setSelectedIndex] = useState(todayIndex);
  const selectedDay = week[selectedIndex] ?? week[todayIndex];
  if (!selectedDay) return <p className="text-sm text-pine">Aucun bloc prevu cette semaine.</p>;

  function openDay(index: number) {
    setSelectedIndex(index);
    setView("day");
  }

  const completed = selectedDay.entries.filter((entry) => entry.status === "COMPLETED").length;
  const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay focus-visible:ring-offset-2";

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium text-pine">Du {week[0].dateLabel} au {week[week.length - 1].dateLabel}</p>
        <div className="inline-flex rounded-full bg-mist p-1" role="group" aria-label="Affichage du planning">
          {(["week", "day"] as const).map((mode) => (
            <button key={mode} type="button" aria-pressed={view === mode} onClick={() => setView(mode)}
              className={`min-h-11 rounded-full px-5 text-sm font-semibold transition ${focusRing} ${view === mode ? "bg-ink text-sand" : "text-pine hover:bg-sand"}`}>
              {mode === "week" ? "Semaine" : "Jour"}
            </button>
          ))}
        </div>
      </div>

      {view === "week" ? (
        <div className="scrollbar-none mt-5 flex gap-3 overflow-x-auto pb-2 md:grid md:overflow-visible md:pb-0 md:[grid-template-columns:repeat(7,minmax(0,1fr))]">
          {week.map((day, index) => (
            <button key={`${day.dayLabel}-${day.dateLabel}`} type="button" onClick={() => openDay(index)}
              aria-label={`Afficher ${day.dayLabel} ${day.dateLabel}`}
              className={`min-w-[268px] rounded-[22px] p-4 text-left transition hover:ring-2 hover:ring-clay/40 md:min-w-0 ${focusRing} ${day.isToday ? "bg-ink text-sand" : "bg-sand text-ink"}`}>
              <span className="block text-sm font-semibold">{day.dayLabel}</span>
              <span className={`mt-1 block text-xs ${day.isToday ? "text-sand/70" : "text-pine/75"}`}>
                {day.dateLabel} · {day.availableHours}h ciblees
              </span>
              <span className="mt-4 block space-y-2 text-xs">
                {day.entries.map((entry) => (
                  <span key={entry.id} className={`block rounded-2xl px-3 py-2 ${day.isToday ? "bg-white/10" : "bg-white/70"}`}>
                    <span className="flex items-center justify-between gap-1 font-semibold">
                      <span>{entry.time} · {entry.subject}</span>
                      {entry.status === "COMPLETED" ? <><Check size={14} className="shrink-0" aria-hidden="true" /><span className="sr-only">Fait</span></> : null}
                    </span>
                    <span className={`mt-1 block break-words ${day.isToday ? "text-sand/80" : "text-pine/75"}`}>{entry.title}</span>
                  </span>
                ))}
                {!day.entries.length ? <span className="block">Aucun bloc prevu</span> : null}
              </span>
            </button>
          ))}
        </div>
      ) : (
        <div className="mt-5">
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-7" role="group" aria-label="Choisir une journee">
            {week.map((day, index) => (
              <button key={`${day.dayLabel}-${day.dateLabel}`} type="button" aria-pressed={selectedIndex === index}
                onClick={() => setSelectedIndex(index)}
                className={`min-h-14 rounded-2xl px-2 py-2 text-center text-xs transition ${focusRing} ${selectedIndex === index ? "bg-ink text-sand" : "bg-sand text-pine hover:bg-mist"}`}>
                <span className="block font-semibold">{day.dayLabel}</span>
                <span className="mt-1 block">{day.dateLabel}</span>
              </button>
            ))}
          </div>
          <div className="my-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold">{selectedDay.isToday ? "Aujourd'hui" : selectedDay.dayLabel} · {selectedDay.dateLabel}</h3>
              <p className="mt-1 text-sm text-pine" role="status">{completed} / {selectedDay.entries.length} blocs valides</p>
            </div>
            <div className="flex items-center gap-1">
              <button type="button" aria-label="Jour precedent" disabled={selectedIndex === 0} onClick={() => setSelectedIndex((index) => index - 1)}
                className={`flex size-11 items-center justify-center rounded-full hover:bg-mist disabled:opacity-30 ${focusRing}`}><ChevronLeft size={18} /></button>
              <button type="button" onClick={() => setSelectedIndex(todayIndex)} className={`min-h-11 rounded-full px-3 text-sm hover:bg-mist ${focusRing}`}>Aujourd'hui</button>
              <button type="button" aria-label="Jour suivant" disabled={selectedIndex === week.length - 1} onClick={() => setSelectedIndex((index) => index + 1)}
                className={`flex size-11 items-center justify-center rounded-full hover:bg-mist disabled:opacity-30 ${focusRing}`}><ChevronRight size={18} /></button>
            </div>
          </div>
          <TodayPlanChecklist entries={selectedDay.entries} />
        </div>
      )}
    </div>
  );
}
