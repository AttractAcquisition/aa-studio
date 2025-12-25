import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get posts that are due for publishing
    const now = new Date().toISOString();
    
    const { data: duePosts, error: fetchError } = await supabase
      .from("scheduled_posts")
      .select("*")
      .in("status", ["scheduled", "queued"])
      .lte("scheduled_for", now)
      .order("scheduled_for", { ascending: true })
      .limit(10);

    if (fetchError) {
      console.error("Failed to fetch due posts:", fetchError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch posts" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!duePosts || duePosts.length === 0) {
      console.log("No posts due for publishing");
      return new Response(
        JSON.stringify({ message: "No posts due", processed: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${duePosts.length} posts to process`);

    const results = [];

    for (const post of duePosts) {
      try {
        // Mark as publishing
        await supabase
          .from("scheduled_posts")
          .update({ status: "publishing" })
          .eq("id", post.id);

        // Check platform API availability
        // For now, we'll use a fallback workflow since direct API publishing
        // requires OAuth tokens which need user setup
        
        const platform = post.platform || "instagram";
        let publishSuccess = false;
        let platformPostId: string | null = null;
        let errorMessage: string | null = null;

        // TODO: Implement actual platform publishing when OAuth is configured
        // For now, mark as "ready_to_export" which tells user to manually post
        
        // Check if user has platform credentials (future implementation)
        const hasCredentials = false; // Placeholder

        if (hasCredentials) {
          // Future: Call platform API
          // const result = await publishToPlatform(platform, post);
          // publishSuccess = result.success;
          // platformPostId = result.postId;
        } else {
          // Fallback: Mark as ready for manual export
          console.log(`Post ${post.id}: No ${platform} credentials, marking for manual export`);
          
          await supabase
            .from("scheduled_posts")
            .update({
              status: "ready_to_export",
              error: "Auto-publish not configured. Please export and post manually.",
            })
            .eq("id", post.id);

          results.push({
            id: post.id,
            status: "ready_to_export",
            message: "Marked for manual export",
          });
          continue;
        }

        if (publishSuccess) {
          await supabase
            .from("scheduled_posts")
            .update({
              status: "published",
              platform_post_id: platformPostId,
              error: null,
            })
            .eq("id", post.id);

          results.push({
            id: post.id,
            status: "published",
            platform_post_id: platformPostId,
          });
        } else {
          await supabase
            .from("scheduled_posts")
            .update({
              status: "failed",
              error: errorMessage || "Unknown publishing error",
            })
            .eq("id", post.id);

          results.push({
            id: post.id,
            status: "failed",
            error: errorMessage,
          });
        }
      } catch (postError) {
        console.error(`Error processing post ${post.id}:`, postError);
        
        await supabase
          .from("scheduled_posts")
          .update({
            status: "failed",
            error: postError instanceof Error ? postError.message : "Processing error",
          })
          .eq("id", post.id);

        results.push({
          id: post.id,
          status: "failed",
          error: postError instanceof Error ? postError.message : "Processing error",
        });
      }
    }

    console.log(`Processed ${results.length} posts`);

    return new Response(
      JSON.stringify({ processed: results.length, results }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Publisher worker error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});