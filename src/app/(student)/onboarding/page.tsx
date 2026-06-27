import type { ReactNode } from "react";

import { AdaptiveOnboardingFields } from "@/components/onboarding/adaptive-onboarding-fields";
import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";
import { getOnboardingOptions } from "@/lib/student-app";

import { submitOnboarding } from "./actions";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const options = await getOnboardingOptions();

  return (
    <div>
      <PageHeader title="Configuration eleve" />

      <form action={submitOnboarding} className="space-y-5">
        <SectionCard eyebrow="Compte" title="Informations de base">
          <div className="grid gap-4 lg:grid-cols-2">
            <InputField label="Prenom" name="firstName" defaultValue={options.user.firstName} />
            <InputField label="Nom" name="lastName" defaultValue={options.user.lastName} />

            <SelectField label="Classe" name="classId" defaultValue={options.classes[0]?.id}>
              {options.classes.map((classItem) => (
                <option key={classItem.id} value={classItem.id}>
                  {classItem.name}
                </option>
              ))}
            </SelectField>

            <SelectField
              label="Annee de prepa"
              name="prepYear"
              defaultValue={String(options.preferences.prepYear)}
            >
              <option value="1">J'entre en 1ere annee</option>
              <option value="2">Je suis en 2eme annee</option>
            </SelectField>
          </div>
        </SectionCard>

        <SectionCard eyebrow="Langues" title="Langues vivantes" accent="soft">
          <div className="grid gap-4 lg:grid-cols-2">
            <SelectField label="LV1" name="lv1Language" defaultValue="ANGLAIS" disabled>
              <option value="ANGLAIS">Anglais</option>
            </SelectField>

            <SelectField
              label="LV2"
              name="lv2Language"
              defaultValue={options.preferences.lv2Language}
            >
              <option value="ESPAGNOL">Espagnol</option>
              <option value="ALLEMAND">Allemand</option>
              <option value="ITALIEN">Italien</option>
            </SelectField>
          </div>
        </SectionCard>

        <SectionCard eyebrow="Objectifs" title="Ecoles visees" accent="soft">
          <AdaptiveOnboardingFields
            bceSchools={options.bceSchools}
            ecricomeSchools={options.ecricomeSchools}
          />
        </SectionCard>

        <SectionCard eyebrow="Creneaux" title="Horaires types">
          <div className="grid gap-4 lg:grid-cols-2">
            <InputField label="Debut type en semaine" name="weekdayStart" type="time" defaultValue="18:00" />
            <InputField label="Fin type en semaine" name="weekdayEnd" type="time" defaultValue="21:30" />
            <InputField label="Debut type le week-end" name="weekendStart" type="time" defaultValue="09:30" />
            <InputField label="Fin type le week-end" name="weekendEnd" type="time" defaultValue="14:30" />
          </div>
        </SectionCard>

        <SectionCard eyebrow="Rythme" title="Blocs de travail et pauses">
          <div className="grid gap-4 lg:grid-cols-2">
            <InputField
              label="Duree cible d'un bloc de travail (min)"
              name="sessionBlockMinutes"
              type="number"
              defaultValue="50"
            />
            <InputField
              label="Pause courte entre deux blocs (min)"
              name="shortBreakMinutes"
              type="number"
              defaultValue="10"
            />
            <InputField
              label="Pause longue (min)"
              name="longBreakMinutes"
              type="number"
              defaultValue="25"
            />
            <InputField
              label="Faire une pause longue tous les X blocs"
              name="breakEveryBlocks"
              type="number"
              defaultValue="2"
            />

            <SelectField label="Rythme actuel" name="energyLevel" defaultValue="modere">
              <option value="leger">Je dois garder un rythme plutot leger</option>
              <option value="modere">Je peux tenir un rythme modere</option>
              <option value="intense">Je peux tenir un rythme intense</option>
            </SelectField>
          </div>
        </SectionCard>

        <SectionCard eyebrow="Resultats" title="Notes deja obtenues">
          <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-4 rounded-[24px] bg-white/70 p-5">
              <p className="text-sm font-semibold text-ink">Notes de concours blancs ou devoirs significatifs</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <InputField label="Maths" name="assessmentMaths" type="number" defaultValue="9" />
                <InputField label="ESH" name="assessmentEsh" type="number" defaultValue="11" />
                <InputField label="HGG" name="assessmentHgg" type="number" defaultValue="10" />
                <InputField label="Culture generale" name="assessmentCg" type="number" defaultValue="12" />
                <InputField label="Anglais" name="assessmentAng" type="number" defaultValue="13" />
              </div>
            </div>

            <div className="space-y-4 rounded-[24px] bg-sand p-5">
              <p className="text-sm font-semibold text-ink">Si l'eleve arrive en 1ere annee</p>
              <InputField label="Moyenne au bac ou moyenne generale" name="bacAverage" type="number" />
              <SelectField label="Mention au bac" name="bacMention" defaultValue="">
                <option value="">Pas renseignee</option>
                <option value="TB">Tres bien</option>
                <option value="B">Bien</option>
                <option value="AB">Assez bien</option>
              </SelectField>
              <div className="grid gap-4 sm:grid-cols-2">
                <InputField label="Bac Maths" name="bacMaths" type="number" />
                <InputField label="Bac ESH / SES" name="bacEsh" type="number" />
                <InputField label="Bac HGG / Histoire-géo" name="bacHgg" type="number" />
                <InputField label="Bac Francais / philo / CG" name="bacCg" type="number" />
                <InputField label="Bac Anglais" name="bacAng" type="number" />
              </div>
            </div>
          </div>
        </SectionCard>

        <div className="flex justify-end">
          <button
            type="submit"
            className="rounded-full bg-clay px-6 py-3 text-sm font-semibold text-white transition hover:bg-clay/90"
          >
            Enregistrer la configuration
          </button>
        </div>
      </form>
    </div>
  );
}

type InputFieldProps = {
  label: string;
  name: string;
  defaultValue?: string;
  type?: string;
};

function InputField({ label, name, defaultValue, type = "text" }: InputFieldProps) {
  return (
    <label>
      <span className="mb-2 block text-sm font-medium text-pine/80">{label}</span>
      <input
        type={type}
        name={name}
        defaultValue={defaultValue}
        className="w-full rounded-2xl border border-ink/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-pine"
      />
    </label>
  );
}

type SelectFieldProps = {
  label: string;
  name: string;
  children: ReactNode;
  defaultValue?: string;
  disabled?: boolean;
};

function SelectField({ label, name, children, defaultValue, disabled = false }: SelectFieldProps) {
  return (
    <label>
      <span className="mb-2 block text-sm font-medium text-pine/80">{label}</span>
      <select
        name={name}
        defaultValue={defaultValue}
        disabled={disabled}
        className="w-full rounded-2xl border border-ink/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-pine"
      >
        {children}
      </select>
    </label>
  );
}
