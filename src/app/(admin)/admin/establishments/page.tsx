import { AdminInvitationForm } from "@/components/admin/invitation-form";
import { PendingSubmitButton } from "@/components/forms/pending-submit-button";
import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";
import { getAdminEstablishmentsData } from "@/lib/admin";

import {
  createEstablishmentAction,
  revokeTeacherInvitationAction,
  rotateAccessCodeAction
} from "../actions";

export default async function AdminEstablishmentsPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const data = await getAdminEstablishmentsData();
  const params = searchParams ? await searchParams : {};
  const message = typeof params.message === "string" ? params.message : "";
  const success = params.status === "success";

  return (
    <div>
      <PageHeader eyebrow="Administration" title="Etablissements" />

      <div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
        <SectionCard title="Ajouter une prepa">
          {message ? <p className={`mb-4 rounded-2xl p-4 text-sm ${success ? "bg-moss/10 text-pine" : "bg-clay/10 text-clay"}`}>{message}</p> : null}
          <form action={createEstablishmentAction} className="space-y-4">
            <AdminField label="Nom" name="name" placeholder="Nom de la prepa" />
            <div className="grid gap-4 sm:grid-cols-2">
              <AdminField label="Annee scolaire" name="yearLabel" placeholder="2026-2027" />
              <AdminField label="Filiere" name="track" defaultValue="ECG" />
            </div>
            <AdminField label="Premier code d'acces" name="accessCode" placeholder="PREPA-2026" />
            <PendingSubmitButton label="Creer l'etablissement" pendingLabel="Creation..." className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-sand" />
          </form>
        </SectionCard>

        <SectionCard title="Environnements actifs">
          <div className="space-y-4">
            {data.classes.map((prepClass) => (
              <article key={prepClass.id} className="rounded-[22px] border border-ink/8 bg-white/70 p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h3 className="font-display text-2xl text-ink">{prepClass.name}</h3>
                    <p className="mt-1 text-sm text-pine/65">{prepClass.yearLabel} - {prepClass.track}</p>
                  </div>
                  <div className="rounded-2xl bg-sand px-4 py-3">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-pine/50">Code eleves</p>
                    <p className="mt-1 font-mono text-sm font-semibold text-ink">{prepClass.accessCode}</p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {[["Eleves", prepClass.students], ["Professeurs", prepClass.teachers], ["Ressources", prepClass.resources], ["Decks", prepClass.decks]].map(([label, value]) => (
                    <div key={label} className="rounded-xl bg-sand/70 p-3 text-center"><p className="font-display text-2xl">{value}</p><p className="text-xs text-pine/60">{label}</p></div>
                  ))}
                </div>
                <form action={rotateAccessCodeAction} className="mt-4">
                  <input type="hidden" name="classId" value={prepClass.id} />
                  <PendingSubmitButton label="Generer un nouveau code eleves" pendingLabel="Generation..." className="rounded-full border border-ink/10 px-4 py-2 text-xs font-semibold text-ink" />
                </form>
              </article>
            ))}
          </div>
        </SectionCard>
      </div>

      <div className="mt-5">
        <SectionCard title="Inviter un professeur">
          <AdminInvitationForm classes={data.classes.map((prepClass) => ({ id: prepClass.id, name: prepClass.name }))} />
          <div className="mt-6 overflow-x-auto rounded-[22px] border border-ink/8">
            <table className="min-w-[760px] w-full text-left text-sm">
              <thead className="bg-sand/70 text-xs uppercase tracking-[0.14em] text-pine/60"><tr><th className="px-4 py-3">Email</th><th className="px-4 py-3">Etablissement</th><th className="px-4 py-3">Expiration</th><th className="px-4 py-3">Statut</th><th className="px-4 py-3">Action</th></tr></thead>
              <tbody className="divide-y divide-ink/6 bg-white/60">
                {data.invitations.map((invitation) => (
                  <tr key={invitation.id}>
                    <td className="px-4 py-4">{invitation.email}</td><td className="px-4 py-4">{invitation.establishment}</td><td className="px-4 py-4">{invitation.expiresAt}</td><td className="px-4 py-4">{invitation.status}</td>
                    <td className="px-4 py-4">{invitation.canRevoke ? <form action={revokeTeacherInvitationAction}><input type="hidden" name="invitationId" value={invitation.id} /><PendingSubmitButton label="Revoquer" pendingLabel="..." className="rounded-full bg-clay/10 px-4 py-2 text-xs font-semibold text-clay" /></form> : <span className="text-xs text-pine/50">Fermee</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

function AdminField({ label, name, placeholder, defaultValue }: { label: string; name: string; placeholder?: string; defaultValue?: string }) {
  return <label className="block"><span className="mb-2 block text-sm font-medium text-pine">{label}</span><input name={name} required placeholder={placeholder} defaultValue={defaultValue} className="w-full rounded-2xl border border-ink/10 bg-sand px-4 py-3 text-sm outline-none focus:border-pine" /></label>;
}
