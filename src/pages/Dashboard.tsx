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
  Users,
  Eye,
  MousePointer,
  Phone,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Loader2,
  BarChart3,
  LogOut
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useGrowthScoreboard } from "@/hooks/useGrowthMetrics";
import { useBundles } from "@/hooks/useBundles";
import { AddProofModal } from "@/components/modals/AddProofModal";
import { UpdateMetricsModal } from "@/components/modals/UpdateMetricsModal";
import { useAuth } from "@/hooks/useAuth";

export default function Dashboard() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { data: scoreboard, isLoading: isLoadingScoreboard } = useGrowthScoreboard();
  const { bundles, isLoading: isLoadingBundles } = useBundles(5);
  const [addProofOpen, setAddProofOpen] = useState(false);
  const [updateMetricsOpen, setUpdateMetricsOpen] = useState(false);

  const formatNumber = (n: number | null | undefined) => {
    if (n === null || n === undefined) return "—";
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
    return n.toString();
  };

  const formatChange = (n: number | null | undefined) => {
    if (n === null || n === undefined) return "";
    const sign = n >= 0 ? "+" : "";
    return `${sign}${n}`;
  };

  const kpis = [
    { 
      title: "Followers", 
      value: formatNumber(scoreboard?.followers), 
      subtitle: scoreboard?.followers7DayChange !== null 
        ? `${formatChange(scoreboard?.followers7DayChange)} this week` 
        : "Add metrics", 
      icon: Users, 
      trend: (scoreboard?.followers7DayChange ?? 0) >= 0 ? "up" as const : "down" as const, 
      trendValue: "Total" 
    },
    { 
      title: "Profile Visits", 
      value: formatNumber(scoreboard?.profileVisits7Day), 
      subtitle: "Last 7 days", 
      icon: Eye, 
      trend: "neutral" as const, 
      trendValue: "7 days" 
    },
    { 
      title: "Link Clicks", 
      value: formatNumber(scoreboard?.linkClicks7Day), 
      subtitle: "Last 7 days", 
      icon: MousePointer, 
      trend: "neutral" as const, 
      trendValue: "7 days" 
    },
    { 
      title: "Inbound DMs", 
      value: formatNumber(scoreboard?.inboundDms7Day), 
      subtitle: "Last 7 days", 
      icon: MessageSquare, 
      trend: "neutral" as const, 
      trendValue: "7 days" 
    },
    { 
      title: "Booked Calls", 
      value: formatNumber(scoreboard?.bookedCalls7Day), 
      subtitle: "Last 7 days", 
      icon: Phone, 
      trend: "up" as const, 
      trendValue: "7 days" 
    },
  ];

  // Map bundles to recent outputs format
  const recentOutputs = bundles.map((bundle) => ({
    id: bundle.id,
    type: "design" as const,
    title: bundle.title || "Untitled",
    series: bundle.series || "General",
    date: new Date(bundle.created_at).toLocaleDateString(),
    status: bundle.status as "draft" | "ready" | "published",
    thumbnail: bundle.design_image_urls?.bold_text_card || null,
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
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => setUpdateMetricsOpen(true)}>
              <BarChart3 className="w-4 h-4 mr-2" />
              Update Metrics
            </Button>
            <Link to="/content-factory">
              <Button variant="gradient" size="lg" className="gap-2">
                <Sparkles className="w-5 h-5" />
                Create Content
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={signOut} className="text-muted-foreground hover:text-foreground">
              <LogOut className="w-4 h-4 mr-2" />
              Log out
            </Button>
          </div>
        </div>

        {/* Growth Scoreboard KPI Grid */}
        <div className="mb-2">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
            Growth Scoreboard
          </h2>
        </div>
        {isLoadingScoreboard ? (
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
                  <p className="text-sm text-muted-foreground mt-1">Your latest content bundles</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => navigate("/content-factory")}>
                  View All
                </Button>
              </div>
              {isLoadingBundles ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : recentOutputs.length > 0 ? (
                <div className="space-y-3">
                  {recentOutputs.map((output, index) => (
                    <div 
                      key={output.id} 
                      className="animate-slide-in-left cursor-pointer" 
                      style={{ animationDelay: `${index * 50}ms` }}
                      onClick={() => navigate(`/bundles/${output.id}`)}
                    >
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
                  style={{ width: "75%" }}
                />
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm text-muted-foreground">75% On-Brand</span>
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
      <UpdateMetricsModal open={updateMetricsOpen} onOpenChange={setUpdateMetricsOpen} />
    </AppLayout>
  );
}
