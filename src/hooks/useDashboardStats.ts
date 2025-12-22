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

      // Posts created this week
      const { count: postsThisWeek } = await supabase
        .from("content_items")
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

      // DM Keywords (active)
      const { data: dmKeywords } = await supabase
        .from("dm_keywords")
        .select("*")
        .eq("user_id", user.id)
        .eq("active", true);

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const responsesToday = dmKeywords?.filter(
        (k: any) => k.last_triggered_at && new Date(k.last_triggered_at) >= todayStart
      ).length || 0;

      // Audits pending
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

      // Brand score (avg of on_brand_score from last 7 days)
      const { data: recentItems } = await supabase
        .from("content_items")
        .select("on_brand_score")
        .eq("user_id", user.id)
        .gte("created_at", weekAgo.toISOString())
        .not("on_brand_score", "is", null);

      const brandScore = recentItems?.length
        ? Math.round(
            recentItems.reduce((acc: number, item: any) => acc + item.on_brand_score, 0) /
              recentItems.length
          )
        : 92; // Default score

      return {
        postsThisWeek: postsThisWeek || 0,
        scheduledCount: scheduledCount || 0,
        publishedCount: publishedCount || 0,
        dmKeywordsCount: dmKeywords?.length || 0,
        responsesToday,
        pendingAudits: pendingAudits || 0,
        newAuditsThisWeek: newAuditsThisWeek || 0,
        brandScore,
      };
    },
    enabled: !!user,
  });

  const { data: recentOutputs, isLoading: recentLoading } = useQuery({
    queryKey: ["recent_outputs", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("content_items")
        .select(`
          *,
          scripts(*),
          one_pagers(*),
          designs(*)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  return {
    stats: stats || {
      postsThisWeek: 0,
      scheduledCount: 0,
      publishedCount: 0,
      dmKeywordsCount: 0,
      responsesToday: 0,
      pendingAudits: 0,
      newAuditsThisWeek: 0,
      brandScore: 92,
    },
    recentOutputs: recentOutputs || [],
    isLoading: isLoading || recentLoading,
  };
}
