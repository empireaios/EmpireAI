/**
 * Deterministic authority surface for Birth / live-commerce questions.
 * Documents and LLM prose cannot grant live permissions while NOT_BORN.
 */
import { canonicalOperatingProjection } from "./executive-fact-precedence.js";

export function isLiveCommerceEffectAsk(message: string): boolean {
  const t = String(message || "");
  if (!/\b(?:live|real|amazon|marketplace|ads?|listing|purchase|order|payment|spend)\b/i.test(t)) {
    return false;
  }
  const effect =
    /\b(?:create|place|publish|buy|purchase|spend|launch|run|start|allocate)\b/i.test(t) &&
    /\b(?:listing|listings|ad(?:vertis(?:e|ing|ement))?|ads|purchase|order|payment|buy)\b/i.test(t);
  const explicitLive =
    /\blive\b/i.test(t) ||
    /\breal\s+commerce\b/i.test(t) ||
    /\bamazon\s+us\b/i.test(t) ||
    /\breal\s+(?:listing|purchase|order|ad)/i.test(t);
  return effect && explicitLive;
}

export function projectLiveCommerceRefusal(message: string): {
  ok: true;
  message: string;
  kind: "authority_refusal";
} {
  const ops = canonicalOperatingProjection();
  void message;
  return {
    ok: true,
    kind: "authority_refusal",
    message: [
      `Refused: live commerce effects are blocked.`,
      `Birth status: ${ops.birthStatus}. Operating mode: ${ops.operatingMode}.`,
      `Real-commerce authority: ${ops.realCommerceAuthorityLabel}.`,
      `Analytical / SYNTHETIC evaluation remains available; no listing, purchase, ad spend, or payment will be executed.`,
    ].join("\n"),
  };
}

export function isOperatingAuthorityFactAsk(message: string): boolean {
  const t = String(message || "");
  const asksBirth = /\bbirth\s+status\b/i.test(t) || /\bwhat is birth\b/i.test(t);
  const asksMode = /\boperating\s+mode\b/i.test(t);
  const asksAuth =
    /\breal[- ]?commerce\s+(?:authori[sz]ed|authority)\b/i.test(t) ||
    /\bis real commerce authori/i.test(t);
  // Short factual asks only — do not hijack long strategy prompts.
  if (t.length > 280) return false;
  return asksBirth || asksMode || asksAuth;
}

export function projectOperatingAuthorityFacts(message: string): {
  ok: true;
  message: string;
  kind: "authority_facts";
} {
  const ops = canonicalOperatingProjection();
  const t = String(message || "");
  const lines: string[] = [];
  if (/\bbirth\b/i.test(t)) {
    lines.push(`Birth status: ${ops.birthStatus}.`);
  }
  if (/\boperating\s+mode\b/i.test(t) || lines.length === 0) {
    lines.push(`Operating mode: ${ops.operatingMode}.`);
  }
  if (/\breal[- ]?commerce|authori/i.test(t)) {
    lines.push(
      `Real commerce authorized: ${ops.realCommerceAuthorized ? "yes" : "no"} (${ops.realCommerceAuthorityLabel}).`,
    );
  }
  return {
    ok: true,
    kind: "authority_facts",
    message: lines.join(" "),
  };
}
