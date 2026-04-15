import { AppLayout } from "@/components/layout/AppLayout";

export default function AAConsole() {
  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl space-y-4 py-10">
        <div className="aa-card space-y-4">
          <div className="aa-pill-outline w-fit">AA Console</div>
          <h1 className="aa-headline-lg text-foreground">AA Console</h1>
          <p className="text-muted-foreground">
            Internal studio shell for planning, production, and review. The full feature set will be built back in
            step by step.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
