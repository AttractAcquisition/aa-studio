import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { supabaseFunctionUrl } from "@/lib/supabase-urls";
import type { 
  AAScript, 
  AAScenePlan, 
  AAVideoRender, 
  PlanJson, 
  PresetName 
} from "@/types/video-generator";

export function useVideoGenerator() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [script, setScript] = useState<AAScript | null>(null);
  const [plan, setPlan] = useState<AAScenePlan | null>(null);
  const [render, setRender] = useState<AAVideoRender | null>(null);
  const [recentRenders, setRecentRenders] = useState<AAVideoRender[]>([]);

  const saveScript = useCallback(async (title: string, scriptText: string) => {
    if (!user) return null;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("video-save-script", {
        body: { title, script: scriptText },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      
      const scriptRow: AAScript = {
        id: data.script_id,
        user_id: user.id,
        title,
        script: scriptText,
        created_at: new Date().toISOString(),
      };
      setScript(scriptRow);
      toast.success("Script saved");
      return scriptRow;
    } catch (err: any) {
      toast.error(err.message || "Failed to save script");
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const generatePlan = useCallback(async (scriptId: string, preset: PresetName) => {
    if (!user) return null;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("video-generate-plan", {
        body: { script_id: scriptId, preset },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      
      const planRow: AAScenePlan = {
        id: data.plan_id,
        user_id: user.id,
        script_id: scriptId,
        plan_json: data.plan_json,
        duration_sec: data.plan_json.scenes.reduce((sum: number, s: any) => sum + (s.sec || 0), 0),
        is_approved: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setPlan(planRow);
      toast.success("Scene plan generated");
      return planRow;
    } catch (err: any) {
      toast.error(err.message || "Failed to generate plan");
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const updatePlan = useCallback(async (planId: string, planJson: PlanJson) => {
    if (!user) return false;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("video-update-plan", {
        body: { plan_id: planId, plan_json: planJson },
      });
      if (error) throw error;
      if (data.error) {
        if (data.validation_errors) {
          toast.error(data.validation_errors.join(", "));
        } else {
          throw new Error(data.error);
        }
        return false;
      }
      
      setPlan(prev => prev ? { 
        ...prev, 
        plan_json: planJson,
        duration_sec: planJson.scenes.reduce((sum, s) => sum + (s.sec || 0), 0),
        updated_at: new Date().toISOString(),
      } : null);
      toast.success("Plan updated");
      return true;
    } catch (err: any) {
      toast.error(err.message || "Failed to update plan");
      return false;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const approvePlan = useCallback(async (planId: string) => {
    if (!user) return false;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("video-approve-plan", {
        body: { plan_id: planId },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      
      setPlan(prev => prev ? { ...prev, is_approved: true } : null);
      toast.success("Plan approved");
      return true;
    } catch (err: any) {
      toast.error(err.message || "Failed to approve plan");
      return false;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const createRender = useCallback(async (scriptId: string, planId: string) => {
    if (!user) return null;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("video-create-render", {
        body: { script_id: scriptId, plan_id: planId },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      
      const renderRow: AAVideoRender = {
        id: data.render_id,
        user_id: user.id,
        script_id: scriptId,
        plan_id: planId,
        status: "queued",
        video_url: null,
        renderer_job_id: null,
        error: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setRender(renderRow);
      toast.success("Render job created");
      return renderRow;
    } catch (err: any) {
      toast.error(err.message || "Failed to create render job");
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const startRender = useCallback(async (renderId: string) => {
    if (!user) return null;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("video-render", {
        body: { render_id: renderId },
      });
      if (error) throw error;
      
      setRender(prev => prev ? {
        ...prev,
        status: data.status,
        video_url: data.video_url || null,
        error: data.error || null,
      } : null);
      
      if (data.status === "done") {
        toast.success("Video rendered successfully");
      } else if (data.status === "failed") {
        toast.error(data.error || "Render failed");
      }
      
      return data;
    } catch (err: any) {
      toast.error(err.message || "Failed to start render");
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const checkRenderStatus = useCallback(async (renderId: string) => {
    if (!user) return null;
    try {
      const { data, error } = await supabase.functions.invoke("video-render-status", {
        body: {},
        method: "GET",
      });
      
      // Use fetch directly for GET with query params
      const response = await fetch(`${supabaseFunctionUrl("video-render-status")}?render_id=${renderId}`, {
          headers: {
            "Authorization": `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            "Content-Type": "application/json",
          },
        }
      );
      
      const result = await response.json();
      
      setRender(prev => prev ? {
        ...prev,
        status: result.status,
        video_url: result.video_url || null,
        error: result.error || null,
      } : null);
      
      return result;
    } catch (err: any) {
      console.error("Status check error:", err);
      return null;
    }
  }, [user]);

  const loadRecentRenders = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("aa_video_renders")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);
      
      if (error) throw error;
      setRecentRenders((data || []) as AAVideoRender[]);
    } catch (err) {
      console.error("Failed to load recent renders:", err);
    }
  }, [user]);

  const reset = useCallback(() => {
    setScript(null);
    setPlan(null);
    setRender(null);
  }, []);

  return {
    loading,
    script,
    plan,
    render,
    recentRenders,
    saveScript,
    generatePlan,
    updatePlan,
    approvePlan,
    createRender,
    startRender,
    checkRenderStatus,
    loadRecentRenders,
    reset,
    setScript,
    setPlan,
    setRender,
  };
}
