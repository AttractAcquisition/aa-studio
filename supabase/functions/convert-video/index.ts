import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { videoId, bucket, path, mime } = await req.json();

    if (!videoId || !bucket || !path) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing required fields: videoId, bucket, path",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const isWebm =
      (typeof mime === "string" && mime.includes("webm")) ||
      (typeof path === "string" && path.toLowerCase().endsWith(".webm"));

    if (!isWebm) {
      return new Response(
        JSON.stringify({
          success: true,
          converted: false,
          message: "Video is not WebM; no conversion needed.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Supabase Edge Runtime cannot spawn subprocesses (no ffmpeg), so transcoding isn't possible here.
    // If you want automatic WebM -> MP4 (H.264/AAC + faststart), use an external transcoder.
    return new Response(
      JSON.stringify({
        success: false,
        code: "TRANSCODE_NOT_SUPPORTED",
        message:
          "Transcoding WebM -> MP4 isn't supported on Supabase Edge Functions (ffmpeg/subprocesses are blocked). Use an external transcoding service.",
      }),
      {
        status: 501,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("convert-video error:", errorMessage);
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
