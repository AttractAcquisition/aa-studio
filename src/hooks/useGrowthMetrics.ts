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

function sumKey(rows: GrowthMetric[], key: keyof GrowthMetric) {
  return rows.reduce((sum, r) => sum + Number(r[key] ?? 0), 0);
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

      // EXACTLY 7 calendar days INCLUDING today
      // Example: if today is Jan 2, window starts Dec 27 (7 days: 27,28,29,30,31,1,2)
      const sevenDayWindowStart = subDays(today, 6);

      // Fetch enough history to calculate deltas safely
      const historyStart = subDays(today, 21);

      const { data, error } = await supabase
        .from("growth_metrics_daily")
        .select("*")
        .eq("user_id", user.id)
        .gte("date", format(historyStart, "yyyy-MM-dd"))
        .order("date", { ascending: false });

      if (error) throw error;

      const metrics = (data || []) as GrowthMetric[];

      if (metrics.length === 0) {
        return {
          followers: null,
          followers7DayChange: null,
          profileVisits7Day: null,
          linkClicks7Day: null,
          inboundDms7Day: null,
          bookedCalls7Day: null,
        };
      }

      // Latest followers (most recent row that actually has a followers value)
      const latestWithFollowers = metrics.find((m) => m.followers !== null && m.followers !== undefined);
      const followers = latestWithFollowers?.followers ?? null;

      // Followers ~7 days ago: find the closest row on/before the window start with followers
      const boundaryStr = format(sevenDayWindowStart, "yyyy-MM-dd");
      const olderWithFollowers = metrics.find(
        (m) => m.date <= boundaryStr && m.followers !== null && m.followers !== undefined
      );

      const followers7DayChange =
        followers !== null && olderWithFollowers?.followers !== null && olderWithFollowers?.followers !== undefined
          ? followers - olderWithFollowers.followers
          : null;

      // Sum last 7 days (inclusive)
      const last7Days = metrics.filter((m) => m.date >= boundaryStr);

      // If you have ANY rows in the last 7 days, show sums (0 is valid and should display as 0)
      const profileVisits7Day = last7Days.length ? sumKey(last7Days, "profile_visits") : null;
      const linkClicks7Day = last7Days.length ? sumKey(last7Days, "link_clicks") : null;
      const inboundDms7Day = last7Days.length ? sumKey(last7Days, "inbound_dms") : null;
      const bookedCalls7Day = last7Days.length ? sumKey(last7Days, "booked_calls") : null;

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
      queryClient.invalidateQueries({ queryKey: ["growth_metrics", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["growth_scoreboard", user?.id] });
    },
  });
}
