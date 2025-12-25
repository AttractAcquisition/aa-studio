// One-Pager Header Block
import type { OnePagerMeta } from "@/types/one-pager-layout";
import { Clock, Users, Tag } from "lucide-react";

interface OPHeaderBlockProps {
  meta: OnePagerMeta;
  brand?: string;
}

export function OPHeaderBlock({ meta, brand = "AA Studio" }: OPHeaderBlockProps) {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 p-6">
      {/* Top row with badge and brand */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {meta.tag && (
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-semibold uppercase tracking-wider">
              <Tag className="w-3 h-3 mr-1.5" />
              {meta.tag}
            </span>
          )}
        </div>
        <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-primary text-sm">
          AA
        </div>
      </div>

      {/* Title */}
      <h1 className="text-2xl md:text-3xl font-bold text-foreground leading-tight mb-4">
        {meta.title}
      </h1>

      {/* Meta row */}
      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
        {meta.audience && (
          <div className="flex items-center gap-1.5">
            <Users className="w-4 h-4 text-primary" />
            <span>{meta.audience}</span>
          </div>
        )}
        {meta.readTime && (
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-primary" />
            <span>{meta.readTime}</span>
          </div>
        )}
        <div className="ml-auto text-xs text-muted-foreground/60">
          {brand}
        </div>
      </div>
    </div>
  );
}
