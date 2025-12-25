import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// AA Brand defaults
const AA_BRAND_DEFAULTS = {
  name: "Attract Acquisition",
  primary: "#6A00F4",
  ink: "#0B0F19",
  secondary: "#EBD7FF",
  accent: "#9D4BFF",
  rules: `
    - Deep ink/navy background (#0B0F19) as primary background
    - Electric purple (#6A00F4) for accents, highlights, and emphasis
    - Klarna-style minimal, high-contrast aesthetic
    - Bold sans-serif typography (Inter, Space Grotesk, or similar)
    - Clean grid layout with generous whitespace
    - No clutter, no stock photo backgrounds
    - No photorealistic imagery unless explicitly requested
    - Geometric patterns and abstract elements preferred
    - AA monogram style optional but should match brand
    - White text (#FFFFFF) for primary content on dark backgrounds
  `
};

const KIND_SYSTEM_PROMPTS: Record<string, string> = {
  bold_text_card: `You are a design prompt expert for the AA Studio brand.
Your task is to generate a SINGLE image prompt for a bold text card design (1:1 square format).

Requirements for the generated prompt:
- Extract the main headline from the script (the hook or most impactful statement)
- Include 2-4 short supporting text lines if relevant
- Deep ink background (#0B0F19)
- Purple accents (#6A00F4)
- Bold, large typography that dominates the design
- Minimal icons or geometric elements optional
- Looks like a premium "textbook card" or social media quote card
- NO people, NO photographs, purely typographic with abstract elements

Output ONLY the image prompt text, no markdown, no lists, no explanations.`,

  reel_cover: `You are a design prompt expert for the AA Studio brand.
Your task is to generate a SINGLE image prompt for a Reel cover design (portrait 9:16 format).

Requirements for the generated prompt:
- Extract a strong title/hook from the script
- Include a subtitle or series label if relevant
- Cover must be readable on mobile phones
- Deep ink background (#0B0F19) with gradient
- Purple accents (#6A00F4)
- Bold typography that's readable even at thumbnail size
- Big "AA" monogram element optional
- Play button or video-related iconography welcome
- NO people, NO photographs, abstract geometric elements only

Output ONLY the image prompt text, no markdown, no lists, no explanations.`,

  one_pager_cover: `You are a design prompt expert for the AA Studio brand.
Your task is to generate a SINGLE image prompt for a One-Pager cover design (4:5 or square format).

Requirements for the generated prompt:
- Extract the main topic/title from the script
- Include "ONE PAGER" or "GUIDE" label in the design
- Clean cover design, not dense with text
- Should match the topic being discussed in the script
- Deep ink background (#0B0F19)
- Purple gradient accents (#6A00F4 to #9D4BFF)
- Professional document/guide aesthetic
- Think premium PDF cover or lead magnet design
- NO people, NO photographs, abstract geometric elements only

Output ONLY the image prompt text, no markdown, no lists, no explanations.`
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { kind, hook, series, audience, script, onePagerBlocks, brand } = await req.json();

    if (!kind) {
      return new Response(
        JSON.stringify({ error: 'kind is required (bold_text_card, reel_cover, or one_pager_cover)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      console.error('OPENAI_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Generating design prompt for kind: ${kind}`);

    // Build context for prompt generation
    const brandRules = brand?.rules || AA_BRAND_DEFAULTS.rules;
    const brandName = brand?.name || AA_BRAND_DEFAULTS.name;
    const primaryColor = brand?.primary || AA_BRAND_DEFAULTS.primary;
    const inkColor = brand?.ink || AA_BRAND_DEFAULTS.ink;

    // Get the system prompt for this kind
    const systemPrompt = KIND_SYSTEM_PROMPTS[kind];
    if (!systemPrompt) {
      return new Response(
        JSON.stringify({ error: `Unknown design kind: ${kind}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build the user message with all context
    const seriesLabel = series ? series.split("-").map((s: string) => s.charAt(0).toUpperCase() + s.slice(1)).join(" ") : "";
    const keyPoints = onePagerBlocks?.slice(0, 3).map((b: any) => b.title || b.content?.substring(0, 100)).filter(Boolean) || [];

    const userMessage = `Generate an image prompt for a ${kind.replace(/_/g, ' ')} design.

BRAND IDENTITY:
- Brand Name: ${brandName}
- Primary Color: ${primaryColor}
- Background Color: ${inkColor}
- Brand Rules:
${brandRules}

CONTENT CONTEXT:
- Hook/Title: "${hook || 'No hook provided'}"
- Series: "${seriesLabel || 'General Content'}"
- Target Audience: "${audience || 'Business Owners'}"

SCRIPT CONTENT:
"""
${script ? script.substring(0, 1500) : 'No script provided'}
"""

${keyPoints.length > 0 ? `KEY POINTS FROM ONE-PAGER:
${keyPoints.map((p: string, i: number) => `${i + 1}. ${p}`).join('\n')}` : ''}

Generate a single, detailed image prompt that will create an on-brand design for this content.`;

    // Call OpenAI to generate the prompt
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: `OpenAI API error: ${errorText}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const generatedPrompt = data.choices?.[0]?.message?.content?.trim();

    if (!generatedPrompt) {
      console.error('No prompt content in OpenAI response:', data);
      return new Response(
        JSON.stringify({ error: 'No prompt generated by OpenAI' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Generated prompt (${generatedPrompt.length} chars)`);

    return new Response(
      JSON.stringify({ prompt: generatedPrompt, kind }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error generating design prompt:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
