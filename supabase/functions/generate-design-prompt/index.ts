import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// AA Brand defaults - CRITICAL for on-brand outputs
const AA_BRAND_DEFAULTS = {
  name: "Attract Acquisition",
  primary: "#6A00F4",
  ink: "#0B0F19",
  secondary: "#EBD7FF",
  accent: "#9D4BFF",
};

// Hard negatives that MUST be included in every image prompt
const HARD_NEGATIVES = `STRICT EXCLUSIONS (add these to the prompt): no cartoons, no illustrations, no characters, no clipart, no vector art, no stock photos, no 3D emoji style, no avatars, no people, no photographs of humans, no anime, no comic style, no flat design icons, no isometric illustrations.`;

// AA brand rules to inject into every prompt
const AA_BRAND_RULES = `
AA STUDIO BRAND RULES:
- Deep ink/navy background (#0B0F19) as the primary background color - MANDATORY
- Electric purple (#6A00F4) for accents, highlights, CTAs, and emphasis
- Secondary accent: soft lavender (#EBD7FF) and bright purple (#9D4BFF)
- Klarna-inspired aesthetic: ultra-minimal, high-contrast, premium feel
- Bold sans-serif typography (think Inter Black, Space Grotesk Bold, or similar weight)
- Typography should DOMINATE the design - text is the hero
- Clean grid layout with generous whitespace (at least 20% of canvas)
- Abstract geometric shapes only: circles, lines, grids, subtle gradients
- Soft purple glow effects on edges or behind text
- Optional: small "AA" monogram badge in corner
- White text (#FFFFFF) on dark backgrounds
- NO busy backgrounds, NO patterns that compete with text
`;

// Kind-specific system prompts that generate VISUAL image prompts
const KIND_SYSTEM_PROMPTS: Record<string, string> = {
  bold_text_card: `You are an AI image prompt engineer specializing in premium typographic social media cards.

Your task: Generate a detailed IMAGE GENERATION PROMPT for a text-first Bold Text Card (1:1 square, 1024x1024px).

CRITICAL REQUIREMENTS FOR THE PROMPT YOU GENERATE:
1. The design must be TEXT-FIRST - bold typography is the primary visual element
2. Extract a short, punchy headline (2-6 words MAX) from the script's hook
3. Add 1-2 very short supporting lines if they add value
4. Background: solid deep ink (#0B0F19) or subtle gradient to darker
5. Text: white (#FFFFFF) with optional purple glow
6. Typography: extremely bold weight, sans-serif, large and centered
7. Abstract elements: subtle geometric shapes, lines, or soft glows - NOT the focus
8. Composition: headline centered, lots of breathing room

${AA_BRAND_RULES}

${HARD_NEGATIVES}

OUTPUT FORMAT:
Return ONLY a single, detailed image generation prompt (300-500 characters). The prompt should describe the visual design, NOT be the text content itself. Include the actual text to display as quoted text within the prompt description.

Example good output:
"Premium typographic social media card, 1:1 square format. Deep ink navy background (#0B0F19). Large bold white sans-serif headline reading 'YOUR CONTENT IS NOISE' centered with generous padding. Subtle purple (#6A00F4) glow behind text. Minimal abstract curved lines in corners. Ultra-clean, Klarna-style aesthetic. No illustrations, no cartoons, no people. High contrast, premium feel."`,

  reel_cover: `You are an AI image prompt engineer specializing in mobile-first video cover designs.

Your task: Generate a detailed IMAGE GENERATION PROMPT for a Reel/TikTok cover (9:16 portrait, 1080x1920px).

CRITICAL REQUIREMENTS FOR THE PROMPT YOU GENERATE:
1. Very large, bold title text - must be readable at thumbnail size
2. Extract the main hook/title from the script (keep it SHORT - 3-7 words)
3. Include a subtitle or series label if relevant
4. Center-safe composition (account for mobile UI overlays)
5. Background: deep ink with subtle purple gradient or glow
6. Text: white, extremely bold, stacked vertically if needed
7. Optional: play button icon hint, video-like aesthetic
8. Optional: small "AA" badge in corner

${AA_BRAND_RULES}

${HARD_NEGATIVES}

OUTPUT FORMAT:
Return ONLY a single, detailed image generation prompt (300-500 characters). The prompt should describe the visual design, NOT be the text content itself. Include the actual text to display as quoted text within the prompt description.

Example good output:
"Vertical 9:16 video cover design. Deep ink background (#0B0F19) with soft purple radial gradient. Massive white bold sans-serif title 'STOP WASTING AD SPEND' stacked in center. Smaller subtitle 'The 3-step fix' below in lavender. Subtle geometric lines framing edges. Faint purple glow behind text. Mobile-safe composition. No cartoons, no illustrations. Premium, minimal Klarna aesthetic."`,

  one_pager_cover: `You are an AI image prompt engineer specializing in professional document cover designs.

Your task: Generate a detailed IMAGE GENERATION PROMPT for a One-Pager/Guide cover (4:5 format, 1080x1350px).

CRITICAL REQUIREMENTS FOR THE PROMPT YOU GENERATE:
1. Clean document/PDF cover aesthetic - professional and premium
2. Include "ONE PAGER" or "GUIDE" label near top
3. Extract the main topic/title from the script
4. Not dense with text - this is a COVER, not a content page
5. Background: deep ink with subtle geometric patterns
6. Typography: bold title, clean hierarchy
7. Optional: AA logo/monogram, abstract shapes

${AA_BRAND_RULES}

${HARD_NEGATIVES}

OUTPUT FORMAT:
Return ONLY a single, detailed image generation prompt (300-500 characters). The prompt should describe the visual design, NOT be the text content itself. Include the actual text to display as quoted text within the prompt description.

Example good output:
"Professional document cover, 4:5 aspect ratio. Deep ink background (#0B0F19). Small lavender 'ONE PAGER' label at top. Large bold white title 'THE AUDIENCE TARGETING PLAYBOOK' centered. Subtle purple (#6A00F4) gradient accent bar. Geometric grid pattern barely visible in background. AA monogram badge in bottom corner. No illustrations, no people. Premium, minimal design."`
};

// Validate prompt quality - reject if too short or looks like raw script
function validatePrompt(prompt: string): { valid: boolean; reason?: string } {
  if (!prompt || prompt.length < 200) {
    return { valid: false, reason: "Prompt too short - needs more visual detail" };
  }
  
  // Check for signs it's just raw script content
  const scriptIndicators = [
    "you're wasting",
    "let me show you",
    "here's the thing",
    "the problem is",
    "most people",
    "if you want to",
    "the secret to",
    "stop doing this",
  ];
  
  const lowerPrompt = prompt.toLowerCase();
  const hasScriptIndicators = scriptIndicators.filter(indicator => 
    lowerPrompt.includes(indicator)
  ).length > 2;
  
  if (hasScriptIndicators) {
    return { valid: false, reason: "Prompt looks like raw script content, not visual directions" };
  }
  
  // Check for required visual terms
  const visualTerms = ["background", "text", "font", "color", "typography", "design", "layout"];
  const hasVisualTerms = visualTerms.some(term => lowerPrompt.includes(term));
  
  if (!hasVisualTerms) {
    return { valid: false, reason: "Prompt missing visual design terms" };
  }
  
  return { valid: true };
}

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

    // Get the system prompt for this kind
    const systemPrompt = KIND_SYSTEM_PROMPTS[kind];
    if (!systemPrompt) {
      return new Response(
        JSON.stringify({ error: `Unknown design kind: ${kind}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build context from content
    const seriesLabel = series ? series.split("-").map((s: string) => s.charAt(0).toUpperCase() + s.slice(1)).join(" ") : "General";
    const keyPoints = onePagerBlocks?.slice(0, 3).map((b: any) => b.title || b.content?.substring(0, 80)).filter(Boolean) || [];
    
    // Extract a punchy hook from the script if none provided
    let effectiveHook = hook;
    if (!effectiveHook && script) {
      // Take the first sentence or first 100 chars
      const firstLine = script.split(/[.!?\n]/)[0]?.trim() || "";
      effectiveHook = firstLine.slice(0, 100);
    }

    const userMessage = `Create an image generation prompt for a ${kind.replace(/_/g, ' ')} design.

CONTENT TO VISUALIZE:
- Main Hook/Title: "${effectiveHook || 'Untitled Content'}"
- Series: "${seriesLabel}"
- Target Audience: "${audience || 'Business Owners'}"

SCRIPT EXCERPT (for context only - extract key message):
"""
${script ? script.substring(0, 800) : 'No script provided'}
"""

${keyPoints.length > 0 ? `KEY POINTS:\n${keyPoints.map((p: string, i: number) => `${i + 1}. ${p}`).join('\n')}` : ''}

IMPORTANT: 
- Generate a VISUAL DESIGN prompt, not the text content
- The prompt should describe colors, typography, layout, effects
- Include the actual headline/title text as a quoted element in the prompt
- Ensure AA brand compliance: deep ink background, purple accents, bold typography
- Include the negative prompts to avoid cartoons/illustrations
- Output 300-500 characters of detailed visual instructions`;

    // Attempt generation with retry logic
    let generatedPrompt = "";
    let attempts = 0;
    const maxAttempts = 2;

    while (attempts < maxAttempts) {
      attempts++;
      
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
            { role: 'user', content: attempts === 1 ? userMessage : userMessage + "\n\nPREVIOUS ATTEMPT FAILED - be more specific about visual design elements, colors, typography. DO NOT output script text as the prompt." }
          ],
          max_tokens: 600,
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
      generatedPrompt = data.choices?.[0]?.message?.content?.trim() || "";

      const validation = validatePrompt(generatedPrompt);
      if (validation.valid) {
        break;
      }
      
      console.log(`Attempt ${attempts} failed validation: ${validation.reason}`);
      
      if (attempts >= maxAttempts) {
        // Return what we have but log the issue
        console.warn(`Prompt validation failed after ${maxAttempts} attempts, returning anyway`);
      }
    }

    if (!generatedPrompt) {
      console.error('No prompt content generated');
      return new Response(
        JSON.stringify({ error: 'Failed to generate prompt after multiple attempts' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Ensure the prompt includes negative prompts if they're missing
    const lowerPrompt = generatedPrompt.toLowerCase();
    if (!lowerPrompt.includes("no cartoon") && !lowerPrompt.includes("no illustration")) {
      generatedPrompt += " No cartoons, no illustrations, no clipart, no characters, no stock photos.";
    }

    console.log(`Generated prompt (${generatedPrompt.length} chars) after ${attempts} attempt(s)`);

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
