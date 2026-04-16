type Stat = {
  label: string;
  value: string;
  note?: string;
};

export function StatRow({ stats }: { stats: Stat[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.label} className="aa-card-elevated flex flex-col gap-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{stat.label}</p>
          <div className="flex items-end justify-between gap-3">
            <div className="aa-headline-md text-foreground">{stat.value}</div>
            <div className="h-8 w-8 rounded-xl border border-primary/15 bg-primary/10" />
          </div>
          {stat.note ? <p className="text-sm leading-6 text-muted-foreground">{stat.note}</p> : null}
        </div>
      ))}
    </div>
  );
}
