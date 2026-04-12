import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type EventType = "enquiry" | "audit_request" | "booked_call" | "conversion";

export interface CreateEventParams {
  type: EventType;
  keyword?: string;
  platform?: string;
  post_id?: string;
  contact_name?: string;
  contact_handle?: string;
  value?: number;
  notes?: string;
  occurred_at?: string;
  related_event_id?: string;
}

export interface EventRow {
  id: string;
  user_id: string;
  type: string;
  keyword: string | null;
  platform: string | null;
  post_id: string | null;
  contact_name: string | null;
  contact_handle: string | null;
  value: number | null;
  notes: string | null;
  occurred_at: string;
  created_at: string;
  related_event_id: string | null;
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
      return data as EventRow[];
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
          contact_name: params.contact_name,
          contact_handle: params.contact_handle,
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

  // Conversion rates (step-by-step funnel)
  const enquiryCount = enquiries.length;
  const auditRequestCount = auditRequests.length;
  const bookedCallCount = bookedCalls.length;
  
  // Rate: audit_requests / enquiries
  const auditRequestRate = enquiryCount > 0 ? Math.round((auditRequestCount / enquiryCount) * 100) : 0;
  // Rate: booked_calls / audit_requests
  const bookedCallRate = auditRequestCount > 0 ? Math.round((bookedCallCount / auditRequestCount) * 100) : 0;
  // Rate: conversions / booked_calls
  const conversionRate = bookedCallCount > 0 ? Math.round((conversionsData.length / bookedCallCount) * 100) : 0;

  // Last 7 days counts
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const enquiriesLast7Days = enquiries.filter((e) => new Date(e.occurred_at) >= sevenDaysAgo).length;
  const auditRequestsLast7Days = auditRequests.filter((e) => new Date(e.occurred_at) >= sevenDaysAgo).length;
  const bookedCallsLast7Days = bookedCalls.filter((e) => new Date(e.occurred_at) >= sevenDaysAgo).length;
  const conversionsLast7Days = conversionsData.filter((e) => new Date(e.occurred_at) >= sevenDaysAgo).length;

  // Total conversion value
  const totalConversionValue = conversionsData.reduce((sum, e) => sum + (e.value || 0), 0);

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
    totalConversionValue,
  };
}
