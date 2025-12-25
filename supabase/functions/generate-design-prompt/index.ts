import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { kind, hook, series, audience, script, onePagerBlocks } = await req.json();

    if (!kind) {
      return new Response(
        JSON.stringify({ error: 'kind is required (bold_text_card, reel_cover, or one_pager_cover)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Generating design prompt for kind: ${kind}`);

    // Build context for prompt generation
    const context = {
      hook: hook || '',
      series: series || '',
      audience: audience || '',
      scriptPreview: script ? script.substring(0, 500) : '',
      keyPoints: onePagerBlocks?.slice(0, 3).map((b: any) => b.title || b.content?.substring(0, 100)).filter(Boolean) || [],
    };

    // Generate prompt based on design type
    let prompt = '';
    
    switch (kind) {
      case 'bold_text_card':
        prompt = generateBoldTextCardPrompt(context);
        break;
      case 'reel_cover':
        prompt = generateReelCoverPrompt(context);
        break;
      case 'one_pager_cover':
        prompt = generateOnePagerCoverPrompt(context);
        break;
      default:
        return new Response(
          JSON.stringify({ error: `Unknown design kind: ${kind}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    console.log(`Generated prompt (${prompt.length} chars)`);

    return new Response(
      JSON.stringify({ prompt, kind }),
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

function generateBoldTextCardPrompt(context: {
  hook: string;
  series: string;
  audience: string;
  scriptPreview: string;
  keyPoints: string[];
}): string {
  const mainText = context.hook || context.keyPoints[0] || 'Your content is noise';
  
  return `A bold, modern social media quote card design (1:1 square format). Dark premium background with deep navy/charcoal tones (#0B0F19, #1a1f2e). 

The main text "${mainText}" displayed in large, bold white typography with excellent readability. 

Add subtle purple gradient accents (#6A00F4 to #8B5CF6) as decorative elements - perhaps a glow effect, underline, or corner accent.

Minimalist aesthetic, professional look suitable for Instagram. No people, no photos - purely typographic with abstract geometric elements if needed.

Brand style: Premium, bold, modern. Think high-end marketing agency aesthetic.`;
}

function generateReelCoverPrompt(context: {
  hook: string;
  series: string;
  audience: string;
  scriptPreview: string;
  keyPoints: string[];
}): string {
  const mainText = context.hook || context.keyPoints[0] || 'Watch This';
  const seriesText = context.series ? context.series.split('-').join(' ') : '';
  
  return `A vertical Instagram Reel cover design (9:16 portrait format). Dark premium background with gradient from #0B0F19 to #1a1f2e.

Center-aligned bold white text: "${mainText}"

${seriesText ? `Small series badge or label at top: "${seriesText}"` : ''}

Purple accent elements (#6A00F4) - perhaps a play button icon, decorative lines, or subtle glow effects.

Modern, attention-grabbing thumbnail style. Bold typography that's readable even at small sizes.

Clean, premium aesthetic. No photographs or people - abstract geometric patterns and typography only.

Style: Dark mode, premium marketing content, Instagram-native design.`;
}

function generateOnePagerCoverPrompt(context: {
  hook: string;
  series: string;
  audience: string;
  scriptPreview: string;
  keyPoints: string[];
}): string {
  const title = context.hook || 'One-Pager Guide';
  const seriesText = context.series ? context.series.split('-').join(' ') : 'Content Strategy';
  
  return `A professional document cover design (4:5 portrait format). Dark premium background (#0B0F19).

Title: "${title}" in large, bold white typography.

${seriesText ? `Subtitle or series name: "${seriesText}"` : ''}

For audience: "${context.audience || 'Business Owners'}"

Include decorative purple gradient elements (#6A00F4 to #8B5CF6) - abstract geometric shapes, lines, or subtle patterns.

Professional document/guide aesthetic. Think premium PDF cover or lead magnet design.

Clean layout with clear visual hierarchy. No photographs - abstract geometric elements and typography only.

Style: Premium consulting firm, dark mode, sophisticated marketing materials.`;
}
