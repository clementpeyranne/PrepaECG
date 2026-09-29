type AuthEventRow = {
  id: string;
  label: string;
  occurredAt: string;
  account: string;
  email: string | null;
  source: string;
  device: string;
  isAlert: boolean;
};

export function AuthEventTable({ events }: { events: AuthEventRow[] }) {
  if (events.length === 0) {
    return <p className="rounded-2xl bg-sand p-5 text-sm text-pine/75">Aucune activite enregistree pour le moment.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-[22px] border border-ink/8 bg-white/65">
      <table className="min-w-[820px] w-full text-left text-sm">
        <thead className="border-b border-ink/8 bg-sand/70 text-xs uppercase tracking-[0.16em] text-pine/60">
          <tr>
            <th className="px-4 py-3 font-semibold">Evenement</th>
            <th className="px-4 py-3 font-semibold">Compte</th>
            <th className="px-4 py-3 font-semibold">Appareil</th>
            <th className="px-4 py-3 font-semibold">Source anonymisee</th>
            <th className="px-4 py-3 font-semibold">Date</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ink/6">
          {events.map((event) => (
            <tr key={event.id} className={event.isAlert ? "bg-clay/5" : ""}>
              <td className="px-4 py-4">
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${event.isAlert ? "bg-clay/12 text-clay" : "bg-moss/10 text-pine"}`}>
                  {event.label}
                </span>
              </td>
              <td className="px-4 py-4">
                <p className="font-medium text-ink">{event.account}</p>
                {event.email ? <p className="mt-1 text-xs text-pine/60">{event.email}</p> : null}
              </td>
              <td className="px-4 py-4 text-pine/75">{event.device}</td>
              <td className="px-4 py-4 font-mono text-xs text-pine/70">{event.source}</td>
              <td className="px-4 py-4 text-pine/70">{event.occurredAt}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
