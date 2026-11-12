import type { ReactNode } from "react";
import { AcademicProfileFields } from "@/components/onboarding/academic-profile-fields";
import { AdaptiveOnboardingFields } from "@/components/onboarding/adaptive-onboarding-fields";
import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";
import { getOnboardingOptions } from "@/lib/student-app";
import { submitOnboarding } from "./actions";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const options = await getOnboardingOptions();
  const preferences = options.preferences;
  return <div>
    <PageHeader title="Mon profil" />
    <form action={submitOnboarding} className="space-y-5">
      <SectionCard eyebrow="Compte" title="Mes informations">
        <div className="grid gap-4 lg:grid-cols-2">
          <InputField label="Prénom" name="firstName" defaultValue={options.user.firstName} required />
          <InputField label="Nom" name="lastName" defaultValue={options.user.lastName} required />
          <SelectField label="Classe" name="classId" defaultValue={options.classes[0]?.id}>
            {options.classes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </SelectField>
          <SelectField label="Année de prépa" name="prepYear" defaultValue={String(preferences.prepYear)}>
            <option value="1">Première année</option><option value="2">Deuxième année</option>
          </SelectField>
        </div>
      </SectionCard>
      <AcademicProfileFields academicPath={preferences.academicPath} lv2Language={preferences.lv2Language} assessments={preferences.assessments}>
        <SectionCard eyebrow="Objectifs" title="Mes écoles cibles" accent="soft">
          <AdaptiveOnboardingFields bceSchools={options.bceSchools} ecricomeSchools={options.ecricomeSchools} initialTargets={preferences.targets}
            initialWeekdayHours={preferences.weekdayDailyHours} initialWeekendHours={preferences.weekendDailyHours} />
        </SectionCard>
        <SectionCard eyebrow="Créneaux" title="Mes horaires de travail">
          <div className="grid gap-4 lg:grid-cols-2">
            <InputField label="Début en semaine" name="weekdayStart" type="time" defaultValue={preferences.weekdayStart ?? "18:00"} />
            <InputField label="Fin en semaine" name="weekdayEnd" type="time" defaultValue={preferences.weekdayEnd ?? "21:30"} />
            <InputField label="Début le week-end" name="weekendStart" type="time" defaultValue={preferences.weekendStart ?? "09:30"} />
            <InputField label="Fin le week-end" name="weekendEnd" type="time" defaultValue={preferences.weekendEnd ?? "14:30"} />
          </div>
        </SectionCard>
        <SectionCard eyebrow="Rythme" title="Mes séances et mes pauses">
          <div className="grid gap-4 lg:grid-cols-2">
            <InputField label="Durée d’une séance (min)" name="sessionBlockMinutes" type="number" defaultValue={String(preferences.sessionBlockMinutes ?? 50)} />
            <InputField label="Pause entre deux séances (min)" name="shortBreakMinutes" type="number" defaultValue={String(preferences.shortBreakMinutes ?? 10)} />
            <InputField label="Pause longue (min)" name="longBreakMinutes" type="number" defaultValue={String(preferences.longBreakMinutes ?? 25)} />
            <InputField label="Nombre de séances avant une pause longue" name="breakEveryBlocks" type="number" defaultValue={String(preferences.breakEveryBlocks ?? 2)} />
            <SelectField label="Rythme souhaité" name="energyLevel" defaultValue={preferences.energyLevel ?? "modere"}>
              <option value="leger">Léger</option><option value="modere">Modéré</option><option value="intense">Intense</option>
            </SelectField>
          </div>
        </SectionCard>
      </AcademicProfileFields>
      <div className="flex justify-end"><button type="submit" className="rounded-full bg-clay px-6 py-3 text-sm font-semibold text-white transition hover:bg-clay/90">Enregistrer mon profil</button></div>
    </form>
  </div>;
}

function InputField({ label, name, defaultValue, type = "text", required = false }: { label: string; name: string; defaultValue?: string; type?: string; required?: boolean }) {
  return <label><span className="mb-2 block text-sm font-medium text-pine/80">{label}</span><input type={type} name={name} defaultValue={defaultValue} required={required} className="w-full rounded-2xl border border-ink/10 bg-sand px-4 py-3 text-sm outline-none focus:border-pine" /></label>;
}

function SelectField({ label, name, defaultValue, children }: { label: string; name: string; defaultValue?: string; children: ReactNode }) {
  return <label><span className="mb-2 block text-sm font-medium text-pine/80">{label}</span><select name={name} defaultValue={defaultValue} className="w-full rounded-2xl border border-ink/10 bg-sand px-4 py-3 text-sm outline-none focus:border-pine">{children}</select></label>;
}
