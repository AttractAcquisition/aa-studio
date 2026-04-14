import { AppLayout } from "@/components/layout/AppLayout";

export default function Home() {
  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl space-y-6 py-10">
        <div className="aa-card space-y-4">
          <div className="aa-pill-outline w-fit">AA Studio</div>
          <h1 className="aa-headline-lg text-foreground">Studio shell</h1>
          <p className="text-muted-foreground">
            The AA console pages were removed. The repo now keeps only the broader app shell and the remaining
            non-studio pages.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
