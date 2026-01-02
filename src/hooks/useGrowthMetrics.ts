import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { format, subDays } from "date-fns";

export type GrowthMetric = {
  id: string;
  user_id: string;
  date: string;
  followers: number | null;
  profile_visits: number | null;
  link_clicks: number | null;
  inbound_dms: number | null;
  booked_calls: number | null;
  created_at: string;
};

export type GrowthMetricInsert = {
  date: string;
  followers?: number | null;
  profile_visits?: number | null;
  link_clicks?: number | null;
  inbound_dms?: number | null;
  booked_calls?: number | null;
};

export function useGrowthMetrics() {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ["growth_metrics", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("growth_metrics_daily")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false })
        .limit(30);

      if (error) throw error;
      return (data || []) as GrowthMetric[];
    },
    enabled: !!user,
  });

  return {
    metrics: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useGrowthScoreboard() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["growth_scoreboard", user?.id],
    queryFn: async () => {
      if (!user) {
        return {
          followers: null,
          followers7DayChange: null,
          profileVisits7Day: null,
          linkClicks7Day: null,
          inboundDms7Day: null,
          bookedCalls7Day: null,
        };
      }

      const today = new Date();
      const sevenDaysAgo = subDays(today, 7);
      const fourteenDaysAgo = subDays(today, 14);

      // Get latest 14 days of data for calculations
      const { data, error } = await supabase
        .from("growth_metrics_daily")
        .select("*")
        .eq("user_id", user.id)
        .gte("date", format(fourteenDaysAgo, "yyyy-MM-dd"))
        .order("date", { ascending: false });

      if (error) throw error;

      const metrics = (data || []) as GrowthMetric[];

      // Get latest followers value
      const latestWithFollowers = metrics.find((m) => m.followers !== null);
      const followers = latestWithFollowers?.followers ?? null;

      // Find followers from ~7 days ago
      const sevenDaysAgoStr = format(sevenDaysAgo, "yyyy-MM-dd");
      const oldMetric = metrics.find((m) => m.date <= sevenDaysAgoStr && m.followers !== null);
      const followers7DayChange = 
        followers !== null && oldMetric?.followers !== null
          ? followers - oldMetric.followers
          : null;

      // Sum last 7 days for other metrics
      const last7Days = metrics.filter((m) => m.date >= sevenDaysAgoStr);

      const profileVisits7Day = last7Days.reduce(
        (sum, m) => sum + (m.profile_visits || 0),
        0
      ) || null;

      const linkClicks7Day = last7Days.reduce(
        (sum, m) => sum + (m.link_clicks || 0),
        0
      ) || null;

      const inboundDms7Day = last7Days.reduce(
        (sum, m) => sum + (m.inbound_dms || 0),
        0
      ) || null;

      const bookedCalls7Day = last7Days.reduce(
        (sum, m) => sum + (m.booked_calls || 0),
        0
      ) || null;

      return {
        followers,
        followers7DayChange,
        profileVisits7Day,
        linkClicks7Day,
        inboundDms7Day,
        bookedCalls7Day,
      };
    },
    enabled: !!user,
  });
}

export function useGrowthMetricMutation() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: GrowthMetricInsert) => {
      if (!user) throw new Error("Not authenticated");

      // Upsert by user_id + date
      const { data: metric, error } = await supabase
        .from("growth_metrics_daily")
        .upsert(
          { 
            user_id: user.id,
            date: data.date,
            followers: data.followers,
            profile_visits: data.profile_visits,
            link_clicks: data.link_clicks,
            inbound_dms: data.inbound_dms,
            booked_calls: data.booked_calls,
          },
          { onConflict: "user_id,date" }
        )
        .select()
        .single();

      if (error) throw error;
      return metric as GrowthMetric;
    },
    onSuccess: () => {
      // Invalidate all growth-related queries to refetch data
      queryClient.invalidateQueries({ queryKey: ["growth_metrics", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["growth_scoreboard", user?.id] });
    },
  });
}
