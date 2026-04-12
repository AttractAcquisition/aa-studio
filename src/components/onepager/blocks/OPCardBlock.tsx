// One-Pager Card Block
import type { CardBlock } from "@/types/one-pager-layout";

interface OPCardBlockProps {
  block: CardBlock;
}

export function OPCardBlock({ block }: OPCardBlockProps) {
  return (
    <div className="rounded-xl bg-card border border-border/40 p-5">
      <h4 className="font-semibold text-foreground mb-3">{block.title}</h4>
      {block.bullets.length > 0 && (
        <ul className="space-y-2">
          {block.bullets.map((bullet, idx) => (
            <li key={idx} className="flex items-start gap-3 text-sm text-muted-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
