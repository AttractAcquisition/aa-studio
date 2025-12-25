// One-Pager Table Block
import type { TableBlock } from "@/types/one-pager-layout";

interface OPTableBlockProps {
  block: TableBlock;
}

export function OPTableBlock({ block }: OPTableBlockProps) {
  return (
    <div className="rounded-xl bg-card border border-border/40 overflow-hidden">
      {block.title && (
        <div className="px-5 py-3 border-b border-border/40">
          <h4 className="font-semibold text-foreground text-sm">{block.title}</h4>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-secondary/50">
              {block.columns.map((col, idx) => (
                <th
                  key={idx}
                  className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {block.rows.map((row, rowIdx) => (
              <tr key={rowIdx} className="hover:bg-secondary/30 transition-colors">
                {row.map((cell, cellIdx) => (
                  <td
                    key={cellIdx}
                    className="px-4 py-3 text-sm text-muted-foreground"
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
