import { AppLayout } from "@/components/layout/AppLayout";
import { KPICard } from "@/components/dashboard/KPICard";
import { RecentOutputCard } from "@/components/dashboard/RecentOutputCard";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  Calendar, 
  CheckCircle, 
  MessageSquare, 
  ClipboardCheck,
  Sparkles,
  ArrowRight,
  TrendingUp
} from "lucide-react";
import { Link } from "react-router-dom";

const kpis = [
  { title: "Posts Created", value: 12, subtitle: "This week", icon: FileText, trend: "up" as const, trendValue: "+3 from last week" },
  { title: "Scheduled", value: 5, subtitle: "Upcoming", icon: Calendar, trend: "neutral" as const, trendValue: "Next: Tomorrow" },
  { title: "Published", value: 47, subtitle: "All time", icon: CheckCircle, trend: "up" as const, trendValue: "+8 this month" },
  { title: "DM Keywords", value: 23, subtitle: "Active triggers", icon: MessageSquare, trend: "up" as const, trendValue: "15 responses today" },
  { title: "Audits Requested", value: 8, subtitle: "Pending review", icon: ClipboardCheck, trend: "neutral" as const, trendValue: "3 new this week" },
];

const recentOutputs = [
  { type: "script" as const, title: "Your Content Is Noise", series: "Fix My Funnel", date: "2h ago", status: "ready" as const },
  { type: "design" as const, title: "Attraction Audit Cover", series: "Attraction Audit", date: "5h ago", status: "published" as const },
  { type: "onepager" as const, title: "Unavoidable Brand Framework", series: "Unavoidable Brand Model", date: "1d ago", status: "draft" as const },
  { type: "script" as const, title: "Stop Chasing, Start Attracting", series: "Noise → Bookings", date: "2d ago", status: "published" as const },
  { type: "design" as const, title: "Proof Card - Dental Clinic", series: "Attraction Audit", date: "3d ago", status: "published" as const },
];

export default function Dashboard() {
  return (
    <AppLayout>
      <div className="animate-fade-in">
        {/* Header */}
        <div className="flex items-start justify-between mb-10">
          <div>
            <div className="aa-pill-primary mb-4">Dashboard</div>
            <h1 className="aa-headline-lg text-foreground">
              Welcome to <span className="aa-gradient-text">AA Studio</span>
            </h1>
            <p className="aa-body mt-2 max-w-lg">
              Your brand-page operating system. Create, manage, and publish on-brand content from one place.
            </p>
          </div>
          <Link to="/content-factory">
            <Button variant="gradient" size="lg" className="gap-2">
              <Sparkles className="w-5 h-5" />
              Create Content
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-10">
          {kpis.map((kpi, index) => (
            <div key={kpi.title} className="animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
              <KPICard {...kpi} />
            </div>
          ))}
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Outputs */}
          <div className="lg:col-span-2">
            <div className="aa-card">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="aa-headline-md text-foreground">Recent Outputs</h2>
                  <p className="text-sm text-muted-foreground mt-1">Your latest scripts, one-pagers, and designs</p>
                </div>
                <Button variant="outline" size="sm">View All</Button>
              </div>
              <div className="space-y-3">
                {recentOutputs.map((output, index) => (
                  <div key={index} className="animate-slide-in-left" style={{ animationDelay: `${index * 50}ms` }}>
                    <RecentOutputCard {...output} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
            {/* Brand Health */}
            <div className="aa-card">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground">Brand Score</h3>
                  <p className="text-xs text-muted-foreground">Consistency check</p>
                </div>
              </div>
              <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                <div className="absolute inset-y-0 left-0 w-[92%] bg-gradient-to-r from-primary to-accent rounded-full" />
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm text-muted-foreground">92% On-Brand</span>
                <span className="text-xs text-primary">+5% this week</span>
              </div>
            </div>

            {/* Quick Links */}
            <div className="aa-card">
              <h3 className="font-bold text-foreground mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <Link to="/templates" className="block">
                  <Button variant="secondary" className="w-full justify-start">
                    <FileText className="w-4 h-4 mr-2" />
                    Browse Templates
                  </Button>
                </Link>
                <Link to="/proofs" className="block">
                  <Button variant="secondary" className="w-full justify-start">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Add Proof
                  </Button>
                </Link>
                <Link to="/calendar" className="block">
                  <Button variant="secondary" className="w-full justify-start">
                    <Calendar className="w-4 h-4 mr-2" />
                    View Calendar
                  </Button>
                </Link>
              </div>
            </div>

            {/* Series Tags */}
            <div className="aa-card">
              <h3 className="font-bold text-foreground mb-4">Active Series</h3>
              <div className="flex flex-wrap gap-2">
                <span className="aa-pill-primary">Fix My Funnel</span>
                <span className="aa-pill-outline">Attraction Audit</span>
                <span className="aa-pill-outline">Unavoidable Brand</span>
                <span className="aa-pill-outline">Ad Creative</span>
                <span className="aa-pill-outline">Noise → Bookings</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
