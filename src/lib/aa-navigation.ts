import type { LucideIcon } from "lucide-react";
import {
  BadgeCheck,
  BarChart3,
  BookOpen,
  CalendarDays,
  ClipboardList,
  Copy,
  Download,
  Film,
  FolderOpen,
  Home,
  Image,
  LayoutDashboard,
  Layers3,
  Mic,
  PenTool,
  Search,
  ScrollText,
  Sparkles,
  Trophy,
  Users,
  Video,
  FileText,
  MonitorPlay,
} from "lucide-react";

export type SidebarNavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
};

export type SidebarSection = {
  title: string;
  items: SidebarNavItem[];
};

export const sidebarSections: SidebarSection[] = [
  {
    title: "Overview",
    items: [
      { title: "Home", href: "/", icon: Home },
      { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { title: "AA Console", href: "/aa-console", icon: Sparkles },
      { title: "Client Console", href: "/client-console", icon: Users },
    ],
  },
  {
    title: "Studio Core",
    items: [
      { title: "Briefs", href: "/briefs", icon: ScrollText },
      { title: "Strategy", href: "/strategy", icon: Layers3 },
      { title: "Production", href: "/production", icon: PenTool },
      { title: "Repurpose", href: "/repurpose", icon: Copy },
      { title: "Review", href: "/review", icon: BadgeCheck },
      { title: "Library", href: "/library", icon: BookOpen },
      { title: "Script Library", href: "/script-library", icon: FileText },
      { title: "Performance", href: "/performance", icon: BarChart3 },
    ],
  },
  {
    title: "Content Ops",
    items: [
      { title: "Content Factory", href: "/content-factory", icon: Sparkles },
      { title: "Brand Kit", href: "/brand-kit", icon: Image },
      { title: "Content Calendar", href: "/calendar", icon: CalendarDays },
      { title: "Asset Vault", href: "/asset-vault", icon: FolderOpen },
      { title: "Proof Vault", href: "/proof-vault", icon: Trophy },
      { title: "Videos", href: "/videos", icon: Video },
      { title: "Recording Studio", href: "/recording-studio", icon: Mic },
      { title: "Video Generator", href: "/video-generator", icon: Film },
      { title: "Exports", href: "/exports", icon: Download },
      { title: "One-Pagers", href: "/one-pagers", icon: FileText },
      { title: "Templates", href: "/templates", icon: FileText },
      { title: "Enquiries", href: "/enquiries", icon: Search },
      { title: "Bundle Detail", href: "/bundles/demo", icon: MonitorPlay },
    ],
  },
  {
    title: "Client Work",
    items: [
      { title: "Requests", href: "/client/requests", icon: ClipboardList },
      { title: "Approvals", href: "/client/approvals", icon: BadgeCheck },
      { title: "Calendar", href: "/client/calendar", icon: CalendarDays },
      { title: "Library", href: "/client/library", icon: FolderOpen },
      { title: "Performance", href: "/client/performance", icon: BarChart3 },
    ],
  },
];
