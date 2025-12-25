/**
 * Build an on-brand proof card prompt for AA Studio
 * Uses AA brand rules: deep ink background, purple accents, bold typography, minimal layout
 */

interface ProofCardData {
  headline: string;
  metric?: string;
  timeframe?: string;
  clientName?: string;
  industry?: string;
}

interface BrandPreset {
  logo_url?: string;
  font_primary?: string;
  prompt_rules?: string;
  preset_json?: Record<string, any>;
}

// AA Brand defaults
const AA_BRAND_DEFAULTS = {
  backgroundColor: "#0B0F19", // deep ink
  accentColor: "#6A00F4",     // purple
  textColor: "#FFFFFF",
  fontPrimary: "Inter",
  fontSecondary: "Space Grotesk",
};

export function buildProofCardPrompt(
  proofData: ProofCardData,
  brandPreset?: BrandPreset | null
): string {
  const { headline, metric, timeframe, clientName, industry } = proofData;
  
  // Build the content description
  const contentParts: string[] = [];
  
  if (headline) {
    contentParts.push(`Main headline text: "${headline}"`);
  }
  
  if (metric) {
    contentParts.push(`Key metric displayed prominently: "${metric}"`);
  }
  
  if (timeframe) {
    contentParts.push(`Timeframe label: "${timeframe}"`);
  }
  
  if (clientName) {
    contentParts.push(`Client/attribution: "${clientName}"`);
  }
  
  if (industry) {
    contentParts.push(`Industry context: ${industry}`);
  }

  // Use brand preset rules if available, otherwise use AA defaults
  const customRules = brandPreset?.prompt_rules || "";
  const presetJson = brandPreset?.preset_json as Record<string, any> | undefined;
  const fontPrimary = brandPreset?.font_primary || presetJson?.font_primary || AA_BRAND_DEFAULTS.fontPrimary;

  const prompt = `Create a professional proof card design for social media with the following specifications:

BRAND IDENTITY:
- Deep ink/navy background color (#0B0F19)
- Electric purple accent color (#6A00F4) for highlights and emphasis
- High contrast Klarna-style aesthetic
- Clean, minimal, modern look

LAYOUT & COMPOSITION:
- Minimal grid layout with lots of whitespace
- Bold, impactful typography hierarchy
- No clutter or busy backgrounds
- No photorealistic backgrounds or stock imagery
- Simple geometric accents if any decoration is used
- Card-style presentation

TYPOGRAPHY:
- Use ${fontPrimary} or similar bold sans-serif font
- Headline should be large and bold, maximum impact
- Short lines, easy to read at a glance
- White text on dark background for primary content
- Purple (#6A00F4) for accent text or highlights

CONTENT TO DISPLAY:
${contentParts.map(part => `- ${part}`).join('\n')}

STYLE:
- "PROOF" or "RESULT" label badge in the design
- Subtle glow or gradient effects using the purple accent
- Professional, trust-building aesthetic
- Instagram/social media ready format
${customRules ? `\nADDITIONAL BRAND RULES:\n${customRules}` : ''}

OUTPUT:
Square format (1:1 aspect ratio), suitable for Instagram feed post. The design should look like a premium, branded proof card that showcases client results.`;

  return prompt;
}
