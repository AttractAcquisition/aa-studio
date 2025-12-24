import { useState } from "react";
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
  TrendingUp,
  Loader2
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useContentItems } from "@/hooks/useContentItems";
import { AddProofModal } from "@/components/modals/AddProofModal";


export default function Dashboard() {
  const navigate = useNavigate();
  const { stats, isLoading } = useDashboardStats();
  const { contentItems, isLoading: isLoadingContent } = useContentItems();
  const [addProofOpen, setAddProofOpen] = useState(false);

  const kpis = [
    { 
      title: "Posts Created", 
      value: stats.postsThisWeek, 
      subtitle: "This week", 
      icon: FileText, 
      trend: "up" as const, 
      trendValue: "This week" 
    },
    { 
      title: "Scheduled", 
      value: stats.scheduledCount, 
      subtitle: "Upcoming", 
      icon: Calendar, 
      trend: "neutral" as const, 
      trendValue: "Pending" 
    },
    { 
      title: "Published", 
      value: stats.publishedCount, 
      subtitle: "All time", 
      icon: CheckCircle, 
      trend: "up" as const, 
      trendValue: "Total" 
    },
    { 
      title: "DM Keywords", 
      value: stats.dmKeywordsCount, 
      subtitle: "Active triggers", 
      icon: MessageSquare, 
      trend: "up" as const, 
      trendValue: `${stats.responsesToday} responses today` 
    },
    { 
      title: "Audits Requested", 
      value: stats.pendingAudits, 
      subtitle: "Pending review", 
      icon: ClipboardCheck, 
      trend: "neutral" as const, 
      trendValue: `${stats.newAuditsThisWeek} new this week` 
    },
  ];

  // Map content items to recent outputs format
  const recentOutputs = contentItems.slice(0, 5).map((item: any) => ({
    type: (item.content_type === "script" ? "script" : 
          item.content_type === "onepager" ? "onepager" : "design") as "script" | "onepager" | "design",
    title: item.title || item.hook || "Untitled",
    series: item.series || "General",
    date: new Date(item.created_at).toLocaleDateString(),
    status: item.status as "draft" | "ready" | "published",
  }));

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
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-10">
            {kpis.map((kpi, index) => (
              <div key={kpi.title} className="animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                <KPICard {...kpi} />
              </div>
            ))}
          </div>
        )}

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
                <Button variant="outline" size="sm" onClick={() => navigate("/content-factory")}>
                  View All
                </Button>
              </div>
              {isLoadingContent ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : recentOutputs.length > 0 ? (
                <div className="space-y-3">
                  {recentOutputs.map((output, index) => (
                    <div key={index} className="animate-slide-in-left" style={{ animationDelay: `${index * 50}ms` }}>
                      <RecentOutputCard {...output} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No content yet. Create your first piece!</p>
                </div>
              )}
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
                <div 
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-accent rounded-full" 
                  style={{ width: `${stats.brandScore}%` }}
                />
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm text-muted-foreground">{stats.brandScore}% On-Brand</span>
                <span className="text-xs text-primary">7-day avg</span>
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
                <Button 
                  variant="secondary" 
                  className="w-full justify-start"
                  onClick={() => setAddProofOpen(true)}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Add Proof
                </Button>
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

      {/* Modals */}
      <AddProofModal open={addProofOpen} onOpenChange={setAddProofOpen} />
    </AppLayout>
  );
}
