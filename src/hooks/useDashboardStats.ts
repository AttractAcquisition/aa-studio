import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export function useDashboardStats() {
  const { user } = useAuth();

  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard_stats", user?.id],
    queryFn: async () => {
      if (!user) return null;

      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Posts created this week (from content_runs)
      const { count: postsThisWeek } = await supabase
        .from("content_runs")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", weekAgo.toISOString());

      // Scheduled posts (upcoming)
      const { count: scheduledCount } = await supabase
        .from("scheduled_posts")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "scheduled")
        .gte("scheduled_for", now.toISOString());

      // Published posts
      const { count: publishedCount } = await supabase
        .from("scheduled_posts")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "published");

      // Enquiries from events table
      const { count: enquiriesCount } = await supabase
        .from("events")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("type", "enquiry");

      // Enquiries today
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const { count: enquiriesToday } = await supabase
        .from("events")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("type", "enquiry")
        .gte("occurred_at", todayStart.toISOString());

      // Audit requests from events
      const { count: auditRequests } = await supabase
        .from("events")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("type", "audit_request");

      // Booked calls from events
      const { count: bookedCalls } = await supabase
        .from("events")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("type", "booked_call");

      // Conversions from events
      const { count: conversions } = await supabase
        .from("events")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("type", "conversion");

      // Pending audits (legacy table)
      const { count: pendingAudits } = await supabase
        .from("audits")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "pending");

      const { count: newAuditsThisWeek } = await supabase
        .from("audits")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", weekAgo.toISOString());

      // Brand score - default to 92 as baseline
      const brandScore = 92;

      return {
        postsThisWeek: postsThisWeek || 0,
        scheduledCount: scheduledCount || 0,
        publishedCount: publishedCount || 0,
        enquiriesCount: enquiriesCount || 0,
        enquiriesToday: enquiriesToday || 0,
        auditRequests: auditRequests || 0,
        bookedCalls: bookedCalls || 0,
        conversions: conversions || 0,
        pendingAudits: pendingAudits || 0,
        newAuditsThisWeek: newAuditsThisWeek || 0,
        brandScore,
      };
    },
    enabled: !!user,
  });

  return {
    stats: stats || {
      postsThisWeek: 0,
      scheduledCount: 0,
      publishedCount: 0,
      enquiriesCount: 0,
      enquiriesToday: 0,
      auditRequests: 0,
      bookedCalls: 0,
      conversions: 0,
      pendingAudits: 0,
      newAuditsThisWeek: 0,
      brandScore: 92,
    },
    isLoading,
  };
}
