import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

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
    const { videoId, userId, bucket, path } = await req.json();

    if (!videoId || !userId || !bucket || !path) {
      throw new Error("Missing required fields: videoId, userId, bucket, path");
    }

    console.log(`Converting video: ${videoId}, path: ${path}`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Download the original video from storage
    const { data: downloadData, error: downloadError } = await supabase.storage
      .from(bucket)
      .download(path);

    if (downloadError) {
      throw new Error(`Failed to download video: ${downloadError.message}`);
    }

    const originalBuffer = await downloadData.arrayBuffer();
    console.log(`Downloaded video: ${originalBuffer.byteLength} bytes`);

    // Check if it's actually a webm file
    const isWebm = path.endsWith(".webm") || downloadData.type.includes("webm");
    
    if (!isWebm) {
      console.log("Video is not webm, skipping conversion");
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Video is already in a compatible format",
          converted: false 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use ffmpeg via Deno subprocess
    // Write input to temp file
    const tempInputPath = `/tmp/input_${videoId}.webm`;
    const tempOutputPath = `/tmp/output_${videoId}.mp4`;

    await Deno.writeFile(tempInputPath, new Uint8Array(originalBuffer));
    console.log(`Wrote temp input file: ${tempInputPath}`);

    // Run ffmpeg conversion
    const ffmpegCommand = new Deno.Command("ffmpeg", {
      args: [
        "-y", // Overwrite output
        "-i", tempInputPath,
        "-c:v", "libx264",
        "-crf", "23",
        "-preset", "veryfast",
        "-c:a", "aac",
        "-b:a", "128k",
        "-movflags", "+faststart",
        "-pix_fmt", "yuv420p", // Ensure compatibility
        tempOutputPath,
      ],
      stdout: "piped",
      stderr: "piped",
    });

    const ffmpegProcess = ffmpegCommand.spawn();
    const { code, stderr } = await ffmpegProcess.output();

    const stderrText = new TextDecoder().decode(stderr);
    console.log(`ffmpeg stderr: ${stderrText}`);

    if (code !== 0) {
      throw new Error(`ffmpeg failed with code ${code}: ${stderrText}`);
    }

    // Read the converted file
    const convertedBuffer = await Deno.readFile(tempOutputPath);
    console.log(`Converted video: ${convertedBuffer.byteLength} bytes`);

    // Generate new path with .mp4 extension
    const newPath = path.replace(/\.webm$/, ".mp4");

    // Upload converted video to storage
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(newPath, convertedBuffer, {
        contentType: "video/mp4",
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`Failed to upload converted video: ${uploadError.message}`);
    }

    // Update the database record
    const { error: updateError } = await supabase
      .from("videos")
      .update({
        path: newPath,
        mime: "video/mp4",
        bytes: convertedBuffer.byteLength,
      })
      .eq("id", videoId);

    if (updateError) {
      throw new Error(`Failed to update video record: ${updateError.message}`);
    }

    // Delete the original webm file
    const { error: deleteError } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (deleteError) {
      console.warn(`Failed to delete original file: ${deleteError.message}`);
    }

    // Cleanup temp files
    try {
      await Deno.remove(tempInputPath);
      await Deno.remove(tempOutputPath);
    } catch (e) {
      console.warn("Failed to cleanup temp files:", e);
    }

    console.log(`Successfully converted video ${videoId} to MP4`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Video converted to MP4 successfully",
        converted: true,
        newPath,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error converting video:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
