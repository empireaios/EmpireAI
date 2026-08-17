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
  | "technical";

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
  /\b(?:without\s+(?:Grand\s+King|owner)\s+authorit|authority\s+(?:restriction|blocker|required)|cannot\s+(?:deploy|publish|authorise\s+Birth|authorize\s+Birth)|Birth\s+(?:not\s+)?authoris)\b/i;

const UNVERIFIED_DEMAND =
  /\b(?:unverified\s+demand|demand\s+(?:is\s+)?unverified|supplier\s+(?:claims?|assert(?:s|ed|ion)?)\s+(?:strong\s+)?demand|demand\s+(?:remains?\s+)?unproven)\b/i;

const INSUFFICIENT_EVIDENCE =
  /\b(?:insufficient\s+(?:verified\s+)?evidence|not\s+enough\s+(?:verified\s+)?evidence|evidence\s+(?:is\s+)?insufficient)\b/i;

const CASH =
  /\b(?:insufficient\s+cash|cash\s+(?:constraint|runway)|budget\s+ceiling|cannot\s+fund)\b/i;

const SUPPLIER =
  /\b(?:supplier\s+(?:constraint|blocker|unavailable|cannot)|MOQ\s+(?:blocker|constraint))\b/i;

const TECHNICAL =
  /\b(?:technical\s+incompatib|infrastructure\s+(?:incompatib|dependency\s+blocker)|incompatible\s+infrastructure)\b/i;

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
  INSUFFICIENT_EVIDENCE: { id: "evidence", label: "material evidence sufficient" },
  CASH_CONSTRAINT: { id: "cash", label: "cash/budget sufficient" },
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
): { message: string; repaired: boolean; violatedClass: string | null } {
  const text = String(message || "").trim();
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
      !/\b(?:capacity|investment|contribution|gate|economics)\b/i.test(merged.slice(-500));
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

  return { message: merged, repaired, violatedClass };
}

/** Constraint-aware recommendation synthesizer. */
export function synthesizeConstraintAwareRecommendation(
  subject: string,
  constraints: readonly MaterialConstraint[],
): string {
  const active = activeConstraints(constraints);
  if (active.length > 0) {
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
