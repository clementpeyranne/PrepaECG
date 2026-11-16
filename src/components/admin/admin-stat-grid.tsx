import { StatTile } from "@/components/ui/stat-tile";

export function AdminStatGrid({ stats }: { stats: Array<{ label: string; value: number | string; helper: string }> }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {stats.map((stat) => (
        <StatTile key={stat.label} tone="white" size="lg" label={stat.label} value={stat.value} helper={stat.helper} />
      ))}
    </div>
  );
}
