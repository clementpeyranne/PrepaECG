import { PendingSubmitButton } from "@/components/forms/pending-submit-button";
import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";
import { getAdminSystemData } from "@/lib/admin";

import { purgeSecurityDataAction } from "../actions";

export default async function AdminSystemPage() {
  const data = await getAdminSystemData();
  const money = (value: number) => `${value.toFixed(value < 1 ? 3 : 2)} $`;
  return (
    <div>
      <PageHeader eyebrow="Administration" title="Systeme" />
      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <SectionCard title="Etat des services">
          <div className="space-y-3">
            {data.runtime.checks.map((check) => (
              <div key={check.label} className="flex flex-col gap-2 rounded-2xl border border-ink/8 bg-white/70 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div><p className="font-semibold capitalize text-ink">{check.label.replaceAll("_", " ")}</p><p className="mt-1 text-sm text-pine/70">{check.detail}</p></div>
                <span className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${check.state === "pass" ? "bg-moss/15 text-pine" : check.state === "warn" ? "bg-amber-100 text-amber-700" : "bg-clay/15 text-clay"}`}>{check.state === "pass" ? "Operationnel" : check.state === "warn" ? "A completer" : "Incident"}</span>
              </div>
            ))}
          </div>
        </SectionCard>
        <SectionCard title="Maintenance" accent="dark">
          <div className="space-y-3 text-sm text-sand/80">
            <p>{data.users} compte(s)</p><p>{data.classes} etablissement(s)</p><p>{data.authEvents} evenement(s) de securite</p><p>{data.rateLimits} compteur(s) anti-abus</p>
          </div>
          <form action={purgeSecurityDataAction} className="mt-6">
            <PendingSubmitButton label="Nettoyer les journaux anciens" pendingLabel="Nettoyage..." className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-ink" />
          </form>
          <p className="mt-3 text-xs leading-6 text-sand/60">Conserve 90 jours de journal de securite et supprime les compteurs, jetons et invitations expires.</p>
        </SectionCard>
      </div>
      <div className="mt-5 grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <SectionCard title="Consommation IA du mois">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl bg-sand p-4"><p className="text-xs uppercase tracking-[0.2em] text-pine/55">Depense</p><p className="mt-2 text-2xl font-semibold text-ink">{money(data.ai.spentUsd)}</p><p className="mt-1 text-sm text-pine/65">sur {money(data.ai.budgetUsd)}</p></div>
            <div className="rounded-2xl bg-sand p-4"><p className="text-xs uppercase tracking-[0.2em] text-pine/55">Appels payants</p><p className="mt-2 text-2xl font-semibold text-ink">{data.ai.paidCalls}</p><p className="mt-1 text-sm text-pine/65">{data.ai.todayPaidCalls} aujourd'hui</p></div>
            <div className="rounded-2xl bg-sand p-4"><p className="text-xs uppercase tracking-[0.2em] text-pine/55">Cache</p><p className="mt-2 text-2xl font-semibold text-ink">{data.ai.cacheHits}</p><p className="mt-1 text-sm text-pine/65">appel(s) economise(s)</p></div>
            <div className="rounded-2xl bg-sand p-4"><p className="text-xs uppercase tracking-[0.2em] text-pine/55">Protection</p><p className="mt-2 text-2xl font-semibold text-ink">{data.ai.blocked}</p><p className="mt-1 text-sm text-pine/65">bloque(s) - {data.ai.failed} echec(s)</p></div>
          </div>
          <div className="mt-5 h-3 overflow-hidden rounded-full bg-ink/8"><div className="h-full rounded-full bg-clay transition-all" style={{ width: `${data.ai.budgetPercent}%` }} /></div>
          <div className="mt-5 space-y-2">
            {data.ai.features.length === 0 ? <p className="text-sm text-pine/65">Aucun appel OpenAI facture ce mois-ci.</p> : data.ai.features.map((feature) => (
              <div key={feature.label} className="flex items-center justify-between rounded-2xl border border-ink/8 bg-white/70 px-4 py-3 text-sm"><span className="font-semibold text-ink">{feature.label}</span><span className="text-pine/65">{feature.calls} appel(s) - {money(feature.cost)}</span></div>
            ))}
          </div>
        </SectionCard>
        <SectionCard title="Regles de consommation" accent="dark">
          <div className="space-y-4 text-sm text-sand/80">
            <div><p className="font-semibold text-white">Modele courant</p><p className="mt-1">{data.ai.fastModel}</p></div>
            <div><p className="font-semibold text-white">Corrections de copies</p><p className="mt-1">{data.ai.qualityModel}</p></div>
            <div><p className="font-semibold text-white">Limite par eleve</p><p className="mt-1">{money(data.ai.userBudgetUsd)} par mois et {data.ai.dailyLimit} appels payants par jour</p></div>
            <div><p className="font-semibold text-white">Jetons ce mois</p><p className="mt-1">{data.ai.inputTokens.toLocaleString("fr-FR")} en entree - {data.ai.outputTokens.toLocaleString("fr-FR")} en sortie</p></div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
