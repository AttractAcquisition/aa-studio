import type { ReactNode } from "react";

export function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <div className="aa-card">
      <div className="mb-4">
        <h3 className="text-xl font-bold text-foreground">{title}</h3>
        {description ? <p className="text-sm text-muted-foreground mt-1">{description}</p> : null}
      </div>
      {children}
    </div>
  );
}
