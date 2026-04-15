import { Link } from "react-router-dom";
import { ConsolePage } from "@/components/console/ConsolePage";
import { studioPageNav } from "@/lib/route-config";
import { useStudio } from "@/context/StudioContext";

export default function AAConsole() {
  const { activeCycle } = useStudio();

  return (
    <div className="space-y-8">
      <ConsolePage
        eyebrow="AA Console"
        title="AA Console"
        description="Attract Acquisition's own production workspace. Build the house brand here, then reuse the same system for clients."
      />

      <section className="aa-card space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Quick access</h2>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {studioPageNav.map((item) => (
            <Link key={item.path} to={`/aa-console/${item.path}`} className="rounded-xl border border-border bg-background p-4 transition-colors hover:bg-secondary">
              <div className="font-medium text-foreground">{item.title}</div>
              <div className="text-sm text-muted-foreground">{item.description}</div>
            </Link>
          ))}
        </div>
      </section>

      <section className="aa-card space-y-2">
        <div className="text-sm font-medium text-foreground">Current cycle</div>
        <div className="text-sm text-muted-foreground">{activeCycle ? `Cycle ${activeCycle.cycle_number} · ${activeCycle.start_date} → ${activeCycle.end_date}` : 'No active AA cycle found yet.'}</div>
      </section>
    </div>
  );
}
