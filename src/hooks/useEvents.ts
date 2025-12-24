import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type EventType = "enquiry" | "booked_call" | "audit_request" | "conversion";

export interface CreateEventParams {
  type: EventType;
  keyword?: string;
  platform?: string;
  post_id?: string;
  value?: number;
  notes?: string;
  occurred_at?: string;
  related_event_id?: string;
}

export function useEvents() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: events, isLoading } = useQuery({
    queryKey: ["events", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("user_id", user.id)
        .order("occurred_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const createEvent = useMutation({
    mutationFn: async (params: CreateEventParams) => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("events")
        .insert({
          user_id: user.id,
          type: params.type,
          keyword: params.keyword,
          platform: params.platform || "instagram",
          post_id: params.post_id,
          value: params.value,
          notes: params.notes,
          occurred_at: params.occurred_at || new Date().toISOString(),
          related_event_id: params.related_event_id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["dashboard_stats", user?.id] });
    },
  });

  const deleteEvent = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("events")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["dashboard_stats", user?.id] });
    },
  });

  // Filter by type
  const enquiries = events?.filter((e) => e.type === "enquiry") || [];
  const bookedCalls = events?.filter((e) => e.type === "booked_call") || [];
  const auditRequests = events?.filter((e) => e.type === "audit_request") || [];
  const conversionsData = events?.filter((e) => e.type === "conversion") || [];

  // Conversion rates
  const enquiryCount = enquiries.length;
  const auditRequestRate = enquiryCount > 0 ? Math.round((auditRequests.length / enquiryCount) * 100) : 0;
  const bookedCallRate = enquiryCount > 0 ? Math.round((bookedCalls.length / enquiryCount) * 100) : 0;
  const conversionRate = enquiryCount > 0 ? Math.round((conversionsData.length / enquiryCount) * 100) : 0;

  // Last 7 days counts
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const enquiriesLast7Days = enquiries.filter((e) => new Date(e.occurred_at) >= sevenDaysAgo).length;
  const auditRequestsLast7Days = auditRequests.filter((e) => new Date(e.occurred_at) >= sevenDaysAgo).length;
  const bookedCallsLast7Days = bookedCalls.filter((e) => new Date(e.occurred_at) >= sevenDaysAgo).length;
  const conversionsLast7Days = conversionsData.filter((e) => new Date(e.occurred_at) >= sevenDaysAgo).length;

  return {
    events: events || [],
    enquiries,
    bookedCalls,
    auditRequests,
    conversions: conversionsData,
    isLoading,
    createEvent: createEvent.mutateAsync,
    deleteEvent: deleteEvent.mutate,
    isCreating: createEvent.isPending,
    // Conversion stats
    conversionRates: {
      auditRequestRate,
      bookedCallRate,
      conversionRate,
    },
    last7Days: {
      enquiries: enquiriesLast7Days,
      auditRequests: auditRequestsLast7Days,
      bookedCalls: bookedCallsLast7Days,
      conversions: conversionsLast7Days,
    },
  };
}
