import { PendingSubmitButton } from "@/components/forms/pending-submit-button";
import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";
import { getAdminUsersData } from "@/lib/admin";

import { setUserActiveAction } from "../actions";

export default async function AdminUsersPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = searchParams ? await searchParams : {};
  const query = typeof params.q === "string" ? params.q : "";
  const role = typeof params.role === "string" ? params.role : "";
  const status = typeof params.status === "string" ? params.status : "";
  const data = await getAdminUsersData({ query, role, status });

  return (
    <div>
      <PageHeader eyebrow="Administration" title="Utilisateurs" />
      <SectionCard title={`${data.total} compte${data.total > 1 ? "s" : ""}`}>
        <form className="grid gap-3 md:grid-cols-[1fr_180px_180px_auto]">
          <input name="q" defaultValue={query} placeholder="Nom ou email" className="rounded-2xl border border-ink/10 bg-sand px-4 py-3 text-sm" />
          <select name="role" defaultValue={role} className="rounded-2xl border border-ink/10 bg-sand px-4 py-3 text-sm">
            <option value="">Tous les roles</option>
            <option value="STUDENT">Eleves</option>
            <option value="TEACHER">Professeurs</option>
            <option value="ADMIN">Administrateurs</option>
          </select>
          <select name="status" defaultValue={status} className="rounded-2xl border border-ink/10 bg-sand px-4 py-3 text-sm">
            <option value="">Tous les statuts</option>
            <option value="active">Actifs</option>
            <option value="suspended">Suspendus</option>
          </select>
          <button className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-sand">Filtrer</button>
        </form>

        <div className="mt-5 overflow-x-auto rounded-[22px] border border-ink/8">
          <table className="min-w-[1160px] w-full text-left text-sm">
            <thead className="border-b border-ink/8 bg-sand/70 text-xs uppercase tracking-[0.14em] text-pine/60">
              <tr>
                <th className="px-4 py-3">Compte</th><th className="px-4 py-3">Role</th><th className="px-4 py-3">Etablissement</th>
                <th className="px-4 py-3">Derniere connexion</th><th className="px-4 py-3">CGU</th><th className="px-4 py-3">Connexions</th><th className="px-4 py-3">Contenus</th><th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/6 bg-white/60">
              {data.users.map((user) => (
                <tr key={user.id} className={!user.isActive ? "bg-clay/5" : ""}>
                  <td className="px-4 py-4"><p className="font-semibold text-ink">{user.name}</p><p className="mt-1 text-xs text-pine/60">{user.email}</p></td>
                  <td className="px-4 py-4">{user.roleLabel}</td>
                  <td className="px-4 py-4">{user.establishment}</td>
                  <td className="px-4 py-4">{user.lastLoginAt}</td>
                  <td className="px-4 py-4 text-xs text-pine/65">{user.legalStatus}</td>
                  <td className="px-4 py-4">{user.loginCount}</td>
                  <td className="px-4 py-4">{user.contentCount}</td>
                  <td className="px-4 py-4">
                    {user.role === "ADMIN" ? <span className="text-xs text-pine/55">Protege</span> : (
                      <form action={setUserActiveAction}>
                        <input type="hidden" name="userId" value={user.id} />
                        <input type="hidden" name="isActive" value={String(!user.isActive)} />
                        <PendingSubmitButton
                          label={user.isActive ? "Suspendre" : "Reactiver"}
                          pendingLabel="Patiente..."
                          className={`rounded-full px-4 py-2 text-xs font-semibold ${user.isActive ? "bg-clay/10 text-clay" : "bg-moss/15 text-pine"}`}
                        />
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}
