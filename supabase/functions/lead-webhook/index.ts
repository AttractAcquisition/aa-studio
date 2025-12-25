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
    const url = new URL(req.url);
    const webhookKey = url.searchParams.get("key");

    if (!webhookKey) {
      return new Response(
        JSON.stringify({ error: "Missing webhook key" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find user by webhook key
    const { data: settings, error: settingsError } = await supabase
      .from("user_settings")
      .select("user_id")
      .eq("lead_webhook_key", webhookKey)
      .single();

    if (settingsError || !settings) {
      console.error("Invalid webhook key:", webhookKey);
      return new Response(
        JSON.stringify({ error: "Invalid webhook key" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse lead data
    const body = await req.json().catch(() => ({}));
    const { name, email, phone, message, source } = body;

    if (!name && !email && !phone) {
      return new Response(
        JSON.stringify({ error: "At least one of name, email, or phone is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Insert lead
    const { data: lead, error: insertError } = await supabase
      .from("leads")
      .insert({
        user_id: settings.user_id,
        name: name || null,
        email: email || null,
        phone: phone || null,
        message: message || null,
        source: source || "webhook",
        status: "new",
        api_key: webhookKey,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Failed to insert lead:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to save lead" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Lead created:", lead.id);

    return new Response(
      JSON.stringify({ success: true, lead_id: lead.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});