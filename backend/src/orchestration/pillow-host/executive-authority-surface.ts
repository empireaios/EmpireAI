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

/** Admission classification only. This never grants execution authority.
 * Interpret each proposition locally: analytical predicates and unconditional
 * prohibitions are not instructions to execute their embedded action verbs.
 * An independent positive action remains blocked even beside a safe disclaimer.
 * Actual tools/writes retain their independent locked runtime checks.
 */
export function isLiveCommerceEffectAsk(message: string): boolean {
  const action = /\b(?:create|place|publish|buy|purchase|pay|spend|launch|run|start|allocate|send|transfer|submit|execute|write|update|delete)\b/i;
  const effectObject = /\b(?:listings?|ads?|advertisements?|campaigns?|purchases?|orders?|payments?|funds|money|inventory|products?|stock|goods|supplier|marketplace|external|commerce)\b|[$€£]/i;
  const units = String(message || "").replace(/[’]/g, "'")
    .split(/[.!?;\n]+|,\s*(?=(?:please\s+)?(?:publish|purchase|pay|spend|send|execute|write|update|delete)\b)|\b(?:but|however|then)\b|,?\s+and\s+(?=(?:please\s+)?(?:create|place|publish|buy|purchase|pay|spend|launch|run|start|allocate|send|transfer|submit|execute|write|update|delete)\b)/i);
  return units.some((unit) => {
    const text = unit.trim().replace(/^[*#>\s-]+/, "");
    const verb = action.exec(text);
    if (!verb || !effectObject.test(text.slice(verb.index))) return false;
    const before = text.slice(0, verb.index);
    // Conditional/exception denials cannot erase a positive execution request.
    const exception = /\b(?:unless|except|until|once|provided|otherwise)\b/i.test(text);
    const prohibition = /\b(?:do not|don't|must not|shall not|will not|won't|cannot|can't|never)\s+(?:actually\s+|ever\s+)?$/i.test(before);
    if (prohibition && !exception) return false;
    // These predicates request a judgment, explanation or model of an action.
    // No global "hypothetical" flag: a separate execution clause is still checked.
    const analytical = /^(?:(?:pillow|please)[,:]?\s+)*(?:analy[sz]e|assess|evaluate|compare|explain|discuss|review|calculate|estimate|model|simulate|describe|recommend|consider|reason about|advise (?:on|whether)|decide whether|should (?:we|i)|what (?:if|would|are|is)|how (?:would|could|should)|whether)\b/i.test(text);
    const delegation = /\b(?:and|also)\s+(?:you\s+)?(?:must|should|will|can|could|please)\b|\b(?:go ahead|carry out|do it|execute it)\b/i.test(text);
    if (analytical && !delegation) return false;
    const analyticalArtifact = /^(?:create|write|run|prepare)\s+(?:(?:a|an|the)\s+)?(?:report|analysis|comparison|simulation|model|forecast|recommendation|explanation|plan)\b/i.test(text.slice(verb.index));
    if (analyticalArtifact && !delegation) return false;
    // Only explicit counterfactual questions are nonexecuting here; a
    // condition alone never licenses the action in its consequent.
    if (/^if\b/i.test(text) && /,\s*(?:what|how|would|should|could)\b/i.test(text) && !delegation) return false;
    return true;
  });
}

export function projectLiveCommerceRefusal(message: string): {
  ok: true;
  message: string;
  kind: "authority_refusal";
  brainCompleted: false;
  semanticSuccess: false;
  reasoningFailure: { code: "LIVE_COMMERCE_REFUSED"; retryable: false };
} {
  const ops = canonicalOperatingProjection();
  void message;
  return {
    ok: true,
    kind: "authority_refusal",
    brainCompleted: false,
    semanticSuccess: false,
    reasoningFailure: { code: "LIVE_COMMERCE_REFUSED", retryable: false },
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
