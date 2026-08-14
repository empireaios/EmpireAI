/**
 * Executive decision-quality layer.
 *
 * Prevents: verified goal → unsupported certainty about a particular solution.
 * Supports: ACT_NOW | ACT_CONDITIONALLY | VERIFY_THEN_ACT | DEFER
 * (internal postures only — never dump enum names into Grand King chat).
 *
 * Entity-agnostic. No sealed T1 / product-specific answer dictionaries.
 */

import type { ExecutiveTruthSnapshot } from "./executive-truth-types.js";

export type DecisionPosture =
  | "ACT_NOW"
  | "ACT_CONDITIONALLY"
  | "VERIFY_THEN_ACT"
  | "DEFER";

export type DecisionQualityResult = {
  violations: string[];
  posture: DecisionPosture | null;
  materialUnknowns: string[];
  hasStrongRecommendation: boolean;
  hasConditionalFraming: boolean;
  hasVerifyFirstFraming: boolean;
};

/** Strong, specific solution actions (not mere goals like "make progress"). */
const STRONG_SPECIFIC_ACTION =
  /\b(?:launch(?:ing)?|publish(?:ing)?|go\s+live\s+with|roll\s+out|scale\s+(?:spend|ads|advertising)|increase\s+(?:ad\s+|advertising\s+)?spend|spend\s+more\s+on\s+(?:ads|advertising)|discount(?:ing)?|cut\s+prices?|migrate(?:\s+to)?|switch\s+(?:to|suppliers?|vendors?)|hire|replace\s+with|commit\s+to|immediately\s+(?:launch|publish|spend|migrate|hire|discount)|proceed\s+with\s+(?:launch|migration|hiring|spend))\b/i;

/** Unconditional urgency that treats decision as settled. */
const UNCONDITIONAL_URGENCY =
  /\b(?:we\s+should\s+(?:immediately|now)|i\s+recommend\s+(?:we\s+)?(?:immediately|now)|best\s+immediate\s+action\s+is\s+to\s+(?:launch|publish|migrate|hire|spend|discount)|therefore\s+(?:i\s+recommend\s+)?(?:we\s+)?(?:launch|publish|migrate|hire|spend|increase|discount|switch)|recommend\s+we\s+\w[\w\s]{0,40}immediately)\b/i;

/** Recommendation stance (goal→solution leap still consequential even if action verb is soft). */
const RECOMMENDATION_STANCE =
  /\b(?:i\s+recommend|we\s+should|therefore|best\s+(?:next|immediate)\s+action|must\s+(?:launch|publish|migrate|hire|spend|switch))\b/i;

/** Soft recommendation / progress goals (allowed even with unknowns). */
const PROGRESS_GOAL =
  /\b(?:commercial\s+progress|need\s+(?:revenue|sales|traction)|first\s+(?:sale|transaction)|make\s+progress|move\s+forward|get\s+to\s+market)\b/i;

/** Explicit conditionality / verify-first framing (good). */
const CONDITIONAL_FRAMING =
  /\b(?:if\s+(?:we\s+)?(?:can\s+)?(?:verify|confirm|validate|clear)|provided\s+that|contingent\s+on|only\s+if|once\s+(?:we\s+)?(?:verify|confirm)|assuming\s+(?:we\s+)?(?:verify|can\s+confirm)|conditional(?:ly)?)\b/i;

const VERIFY_FIRST_FRAMING =
  /\b(?:verify(?:ing)?\s+(?:first|before|whether)|check(?:ing)?\s+(?:first|before|whether)|before\s+(?:we\s+)?(?:launch|publish|spend|migrate|hire|commit|increase|switch|discount|replace)|validate(?:ing)?\s+(?:first|before|whether)|cheap\s+to\s+(?:check|verify)|worth\s+(?:checking|verifying)\s+first|recommend\s+verifying|(?:verify|check|validate).{0,40}\bfirst\b)\b/i;

const REVERSIBLE_BOUNDED =
  /\b(?:bounded\s+test|small\s+test|reversible|low\s+downside|cheap\s+to\s+(?:try|reverse)|pilot|limited\s+experiment)\b/i;

/** Material commercial/solution premises often left unverified. */
const MATERIAL_PREMISE_MARKERS =
  /\b(?:market\s+demand|current\s+demand|unit\s+economics|contribution\s+margin|competitive\s+(?:position|attractiveness)|supplier\s+readiness|fulfillment\s+readiness|listing\s+readiness|marketplace\s+readiness|commercial\s+viability|product[- ]market\s+fit|true\s+demand)\b/i;

const ADMITS_UNKNOWN_MATERIAL =
  /\b(?:(?:do\s+not|don't|cannot|can't|haven'?t|have\s+not)\s+(?:yet\s+)?(?:know|verified?|confirm|establish).{0,80}(?:demand|economics|viability|readiness|competit)|(?:demand|economics|viability|readiness|competit).{0,60}(?:unknown|unproven|unverified|not\s+(?:yet\s+)?(?:known|verified|established))|assumption\b.{0,80}(?:demand|economics|viability|readiness)|material(?:ly)?\s+(?:depends|dependent|assumption))\b/i;

/** Goal→solution causal leap patterns (domain-agnostic classes). */
const GOAL_SOLUTION_LEAPS: Array<{ goal: RegExp; solution: RegExp; id: string }> = [
  {
    id: "revenue_to_launch",
    goal: /\b(?:zero|no|0)\s+(?:realised\s+)?(?:orders|sales|revenue)|haven'?t\s+made\s+(?:a\s+)?first\s+sale\b/i,
    solution: /\b(?:launch|publish|go\s+live\s+with|roll\s+out)\b/i,
  },
  {
    id: "latency_to_migrate",
    goal: /\b(?:high|elevated|unacceptable)\s+latency|latency\s+is\s+(?:high|bad|poor)\b/i,
    solution: /\b(?:migrate|migration|switch\s+(?:databases?|to\s+\w+db))\b/i,
  },
  {
    id: "churn_to_discount",
    goal: /\b(?:high|elevated)\s+churn|churn\s+is\s+(?:high|elevated|bad)|customers?\s+churn\s+is\s+(?:high|elevated)|customers?\s+(?:are\s+)?churning\b/i,
    solution: /\b(?:discount|cut\s+prices?|increase\s+(?:ad\s+|advertising\s+)?spend|spend\s+more\s+on\s+(?:ads|advertising)|scale\s+(?:ads|advertising))\b/i,
  },
  {
    id: "supplier_to_switch",
    goal: /\bsupplier\s+(?:failure|failed|unreliable|cannot\s+deliver)\b/i,
    solution: /\b(?:switch\s+(?:to\s+)?(?:supplier|vendor)|replace\s+(?:the\s+)?supplier)\b/i,
  },
  {
    id: "conversion_to_ads",
    goal: /\b(?:low|poor)\s+conversion|conversion\s+(?:is\s+)?(?:low|poor)\b/i,
    solution: /\b(?:increase\s+(?:ad\s+|advertising\s+)?spend|scale\s+(?:ads|advertising)|spend\s+more\s+on\s+(?:ads|advertising)|discount|cut\s+prices?)\b/i,
  },
];

const CAUSAL_BRIDGE =
  /\b(?:because\s+(?:we\s+)?(?:verified|confirmed|measured)|given\s+(?:verified|confirmed)\s+|evidence\s+(?:shows|supports)\s+that\s+(?:this|the)\s+(?:candidate|option|product|supplier|migration)|economics\s+(?:clear|pass|support)|readiness\s+(?:is\s+)?(?:confirmed|verified))\b/i;

export function hasStrongSpecificRecommendation(text: string): boolean {
  return STRONG_SPECIFIC_ACTION.test(text) || UNCONDITIONAL_URGENCY.test(text);
}

export function hasDecisionConditionality(text: string): boolean {
  return CONDITIONAL_FRAMING.test(text) || VERIFY_FIRST_FRAMING.test(text) || REVERSIBLE_BOUNDED.test(text);
}

export function classifyDecisionPosture(text: string): DecisionPosture | null {
  if (!hasStrongSpecificRecommendation(text) && !PROGRESS_GOAL.test(text)) {
    return null;
  }
  if (VERIFY_FIRST_FRAMING.test(text) && hasStrongSpecificRecommendation(text)) {
    return "VERIFY_THEN_ACT";
  }
  if (CONDITIONAL_FRAMING.test(text)) return "ACT_CONDITIONALLY";
  if (REVERSIBLE_BOUNDED.test(text) && hasStrongSpecificRecommendation(text)) {
    return "ACT_NOW";
  }
  if (hasStrongSpecificRecommendation(text) && ADMITS_UNKNOWN_MATERIAL.test(text) && !hasDecisionConditionality(text)) {
    return "DEFER"; // internal: should have been verify/defer — currently malformed
  }
  if (hasStrongSpecificRecommendation(text)) return "ACT_NOW";
  return null;
}

export function assessDecisionQuality(
  message: string,
  truth: ExecutiveTruthSnapshot,
): DecisionQualityResult {
  const violations: string[] = [];
  const materialUnknowns: string[] = [];
  const strong = hasStrongSpecificRecommendation(message);
  const conditional = CONDITIONAL_FRAMING.test(message);
  const verifyFirst = VERIFY_FIRST_FRAMING.test(message);
  const reversible = REVERSIBLE_BOUNDED.test(message);
  const admitsMaterial = ADMITS_UNKNOWN_MATERIAL.test(message) || MATERIAL_PREMISE_MARKERS.test(message);

  if (MATERIAL_PREMISE_MARKERS.test(message)) {
    const markers = message.match(
      /\b(?:market\s+demand|unit\s+economics|competitive\s+(?:position|attractiveness)|supplier\s+readiness|fulfillment\s+readiness|listing\s+readiness|marketplace\s+readiness|commercial\s+viability|product[- ]market\s+fit)\b/gi,
    );
    if (markers) materialUnknowns.push(...[...new Set(markers.map((m) => m.toLowerCase()))]);
  }

  // Zero realised commerce is a verified goal signal in truth snapshot.
  const zeroCommerce =
    Number(truth?.financial?.orders ?? -1) === 0 &&
    Number(truth?.financial?.realisedRevenueUsd ?? -1) === 0;

  for (const leap of GOAL_SOLUTION_LEAPS) {
    const goalHit =
      leap.id === "revenue_to_launch"
        ? leap.goal.test(message) || zeroCommerce
        : leap.goal.test(message);
    const solutionHit = leap.solution.test(message);
    const consequential =
      strong || RECOMMENDATION_STANCE.test(message) || UNCONDITIONAL_URGENCY.test(message);
    if (goalHit && solutionHit && consequential) {
      if (!CAUSAL_BRIDGE.test(message) && !conditional && !verifyFirst && !reversible) {
        violations.push("GOAL_SOLUTION_CAUSAL_LEAP");
        break;
      }
    }
  }

  // Material assumption identified but treated as established for an unconditional recommendation.
  if (
    strong &&
    admitsMaterial &&
    !conditional &&
    !verifyFirst &&
    !reversible &&
    (ADMITS_UNKNOWN_MATERIAL.test(message) ||
      (zeroCommerce && /\b(?:launch|publish|go\s+live)\b/i.test(message)))
  ) {
    // If they admit unknowns AND still push unconditional launch/specific action:
    if (ADMITS_UNKNOWN_MATERIAL.test(message) || (zeroCommerce && MATERIAL_PREMISE_MARKERS.test(message))) {
      violations.push("MATERIAL_ASSUMPTION_TREATED_AS_ESTABLISHED");
    }
  }

  // Verified problem + specific solution without acknowledging material unknowns when zero commerce + launch.
  if (
    zeroCommerce &&
    /\b(?:launch|publish|go\s+live\s+with|roll\s+out)\b/i.test(message) &&
    strong &&
    !conditional &&
    !verifyFirst &&
    !reversible &&
    !CAUSAL_BRIDGE.test(message)
  ) {
    violations.push("UNVERIFIED_SOLUTION_FROM_VERIFIED_GOAL");
  }

  const posture = classifyDecisionPosture(message);

  return {
    violations: [...new Set(violations)],
    posture,
    materialUnknowns,
    hasStrongRecommendation: strong,
    hasConditionalFraming: conditional,
    hasVerifyFirstFraming: verifyFirst,
  };
}

/**
 * Natural repair for decision-quality violations.
 * Speaks like an executive partner — no internal enum leakage.
 */
export function repairDecisionQualityAnswer(
  draft: string,
  truth: ExecutiveTruthSnapshot,
  assessment: DecisionQualityResult,
): string {
  const zeroCommerce =
    Number(truth?.financial?.orders ?? -1) === 0 &&
    Number(truth?.financial?.realisedRevenueUsd ?? -1) === 0;
  const product = truth?.product?.productName ?? "the current candidate";

  const latencyCase = /\blatency\b/i.test(draft) && /\bmigrat/i.test(draft);
  const churnOrConversion =
    /\b(?:churn|conversion)\b/i.test(draft) &&
    /\b(?:ad\s+spend|advertising|discount|spend)\b/i.test(draft);
  const supplierCase = /\bsupplier\b/i.test(draft) && /\bswitch\b/i.test(draft);

  const parts: string[] = [];

  if (latencyCase) {
    parts.push("The latency problem is clear from what we can observe.");
    parts.push(
      "Whether a database migration is the right immediate fix depends on premises we have not verified — for example whether the bottleneck is query shape, capacity, or something else.",
    );
  } else if (churnOrConversion) {
    parts.push("The performance problem is clear from what we can observe.");
    parts.push(
      "Whether increasing spend or cutting price is the right immediate fix depends on premises we have not verified — for example offer quality, acquisition quality, and unit economics of the proposed lever.",
    );
  } else if (supplierCase) {
    parts.push("Supplier failure is a real operational problem.");
    parts.push(
      "Whether switching to a particular replacement is the right immediate move depends on premises we have not verified — capacity, quality, lead time, and switching cost.",
    );
  } else {
    const wantsProgress =
      PROGRESS_GOAL.test(draft) ||
      zeroCommerce ||
      /\b(?:revenue|sales|traction|commercial)\b/i.test(draft);
    if (wantsProgress && zeroCommerce) {
      parts.push("We need commercial progress — realised sales are still zero.");
    } else if (wantsProgress) {
      parts.push("The underlying goal is clear from what we can verify.");
    } else {
      parts.push("The underlying goal is clear from what we can verify.");
    }
    parts.push(
      `Whether ${product} is the right immediate move depends on premises we have not verified yet — typically demand attractiveness, unit economics, and operational readiness.`,
    );
  }

  parts.push(
    "Those checks are usually cheap relative to committing to one specific path, and they could reverse the decision, so I would verify them first.",
  );

  parts.push(
    "If they clear a sensible threshold, proceed with a bounded test rather than treating one solution as already proven.",
  );

  if (!/\b(?:change\s+my\s+(?:mind|recommendation)|falsif)/i.test(draft)) {
    parts.push(
      "What would change this: evidence that clearly supports or refutes the proposed solution, or that waiting costs more than a reversible test.",
    );
  }

  // Silence unused param warning while keeping signature for gate callers.
  void assessment;

  return parts.join(" ");
}

/** Brief fragment for LLM context — natural instructions, no sealed Q&A. */
export function formatExecutiveDecisionDisciplineBrief(): string {
  return [
    "--- Executive decision discipline (mandatory) ---",
    "For consequential recommendations, separate: verified support | non-material uncertainty | material decision-critical uncertainty | inference.",
    "Ask internally: what must be true for this recommendation to be good?",
    "If a necessary premise is unverified: prefer verify-then-act or conditional action when verification is cheap and could reverse the decision; prefer act-now when action is reversible/low-downside or delay costs dominate; defer when downside is high and evidence is unavailable.",
    "Do NOT confuse a verified GOAL with a proven SOLUTION (e.g. revenue pressure ≠ this candidate must launch next; latency ≠ this migration must proceed).",
    "Speak naturally to Grand King. Never dump internal labels like ACT_NOW, VERIFY_THEN_ACT, DECISION_CRITICAL, CURRENT_VERIFIED.",
    "Still make useful judgments under uncertainty — do not refuse to recommend.",
  ].join("\n");
}
