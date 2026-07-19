/**
 * Executive conversational query routing (T-Series production reality).
 * Shared by G4-07/G4-09 Brain fallback and Pillow host production chat.
 */

export type ExecutiveQueryKind =
  | "screen"
  | "cursor"
  | "blocker"
  | "alert"
  | "health"
  | "metric"
  | "recommend"
  | "general";

const SCREEN_PATTERNS = [
  /what am i looking at/i,
  /what (am i|are we) (viewing|on|seeing)/i,
  /can you see my screen/i,
  /see my screen/i,
  /what is this page/i,
  /what page (am i|is this)/i,
  /what should i click/i,
  /explain this (page|screen|panel|error)/i,
  /what('s| is) (on|in) (this|the) (screen|page)/i,
  /describe (this|the) (screen|page|view)/i,
];

const CURSOR_PATTERNS = [
  /help.*cursor/i,
  /cursor help/i,
  /with cursor/i,
  /cursor (assist|assistance|status|mission|progress|output|build|fail)/i,
  /explain cursor/i,
  /resume.*mission/i,
  /build fail/i,
  /implementation progress/i,
];

const BLOCKER_PATTERNS = [
  /biggest blocker/i,
  /top blocker/i,
  /what should i do next/i,
  /next (executive )?action/i,
  /recommend next/i,
  /highest priority/i,
  /what('s| is) blocking/i,
];

const ALERT_PATTERNS = [/why is this alert/i, /explain (this |the )?alert/i, /what alert/i];

const HEALTH_PATTERNS = [
  /health/i,
  /supplier/i,
  /marketplace/i,
  /engine health/i,
];

const METRIC_PATTERNS = [/revenue/i, /metric/i, /kpi/i, /proof-001/i];

const FOLLOW_UP_PATTERNS = [
  /^tell me more\.?$/i,
  /^why\??$/i,
  /^continue\.?$/i,
  /^explain\.?$/i,
  /^fix it\.?$/i,
  /^do it\.?$/i,
  /can you simplify/i,
  /make that shorter/i,
  /three bullets/i,
  /^go on\.?$/i,
  /^and\??$/i,
  /what did i (say|ask|mean)/i,
  /what codeword/i,
  /what code did i/i,
  /remember/i,
  /^good morning/i,
  /^hi pillow/i,
  /^thanks\.?$/i,
];

export function isExecutiveFollowUpQuery(query: string): boolean {
  const q = query.trim();
  if (!q) return false;
  return FOLLOW_UP_PATTERNS.some((p) => p.test(q));
}

export function isAmbiguousExecutiveRequest(query: string): boolean {
  const q = query.trim();
  return /^(fix it|do it|continue|explain)\.?$/i.test(q);
}

export function classifyExecutiveQuery(query: string): ExecutiveQueryKind {
  const q = query.trim();
  if (!q) return "general";

  if (BLOCKER_PATTERNS.some((p) => p.test(q))) return "blocker";
  if (SCREEN_PATTERNS.some((p) => p.test(q))) return "screen";
  if (CURSOR_PATTERNS.some((p) => p.test(q))) return "cursor";
  if (ALERT_PATTERNS.some((p) => p.test(q))) return "alert";
  if (HEALTH_PATTERNS.some((p) => p.test(q))) return "health";
  if (METRIC_PATTERNS.some((p) => p.test(q))) return "metric";
  if (/recommend/i.test(q)) return "recommend";

  return "general";
}

/** Production chat should run full Pillow pipelines for executive conversational queries. */
export function shouldRunConversationalPipeline(query: string): boolean {
  const kind = classifyExecutiveQuery(query);
  if (kind !== "general") return true;
  if (isExecutiveFollowUpQuery(query)) return true;
  if (/\b(what|how|why|explain|describe|help|can you|tell me|where am i|remember|summar|compare|should i|good morning|quick check)\b/i.test(query)) {
    return true;
  }
  // Natural-language executive chat (not terse system commands)
  const trimmed = query.trim();
  if (trimmed.length >= 8 && /[a-zA-Z]{3,}/.test(trimmed) && !/^[a-z0-9_-]+\.[a-z]+$/i.test(trimmed)) {
    return true;
  }
  return false;
}

export function mapExecutiveQueryToCockpitIntent(
  query: string,
): import("./cockpit-interaction-layer.js").CockpitInteractionIntent {
  switch (classifyExecutiveQuery(query)) {
    case "screen":
      return "explain_screen";
    case "cursor":
      return "explain_cursor";
    case "blocker":
    case "recommend":
      return "recommend_next_action";
    case "alert":
      return "explain_alert";
    case "health":
      return "explain_engine_health";
    case "metric":
      return "explain_metric";
    default:
      return "explain_panel";
  }
}

export function conversationalResponsePolicy(query: string): string {
  const kind = classifyExecutiveQuery(query);
  if (kind === "screen") {
    return "Answer the Grand King's question about what they are viewing using the active screen context first. Describe the page, panels, and purpose. Do not lead with certification blockers unless explicitly asked.";
  }
  if (kind === "cursor") {
    return "Answer as Pillow Engineering Chief for Cursor. Explain Cursor state, recommended actions, mission progress, or build failures. Do not substitute a generic executive blocker for Cursor guidance.";
  }
  if (kind === "blocker" || kind === "recommend") {
    return "Answer with the highest-priority executive action and supporting evidence.";
  }
  if (isAmbiguousExecutiveRequest(query)) {
    return "The request is ambiguous. Ask one concise clarifying question about what the Grand King wants fixed, explained, or continued — use prior turns if present. Do not trigger web search or generic blocker lists.";
  }
  if (isExecutiveFollowUpQuery(query)) {
    return "This is a follow-up to the prior turn. Answer using the conversation history first, then screen context if needed. Do not restart with unrelated certification blockers.";
  }
  return "Answer the Grand King's exact question first using available screen and operational context. Mention certification blockers only when relevant to the question.";
}
