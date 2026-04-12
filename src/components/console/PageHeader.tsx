type PageHeaderProps = {
  eyebrow: string;
  title: string;
  accent?: string;
  subtitle: string;
  meta?: string;
};

export function PageHeader({ eyebrow, title, accent, subtitle, meta }: PageHeaderProps) {
  return (
    <div className="mb-10">
      <div className="aa-pill-primary mb-4">{eyebrow}</div>
      <h1 className="aa-headline-lg text-foreground">
        {title} {accent ? <span className="aa-gradient-text">{accent}</span> : null}
      </h1>
      <p className="aa-body mt-2 max-w-2xl">{subtitle}</p>
      {meta ? <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mt-3">{meta}</p> : null}
    </div>
  );
}
