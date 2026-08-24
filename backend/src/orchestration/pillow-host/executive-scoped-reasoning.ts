/**
 * Scoped synthetic / scenario reasoning + evidence-structure audits.
 * Keeps CURRENT EmpireAI reality separate from SYNTHETIC_ANALYSIS.
 * Does not encode sealed exam content or fixed product fixtures.
 */

import {
  asksForDecisionChangingEvidence,
  asksForNextEvidence,
  asksForReversalConditions,
  buildActionEligibilityStates,
  synthesizeNextEvidenceDecisionImpact,
  synthesizeReversalConditions,
  type MaterialConstraint,
} from "./executive-decision-constraints.js";

export type ReasoningScopeType =
  | "CURRENT_REALITY"
  | "SYNTHETIC_ANALYSIS"
  | "HYPOTHETICAL"
  | "HISTORICAL_ANALYSIS"
  | "COMPARATIVE_SCENARIO";

/** True for SyntheticCanary / synthetic-* labels (word-boundary alone misses compounds). */
export function hasSyntheticAnalysisMarker(message: string): boolean {
  const t = String(message || "");
  return (
    /\bsynthetic\w*/i.test(t) ||
    /\bfor analysis(?:\s+only)?\b/i.test(t) ||
    /\bnot (?:facts?|claims?) about EmpireAI\b/i.test(t) ||
    /\bclaims? for analysis\b/i.test(t) ||
    /\bthought experiment\b/i.test(t) ||
    /\bscenario[- ]only\b/i.test(t) ||
    /\bhypothetical (?:claim|product|entity|scenario)\b/i.test(t) ||
    /\banalysis scenario\b/i.test(t)
  );
}

/** Detect analysis scope from Grand King's message (not from live state). */
export function detectReasoningScope(message: string): ReasoningScopeType {
  const t = String(message || "");
  if (hasSyntheticAnalysisMarker(t)) {
    return "SYNTHETIC_ANALYSIS";
  }
  if (
    /\b(assume|suppos(?:e|ing)|if .{0,80} (?:were|becomes?|became)|under (?:the )?assumption|for (?:this|the) (?:hypothetical|scenario))\b/i.test(
      t,
    )
  ) {
    return "HYPOTHETICAL";
  }
  if (
    /\b(compare|versus|\bvs\.?\b|which (?:version|option|claim)|better supported|rank(?:ing)? these)\b/i.test(
      t,
    ) &&
    !/\b(our (?:current|live)|EmpireAI (?:product|revenue|orders?))\b/i.test(t)
  ) {
    return "COMPARATIVE_SCENARIO";
  }
  if (
    /\b(histor(?:y|ical)|yesterday|was true|superseded|old notes?)\b/i.test(t) &&
    !/\b(EmpireAI is|our realised|our current product)\b/i.test(t)
  ) {
    return "HISTORICAL_ANALYSIS";
  }
  return "CURRENT_REALITY";
}

export function isScopedAwayFromLiveEmpire(scope: ReasoningScopeType): boolean {
  // Only pure synthetic analysis forbids live product/revenue injection.
  // Historical / comparative / hypothetical EmpireAI asks may still need live contrast.
  return scope === "SYNTHETIC_ANALYSIS";
}

export function asksForRiskRanking(message: string): boolean {
  return /\b(most dangerous|danger(?:ous)?(?:\s+if)?|rank(?:ing)? (?:these )?risks?|which (?:claim|claims|one) (?:is|are) (?:the )?most (?:dangerous|risky)|risk[- ]rank|irreversible (?:financial )?decision)\b/i.test(
    message,
  );
}

export function asksForVerificationPriority(message: string): boolean {
  return /\b(verify first|verification priority|most important (?:additional )?(?:verification|verify|check|evidence)|which evidence|priority (?:check|verification|evidence)|single most important (?:additional )?(?:verification|verify)|what should (?:i|we) verify|single most valuable next evidence|most valuable next (?:evidence|verification)|evidence that could change)\b/i.test(
    message,
  );
}

/**
 * Evidence-structure audit for a synthetic / scenario claim.
 * Reasons from evidential form — does not invent live EmpireAI facts.
 */
export function synthesizeEvidenceStructureAudit(
  subject: string,
  sourceSpan: string,
): string {
  const label = (subject || sourceSpan || "this claim").slice(0, 100);
  const s = `${subject} ${sourceSpan}`.toLowerCase();

  let verdict = "Unsupported as established fact";
  let reason =
    "The supplied claim does not carry enough evidential force on its own to treat it as settled.";
  let need =
    "independent verification against an authoritative source for this scenario.";
  let conclude =
    "What can be concluded now: only that the claim remains unproven, not that it is true or false in live EmpireAI operations.";

  // Operation-specific branches first — shared evidence context must not clone one template.
  if (
    /synthes|across the (?:above|audits|claims)|executive (?:synthesis|conclusion|summary)|overall (?:reading|conclusion)|integrate (?:the |these )?findings/i.test(
      s,
    )
  ) {
    verdict = "Cross-evidence synthesis (local)";
    reason =
      "Synthesis must integrate sibling findings without replacing them: keep forecasts labeled as estimates, identity mappings open unless registry-proven, and supplier assertions below independent corroboration.";
    need =
      "A short integrated reading that preserves distinct obligation outcomes — not a repeated single-claim verdict.";
    conclude =
      "What can be concluded: the pack supports cautious, labeled conclusions only; no single sibling unlocks the rest.";
  } else if (
    /customer(?:s)? (?:count|vs|versus)|order count|customers? vs orders?|reconcile (?:customer|order)/i.test(
      s,
    )
  ) {
    verdict = "Quantity classes are not interchangeable";
    reason =
      "Customer count and order count measure different events. Co-listed totals do not prove one-to-one equivalence without a join key.";
    need = "primary records that define the unit of count for each metric and any mapping between them.";
    conclude =
      "What can be concluded: treat customer and order figures as distinct evidence classes until reconciled explicitly.";
  } else if (
    /(?:net after|after refund|compute net|arithmetic|subtract(?:ed|ion)?)/i.test(s) ||
    (/\brefunds?\b/i.test(s) &&
      !/\bno\s+(?:commercial\s+)?refunds?\b/i.test(s) &&
      !/\brefund\s+is\s+(?:not\s+)?(?:in\s+scope|discussed|relevant)\b/i.test(s))
  ) {
    if (
      /completed|delivered|performed|occurred|histor/i.test(s) &&
      /\b(?:refunds?|charge\s*-?backs?|compensat(?:ed|ion)|economic\s+revers)/i.test(s) &&
      !/\bno\s+(?:commercial\s+)?refunds?\b/i.test(s)
    ) {
      verdict = "Occurrence preserved; later outcome separate";
      reason =
        "If the pack establishes that an operation physically occurred and was recorded complete, a later economic reversal changes settlement — it does not by itself rewrite historical occurrence as non-occurrence.";
      need =
        "Keep occurrence distinct from later economic treatment. Only record-invalidating evidence (fraud, void, never executed) may erase historical occurrence.";
      conclude =
        "What can be concluded: historical completion can stand while later economic outcomes are recorded separately.";
    } else if (/\brefunds?\b/i.test(s) && !/\bno\s+(?:commercial\s+)?refunds?\b/i.test(s)) {
      verdict = "Arithmetic requires stated operands";
      reason =
        "Net-after-refund conclusions need explicit gross, refund, and unit definitions from the pack. Missing operands stay locally unknown — do not invent ledger math.";
      need =
        "the stated gross/realised figure, refund quantity or amount, and whether units or currency are the operand.";
      conclude =
        "What can be concluded: perform only the arithmetic the pack supports; otherwise mark the net figure locally unavailable.";
    } else {
      // "No refund" / eligibility-only packs must not enter refund arithmetic doctrine.
      verdict = "Unsupported as established fact";
      reason =
        "The supplied claim does not carry enough evidential force on its own to treat it as settled.";
      need = "independent verification against an authoritative source for this scenario.";
      conclude =
        "What can be concluded now: only that the claim remains unproven, not that it is true or false in live EmpireAI operations.";
    }
  } else if (
    /each (?:quoted )?claim|claim[- ]by[- ]claim|verdict each|quoted claims?|Claim\s+\d+/i.test(
      s,
    )
  ) {
    verdict = "Claims retain distinct identity";
    reason =
      "A multi-claim audit must score each quoted claim on its own evidence class. Shared scenario context does not make claims interchangeable.";
    need = "per-claim verdicts with local unknowns — never one blanket unsupported template for the whole set.";
    conclude =
      "What can be concluded: claim-level outcomes must remain separable in the visible answer.";
  } else if (
    /weigh|supplier.{0,40}independent|independent.{0,40}supplier|vs\.? independent|versus independent/i.test(
      s,
    )
  ) {
    verdict = "Provenance ranking required";
    reason =
      "Supplier assertions sit below independent studies or third-party corroboration when both address the same metric. Neither automatically becomes realised ledger fact.";
    need = "explicit comparison of claim provenance and what each source can actually support.";
    conclude =
      "What can be concluded: prefer independent corroboration over partner assertion; still label both as non-ledger unless transactions exist.";
  } else if (
    /supersed|later (?:registry|update|transaction|ledger|study)|what does (?:the )?later/i.test(s)
  ) {
    verdict = "Scoped supersession only";
    reason =
      "Later verified evidence supersedes only the claims it updates. A registry or transaction update does not blanket-erase unrelated forecasts or identity notes.";
    need = "state which prior claim is updated, which remains untouched, and what stays open.";
    conclude =
      "What can be concluded: supersession is local to overlapping subjects — not global pack overwrite.";
  } else if (/expected|forecast|projected|estimate|projected profit|expected (?:revenue|profit)|forecast vs|vs\.? realised/i.test(s)) {
    verdict = "Unsupported as realised result";
    reason =
      "An expected, forecast, or estimated figure is not realised profit and is not transaction evidence.";
    need =
      "If this were live, ledger/transaction confirmation. In this analysis: keep it labeled as an estimate only.";
    conclude =
      "What can be concluded: the figure may be a planning estimate; it does not establish realised economics.";
  } else if (
    /same (?:note|document|list|file|entity)|appear(?:ed|s)? (?:together|in the same)|co-occur|mapped to|is the same (?:as|entity)|identical to|refers to the same|two skus|same entity/i.test(
      s,
    )
  ) {
    verdict = "Unproven identity mapping";
    reason =
      "Co-occurrence in a note or shared listing is not proof that two labels name the same entity.";
    need =
      "authoritative product-code / identity mapping from a primary registry or source record.";
    conclude =
      "What can be concluded: identity is unproven. Treat the mapping as open until verified.";
  } else if (/supplier|vendor|partner (?:says|claims|assert|told)|according to (?:the )?supplier/i.test(s)) {
    verdict = "Unverified assertion";
    reason =
      "A supplier or partner assertion is not independent market evidence and should not be treated as confirmed demand or performance.";
    need = "independent market, operational, or third-party corroboration.";
    conclude =
      "What can be concluded: the assertion exists as a claim only; it is not established evidence.";
  } else if (
    /imply|implies|therefore|likely success|selection (?:implies|means)|prove(?:s)? success|guarantees?/i.test(
      s,
    )
  ) {
    verdict = "Invalid inference";
    reason =
      "Selection, correlation, or a single favorable signal does not establish commercial success.";
    need =
      "outcome evidence (validated demand or realised traction) before treating success as likely.";
    conclude =
      "What can be concluded: the inference is not warranted from the supplied premises alone.";
  } else if (/histor|yesterday|previously|old |last (?:week|month|year)|no longer/i.test(s)) {
    if (/\b(?:refunds?|charge\s*-?backs?|compensat(?:ed|ion)|economic\s+revers)/i.test(s)) {
      verdict = "Later outcome ≠ historical non-occurrence";
      reason =
        "A past completed event remains historically occurred unless later evidence invalidates the record itself. Later economic outcomes update settlement treatment, not the occurrence layer by default.";
      need = "explicit invalidation evidence before erasing historical occurrence; otherwise keep both layers.";
      conclude =
        "What can be concluded: historical occurrence and later economic outcome are separable evidence classes.";
    } else {
      verdict = "Historical — not automatically current";
      reason =
        "A past statement does not remain current without newer confirmation that supersedes it.";
      need = "current-state confirmation for the same subject.";
      conclude =
        "What can be concluded: the historical claim may have been true then; current status stays open here.";
    }
  } else if (/revenue|profit|sales?|orders?|usd|\$|s\$|financial/i.test(s)) {
    verdict = "Financial claim unestablished";
    reason =
      "Financial assertions require matching evidence class (realised vs expected, ledger vs estimate).";
    need = "evidence matching the claim class — realised figures need transactions; forecasts stay estimates.";
    conclude =
      "What can be concluded: do not treat the financial claim as established on the supplied wording alone.";
  }

  return [
    `### ${label}`,
    `**Verdict:** ${verdict}`,
    "",
    reason,
    "",
    conclude,
    "",
    `**Need:** ${need}`,
  ].join("\n");
}

/** Aggregate: which claim is most dangerous for irreversible financial action. */
export function synthesizeRiskRanking(
  siblingSubjects: readonly string[],
  sourceSpan = "rank risk across the audits",
): string {
  const subjects = siblingSubjects.map((s) => s.trim()).filter(Boolean).slice(0, 8);
  const scored = subjects.map((sub) => {
    const s = sub.toLowerCase();
    let score = 1;
    let why = "general unsupported claim";
    if (/revenue|profit|sales?|financial|usd|\$|s\$|spend|irreversible/i.test(s)) {
      score = 5;
      why = "false financial certainty can drive irreversible spend";
    } else if (/same|identity|mapped|co-occur|entity/i.test(s)) {
      score = 4;
      why = "wrong identity mapping can misdirect capital and operations";
    } else if (/supplier|assert|demand proven|market (?:is|proven)/i.test(s)) {
      score = 4;
      why = "unverified external assertion can look like demand proof";
    } else if (/imply|success|selection|therefore/i.test(s)) {
      score = 3;
      why = "invalid success inference can justify premature scale";
    } else if (/histor|was true|old /i.test(s)) {
      score = 2;
      why = "stale historical claims can mis-state current risk";
    }
    return { sub, score, why };
  });
  scored.sort((a, b) => b.score - a.score);
  const top = scored[0];
  const lines = [
    "### What matters most",
    top
      ? `**Most dangerous for an irreversible financial decision:** ${top.sub.slice(0, 120)}`
      : `**Most dangerous for an irreversible financial decision:** the financially consequential unsupported claim (${sourceSpan.slice(0, 80)}).`,
    "",
    top
      ? `Why: ${top.why}. Acting as if it were established risks capital allocation on weak evidence.`
      : "Why: unsupported claims that imply money already earned or success already proven are the highest decision risk.",
    "",
  ];
  if (scored.length > 1) {
    lines.push("Relative ranking (highest risk first):");
    for (const row of scored.slice(0, 5)) {
      lines.push(`- ${row.sub.slice(0, 100)} — ${row.why}`);
    }
    lines.push("");
  }
  return lines.join("\n").trim();
}

/** Aggregate: single most important additional verification. */
export function synthesizeVerificationPriority(
  siblingSubjects: readonly string[],
  sourceSpan = "choose verification priority",
  materialConstraints: readonly MaterialConstraint[] = [],
): string {
  const joined = `${siblingSubjects.join(" ")} ${sourceSpan}`;

  // Multi-gate path: next evidence must respect remaining blockers.
  const actions = buildActionEligibilityStates(joined, materialConstraints);
  const primary =
    actions.find((a) => a.requiredGates.some((g) => g.status !== "PASS")) ?? actions[0];
  if (primary && primary.requiredGates.filter((g) => g.status !== "PASS").length > 0) {
    if (asksForReversalConditions(joined)) return synthesizeReversalConditions(primary);
    if (
      asksForDecisionChangingEvidence(joined) ||
      asksForNextEvidence(joined) ||
      primary.requiredGates.filter((g) => g.status !== "PASS").length >= 2
    ) {
      return synthesizeNextEvidenceDecisionImpact(primary, joined);
    }
  }

  const lower = joined.toLowerCase();
  let priority =
    "Verify the financially consequential claim against primary evidence before any irreversible spend.";
  let why =
    "Money and permanence amplify error — settle the financial evidence class first.";

  if (/same|identity|mapped|co-occur|entity|product.?code/i.test(lower)) {
    priority =
      "Verify entity/product-code identity against an authoritative mapping or source record.";
    why =
      "If identity is wrong, every downstream financial or demand conclusion is contaminated.";
  }
  if (/supplier|assert|external (?:research|memo)|demand/i.test(lower) && !/identity|mapped/i.test(lower)) {
    priority =
      "Obtain independent corroboration for the strongest external assertion before treating demand as proven.";
    why = "Partner assertions are cheap to produce and expensive to act on.";
  }
  if (/expected|forecast|profit|revenue|sales/i.test(lower)) {
    priority =
      "Separate expected/forecast figures from realised transaction evidence — confirm which class each number belongs to.";
    why = "Confusing estimates with realised results is a classic irreversible-spend failure mode.";
  }

  void sourceSpan;
  return [
    "### My recommendation — verification priority",
    `**Verify first:** ${priority}`,
    "",
    `Why this first: ${why}`,
    "",
    "Then revisit the remaining audits with that evidence in hand — do not scale or spend irreversibly on the weaker claims.",
  ].join("\n");
}

/** Recommendation under scoped analysis (no live product dump). */
export function synthesizeScopedRecommendation(subject: string): string {
  return [
    "### My recommendation",
    `**Decision:** Treat the scenario claims as unproven analysis — verify the highest-risk claim before any irreversible financial action.`,
    "",
    `Regarding “${(subject || "this ask").slice(0, 100)}”: prefer a bounded verification step over acting as if the claims were established EmpireAI facts.`,
  ].join("\n");
}

/**
 * Strip live EmpireAI grounding sentences that are irrelevant under scoped analysis.
 * Conservative: only removes clear protected-state boilerplate, not all commerce words.
 */
export function stripIrrelevantLiveGrounding(
  message: string,
  userMessage: string,
  scope: ReasoningScopeType,
): string {
  // Import deferred via dynamic pattern avoided — callers may also pass authority asks.
  const authorityBlocksCommerce =
    (/\b(authori[sz]|delegat|discretion|you may (?:spend|adjust)|approval gate|governance|system capability|execution authority|do not ask again|anything below|budget ceiling|spend ceiling)\b/i.test(
      userMessage,
    ) ||
      (/\b(up to|below|under)\b.{0,40}\$/i.test(userMessage) &&
        /\b(authori|delegat|you may|spend|discretion)\b/i.test(userMessage))) &&
    !/\b(realised (?:orders?|revenue)|sales? (?:count|volume)|demand strength|bound product|asin|commissioning)\b/i.test(
      userMessage,
    );

  if (
    !isScopedAwayFromLiveEmpire(scope) &&
    !hasSyntheticAnalysisMarker(userMessage) &&
    !authorityBlocksCommerce
  ) {
    return String(message || "").trim();
  }
  const liveAsk =
    /\b(EmpireAI|our (?:current|live|realised)|bound product|commissioning|Birth)\b/i.test(
      userMessage,
    ) &&
    !hasSyntheticAnalysisMarker(userMessage) &&
    !authorityBlocksCommerce;
  if (liveAsk) return String(message || "").trim();

  const isLiveBoilerplate = (s: string): boolean => {
    if (/\bBrief verified note:\s*focus remains\b/i.test(s)) {
      return true;
    }
    if (
      /\b(High-Speed Handheld|Mini Fan)\b/i.test(s) &&
      (!/\bsynthetic|scenario|claim audit|for analysis\b/i.test(s) ||
        /\bBrief verified note\b/i.test(s) ||
        /\bfocus remains\b/i.test(s))
    ) {
      return true;
    }
    if (
      /\b(realised orders? (?:and realised revenue )?remain(?:s)? zero|Current product focus is|focus remains .{0,80}; realised)\b/i.test(
        s,
      )
    ) {
      return true;
    }
    if (
      /\bverified sales-history evidence beyond realised orders\b/i.test(s) ||
      /\bOur bound product is\b/i.test(s)
    ) {
      return true;
    }
    if (/\bI don't have verified sales-history\b/i.test(s)) return true;
    if (/\bcommissioning\/KPI state\b/i.test(s) && scope === "SYNTHETIC_ANALYSIS") return true;
    if (/\bverified operating state\b/i.test(s) && scope !== "CURRENT_REALITY") return true;
    if (/\bBirth has not been authorised\b/i.test(s)) return true;
    if (
      /\bEmpireAI is live and answering in production\b/i.test(s) &&
      scope === "SYNTHETIC_ANALYSIS"
    ) {
      return true;
    }
    return false;
  };

  /** Keep Markdown headings when a contaminated sentence starts with ### / **Decision**. */
  const preserveLeadMarker = (s: string): string | null => {
    const m = s.match(/^(#{1,3}\s+[^\n]+?)(?=\s+(?:I\s+don't|Our bound|EmpireAI|Birth|Current product)\b)/i);
    if (m && m[1] && m[1].length >= 8) return m[1].trim();
    return null;
  };

  const paras = String(message || "").split(/\n{2,}/);
  const cleaned = paras
    .map((para) => {
      const sentences = para
        .split(/(?<=[.!?])\s+/)
        .map((s) => s.trim())
        .filter(Boolean);
      const kept: string[] = [];
      for (const s of sentences) {
        if (!isLiveBoilerplate(s)) {
          kept.push(s);
          continue;
        }
        const lead = preserveLeadMarker(s);
        if (lead) kept.push(lead);
      }
      return kept.join(" ");
    })
    .filter((p) => p.trim().length > 0);

  return cleaned.join("\n\n").replace(/\n{3,}/g, "\n\n").trim();
}

/** Heuristic: complex answer collapsed into one wall of text. */
export function isComplexWallOfText(message: string, multipart: boolean): boolean {
  const t = String(message || "");
  const newlines = (t.match(/\n/g) || []).length;
  const hasSectionMarkers = /#{1,3}\s+\S|[A-E][).]\s|\d+[).]\s/.test(t);
  // Flattened Markdown headings must be repaired even under 500 chars.
  if (multipart && hasSectionMarkers && newlines < 2 && t.length >= 160) return true;
  if (!multipart && t.length < 500) return false;
  if (t.length >= 500 && newlines < 3) return true;
  if (t.length >= 900 && newlines < 6) return true;
  return false;
}
