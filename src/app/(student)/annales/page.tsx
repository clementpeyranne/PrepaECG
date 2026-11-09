import type { Metadata } from "next";
import { MathAnnalsExplorer } from "@/components/annals/math-annals-explorer";
import { PageHeader } from "@/components/ui/page-header";
import catalog from "@/data/math-annals.json";
import type { MathAnnal } from "@/lib/math-annals";

export const metadata: Metadata = { title: "Annales de maths" };

export default function MathAnnalsPage() {
  return (
    <div className="min-w-0">
      <PageHeader title="Annales de maths" eyebrow={`Concours · 2000 – ${Math.max(...catalog.records.map((record) => record.year))}`} />
      <MathAnnalsExplorer records={catalog.records as MathAnnal[]} />
    </div>
  );
}
