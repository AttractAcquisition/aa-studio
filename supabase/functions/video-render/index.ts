import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { render_id } = await req.json();

    if (!render_id) {
      return new Response(JSON.stringify({ error: "render_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Load render + plan
    const { data: render, error: renderError } = await supabase
      .from("aa_video_renders")
      .select(`
        *,
        plan:aa_scene_plans(plan_json, is_approved)
      `)
      .eq("id", render_id)
      .eq("user_id", user.id)
      .single();

    if (renderError || !render) {
      return new Response(JSON.stringify({ error: "Render not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (render.status === "done") {
      return new Response(JSON.stringify({ 
        status: "done", 
        video_url: render.video_url 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (render.status === "rendering") {
      return new Response(JSON.stringify({ status: "rendering" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Set status to rendering
    await supabase
      .from("aa_video_renders")
      .update({ status: "rendering" })
      .eq("id", render_id);

    const rendererUrl = Deno.env.get("RENDERER_URL");
    const renderSecret = Deno.env.get("RENDER_SECRET");

    if (rendererUrl && renderSecret) {
      // Call external renderer
      try {
        const response = await fetch(`${rendererUrl}/render`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${renderSecret}`,
          },
          body: JSON.stringify({
            render_id,
            user_id: user.id,
            plan_json: render.plan.plan_json,
          }),
        });

        const result = await response.json();

        if (result.ok && result.video_url) {
          await supabase
            .from("aa_video_renders")
            .update({
              status: "done",
              video_url: result.video_url,
              renderer_job_id: result.renderer_job_id || null,
            })
            .eq("id", render_id);

          return new Response(JSON.stringify({ 
            status: "done", 
            video_url: result.video_url 
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        } else {
          await supabase
            .from("aa_video_renders")
            .update({
              status: "failed",
              error: result.error || "Renderer returned error",
            })
            .eq("id", render_id);

          return new Response(JSON.stringify({ 
            status: "failed", 
            error: result.error 
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      } catch (fetchErr) {
        console.error("Renderer fetch error:", fetchErr);
        await supabase
          .from("aa_video_renders")
          .update({
            status: "failed",
            error: "Failed to connect to renderer service",
          })
          .eq("id", render_id);

        return new Response(JSON.stringify({ 
          status: "failed", 
          error: "Failed to connect to renderer" 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else {
      // Stub mode: simulate rendering with placeholder
      console.log("Stub mode: no RENDERER_URL configured, using placeholder");
      
      // Simulate a short delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Use a placeholder video URL
      const placeholderUrl = "https://dwhmvzooerxejustfqpt.supabase.co/storage/v1/object/public/aa-videos/placeholder/sample.mp4";

      await supabase
        .from("aa_video_renders")
        .update({
          status: "done",
          video_url: placeholderUrl,
          renderer_job_id: "stub-" + Date.now(),
        })
        .eq("id", render_id);

      return new Response(JSON.stringify({ 
        status: "done", 
        video_url: placeholderUrl,
        stub: true 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
