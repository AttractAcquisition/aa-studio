import type { LucideIcon } from "lucide-react";
import {
  Sparkles,
  MessageSquareText,
  CalendarDays,
  BadgeCheck,
  Library,
  ChartColumn,
  Repeat,
  ShieldCheck,
  Users,
  ClipboardList,
  FolderOpen,
  TrendingUp,
  Send,
  Clock3,
  FileText,
  Video,
} from "lucide-react";

export type NavCard = {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
};

export const mainConsoleCards: NavCard[] = [
  {
    title: "AA Console",
    description: "Internal content production, strategy, review, and performance for Attract Acquisition.",
    href: "/aa-console",
    icon: Sparkles,
    badge: "Studio",
  },
  {
    title: "Client Console",
    description: "Client-facing production requests, approvals, shared assets, and content delivery.",
    href: "/client-console",
    icon: Users,
    badge: "Client",
  },
];

export const aaConsoleCards: NavCard[] = [
  { title: "Brief Builder", description: "Turn raw inputs into production-ready briefs and hooks.", href: "/briefs", icon: MessageSquareText },
  { title: "Content Strategy", description: "Pillars, campaign themes, batch planning, and content priorities.", href: "/strategy", icon: CalendarDays },
  { title: "Content Production", description: "Scripts, captions, one-pagers, and asset generation.", href: "/production", icon: Sparkles },
  { title: "Repurpose Engine", description: "Turn one source into multiple outputs across channels.", href: "/repurpose", icon: Repeat },
  { title: "Review Queue", description: "Approve, revise, and QA content before it ships.", href: "/review", icon: ShieldCheck },
  { title: "Content Library", description: "Search briefs, assets, templates, proof, and reusable playbooks.", href: "/library", icon: Library },
  { title: "Performance", description: "Measure winners, angles, leads, and booked calls.", href: "/performance", icon: ChartColumn },
];

export const clientConsoleCards: NavCard[] = [
  { title: "Requests", description: "Capture client content requests and production inputs.", href: "/client/requests", icon: ClipboardList },
  { title: "Approvals", description: "Review, edit, and approve content before publishing.", href: "/client/approvals", icon: BadgeCheck },
  { title: "Calendar", description: "Scheduled posts, publishing windows, and content queues.", href: "/client/calendar", icon: CalendarDays },
  { title: "Client Library", description: "Shared assets, source proof, and approved deliverables.", href: "/client/library", icon: FolderOpen },
  { title: "Performance", description: "Track output quality, response rates, and content wins.", href: "/client/performance", icon: TrendingUp },
];

export const briefInputs = [
  "Offer",
  "Audience",
  "Proof",
  "Angle",
  "Goal",
  "Platform",
  "CTA",
];

export const sampleBriefs = [
  {
    title: "Proof Sprint opener",
    offer: "Proof Sprint",
    audience: "Owner-operated service businesses",
    angle: "The proof-first risk reversal",
    status: "ready",
  },
  {
    title: "Authority Brand hook set",
    offer: "Authority Brand",
    audience: "Growth-stage founders",
    angle: "Category authority through evidence",
    status: "draft",
  },
  {
    title: "MJR lead magnet",
    offer: "Missed Jobs Report",
    audience: "Invisible local businesses",
    angle: "What revenue is leaking unseen",
    status: "review",
  },
];

export const strategyPillars = [
  "Proof",
  "Offer clarity",
  "Positioning",
  "Lead generation",
  "Authority building",
];

export const campaignThemes = [
  "Objection crushers",
  "Before / after proof",
  "Offer breakdowns",
  "Founder mindset",
  "Case study snippets",
];

export const productionSteps = [
  "Brief received",
  "Hook and angle generated",
  "Script drafted",
  "One-pager structured",
  "Design asset produced",
  "Review and QA",
  "Export and handoff",
];

export const repurposeSources = [
  "Client result",
  "Call note",
  "Testimonial",
  "SOP",
  "Offer doc",
  "Voice note",
  "Long-form article",
];

export const repurposeOutputs = [
  "Reel script",
  "Carousel",
  "Caption",
  "Email",
  "Ad angle",
  "Quote post",
];

export const reviewItems = [
  {
    title: "Fix My Funnel reel",
    note: "CTA needs to be sharper",
    status: "revise",
  },
  {
    title: "Attraction Audit carousel",
    note: "Proof line is strong",
    status: "approve",
  },
  {
    title: "Authority Brand one-pager",
    note: "Check claim consistency",
    status: "review",
  },
];

export const librarySections = [
  {
    title: "Brand Kit",
    items: ["Color tokens", "Logo assets", "Typography", "Design rules"],
  },
  {
    title: "Templates",
    items: ["Reel cover", "Carousel", "One-pager", "Proof card"],
  },
  {
    title: "Scripts",
    items: ["Hooks", "Reels", "Talking-head", "CTA variants"],
  },
  {
    title: "Proof",
    items: ["Testimonials", "Results", "Screenshots", "Metrics"],
  },
  {
    title: "Assets",
    items: ["Images", "Video", "Audio", "Exports"],
  },
];

export const performanceMetrics = [
  { label: "Views", value: "124k", note: "30-day total" },
  { label: "Saves", value: "4.8k", note: "High intent" },
  { label: "Replies", value: "1.2k", note: "Conversation starts" },
  { label: "Booked calls", value: "86", note: "Attribution window" },
];

export const winnerAngles = [
  "Proof-first risk reversal",
  "Invisible revenue audit",
  "Before/after case study",
  "Objection handling breakdown",
];

export const clientRequests = [
  {
    title: "Request a reel batch",
    detail: "5 reels around proof and offer clarity.",
    due: "Today",
  },
  {
    title: "Upload source proof",
    detail: "Add screenshots or testimonial links for the next batch.",
    due: "Tomorrow",
  },
  {
    title: "Approve carousel draft",
    detail: "Review angle and CTA before export.",
    due: "Thu",
  },
];

export const clientApprovals = [
  {
    title: "Audience / proof carousel",
    detail: "Approved layout, needs a softer CTA.",
    state: "pending",
  },
  {
    title: "DM proof reel",
    detail: "Ready to publish.",
    state: "approved",
  },
  {
    title: "Authority one-pager",
    detail: "Needs minor wording changes.",
    state: "revising",
  },
];

export const clientSchedule = [
  {
    title: "Monday batch",
    detail: "2 reels + 1 proof carousel",
    time: "09:00",
  },
  {
    title: "Wednesday review",
    detail: "Approve revised captions",
    time: "13:00",
  },
  {
    title: "Friday export",
    detail: "Final assets and handoff",
    time: "16:30",
  },
];

export const clientLibraryItems = [
  "Approved captions",
  "Client proof assets",
  "Exported reels",
  "Style references",
  "Handoff packages",
];

export const clientPerformanceStats = [
  { label: "Content delivered", value: "18", note: "This month" },
  { label: "Approvals", value: "92%", note: "On first review" },
  { label: "Average response", value: "2.3h", note: "Client feedback" },
  { label: "Completed batches", value: "7", note: "Production cycles" },
];
