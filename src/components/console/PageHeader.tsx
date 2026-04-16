type PageHeaderProps = {
  eyebrow: string;
  title: string;
  accent?: string;
  subtitle: string;
  meta?: string;
};

export function PageHeader({ eyebrow, title, accent, subtitle, meta }: PageHeaderProps) {
  return (
    <header className="mb-10">
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="aa-pill-primary">{eyebrow}</div>
        {meta ? <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{meta}</span> : null}
      </div>
      <h1 className="aa-headline-lg text-foreground">
        {title} {accent ? <span className="aa-gradient-text">{accent}</span> : null}
      </h1>
      <p className="aa-body mt-2 max-w-2xl">{subtitle}</p>
      <div className="aa-underline-bar" />
    </header>
  );
}
