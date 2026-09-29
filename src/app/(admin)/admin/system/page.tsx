import { PendingSubmitButton } from "@/components/forms/pending-submit-button";
import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";
import { getAdminSystemData } from "@/lib/admin";

import { purgeSecurityDataAction } from "../actions";

export default async function AdminSystemPage() {
  const data = await getAdminSystemData();
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
    </div>
  );
}
