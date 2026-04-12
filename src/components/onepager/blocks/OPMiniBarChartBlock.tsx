// One-Pager Mini Bar Chart Block
import type { MiniBarChartBlock } from "@/types/one-pager-layout";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from "recharts";

interface OPMiniBarChartBlockProps {
  block: MiniBarChartBlock;
}

export function OPMiniBarChartBlock({ block }: OPMiniBarChartBlockProps) {
  return (
    <div className="rounded-xl bg-card border border-border/40 p-5">
      {block.title && (
        <h4 className="font-semibold text-foreground mb-4">{block.title}</h4>
      )}
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={block.data} layout="vertical" margin={{ left: 0, right: 10 }}>
            <XAxis type="number" domain={[0, 100]} hide />
            <YAxis 
              type="category" 
              dataKey="name" 
              width={80}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <Bar 
              dataKey="value" 
              radius={[0, 4, 4, 0]}
              barSize={20}
            >
              {block.data.map((entry, index) => {
                const value = entry.value;
                let fill = 'hsl(var(--primary))';
                if (value < 40) fill = 'hsl(0, 84%, 60%)';
                else if (value < 70) fill = 'hsl(45, 93%, 47%)';
                else fill = 'hsl(142, 71%, 45%)';
                return <Cell key={`cell-${index}`} fill={fill} />;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
