import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const AA_BRAND_RULES = `
You are an expert short-form content writer for Attract Acquisition (AA), a business growth consultancy.

BRAND VOICE:
- Confident, direct, no-fluff
- High value-per-second ratio
- Speaks to physical/local business owners
- Uses concrete examples and numbers
- Avoids corporate jargon and buzzwords

SCRIPT REQUIREMENTS:
- Target: 140-160 words (optimal for 60-90 second delivery)
- Start with a strong hook (pattern interrupt, bold claim, or question)
- Use short, punchy sentences
- Include 1-2 specific examples or stats
- End with a clear call-to-action or thought-provoking statement
- No emojis, no hashtags
- Write for spoken delivery (natural flow, easy to read aloud)

TOPICS TO COVER:
- Lead generation strategies
- Client acquisition systems
- Marketing fundamentals
- Business growth frameworks
- Sales psychology
- Local business marketing
`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topic, audience, style_rules } = await req.json();

    if (!openAIApiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    const userPrompt = `Generate a short-form video script for Instagram/TikTok.

${topic ? `TOPIC: ${topic}` : 'TOPIC: Choose a relevant business growth topic'}
${audience ? `TARGET AUDIENCE: ${audience}` : 'TARGET AUDIENCE: Physical/local business owners'}
${style_rules ? `ADDITIONAL STYLE: ${style_rules}` : ''}

Write ONLY the script text (no titles, no labels, no formatting). Start with the hook, then the body.
The script should be 140-160 words total and flow naturally when spoken aloud.`;

    console.log('Generating script with prompt:', userPrompt);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: AA_BRAND_RULES },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 500,
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const script = data.choices?.[0]?.message?.content?.trim();

    if (!script) {
      throw new Error('No script generated');
    }

    console.log('Generated script:', script.substring(0, 100) + '...');

    return new Response(JSON.stringify({ script }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in generate-script function:', message);
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
