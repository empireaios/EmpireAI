/**
 * Grand King conversation surface.
 *
 * Internal epistemic machinery stays internal.
 * Normal chat: natural executive language.
 * Progressive disclosure: evidence → technical only on request.
 *
 * Does not encode sealed examination Q&A.
 */

export type DisclosureLevel = "normal" | "evidence" | "technical";

export type ExecutiveTaskIntent =
  | "state"
  | "inference"
  | "strategy"
  | "uncertainty"
  | "evidence_request"
  | "technical_request"
  | "general";

const INTERNAL_ENUM =
  /\b(CURRENT_VERIFIED|TOOL_ATTESTED|OWNER_SUPPLIED|HISTORICAL_VERIFIED|RUNTIME_VERIFIED|MODEL_INFERENCE|RetrievalAttestationLedger|CAPABILITY_REGISTRY|UNATTESTED_RETRIEVAL_CLAIM|INVENTED_SOURCE_SYSTEM)\b/gi;

const RAW_FIELD_LEAK =
  /\b(deployGitCommitSha|commissioningId|cursorSelected|selectionAuthority|realisedRevenueUsd|gitCommitSha|requestId|capabilityId|attestationId)\s*=\s*[^\s.;,)]+/gi;

const RAW_FIELD_NAME =
  /\b(deployGitCommitSha|commissioningId|cursorSelected|selectionAuthority|realisedRevenueUsd|request-scoped attestation)\b/gi;

const EPISTEMIC_PREAMBLE =
  /^I can only release claims that survive[^.]*\.\s*/i;

const AUTHORITY_BOILERPLATE =
  /\s*Authority boundary[^.]*\.\s*|I cannot autonomously publish, spend, authorise Birth, or execute production deploys from this chat\.?/gi;

const UNKNOWN_ROBOT =
  /\bUNKNOWN is the correct executive state for those claims\.?/gi;

const CLAIMS_REMAIN_UNKNOWN =
  /\bClaims requiring (?:those|such) sources remain UNKNOWN\.?/gi;

export function detectDisclosureLevel(userMessage: string | undefined): DisclosureLevel {
  const m = userMessage ?? "";
  if (
    /\b(technical evidence|raw (?:evidence|provenance|fields?)|deploy\s*sha|commissioning\s*id|attestation|capability\s*id|show me exactly where|dump (?:the )?(?:runtime|internal) state)\b/i.test(
      m,
    )
  ) {
    return "technical";
  }
  if (
    /\b(how do you know|show me the evidence|where did (?:that|this) come from|prove it|what(?:'s| is) the (?:source|provenance)|evidence for)\b/i.test(
      m,
    )
  ) {
    return "evidence";
  }
  return "normal";
}

export function detectExecutiveTaskIntent(userMessage: string | undefined): ExecutiveTaskIntent {
  const m = userMessage ?? "";
  const level = detectDisclosureLevel(m);
  if (level === "technical") return "technical_request";
  if (level === "evidence") return "evidence_request";
  if (
    /\b(infer|inference|hypothesis|suspect|what do you think|best assessment|what does (?:this|that) (?:suggest|imply)|separate inference|meaningful claim you suspect)\b/i.test(
      m,
    )
  ) {
    return "inference";
  }
  if (
    /\b(what should (?:we|i) do|recommend|strategy|priorit|next (?:step|move)|play to win|which (?:product|option)|would you choose)\b/i.test(
      m,
    )
  ) {
    return "strategy";
  }
  if (
    /\b(what (?:don'?t|do not) we know|uncertain|uncertainty|unknown|missing evidence|what would falsify|disconfirm)\b/i.test(
      m,
    )
  ) {
    return "uncertainty";
  }
  if (
    /\b(where are we|current state|status|what is verified|facts only|operating posture)\b/i.test(m)
  ) {
    return "state";
  }
  return "general";
}

export function isLabeledInferenceOrHypothesis(text: string): boolean {
  return /\b(i\s+(?:infer|suspect|think|assess|believe)|my\s+(?:best\s+)?(?:assessment|view|read)|inference(?:\s+only)?|hypothesis|as\s+a\s+hypothesis|treat(?:ing)?\s+(?:this|it|that)\s+as\s+(?:a\s+)?(?:hypothesis|inference)|probably|likely|may\s+be|might\s+be|not\s+(?:yet\s+)?(?:proven|established|verified)|unverified)\b/i.test(
    text,
  );
}

/** Strip internal machinery from GK-facing text according to disclosure level. */
export function renderForGrandKing(
  text: string,
  level: DisclosureLevel = "normal",
  opts: { allowAuthorityNotice?: boolean } = {},
): string {
  let out = text.trim();
  if (!out) return out;

  if (level === "technical") {
    return out.replace(EPISTEMIC_PREAMBLE, "").replace(/\s{2,}/g, " ").trim();
  }

  out = out.replace(EPISTEMIC_PREAMBLE, "");
  out = out.replace(INTERNAL_ENUM, "");
  out = out.replace(RAW_FIELD_LEAK, "");
  out = out.replace(RAW_FIELD_NAME, "");
  out = out.replace(UNKNOWN_ROBOT, "");
  out = out.replace(CLAIMS_REMAIN_UNKNOWN, "I don't have enough evidence from those sources yet.");
  out = out.replace(/\(\s*;\s*/g, "(").replace(/\s*;\s*\)/g, ")");
  out = out.replace(/\(\s*\)/g, "");
  out = out.replace(/\s{2,}/g, " ").replace(/\s+\./g, ".");

  if (level === "normal" && !opts.allowAuthorityNotice) {
    out = out.replace(AUTHORITY_BOILERPLATE, " ");
  }

  // Soften remaining robotic UNKNOWN tokens in normal mode.
  if (level === "normal") {
    out = out.replace(/\bremain UNKNOWN\b/gi, "remain unproven");
    out = out.replace(/\bis UNKNOWN\b/gi, "isn't established yet");
    out = out.replace(/\bas UNKNOWN\b/gi, "as unproven");
    out = out.replace(/\bUNKNOWN\b/g, "unproven");
  }

  out = out.replace(/\s{2,}/g, " ").replace(/\s+([,.;:!?])/g, "$1").trim();
  return out;
}

export type NaturalReconstructInput = {
  productName: string | null;
  asin: string | null;
  orders: number;
  realisedRevenueUsd: number;
  birthTimestamp: string | null;
  live: boolean;
  intent: ExecutiveTaskIntent;
  level: DisclosureLevel;
  hadProvenanceViolation: boolean;
  hadTemporalViolation: boolean;
};

/**
 * Natural, task-sensitive fallback when surgical repair cannot preserve the draft.
 * Speaks like an executive partner — not an audit dump.
 */
export function buildNaturalExecutiveFallback(input: NaturalReconstructInput): string {
  const product =
    input.productName ??
    (input.asin ? `the bound product (${input.asin})` : "our bound product");
  const noSales = input.orders === 0 && input.realisedRevenueUsd === 0;
  const liveLine = input.live
    ? "EmpireAI is live and answering you in production right now."
    : "I'm answering through the active Brain process.";

  if (input.level === "technical") {
    return [
      liveLine,
      input.asin ? `Bound ASIN ${input.asin}${input.productName ? ` (${input.productName})` : ""}.` : "No bound product ASIN is available.",
      `Realised orders=${input.orders}; realised revenue USD=${input.realisedRevenueUsd}.`,
      `Birth timestamp=${input.birthTimestamp ?? "NULL"}.`,
      "I did not retrieve external unattested systems this turn.",
    ].join(" ");
  }

  if (input.intent === "inference" || input.intent === "uncertainty") {
    const parts = [
      liveLine,
      `Our current product focus is ${product}.`,
      noSales
        ? "We haven't made a first sale yet — realised revenue is still zero."
        : `We have some realised commerce on record (orders=${input.orders}).`,
      "My best assessment is that we still lack proof of demand strength; I treat that as a hypothesis, not an established fact.",
      "What would change my mind: clear realised sales traction or independent demand evidence I can actually retrieve.",
      "Next verification: gather demand signals through channels we genuinely have before scaling spend.",
    ];
    if (input.hadProvenanceViolation) {
      parts.push(
        "I won't invent reports or systems I didn't retrieve — if I don't have the source, I'll say so.",
      );
    }
    return parts.join(" ");
  }

  if (input.intent === "strategy") {
    return [
      liveLine,
      `We're focused on ${product}.`,
      noSales
        ? "Because we haven't proven demand with a first sale yet, I wouldn't scale spend or publish aggressively on hope alone."
        : "We have early realised commerce, so next moves should protect that signal and deepen it.",
      "Recommendation: prioritise cheap demand verification before irreversible spend — that's a judgment call under uncertainty, not a proven law.",
      "If you want, I can walk through the evidence behind that view.",
    ].join(" ");
  }

  if (input.intent === "evidence_request") {
    return [
      "Here's what I can actually stand on right now:",
      liveLine,
      `Product focus: ${product}.`,
      noSales
        ? "Commerce evidence: no realised sales yet."
        : `Commerce evidence: orders=${input.orders}, realised revenue about ${input.realisedRevenueUsd} USD.`,
      "I didn't pull external project tools, email inboxes, or market-analysis systems this turn — so anything beyond that is either labeled judgment or still open.",
    ].join(" ");
  }

  // state / general
  const parts = [
    liveLine,
    `We're focused on ${product}.`,
    noSales
      ? "We haven't made our first sale yet."
      : `Realised orders so far: ${input.orders}.`,
  ];
  if (input.hadTemporalViolation) {
    parts.push(
      "Older notes about waiting to go live are out of date — we're already serving you.",
    );
  }
  if (input.birthTimestamp == null) {
    parts.push("Birth hasn't been authorised yet.");
  }
  return parts.join(" ");
}

/** UX quality checks for released Grand King text (normal disclosure). */
export function assessConversationalUx(text: string): {
  ok: boolean;
  failures: string[];
} {
  const failures: string[] = [];
  if (INTERNAL_ENUM.test(text)) failures.push("INTERNAL_ENUM_LEAKAGE");
  INTERNAL_ENUM.lastIndex = 0;
  if (RAW_FIELD_LEAK.test(text) || /\bdeployGitCommitSha\b/i.test(text)) {
    failures.push("RAW_RUNTIME_FIELD_LEAKAGE");
  }
  RAW_FIELD_LEAK.lastIndex = 0;
  if (/\bcommissioningId\s*=/i.test(text)) failures.push("UNNECESSARY_DATABASE_ID_LEAKAGE");
  if (EPISTEMIC_PREAMBLE.test(text) || /^I can only release claims/i.test(text)) {
    failures.push("EPISTEMIC_BOILERPLATE");
  }
  EPISTEMIC_PREAMBLE.lastIndex = 0;
  if (/Authority boundary \(CURRENT_VERIFIED\)/i.test(text)) {
    failures.push("AUTHORITY_BOILERPLATE");
  }
  if (/UNKNOWN is the correct executive state/i.test(text)) {
    failures.push("ROBOTIC_UNKNOWN");
  }
  return { ok: failures.length === 0, failures };
}
