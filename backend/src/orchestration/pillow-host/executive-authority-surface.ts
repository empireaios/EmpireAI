/**
 * Deterministic authority surface for Birth / live-commerce questions.
 * Documents and LLM prose cannot grant live permissions while NOT_BORN.
 */
import { canonicalOperatingProjection } from "./executive-fact-precedence.js";

function isDirectAuthorityStatusAsk(message: string): boolean {
  const sentences = message.trim().split(/[?.!]+/).map((part) => part.trim()).filter(Boolean);
  const first = (sentences.shift() ?? "").replace(/^pillow,?\s+/i, "").replace(/^please\s+/i, "");
  const direct = /^(?:what (?:is|are) your (?:current )?(?:authority|permissions)|what permissions do you (?:currently )?have|what are you (?:currently )?authori[sz]ed to do|(?:tell me|explain|state) your (?:current )?(?:authority|permissions))(?: (?:right now|now|currently))?$/i.test(first);
  // Extra tasks must keep their normal reasoning path; only non-action/probe qualifiers are allowed.
  return direct && sentences.every((part) =>
    /^(?:do not execute tools, commerce or spending|this is a bounded engineering transport test)$/i.test(part));
}

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
  // Exact-line checkpoint / contribution contracts own Birth lines — do not short-circuit.
  if (
    /Checkpoint\s+token/i.test(t) ||
    /Total\s+synthetic\s+contribution/i.test(t) ||
    (/\bEligible\s+candidates\b/i.test(t) && /\bCandidate\s+selected\b/i.test(t))
  ) {
    return false;
  }
  const asksBirth = /\bbirth\s+status\b/i.test(t) || /\bwhat is birth\b/i.test(t);
  const asksMode = /\boperating\s+mode\b/i.test(t);
  const asksAuth =
    /\breal[- ]?commerce\s+(?:authori[sz]ed|authority)\b/i.test(t) ||
    /\bis real commerce authori/i.test(t);
  // Short factual asks only — do not hijack long strategy prompts.
  if (t.length > 280) return false;
  return asksBirth || asksMode || asksAuth || isDirectAuthorityStatusAsk(t);
}

export function projectOperatingAuthorityFacts(message: string): {
  ok: true;
  message: string;
  kind: "authority_facts";
} {
  const ops = canonicalOperatingProjection();
  const t = String(message || "");
  const directAuthorityAsk = isDirectAuthorityStatusAsk(t);
  const lines: string[] = [];
  if (directAuthorityAsk || /\bbirth\b/i.test(t)) {
    lines.push(`Birth status: ${ops.birthStatus}.`);
  }
  if (directAuthorityAsk || /\boperating\s+mode\b/i.test(t) || lines.length === 0) {
    lines.push(`Operating mode: ${ops.operatingMode}.`);
  }
  if (directAuthorityAsk || /\breal[- ]?commerce|authori/i.test(t)) {
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
