import { BrainCircuit, Layers3, NotebookPen, Image, Repeat, UserRoundPen, Megaphone, ClipboardCheck, CalendarDays, type LucideIcon } from "lucide-react";

export type ConsoleNavItem = {
  title: string;
  path: string;
  icon: LucideIcon;
  description: string;
};

export const studioPageNav: ConsoleNavItem[] = [
  { title: "Brand Intelligence", path: "brand-intelligence", icon: BrainCircuit, description: "Client context and positioning inputs." },
  { title: "Positioning Studio", path: "positioning-studio", icon: Layers3, description: "Attraction, nurture, and conversion documents." },
  { title: "Script Library", path: "script-library", icon: NotebookPen, description: "Copy hooks and script variants." },
  { title: "Proof Asset Manager", path: "proof-assets", icon: Image, description: "Photos, videos, and proof metadata." },
  { title: "Organic Content Studio", path: "organic-studio", icon: Repeat, description: "Organic content drafts and repurposing." },
  { title: "Profile Builder", path: "profile-builder", icon: UserRoundPen, description: "Profile infrastructure and bio setup." },
  { title: "Ad Creative Briefs", path: "ad-briefs", icon: Megaphone, description: "Briefs for AdCreative AI exports." },
  { title: "Approval Queue", path: "approval-queue", icon: ClipboardCheck, description: "QA and approvals before release." },
  { title: "Content Calendar", path: "content-calendar", icon: CalendarDays, description: "14-day cycle scheduling layer." },
];
