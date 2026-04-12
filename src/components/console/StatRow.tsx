type Stat = {
  label: string;
  value: string;
  note?: string;
};

export function StatRow({ stats }: { stats: Stat[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <div key={stat.label} className="aa-card">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-2">{stat.label}</p>
          <div className="text-3xl font-black text-foreground">{stat.value}</div>
          {stat.note ? <p className="text-sm text-muted-foreground mt-1">{stat.note}</p> : null}
        </div>
      ))}
    </div>
  );
}
