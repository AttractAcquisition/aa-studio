import { ReactNode } from "react";

export function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="aa-card">
      <div className="mb-4 border-b border-border/60 pb-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Section</p>
        <h3 className="aa-headline-md mt-1 text-foreground">{title}</h3>
        {description ? <p className="aa-body mt-2 text-sm">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}
