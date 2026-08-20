/**
 * Material decision-constraint + multi-gate eligibility for executive recommendations.
 * Deterministic — no second LLM. Does not encode sealed exam scenarios.
 *
 * CONSTRAINT_RESOLVED ≠ DECISION_ELIGIBLE.
 * One cleared gate never unlocks a multi-gate decision by itself.
 */

export type MaterialConstraintClass =
  | "NEGATIVE_UNIT_ECONOMICS"
  | "UNVERIFIED_DEMAND"
  | "CAPACITY_LIMIT"
  | "INVESTMENT_JUSTIFICATION"
  | "AUTHORITY_RESTRICTION"
  | "INSUFFICIENT_EVIDENCE"
  | "CASH_CONSTRAINT"
  | "SUPPLIER_CONSTRAINT"
  | "TECHNICAL_INCOMPATIBILITY"
  | "PERFORMANCE_THRESHOLD"
  | "EXPENDITURE_CEILING"
  | "OTHER";

export type MaterialConstraintStatus = "active" | "superseded";

export type MaterialConstraint = {
  id: string;
  class: MaterialConstraintClass;
  status: MaterialConstraintStatus;
  summary: string;
};

export type DecisionGateId =
  | "unit_economics"
  | "demand"
  | "capacity"
  | "investment_return"
  | "authority"
  | "evidence"
  | "cash"
  | "supplier"
  | "technical"
  | "performance"
  | "expenditure";

export type DecisionGateStatus = "PASS" | "FAIL" | "UNKNOWN";

export type DecisionGate = {
  id: DecisionGateId;
  label: string;
  status: DecisionGateStatus;
  constraintClass?: MaterialConstraintClass;
};

export type ScaleEligibility = {
  scaleEligible: boolean;
  blockedBy: DecisionGate[];
  cleared: DecisionGate[];
  partialUnlock: string;
  exactEvidenceForScale: string[];
};

/** Per-action / per-candidate multi-gate eligibility (canonical decision state). */
export type ActionEligibility = {
  actionId: string;
  actionLabel: string;
  requiredGates: DecisionGate[];
  currentlyEligible: boolean;
  /** Eligible ≠ preferred. Null when comparative rank is not supplied. */
  comparativelyPreferred: boolean | null;
  preferenceNote: string | null;
};

export type EvidenceImpactClass =
  | "uncertainty_reduction"
  | "single_blocker_clear"
  | "decision_state_change"
  | "insufficient_alone";

export type EvidenceGateImpact = {
  proposedEvidence: string;
  gatesCleared: DecisionGateId[];
  gatesRemaining: DecisionGate[];
  wouldChangeDecisionEligibility: boolean;
  impactClass: EvidenceImpactClass;
};

const SCALE_ACTION =
  /\b(?:scale(?:\s+up)?(?:\s+(?:production|marketing|spend|ads|advertising|inventory|operations))?|ramp(?:\s+up)?(?:\s+production)?|expand(?:\s+(?:marketing|production|spend))?|increase\s+(?:production|marketing\s+spend|ad\s+spend)|go\s+all[\s-]in|aggressively\s+(?:scale|expand)|meaningful\s+scal(?:e|ing))\b/i;

/** Claims that a piece of evidence fully unlocks scaling. */
const FULL_SCALE_UNLOCK =
  /\b(?:unlock(?:s|ed|ing)?\s+(?:the\s+)?(?:decision\s+to\s+)?(?:meaningful\s+)?scale|scale\s+(?:would\s+)?(?:be|become|becomes)\s+(?:eligible|unlocked|justified)|would\s+(?:then\s+)?(?:unlock|enable|justify)\s+(?:the\s+)?(?:decision\s+to\s+)?(?:meaningful\s+)?scale|make(?:s)?\s+(?:this\s+)?eligible\s+for\s+(?:meaningful\s+)?scal(?:e|ing))\b/i;

const NEGATIVE_ECON =
  /\b(?:negative\s+(?:contribution\s+)?(?:margin|unit\s+economics)|negative\s+contribution(?:\s+remains?)?|contribution\s+margin\s*(?:=|:)?\s*-|loses?\s+(?:money|[Ss]\$\s*\d+(?:\.\d+)?)\s+per\s+(?:sale|unit|order|transaction)|loss(?:es)?\s+per\s+(?:completed\s+)?(?:sale|unit|transaction)|unit\s+economics?\s+(?:are\s+)?(?:negative|adverse|underwater)|margin\s+(?:is\s+)?negative|unprofitable\s+per\s+(?:sale|unit)|remains?\s+negative|still\s+negative|currently\s+loses?\b)\b/i;

const ECON_SUPERSEDED =
  /\b(?:margin\s+(?:is\s+)?(?:now\s+)?positive|contribution\s+(?:is\s+)?(?:now\s+)?positive|unit\s+economics?\s+(?:are\s+)?(?:now\s+)?(?:positive|repaired|fixed)|(?:verified|confirmed)\s+cost\s+reduction|economics?\s+(?:have\s+been\s+)?(?:repaired|resolved|cleared)|profitable\s+per\s+(?:sale|unit)\s+(?:is\s+)?(?:now\s+)?(?:verified|established))\b/i;

const CAPACITY =
  /\b(?:capacity\s+(?:limit|constraint|capped|exhausted|limited)|(?:is\s+)?capped\s+capacity|capacity\s+is\s+capped|limited\s+to\s+\d+|cannot\s+(?:fulfill|fulfil)|warehouse\s+(?:full|capacity)|throughput\s+(?:limit|constrained)|insufficient\s+capacity|transactions?\s*\/\s*week|per\s+week\s+cap)\b/i;

const INVESTMENT =
  /\b(?:additional\s+fixed\s+investment|fixed\s+investment\s+required|expansion\s+requires\s+(?:additional\s+)?(?:fixed\s+)?investment|capex\s+(?:required|needed)|investment\s+(?:not\s+)?(?:yet\s+)?(?:justified|verified|proven))\b/i;

const AUTHORITY =
  /\b(?:without\s+(?:Grand\s+King|owner)\s+authorit|authority\s+(?:restriction|blocker|required)|cannot\s+(?:deploy|publish|authorise\s+Birth|authorize\s+Birth)|Birth\s+(?:not\s+)?authoris|safety\s+(?:authorization|authorisation)\s+(?:missing|required|not\s+(?:yet\s+)?(?:obtained|cleared|granted)|fails?)|(?:missing|lacking|no)\s+safety\s+(?:authorization|authorisation)|safety\s+gate\s+(?:fails?|open|FAIL))\b/i;

const UNVERIFIED_DEMAND =
  /\b(?:unverified\s+demand|demand\s+(?:is\s+)?unverified|supplier\s+(?:claims?|assert(?:s|ed|ion)?)\s+(?:strong\s+)?demand|demand\s+(?:remains?\s+)?unproven)\b/i;

const INSUFFICIENT_EVIDENCE =
  /\b(?:insufficient\s+(?:verified\s+)?(?:operating\s+)?evidence|not\s+enough\s+(?:verified\s+)?(?:operating\s+)?evidence|evidence\s+(?:is\s+)?insufficient|(?:lacking|missing|insufficient)\s+operating\s+evidence|operating\s+evidence\s+(?:insufficient|missing|lacking|fails?))\b/i;

const CASH =
  /\b(?:insufficient\s+cash|cash\s+(?:constraint|runway)|budget\s+ceiling|cannot\s+fund|budget\s+(?:compatibility|compatible)\s+(?:fails?|not\s+met|missing|FAIL)|(?:fails?|missing)\s+budget\s+compatibility)\b/i;

const EXPENDITURE =
  /\b(?:expenditure\s+(?:exceeds|over|above|beyond|fails?)\s+(?:the\s+)?(?:approved\s+)?(?:ceiling|budget|cap)|(?:over|above|beyond)\s+(?:the\s+)?(?:approved\s+)?(?:expenditure|spend)\s+(?:ceiling|cap)|expenditure\s+(?:ceiling|gate)\s+(?:FAIL|fails?|open|active)|spend\s+(?:exceeds|over)\s+(?:approved\s+)?ceiling)\b/i;

const PERFORMANCE =
  /\b(?:performance\s+(?:is\s+|remains\s+)?(?:below|under|short\s+of|fails?)\s+(?:the\s+)?threshold|(?:fails?|miss(?:es|ing)|below)\s+performance\s+(?:threshold|gate|requirement)|performance\s+(?:threshold|gate)\s+(?:FAIL|fails?|open|not\s+met)|performance\s*<\s*(?:the\s+)?threshold)\b/i;

const SUPPLIER =
  /\b(?:supplier\s+(?:constraint|blocker|unavailable|cannot)|MOQ\s+(?:blocker|constraint))\b/i;

const TECHNICAL =
  /\b(?:technical\s+incompatib|infrastructure\s+(?:incompatib|dependency\s+blocker)|incompatible\s+infrastructure)\b/i;

const PERFORMANCE_CLEARED =
  /\b(?:performance\s+(?:now\s+)?(?:meets|clears|passes|above|at\s+or\s+above)\s+(?:the\s+)?threshold|verified\s+(?:improved\s+)?performance\s+(?:meeting|above|clearing|passes)\s+(?:the\s+)?threshold|performance\s+gate\s+(?:PASS|cleared|resolved))\b/i;

const EXPENDITURE_CLEARED =
  /\b(?:expenditure\s+(?:now\s+)?(?:within|under|below|inside)\s+(?:the\s+)?(?:approved\s+)?(?:ceiling|budget|cap)|spend\s+(?:now\s+)?(?:within|under)\s+(?:approved\s+)?ceiling|expenditure\s+gate\s+(?:PASS|cleared|resolved)|verified\s+expenditure\s+(?:within|under)\s+ceiling)\b/i;

const AUTHORITY_CLEARED =
  /\b(?:(?:safety\s+)?(?:authorization|authorisation)\s+(?:obtained|cleared|granted|approved)|authority\s+(?:gate\s+)?(?:PASS|cleared|resolved)|Grand\s+King\s+(?:has\s+)?authoris)\b/i;

const EVIDENCE_CLEARED =
  /\b(?:sufficient\s+operating\s+evidence\s+(?:verified|established|obtained)|operating\s+evidence\s+(?:now\s+)?(?:sufficient|verified|cleared)|evidence\s+gate\s+(?:PASS|cleared))\b/i;

/** Evidence that claims a single verification fully changes the recommendation. */
const DECISION_CHANGE_CLAIM =
  /\b(?:(?:would|could|can)\s+(?:then\s+)?(?:change|reverse|unlock)\s+the\s+(?:recommendation|decision)|(?:change|reverse)\s+the\s+recommendation|make(?:s)?\s+(?:candidate\s+[A-Z]\s+)?(?:eligible|preferred)|unlock(?:s)?\s+(?:eligibility|the\s+decision))\b/i;

function pushUnique(
  out: MaterialConstraint[],
  cls: MaterialConstraintClass,
  summary: string,
): void {
  if (out.some((c) => c.class === cls && c.status === "active")) return;
  out.push({
    id: `c_${cls.toLowerCase()}_${out.length + 1}`,
    class: cls,
    status: "active",
    summary,
  });
}

/** Extract material constraints from owner ask and/or draft reasoning. */
export function extractMaterialConstraints(
  userMessage: string,
  draft = "",
): MaterialConstraint[] {
  const corpus = `${userMessage}\n${draft}`;
  const out: MaterialConstraint[] = [];

  if (NEGATIVE_ECON.test(corpus)) {
    pushUnique(out, "NEGATIVE_UNIT_ECONOMICS", "Negative or loss-making unit economics");
  }
  if (CAPACITY.test(corpus)) {
    pushUnique(out, "CAPACITY_LIMIT", "Capacity or fulfilment limit");
  }
  if (INVESTMENT.test(corpus)) {
    pushUnique(
      out,
      "INVESTMENT_JUSTIFICATION",
      "Expansion requires additional fixed investment that is not yet justified",
    );
  }
  if (AUTHORITY.test(corpus)) {
    pushUnique(out, "AUTHORITY_RESTRICTION", "Authority or approval restriction");
  }
  if (UNVERIFIED_DEMAND.test(corpus)) {
    pushUnique(out, "UNVERIFIED_DEMAND", "Demand remains unverified");
  }
  if (INSUFFICIENT_EVIDENCE.test(corpus)) {
    pushUnique(out, "INSUFFICIENT_EVIDENCE", "Insufficient verified evidence");
  }
  if (CASH.test(corpus)) {
    pushUnique(out, "CASH_CONSTRAINT", "Cash or budget constraint");
  }
  if (EXPENDITURE.test(corpus)) {
    pushUnique(out, "EXPENDITURE_CEILING", "Expenditure exceeds approved ceiling");
  }
  if (
    PERFORMANCE.test(corpus) ||
    (/\bperformance\s*(?:>=\s*|>\s*|meets?\s+|threshold\b)/i.test(corpus) &&
      /\b(?:fail|below|not\s+met|currently\s+fail|both\s+currently\s+fail)\b/i.test(corpus))
  ) {
    pushUnique(out, "PERFORMANCE_THRESHOLD", "Performance below required threshold");
  }
  if (
    !out.some((c) => c.class === "EXPENDITURE_CEILING") &&
    /\bexpenditure\s*(?:<=\s*|<\s*|ceiling\b|budget\b)/i.test(corpus) &&
    /\b(?:fail|exceed|over|above|currently\s+fail|both\s+currently\s+fail)\b/i.test(corpus)
  ) {
    pushUnique(out, "EXPENDITURE_CEILING", "Expenditure exceeds approved ceiling");
  }
  if (
    /\bsafety\s+(?:authorization|authorisation)\b/i.test(corpus) &&
    /\b(?:require|missing|fail|not\s+(?:yet\s+)?(?:obtained|cleared)|blocker)\b/i.test(corpus)
  ) {
    pushUnique(out, "AUTHORITY_RESTRICTION", "Authority or approval restriction");
  }
  if (
    /\boperating\s+evidence\b/i.test(corpus) &&
    /\b(?:insufficient|require|missing|fail|not\s+enough)\b/i.test(corpus)
  ) {
    pushUnique(out, "INSUFFICIENT_EVIDENCE", "Insufficient verified evidence");
  }
  if (SUPPLIER.test(corpus)) {
    pushUnique(out, "SUPPLIER_CONSTRAINT", "Supplier constraint");
  }
  if (TECHNICAL.test(corpus)) {
    pushUnique(out, "TECHNICAL_INCOMPATIBILITY", "Technical or infrastructure incompatibility");
  }

  // Supersession must use owner/scenario evidence only — never the model draft.
  // Drafts often list "Verified capacity expansion" as a *requirement*, which must not clear gates.
  return applyConstraintSupersession(out, userMessage);
}

/** True when text is stating a requirement/wishlist rather than current verified clearance. */
function looksLikeRequirementContext(evidenceText: string, matchIndex: number): boolean {
  const window = evidenceText.slice(Math.max(0, matchIndex - 80), matchIndex + 40);
  return /\b(?:require(?:s|d|ments?)?|need(?:s|ed)?|must|still\s+required|exact evidence|would\s+(?:clear|unlock)|to\s+(?:clear|unlock|make)|evidence\s+for)\b/i.test(
    window,
  );
}

/** Newer evidence can supersede an active constraint — never silently forget others. */
export function applyConstraintSupersession(
  constraints: readonly MaterialConstraint[],
  evidenceText: string,
): MaterialConstraint[] {
  // Only owner/scenario evidence may clear gates. Model drafts are not evidence.
  const evidence = String(evidenceText || "");
  return constraints.map((c) => {
    if (c.status !== "active") return c;
    if (c.class === "NEGATIVE_UNIT_ECONOMICS" && ECON_SUPERSEDED.test(evidence)) {
      // Unverified hypothetical savings must not clear economics.
      if (
        /\b(?:unverified|possible|potential|if\s+(?:the\s+)?(?:additional\s+)?saving)\b/i.test(
          evidence,
        ) &&
        !/\b(?:contribution\s+(?:is\s+)?(?:now\s+)?positive|margin\s+(?:is\s+)?(?:now\s+)?positive|unit\s+economics?\s+(?:are\s+)?(?:now\s+)?positive)\b/i.test(
          evidence,
        )
      ) {
        return c;
      }
      // A verified partial cost cut that still leaves losses must not clear economics.
      if (
        NEGATIVE_ECON.test(evidence) &&
        !/\b(?:contribution\s+(?:is\s+)?(?:now\s+)?positive|margin\s+(?:is\s+)?(?:now\s+)?positive|unit\s+economics?\s+(?:are\s+)?(?:now\s+)?positive)\b/i.test(
          evidence,
        )
      ) {
        return c;
      }
      return {
        ...c,
        status: "superseded",
        summary: `${c.summary} (superseded by verified economics repair)`,
      };
    }
    if (c.class === "CAPACITY_LIMIT") {
      const m = evidence.match(
        /\b(?:capacity\s+(?:is\s+)?(?:now\s+)?(?:expanded|resolved|cleared)|(?:capacity\s+expanded\s+and\s+verified)|verified\s+capacity\s+expansion)\b/i,
      );
      if (m && m.index != null && !looksLikeRequirementContext(evidence, m.index)) {
        return {
          ...c,
          status: "superseded",
          summary: `${c.summary} (superseded by verified capacity expansion)`,
        };
      }
    }
    if (c.class === "INVESTMENT_JUSTIFICATION") {
      const m = evidence.match(
        /\b(?:investment\s+(?:is\s+)?(?:now\s+)?(?:justified|approved|verified)|ROI\s+(?:of\s+)?(?:the\s+)?investment\s+(?:is\s+)?(?:verified|positive|acceptable)|investment\s+ROI\s+verified\s+acceptable)\b/i,
      );
      if (m && m.index != null && !looksLikeRequirementContext(evidence, m.index)) {
        return {
          ...c,
          status: "superseded",
          summary: `${c.summary} (superseded by verified investment justification)`,
        };
      }
    }
    if (c.class === "UNVERIFIED_DEMAND") {
      const m = evidence.match(/\b(?:verified|proven|confirmed)\s+(?:strong\s+)?demand\b/i);
      if (m && m.index != null && !looksLikeRequirementContext(evidence, m.index)) {
        return {
          ...c,
          status: "superseded",
          summary: `${c.summary} (superseded by verified demand evidence)`,
        };
      }
    }
    if (c.class === "PERFORMANCE_THRESHOLD") {
      const m = evidence.match(PERFORMANCE_CLEARED);
      if (m && m.index != null && !looksLikeRequirementContext(evidence, m.index)) {
        return {
          ...c,
          status: "superseded",
          summary: `${c.summary} (superseded by verified performance clearance)`,
        };
      }
    }
    if (c.class === "EXPENDITURE_CEILING" || c.class === "CASH_CONSTRAINT") {
      const m = evidence.match(EXPENDITURE_CLEARED);
      if (m && m.index != null && !looksLikeRequirementContext(evidence, m.index)) {
        return {
          ...c,
          status: "superseded",
          summary: `${c.summary} (superseded by verified expenditure/budget clearance)`,
        };
      }
    }
    if (c.class === "AUTHORITY_RESTRICTION") {
      const m = evidence.match(AUTHORITY_CLEARED);
      if (m && m.index != null && !looksLikeRequirementContext(evidence, m.index)) {
        return {
          ...c,
          status: "superseded",
          summary: `${c.summary} (superseded by verified authority/safety clearance)`,
        };
      }
    }
    if (c.class === "INSUFFICIENT_EVIDENCE") {
      const m = evidence.match(EVIDENCE_CLEARED);
      if (m && m.index != null && !looksLikeRequirementContext(evidence, m.index)) {
        return {
          ...c,
          status: "superseded",
          summary: `${c.summary} (superseded by verified operating evidence)`,
        };
      }
    }
    return c;
  });
}

export function activeConstraints(
  constraints: readonly MaterialConstraint[],
): MaterialConstraint[] {
  return constraints.filter((c) => c.status === "active");
}

const CLASS_TO_GATE: Partial<
  Record<MaterialConstraintClass, { id: DecisionGateId; label: string }>
> = {
  NEGATIVE_UNIT_ECONOMICS: { id: "unit_economics", label: "unit economics acceptable" },
  UNVERIFIED_DEMAND: { id: "demand", label: "demand sufficiently supported" },
  CAPACITY_LIMIT: { id: "capacity", label: "capacity available or expansion justified" },
  INVESTMENT_JUSTIFICATION: {
    id: "investment_return",
    label: "required investment economically justified",
  },
  AUTHORITY_RESTRICTION: { id: "authority", label: "authority/safety clear" },
  INSUFFICIENT_EVIDENCE: { id: "evidence", label: "material/operating evidence sufficient" },
  CASH_CONSTRAINT: { id: "cash", label: "cash/budget sufficient" },
  EXPENDITURE_CEILING: { id: "expenditure", label: "expenditure within approved ceiling" },
  PERFORMANCE_THRESHOLD: { id: "performance", label: "performance meets threshold" },
  SUPPLIER_CONSTRAINT: { id: "supplier", label: "supplier constraint cleared" },
  TECHNICAL_INCOMPATIBILITY: { id: "technical", label: "technical compatibility" },
};

/** Map constraints into gate statuses for a scale-class decision. */
export function buildScaleDecisionGates(
  constraints: readonly MaterialConstraint[],
): DecisionGate[] {
  const gates: DecisionGate[] = [];
  const seen = new Set<DecisionGateId>();
  for (const c of constraints) {
    const meta = CLASS_TO_GATE[c.class];
    if (!meta || seen.has(meta.id)) continue;
    seen.add(meta.id);
    gates.push({
      id: meta.id,
      label: meta.label,
      status: c.status === "superseded" ? "PASS" : "FAIL",
      constraintClass: c.class,
    });
  }
  return gates;
}

export function assessScaleEligibility(
  constraints: readonly MaterialConstraint[],
): ScaleEligibility {
  const gates = buildScaleDecisionGates(constraints);
  const blockedBy = gates.filter((g) => g.status !== "PASS");
  const cleared = gates.filter((g) => g.status === "PASS");
  const scaleEligible = blockedBy.length === 0 && gates.length > 0
    ? true
    : blockedBy.length === 0 && activeConstraints(constraints).length === 0;

  const partialUnlock =
    blockedBy.length === 0
      ? "All identified material gates for meaningful scaling are clear — scale becomes eligible only if no new blocker appears."
      : cleared.length > 0
        ? `Partial unlock only: ${cleared.map((g) => g.label).join("; ")} cleared. Meaningful scaling remains blocked by: ${blockedBy.map((g) => g.label).join("; ")}.`
        : `Meaningful scaling is not eligible while these gates remain open: ${blockedBy.map((g) => g.label).join("; ")}.`;

  const exactEvidenceForScale = blockedBy.map((g) => {
    switch (g.id) {
      case "unit_economics":
        return "Verified contribution that is non-negative (or otherwise acceptable) after variable costs — not an unverified possible saving.";
      case "capacity":
        return "Verified capacity to support the intended volume, or a justified expansion plan that clears the capacity gate.";
      case "investment_return":
        return "Verified economics/ROI of any additional fixed investment required for expansion beyond current capacity.";
      case "demand":
        return "Independently verified demand evidence sufficient for the intended scale.";
      case "authority":
        return "Explicit Grand King authority for the restricted action.";
      case "cash":
        return "Verified cash/budget headroom for the proposed action.";
      case "expenditure":
        return "Verified expenditure within the approved ceiling (or an approved ceiling change).";
      case "performance":
        return "Verified performance at or above the required threshold.";
      case "supplier":
        return "Verified clearance of the supplier/MOQ constraint.";
      case "technical":
        return "Verified technical/infrastructure compatibility.";
      default:
        return `Verified evidence that clears: ${g.label}.`;
    }
  });

  return {
    scaleEligible: Boolean(scaleEligible && blockedBy.length === 0),
    blockedBy,
    cleared,
    partialUnlock,
    exactEvidenceForScale,
  };
}

export function recommendationViolatesConstraints(
  recommendationText: string,
  constraints: readonly MaterialConstraint[],
): MaterialConstraint | null {
  const active = activeConstraints(constraints);
  if (active.length === 0) return null;
  const t = recommendationText;
  const eligibility = assessScaleEligibility(constraints);

  // Partial gate clear must not be narrated as full scale unlock.
  if (FULL_SCALE_UNLOCK.test(t) && eligibility.blockedBy.length > 0) {
    return (
      active.find((c) =>
        eligibility.blockedBy.some((g) => g.constraintClass === c.class),
      ) ?? active[0]!
    );
  }

  const neg = active.find((c) => c.class === "NEGATIVE_UNIT_ECONOMICS");
  if (neg && SCALE_ACTION.test(t)) {
    if (!ECON_SUPERSEDED.test(t) && !/\buntil\s+(?:margin|economics|contribution)\b/i.test(t)) {
      return neg;
    }
  }

  const cap = active.find((c) => c.class === "CAPACITY_LIMIT");
  if (cap && (SCALE_ACTION.test(t) || FULL_SCALE_UNLOCK.test(t))) {
    if (!/\buntil\s+capacity|after\s+capacity|once\s+capacity|within\s+(?:current\s+)?capacity\b/i.test(t)) {
      return cap;
    }
  }

  const inv = active.find((c) => c.class === "INVESTMENT_JUSTIFICATION");
  if (inv && (SCALE_ACTION.test(t) || FULL_SCALE_UNLOCK.test(t))) {
    if (!/\buntil\s+investment|after\s+investment|once\s+investment\b/i.test(t)) return inv;
  }

  const auth = active.find((c) => c.class === "AUTHORITY_RESTRICTION");
  if (auth && /\b(?:deploy|publish|authorise\s+Birth|authorize\s+Birth|go\s+live\s+without)\b/i.test(t)) {
    if (!/\bGrand\s+King\s+authorit|await(?:ing)?\s+approv|without\s+authority\b/i.test(t)) {
      return auth;
    }
  }

  return null;
}

function recommendationCompatibleWith(
  constraints: readonly MaterialConstraint[],
): string {
  const eligibility = assessScaleEligibility(constraints);
  const active = activeConstraints(constraints);
  const lines = [
    "### My recommendation",
    `**Decision:** ${
      eligibility.scaleEligible
        ? "Meaningful scaling is eligible only while every material gate remains clear."
        : "Do not unlock meaningful scaling yet — at least one material gate remains open."
    }`,
    "",
    `**Gate status:** ${eligibility.partialUnlock}`,
  ];

  if (eligibility.exactEvidenceForScale.length > 0) {
    lines.push(
      "",
      "**Exact evidence still required for meaningful scaling:**",
      ...eligibility.exactEvidenceForScale.map((e) => `- ${e}`),
    );
  }

  const strongest =
    active.some((c) => c.class === "CAPACITY_LIMIT")
      ? "Strongest justified next step: a bounded action within current capacity (or a diligence step on expansion investment) — not irreversible scale."
      : active.some((c) => c.class === "NEGATIVE_UNIT_ECONOMICS")
        ? "Strongest justified next step: verify/repair unit economics with a bounded test — not scale."
        : "Strongest justified next step: a bounded verification that clears the highest remaining gate.";

  lines.push("", `**Partial unlock:** ${strongest}`);
  return lines.join("\n");
}

/** Natural answer for “what exact evidence would unlock meaningful scaling?” */
export function synthesizeExactEvidenceForDecision(
  constraints: readonly MaterialConstraint[],
  decisionLabel = "meaningful scaling",
): string {
  const eligibility = assessScaleEligibility(constraints);
  if (eligibility.blockedBy.length === 0) {
    return [
      `### Exact evidence for ${decisionLabel}`,
      "No active material blockers are identified for that decision from the supplied scenario — confirm no new gate appears before acting.",
    ].join("\n");
  }
  return [
    `### Exact evidence for ${decisionLabel}`,
    `Clearing one gate is not enough. ${decisionLabel} stays ineligible until every material gate passes:`,
    "",
    ...eligibility.exactEvidenceForScale.map((e, i) => `${i + 1}. ${e}`),
    "",
    eligibility.partialUnlock,
  ].join("\n");
}

/**
 * If final recommendation/unlock contradicts active multi-gate state, repair that slice only.
 */
export function ensureRecommendationConstraintConsistency(
  message: string,
  constraints: readonly MaterialConstraint[],
  userMessage = "",
): { message: string; repaired: boolean; violatedClass: string | null } {
  const text = String(message || "").trim();
  const ask = String(userMessage || text);
  if (!text || activeConstraints(constraints).length === 0) {
    return { message: text, repaired: false, violatedClass: null };
  }

  const respectsNegEcon = (t: string) =>
    /\b(?:do not scale|do not unlock meaningful scaling|withhold scale|scale losses|until (?:margin|economics|contribution)|resolve unit economics|verify\/repair unit economics|economics remain negative|binding (?:economic )?constraint|gate(?:s)? remain|not scale)\b/i.test(
      t,
    );

  const respectsMultiGate = (t: string) =>
    /\b(?:remain(?:s|ing)?\s+(?:unresolved|open|blocked)|capacity\s+(?:still|remain)|investment\s+(?:still|remain)|partial\s+unlock|not\s+(?:yet\s+)?(?:unlock|eligible)|gate(?:s)?\s+remain)\b/i.test(
      t,
    ) || !FULL_SCALE_UNLOCK.test(t);

  const slices = text.split(/(?=^#{1,3}\s+)/m);
  let repaired = false;
  let violatedClass: string | null = null;
  const out: string[] = [];

  for (const slice of slices) {
    const isRec =
      /#{1,3}\s+(?:My\s+)?recommendation\b/i.test(slice) ||
      /#{1,3}\s+(?:Decision(?:\s+unlock)?|What\s+this\s+(?:verification\s+)?unlocks?|Exact evidence)\b/i.test(
        slice,
      ) ||
      /\b(?:what\s+(?:decision|this)\s+(?:would\s+)?unlock|unlocks?\s+(?:the\s+)?(?:decision|scale)|exact evidence\s+(?:would|required|needed))\b/i.test(
        slice,
      );
    if (!isRec && slices.length > 1) {
      out.push(slice);
      continue;
    }
    const hit = recommendationViolatesConstraints(slice, constraints);
    if (hit) {
      repaired = true;
      violatedClass = hit.class;
      if (isRec) {
        out.push(recommendationCompatibleWith(constraints));
      } else {
        let fixed = slice.replace(
          FULL_SCALE_UNLOCK,
          "clear only the economics gate — not full scale eligibility",
        );
        // Only rewrite imperative scale actions, not “eligible for meaningful scaling” evidence asks.
        if (
          !/\b(?:exact evidence|evidence (?:would|needed|required)|what evidence)\b/i.test(slice)
        ) {
          fixed = fixed.replace(
            /\b(?:scale(?:\s+up)?(?:\s+(?:production|marketing|spend|ads|advertising|inventory|operations))?|ramp(?:\s+up)?(?:\s+production)?)\b/gi,
            "withhold scale",
          );
        }
        out.push(fixed);
        if (!respectsMultiGate(fixed)) {
          out.push("\n\n" + recommendationCompatibleWith(constraints));
        }
      }
    } else {
      out.push(slice);
    }
  }

  let merged = out.join("").replace(/\n{3,}/g, "\n\n").trim();
  if (!repaired) {
    const hit = recommendationViolatesConstraints(merged, constraints);
    if (hit) {
      repaired = true;
      violatedClass = hit.class;
      merged = `${merged}\n\n${recommendationCompatibleWith(constraints)}`.replace(/\n{3,}/g, "\n\n").trim();
    }
  }

  const eligibility = assessScaleEligibility(constraints);
  if (
    eligibility.blockedBy.length > 0 &&
    FULL_SCALE_UNLOCK.test(merged) &&
    !respectsMultiGate(merged)
  ) {
    repaired = true;
    violatedClass =
      violatedClass ?? eligibility.blockedBy[0]?.constraintClass ?? "CAPACITY_LIMIT";
    merged = `${merged}\n\n${recommendationCompatibleWith(constraints)}`.replace(/\n{3,}/g, "\n\n").trim();
  }

  // Dropout class: economics active but answer never carries the constraint into decision/rec.
  const neg = activeConstraints(constraints).find((c) => c.class === "NEGATIVE_UNIT_ECONOMICS");
  if (neg && !respectsNegEcon(merged)) {
    repaired = true;
    violatedClass = violatedClass ?? neg.class;
    merged = `${merged}\n\n${recommendationCompatibleWith(constraints)}`.replace(/\n{3,}/g, "\n\n").trim();
  }

  // Exact-evidence asks: if answer is generic UNKNOWN, inject gate list.
  if (
    /\b(?:exact evidence|what evidence would|evidence (?:would|needed|required) (?:to |for )?(?:unlock|make .{0,40} eligible))\b/i.test(
      merged,
    ) ||
    /\b(?:exact evidence|what evidence would|make .{0,60} eligible for .{0,40}scal)\b/i.test(
      // also check — use constraints context from caller via message alone
      text,
    )
  ) {
    const genericOnly =
      /\b(?:not established|unsupported as established|claim remains unproven)\b/i.test(merged) &&
      eligibility.exactEvidenceForScale.length > 0 &&
      !/\b(?:capacity|investment|contribution|gate|economics|performance|expenditure|authority)\b/i.test(
        merged.slice(-500),
      );
    if (genericOnly || (eligibility.exactEvidenceForScale.length > 0 && !/\bExact evidence still required|Clearing one gate is not enough\b/i.test(merged))) {
      if (!/\bExact evidence for\b|\bExact evidence still required\b/i.test(merged)) {
        repaired = true;
        merged = `${merged}\n\n${synthesizeExactEvidenceForDecision(constraints)}`.replace(
          /\n{3,}/g,
          "\n\n",
        ).trim();
      }
    }
  }

  // Decision-change / next-evidence / reversal asks: refuse single-gate unlock narratives.
  if (
    asksForDecisionChangingEvidence(ask) ||
    asksForReversalConditions(ask) ||
    asksForNextEvidence(ask)
  ) {
    const actions = buildActionEligibilityStates(ask, constraints);
    const primary = actions[0];
    if (primary && primary.requiredGates.filter((g) => g.status !== "PASS").length >= 2) {
      const remaining = primary.requiredGates.filter((g) => g.status !== "PASS");
      const claimsFullUnlock =
        DECISION_CHANGE_CLAIM.test(merged) &&
        !/\b(?:remain|still\s+block|other\s+gate|not\s+enough|alone\s+does\s+not|would\s+not\s+(?:yet\s+)?change|insufficient\s+alone)\b/i.test(
          merged,
        );
      const mentionsOnlyOneGate =
        remaining.length >= 2 &&
        remaining.filter((g) => {
          const re = new RegExp(g.label.split(" ")[0]!, "i");
          return re.test(merged) || new RegExp(g.id, "i").test(merged);
        }).length === 1 &&
        !/\b(?:all\s+(?:remaining\s+)?gates|both\s+(?:gates|blockers)|every\s+(?:remaining\s+)?gate)\b/i.test(
          merged,
        );
      if (claimsFullUnlock || mentionsOnlyOneGate || !/\bgate|remain|blocker|eligible/i.test(merged)) {
        repaired = true;
        violatedClass = violatedClass ?? remaining[0]?.constraintClass ?? "OTHER";
        const inject = asksForReversalConditions(ask)
          ? synthesizeReversalConditions(primary)
          : synthesizeNextEvidenceDecisionImpact(primary, ask);
        if (!/\bCLEARING ONE BLOCKER|would not (?:yet )?change decision eligibility|REMAINING_GATES\b/i.test(merged)) {
          merged = `${merged}\n\n${inject}`.replace(/\n{3,}/g, "\n\n").trim();
        }
      }
    }
  }

  return { message: merged, repaired, violatedClass };
}

/** Constraint-aware recommendation synthesizer. */
export function synthesizeConstraintAwareRecommendation(
  subject: string,
  constraints: readonly MaterialConstraint[],
): string {
  const active = activeConstraints(constraints);
  if (active.length > 0) {
    const actions = buildActionEligibilityStates(subject, constraints);
    const primary = actions[0];
    if (primary && asksForReversalConditions(subject)) {
      return synthesizeReversalConditions(primary);
    }
    if (
      primary &&
      (asksForDecisionChangingEvidence(subject) || asksForNextEvidence(subject))
    ) {
      return synthesizeNextEvidenceDecisionImpact(primary, subject);
    }
    if (/\bexact evidence|what evidence would|eligible for .{0,40}scal/i.test(subject)) {
      return synthesizeExactEvidenceForDecision(constraints);
    }
    return recommendationCompatibleWith(constraints);
  }
  return [
    "### My recommendation",
    `**Decision:** Treat the scenario claims carefully — verify the highest-risk claim before any irreversible financial action.`,
    "",
    `Regarding “${(subject || "this ask").slice(0, 100)}”: prefer a bounded verification step over acting as if unconstrained scale were already justified.`,
  ].join("\n");
}

export function asksForDecisionChangingEvidence(message: string): boolean {
  return /\b(?:change(?:s)?\s+the\s+recommendation|evidence\s+that\s+could\s+change|what\s+new\s+evidence\s+could\s+change|could\s+change\s+the\s+(?:recommendation|decision)|decision[- ]state\s+change)\b/i.test(
    message,
  );
}

export function asksForReversalConditions(message: string): boolean {
  return /\b(?:what\s+would\s+(?:make\s+you\s+)?reverse(?:\s+toward|\s+to)?|reversal\s+(?:toward|to|condition)|reverse\s+toward\s+candidate)\b/i.test(
    message,
  );
}

export function asksForNextEvidence(message: string): boolean {
  return /\b(?:single\s+most\s+valuable\s+next\s+evidence|most\s+valuable\s+next\s+(?:evidence|verification)|next\s+(?:most\s+)?valuable\s+evidence|highest[- ]value\s+next\s+verification)\b/i.test(
    message,
  );
}

/** Which gates would this proposed evidence clear? */
export function evaluateEvidenceGateImpact(
  action: ActionEligibility,
  proposedEvidence: string,
): EvidenceGateImpact {
  const evidence = String(proposedEvidence || "");
  const failing = action.requiredGates.filter((g) => g.status !== "PASS");
  const asConstraints: MaterialConstraint[] = action.requiredGates
    .filter((g) => g.constraintClass)
    .map((g, i) => ({
      id: `g_${g.id}_${i}`,
      class: g.constraintClass!,
      status: g.status === "PASS" ? ("superseded" as const) : ("active" as const),
      summary: g.label,
    }));
  const after = applyConstraintSupersession(asConstraints, evidence);
  const clearedIds: DecisionGateId[] = [];
  for (const c of after) {
    if (c.status === "superseded") {
      const gate = CLASS_TO_GATE[c.class];
      if (gate) clearedIds.push(gate.id);
    }
  }
  // Heuristic: if evidence only names one failing gate class without supersession phrases, treat as single clear intent.
  if (clearedIds.length === 0 && failing.length > 0) {
    for (const g of failing) {
      if (new RegExp(g.id, "i").test(evidence) || new RegExp(g.label.split(/\s+/)[0]!, "i").test(evidence)) {
        if (
          /\b(?:verify|confirm|improve|obtain|clear|meet|pass)\b/i.test(evidence) &&
          !/\b(?:and|both|all)\b/i.test(evidence)
        ) {
          clearedIds.push(g.id);
          break;
        }
      }
    }
  }
  const uniqueCleared = [...new Set(clearedIds)];
  const remaining = failing.filter((g) => !uniqueCleared.includes(g.id));
  const wouldChange = remaining.length === 0 && failing.length > 0;
  let impactClass: EvidenceImpactClass;
  if (wouldChange) impactClass = "decision_state_change";
  else if (uniqueCleared.length === 1 && remaining.length > 0) impactClass = "single_blocker_clear";
  else if (uniqueCleared.length === 0) impactClass = "uncertainty_reduction";
  else impactClass = "insufficient_alone";

  return {
    proposedEvidence: evidence,
    gatesCleared: uniqueCleared,
    gatesRemaining: remaining,
    wouldChangeDecisionEligibility: wouldChange,
    impactClass,
  };
}

function preferenceFromText(text: string, actionLabel: string): {
  comparativelyPreferred: boolean | null;
  preferenceNote: string | null;
} {
  const t = String(text || "");
  if (
    /\b(?:even\s+if\s+eligible|eligible\s+does\s+not\s+(?:mean|equal)\s+best|not\s+(?:comparatively\s+)?(?:best|preferred)|comparative\s+evidence\s+does\s+not\s+justify)\b/i.test(
      t,
    )
  ) {
    return {
      comparativelyPreferred: false,
      preferenceNote:
        "ELIGIBLE ≠ BEST — comparative evidence still required before preferring this action.",
    };
  }
  const prefer =
    new RegExp(
      `\\b(?:prefer|recommend|choose|best)\\b[\\s\\S]{0,40}\\b${actionLabel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
      "i",
    ).test(t) ||
    new RegExp(
      `\\b${actionLabel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b[\\s\\S]{0,40}\\b(?:preferred|best|recommended)\\b`,
      "i",
    ).test(t);
  if (prefer) {
    return {
      comparativelyPreferred: true,
      preferenceNote: "Comparative preference stated only among eligible options.",
    };
  }
  return { comparativelyPreferred: null, preferenceNote: null };
}

/**
 * Build per-action gate eligibility from owner pack (+ optional pre-extracted constraints).
 * Candidate blocks are preferred; otherwise a single primary decision action is used.
 */
export function buildActionEligibilityStates(
  userMessage: string,
  seededConstraints?: readonly MaterialConstraint[],
): ActionEligibility[] {
  const text = String(userMessage || "");
  const actions: ActionEligibility[] = [];

  const candidateRe =
    /\bCandidate\s+([A-Z])\b[\s\S]{0,400}?(?=\bCandidate\s+[A-Z]\b|$)/gi;
  let m: RegExpExecArray | null;
  while ((m = candidateRe.exec(text)) !== null) {
    const label = `Candidate ${m[1]}`;
    const block = m[0];
    const fromBlock = extractMaterialConstraints(block);
    const inferred = inferGatesFromRequirementLanguage(block);
    const mergedConstraints = [...fromBlock];
    for (const g of inferred) {
      if (g.constraintClass && !mergedConstraints.some((c) => c.class === g.constraintClass)) {
        mergedConstraints.push({
          id: `inf_${g.id}`,
          class: g.constraintClass,
          status: "active",
          summary: g.label,
        });
      }
    }
    const required = buildScaleDecisionGates(
      mergedConstraints.length ? mergedConstraints : extractMaterialConstraints(text),
    );
    const pref = preferenceFromText(text, label);
    actions.push({
      actionId: `candidate_${String(m[1]).toLowerCase()}`,
      actionLabel: label,
      requiredGates: required,
      currentlyEligible: required.length > 0 && required.every((g) => g.status === "PASS"),
      comparativelyPreferred: pref.comparativelyPreferred,
      preferenceNote: pref.preferenceNote,
    });
  }

  if (actions.length === 0) {
    const constraints =
      seededConstraints && seededConstraints.length > 0
        ? [...seededConstraints]
        : extractMaterialConstraints(text);
    const gates = buildScaleDecisionGates(constraints);
    const pref = preferenceFromText(text, "primary decision");
    actions.push({
      actionId: "primary_decision",
      actionLabel: "primary decision",
      requiredGates: gates,
      currentlyEligible: gates.length > 0 && gates.every((g) => g.status === "PASS"),
      comparativelyPreferred: pref.comparativelyPreferred,
      preferenceNote: pref.preferenceNote,
    });
  }

  return actions;
}

function inferGatesFromRequirementLanguage(block: string): DecisionGate[] {
  const constraints = extractMaterialConstraints(
    [
      PERFORMANCE.test(block) || /performance\s*(?:>=\s*|threshold)/i.test(block)
        ? "performance is below the threshold"
        : "",
      EXPENDITURE.test(block) || /expenditure\s*(?:<=\s*|ceiling)/i.test(block)
        ? "expenditure exceeds the approved ceiling"
        : "",
      /safety\s+(?:authorization|authorisation)/i.test(block)
        ? "safety authorization missing"
        : "",
      /budget\s+compatibility/i.test(block) ? "budget compatibility fails" : "",
      /operating\s+evidence/i.test(block) ? "insufficient operating evidence" : "",
      /unit\s+economics|contribution/i.test(block) ? "negative unit economics" : "",
      /capacity/i.test(block) ? "capacity is limited to 100 transactions/week" : "",
    ]
      .filter(Boolean)
      .join("; "),
  );
  return buildScaleDecisionGates(constraints);
}

export function synthesizeNextEvidenceDecisionImpact(
  action: ActionEligibility,
  userMessage: string,
): string {
  const failing = action.requiredGates.filter((g) => g.status !== "PASS");
  const lines = [
    "### Next evidence vs decision eligibility",
    `**Action:** ${action.actionLabel}`,
    `**CURRENTLY_ELIGIBLE:** ${action.currentlyEligible ? "YES" : "NO"}`,
    `**REQUIRED_GATES:** ${
      action.requiredGates.map((g) => `${g.id}=${g.status}`).join("; ") || "(none identified)"
    }`,
  ];

  if (failing.length === 0) {
    lines.push(
      "",
      "All identified gates pass — eligibility is clear. Preference still requires comparative evidence (ELIGIBLE ≠ BEST).",
    );
    if (action.preferenceNote) lines.push(`**Preference:** ${action.preferenceNote}`);
    return lines.join("\n");
  }

  if (failing.length === 1) {
    lines.push(
      "",
      `A single verification that clears **${failing[0]!.label}** would change decision eligibility.`,
      `Highest-value next verification: verified clearance of ${failing[0]!.label}.`,
    );
    return lines.join("\n");
  }

  const wantsChange =
    asksForDecisionChangingEvidence(userMessage) ||
    /\bchange\s+the\s+recommendation\b/i.test(userMessage);

  lines.push(
    "",
    "**CLEARING ONE BLOCKER ≠ DECISION UNLOCK** while other required blockers remain active.",
    "",
    `No single evidence item clears all independent blockers (${failing.map((g) => g.label).join("; ")}).`,
  );

  if (wantsChange) {
    lines.push(
      "",
      "Evidence that could **change** the recommendation must clear **every** currently failing gate — not only one attractive improvement.",
      "",
      "**REMAINING_GATES (all must pass for eligibility):**",
      ...failing.map((g) => `- ${g.label} (${g.id}=${g.status})`),
      "",
      `Highest-value next verification: clear ${failing[0]!.label} — **and** explicitly note that ${failing
        .slice(1)
        .map((g) => g.label)
        .join("; ")} would still remain.`,
    );
  } else {
    lines.push(
      "",
      `Highest-value next verification (uncertainty / one-blocker class): clear ${failing[0]!.label}.`,
      `**REMAINING_GATES after that alone:** ${failing
        .slice(1)
        .map((g) => g.label)
        .join("; ") || "none"}.`,
      "That verification would **not** yet change decision eligibility.",
    );
  }

  if (action.comparativelyPreferred === false || action.preferenceNote) {
    lines.push(
      "",
      `**ELIGIBILITY vs PREFERENCE:** ${
        action.preferenceNote ??
        "Even after all gates pass, comparative evidence must still justify preferring this action."
      }`,
    );
  }

  return lines.join("\n");
}

export function synthesizeReversalConditions(action: ActionEligibility): string {
  const failing = action.requiredGates.filter((g) => g.status !== "PASS");
  const lines = [
    `### Reversal conditions — ${action.actionLabel}`,
    `REVERSE_TO_${action.actionId.toUpperCase()} only if:`,
  ];
  if (action.requiredGates.length === 0) {
    lines.push("- (no binding gates identified from the pack — state residual uncertainty)");
  } else {
    for (const g of action.requiredGates) {
      lines.push(`- ${g.label} = PASS (currently ${g.status})`);
    }
  }
  lines.push(
    "- AND comparative evidence then makes this action preferable among eligible options.",
    "",
    "Do not reverse on a single attractive improvement while another required gate remains FAIL/UNKNOWN.",
  );
  if (failing.length > 0) {
    lines.push(
      "",
      `Currently binding gates that must all be addressed: ${failing.map((g) => g.label).join("; ")}.`,
    );
  }
  lines.push(
    "",
    "**ELIGIBILITY ≠ PREFERENCE:** clearing gates makes the action selectable; preference still needs comparative justification.",
  );
  return lines.join("\n");
}

/** Compact brief for canonical / prompt injection. */
export function formatActionEligibilityBrief(
  actions: readonly ActionEligibility[],
): string {
  if (!actions.length) return "";
  const lines = [
    "[Canonical decision-gate state — CLEARING ONE BLOCKER ≠ DECISION UNLOCK; ELIGIBLE ≠ BEST]",
  ];
  for (const a of actions) {
    lines.push(
      `- ACTION=${a.actionLabel} CURRENTLY_ELIGIBLE=${a.currentlyEligible ? "YES" : "NO"}`,
    );
    for (const g of a.requiredGates) {
      lines.push(`  GATE_${g.id}=${g.status} (${g.label})`);
    }
    if (a.preferenceNote) lines.push(`  PREFERENCE_NOTE=${a.preferenceNote}`);
  }
  return lines.join("\n");
}
