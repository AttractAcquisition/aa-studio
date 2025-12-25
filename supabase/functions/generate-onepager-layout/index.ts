import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { script, hook, series, audience, templateId } = await req.json();

    if (!script) {
      return new Response(
        JSON.stringify({ error: 'script is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Generating one-pager layout. Template: ${templateId || 'auto'}, Script length: ${script.length}`);

    // Build the system prompt with schema
    const systemPrompt = `You are a content layout expert. Generate a structured one-pager layout in JSON format.

IMPORTANT: Return ONLY valid JSON, no markdown, no explanation, just the JSON object.

The JSON must follow this exact schema:
{
  "version": 1,
  "meta": {
    "title": "string (the main title/hook)",
    "audience": "string (target audience)",
    "readTime": "string (e.g., '~3 min read')",
    "tag": "string (e.g., 'Framework', 'Playbook', 'Audit')"
  },
  "sections": [
    {
      "id": "beat_1",
      "beatNumber": 1,
      "heading": "Section Heading",
      "blocks": [
        // One or more blocks from the allowed types below
      ]
    }
  ],
  "footer": { "text": "optional footer text" }
}

ALLOWED BLOCK TYPES:
1. Card: { "type": "card", "title": "string", "bullets": ["string", "string"] }
2. Checklist: { "type": "checklist", "title": "optional string", "items": ["string", "string"] }
3. Steps: { "type": "steps", "title": "optional string", "steps": ["string", "string"] }
4. Template: { "type": "template", "title": "string", "lines": ["string", "string"] }
5. Table: { "type": "table", "title": "optional string", "columns": ["Col1", "Col2"], "rows": [["val1", "val2"]] }
6. Scorecard: { "type": "scorecard", "title": "string", "rows": [{ "label": "string", "value": "Low/Med/High" }] }
7. Mini Bar Chart: { "type": "mini_bar_chart", "title": "optional string", "data": [{ "name": "string", "value": number }] }
8. Warning: { "type": "warning", "title": "optional string", "text": "string" }
9. CTA Buttons: { "type": "cta_buttons", "primary": { "label": "string", "actionText": "string" }, "secondary": { "label": "string", "actionText": "string" } }

RULES:
- Create 3-5 sections (beats) based on the script content
- Each section should have 1-3 blocks maximum
- Match blocks to content type (use checklists for action items, tables for comparisons, etc.)
- Always end with a CTA buttons block in the final section
- Keep text concise and actionable
- Use the script's structure to determine section breaks`;

    // Build template hint
    let templateHint = '';
    if (templateId && templateId !== 'auto') {
      const templateDescriptions: Record<string, string> = {
        'definition-steps': 'Use Definition + Steps + Checklist format: explain concept, show steps, add quick wins',
        'problem-fix': 'Use Problem → Fix format: show the problem with warning, explain solution, include before/after table',
        'framework-scorecard': 'Use Framework + Scorecard format: multiple pillar cards, self-rating scorecard, action checklist',
        'playbook': 'Use Playbook format: overview card, detailed steps, copy-paste template block',
        'audit-sheet': 'Use Audit format: checklist for self-audit, mini bar chart for metrics, priority scorecard',
      };
      templateHint = templateDescriptions[templateId] || '';
    }

    const userPrompt = `Generate a one-pager layout for this content:

TITLE/HOOK: ${hook || 'Content Guide'}
SERIES: ${series || 'General'}
AUDIENCE: ${audience || 'Business Owners'}
${templateHint ? `\nTEMPLATE STYLE: ${templateHint}` : ''}

SCRIPT CONTENT:
${script}

Return ONLY the JSON object, nothing else.`;

    // Call Lovable AI Gateway
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content returned from AI');
    }

    console.log('Raw AI response:', content.substring(0, 500));

    // Parse JSON from response (handle potential markdown wrapping)
    let layoutJson;
    try {
      // Try to extract JSON from markdown code blocks if present
      let jsonStr = content.trim();
      if (jsonStr.startsWith('```')) {
        const match = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (match) {
          jsonStr = match[1].trim();
        }
      }
      layoutJson = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      return new Response(
        JSON.stringify({ 
          error: 'AI returned invalid JSON', 
          raw: content.substring(0, 1000) 
        }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Successfully parsed layout JSON');

    return new Response(
      JSON.stringify({ layout: layoutJson }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating one-pager layout:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
