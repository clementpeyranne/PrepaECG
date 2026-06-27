export const dynamic = "force-dynamic";

import { ResourcesExplorer } from "@/components/resources/resources-explorer";
import { PageHeader } from "@/components/ui/page-header";
import { getResourcesOverviewData } from "@/lib/resources";

export default async function ResourcesPage() {
  const data = await getResourcesOverviewData();

  return (
    <div>
      <PageHeader title="Ressources" />
      <ResourcesExplorer resources={data.resources} />
    </div>
  );
}
