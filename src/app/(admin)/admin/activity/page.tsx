import { AdminStatGrid } from "@/components/admin/admin-stat-grid";
import { AuthEventTable } from "@/components/admin/auth-event-table";
import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";
import { getAdminActivityData } from "@/lib/admin";

export default async function AdminActivityPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = searchParams ? await searchParams : {};
  const type = typeof params.type === "string" ? params.type : "";
  const data = await getAdminActivityData(type);
  return (
    <div>
      <PageHeader eyebrow="Administration" title="Connexions" />
      <AdminStatGrid stats={[
        { label: "Connexions réussies", value: data.successCount, helper: "Sur les dernières 24 h" },
        { label: "Alertes", value: data.failureCount, helper: "Échecs, limites ou comptes bloques" },
        { label: "Sources distinctes", value: data.uniqueSources, helper: "Empreintes anonymisees sur 24 h" }
      ]} />
      <div className="mt-5">
        <SectionCard title="Journal de sécurité">
          <form className="mb-5 flex flex-col gap-3 sm:flex-row">
            <select name="type" defaultValue={type} className="rounded-2xl border border-ink/10 bg-sand px-4 py-3 text-sm">
              <option value="">Tous les événements</option>
              <option value="LOGIN_SUCCESS">Connexions réussies</option>
              <option value="LOGIN_FAILURE">Échecs de connexion</option>
              <option value="LOGIN_BLOCKED">Comptes bloques</option>
              <option value="ACCOUNT_CREATED">Comptes créés</option>
              <option value="ACCOUNT_SUSPENDED">Comptes suspendus</option>
            </select>
            <button className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-sand">Filtrer</button>
          </form>
          <AuthEventTable events={data.events} />
        </SectionCard>
      </div>
    </div>
  );
}
