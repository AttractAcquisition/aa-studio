import type { NavCard } from "@/lib/studio-data";
import { ConsoleCard } from "./ConsoleCard";

export function CardGrid({ cards }: { cards: NavCard[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
      {cards.map((card) => (
        <ConsoleCard key={card.href} {...card} />
      ))}
    </div>
  );
}
