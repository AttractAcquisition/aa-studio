type ConsolePageProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export function ConsolePage({ eyebrow, title, description }: ConsolePageProps) {
  return (
    <div className="mx-auto max-w-3xl space-y-4 py-10">
      <div className="aa-card space-y-4">
        <div className="aa-pill-outline w-fit">{eyebrow}</div>
        <h1 className="aa-headline-lg text-foreground">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
