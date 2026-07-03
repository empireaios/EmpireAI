import type { UxChangeCategory, UxDesignIntent, UxDesignStyle } from "./types.js";

const STYLE_PATTERNS: Array<{ style: UxDesignStyle; patterns: RegExp[] }> = [
  { style: "apple_clean", patterns: [/apple/i, /sf pro/i, /ios/i] },
  { style: "futuristic_neon", patterns: [/neon/i, /futuristic/i, /cyber/i, /glow/i] },
  { style: "premium_minimal", patterns: [/premium/i, /luxury/i, /minimal/i, /refined/i] },
  { style: "high_contrast", patterns: [/readability/i, /contrast/i, /accessible/i, /larger text/i] },
];

const CATEGORY_PATTERNS: Array<{ category: UxChangeCategory; patterns: RegExp[] }> = [
  { category: "colour", patterns: [/colour|color|pink|darker|lighter|palette|gold|background/i] },
  { category: "spacing", patterns: [/spacing|padding|margin|gap|whitespace|further left|move.*left|move.*right/i] },
  { category: "layout", patterns: [/layout|move|align|grid|column|sidebar|dashboard/i] },
  { category: "typography", patterns: [/font|text size|typography|readability|heading/i] },
  { category: "component", patterns: [/card|button|panel|replace|widget|component/i] },
  { category: "navigation", patterns: [/nav|menu|sidebar|tab/i] },
  { category: "animation", patterns: [/animation|transition|motion|fade/i] },
  { category: "responsive", patterns: [/mobile|responsive|tablet|breakpoint/i] },
  { category: "accessibility", patterns: [/accessibility|a11y|contrast|screen reader/i] },
  { category: "branding", patterns: [/brand|logo|premium|executive|grand king/i] },
];

export function parseUxIntent(request: string, screenPath?: string): UxDesignIntent {
  const normalized = request.trim();
  const categories = new Set<UxChangeCategory>();
  let styleHint: UxDesignStyle | null = null;

  for (const { category, patterns } of CATEGORY_PATTERNS) {
    if (patterns.some((p) => p.test(normalized))) categories.add(category);
  }
  if (categories.size === 0) categories.add("layout");

  for (const { style, patterns } of STYLE_PATTERNS) {
    if (patterns.some((p) => p.test(normalized))) {
      styleHint = style;
      break;
    }
  }
  if (/pink/i.test(normalized)) styleHint = "custom";

  const keywords = extractKeywords(normalized);
  const targetScreen = inferTargetScreen(normalized, screenPath);

  const summary = [
    `UX change request: ${categories.size > 0 ? [...categories].join(", ") : "general"}`,
    targetScreen ? `Target: ${targetScreen}` : "Target: current screen",
    styleHint ? `Style: ${styleHint}` : null,
  ]
    .filter(Boolean)
    .join(". ");

  return {
    rawRequest: request,
    targetScreen,
    categories: [...categories],
    styleHint,
    keywords,
    summary,
  };
}

function extractKeywords(text: string): string[] {
  const found = text.toLowerCase().match(
    /\b(homepage|home|dashboard|cockpit|pillow|storefront|login|sidebar|card|pink|gold|spacing|premium|neon|apple)\b/g,
  );
  return [...new Set(found ?? [])];
}

function inferTargetScreen(text: string, screenPath?: string): string | null {
  if (/homepage|executive home|home page/i.test(text)) return "/cockpit";
  if (/storefront|store engine/i.test(text)) return "/cockpit/commerce/store";
  if (/pillow|development/i.test(text)) return "/cockpit/development/pillow";
  if (/login/i.test(text)) return "/login";
  if (/mission/i.test(text)) return "/cockpit/missions";
  if (/dashboard/i.test(text) && !screenPath) return "/cockpit";
  return screenPath ?? null;
}
