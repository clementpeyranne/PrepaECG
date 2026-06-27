export const dynamic = "force-dynamic";

import { AssistantConsole } from "@/components/assistant/assistant-console";
import { PageHeader } from "@/components/ui/page-header";
import { getAssistantWorkspaceData } from "@/lib/assistant";

export default async function AssistantPage() {
  const data = await getAssistantWorkspaceData();

  return (
    <div>
      <PageHeader
        title="Assistant IA"
        description="Un vrai chat de travail centre sur les cours, les copies et la methode. Le planning reste gere dans son onglet dedie."
      />

      <div className="mt-5">
        <AssistantConsole
          initialSummary={data.responseSummary}
          resources={data.resources}
          essays={data.essays}
        />
      </div>
    </div>
  );
}
