"use client";

import { useMemo, useState } from "react";

type AdaptiveOnboardingFieldsProps = {
  bceSchools: string[];
  ecricomeSchools: string[];
};

const SCHOOL_WEIGHTS: Record<string, number> = {
  HEC: 5,
  ESSEC: 5,
  ESCP: 5,
  EDHEC: 4,
  emlyon: 4,
  SKEMA: 3,
  Audencia: 3,
  NEOMA: 3,
  KEDGE: 2,
  "Montpellier BS": 2,
  "Rennes SB": 2,
  Excelia: 2
};

export function AdaptiveOnboardingFields({
  bceSchools,
  ecricomeSchools
}: AdaptiveOnboardingFieldsProps) {
  const [selectedBce, setSelectedBce] = useState<string[]>(["HEC", "ESSEC", "ESCP"]);
  const [selectedEcricome, setSelectedEcricome] = useState<string[]>(["NEOMA", "KEDGE"]);
  const [weekdayDailyHours, setWeekdayDailyHours] = useState(3);
  const [weekendDailyHours, setWeekendDailyHours] = useState(5);

  const guidance = useMemo(() => {
    const selectedSchools = [...selectedBce, ...selectedEcricome];
    const highestAmbition = selectedSchools.reduce(
      (current, school) => Math.max(current, SCHOOL_WEIGHTS[school] ?? 2),
      2
    );

    const recommendedWeekday =
      highestAmbition >= 5 ? 4 : highestAmbition === 4 ? 3.5 : highestAmbition === 3 ? 3 : 2.5;
    const recommendedWeekend = highestAmbition >= 5 ? 7 : highestAmbition === 4 ? 6 : 5;
    const actualWeighted = weekdayDailyHours * 5 + weekendDailyHours * 2;
    const recommendedWeighted = recommendedWeekday * 5 + recommendedWeekend * 2;
    const ratio = actualWeighted / recommendedWeighted;

    if (ratio < 0.55) {
      return {
        score: 20,
        title: "Charge tres insuffisante",
        message:
          "Avec ces ecoles visees, le volume annonce semble trop faible. Il y a un vrai risque de decalage entre ambition et execution.",
        tone: "bg-red-100 text-red-700"
      };
    }

    if (ratio < 0.8) {
      return {
        score: 45,
        title: "Charge fragile",
        message:
          "Le cadrage commence a exister, mais il risque d'etre trop leger pour soutenir l'objectif annonce sur la duree.",
        tone: "bg-amber-100 text-amber-700"
      };
    }

    if (ratio <= 1.15) {
      return {
        score: 75,
        title: "Charge plutot coherente",
        message:
          "Le volume annonce semble globalement coherent avec les ecoles visees. L'enjeu sera ensuite la regularite et la qualite du travail.",
        tone: "bg-emerald-100 text-emerald-700"
      };
    }

    return {
      score: 92,
      title: "Charge ambitieuse",
      message:
        "Le volume annonce est ambitieux. Il peut convenir, a condition d'etre soutenable et correctement reparti entre les matieres.",
      tone: "bg-sky-100 text-sky-700"
    };
  }, [selectedBce, selectedEcricome, weekdayDailyHours, weekendDailyHours]);

  return (
    <div className="space-y-5">
      <div className="grid gap-5 xl:grid-cols-2">
        <SchoolPicker
          title="Banque BCE"
          name="bceSchools"
          options={bceSchools}
          selected={selectedBce}
          onToggle={setSelectedBce}
        />
        <SchoolPicker
          title="Banque Ecricome"
          name="ecricomeSchools"
          options={ecricomeSchools}
          selected={selectedEcricome}
          onToggle={setSelectedEcricome}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <NumberField
          label="Heures utiles visees par jour de semaine"
          name="weekdayDailyHours"
          value={weekdayDailyHours}
          onChange={setWeekdayDailyHours}
        />
        <NumberField
          label="Heures utiles visees par jour de week-end"
          name="weekendDailyHours"
          value={weekendDailyHours}
          onChange={setWeekendDailyHours}
        />
      </div>

      <div className="rounded-[24px] border border-ink/10 bg-white/75 p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-ink">{guidance.title}</p>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-pine/80">{guidance.message}</p>
          </div>
          <span className={`rounded-full px-3 py-2 text-xs font-semibold ${guidance.tone}`}>
            Coherence {guidance.score}/100
          </span>
        </div>

        <div className="mt-5">
          <input
            type="range"
            min="0"
            max="100"
            value={guidance.score}
            readOnly
            className="h-2 w-full cursor-default appearance-none rounded-full bg-sand"
          />
          <div className="mt-2 flex justify-between text-xs text-pine/60">
            <span>trop faible</span>
            <span>coherent</span>
            <span>tres ambitieux</span>
          </div>
        </div>
      </div>
    </div>
  );
}

type SchoolPickerProps = {
  title: string;
  name: string;
  options: string[];
  selected: string[];
  onToggle: (next: string[]) => void;
};

function SchoolPicker({ title, name, options, selected, onToggle }: SchoolPickerProps) {
  return (
    <div className="rounded-[24px] bg-white/70 p-5">
      <p className="font-semibold text-ink">{title}</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {options.map((option) => {
          const isChecked = selected.includes(option);
          return (
            <label key={option} className="rounded-2xl bg-sand px-4 py-3 text-sm text-pine/85">
              <input
                type="checkbox"
                name={name}
                value={option}
                checked={isChecked}
                onChange={(event) => {
                  if (event.target.checked) {
                    onToggle([...selected, option]);
                    return;
                  }

                  onToggle(selected.filter((item) => item !== option));
                }}
                className="mr-3"
              />
              {option}
            </label>
          );
        })}
      </div>
    </div>
  );
}

type NumberFieldProps = {
  label: string;
  name: string;
  value: number;
  onChange: (next: number) => void;
};

function NumberField({ label, name, value, onChange }: NumberFieldProps) {
  return (
    <label>
      <span className="mb-2 block text-sm font-medium text-pine/80">{label}</span>
      <input
        type="number"
        name={name}
        value={value}
        onChange={(event) => onChange(Number(event.target.value) || 0)}
        className="w-full rounded-2xl border border-ink/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-pine"
      />
    </label>
  );
}
