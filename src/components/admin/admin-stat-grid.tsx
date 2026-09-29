export function AdminStatGrid({ stats }: { stats: Array<{ label: string; value: number | string; helper: string }> }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {stats.map((stat) => (
        <div key={stat.label} className="rounded-[24px] border border-white/80 bg-white/75 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-pine/55">{stat.label}</p>
          <p className="mt-3 font-display text-4xl tracking-[-0.05em] text-ink">{stat.value}</p>
          <p className="mt-2 text-sm text-pine/70">{stat.helper}</p>
        </div>
      ))}
    </div>
  );
}
