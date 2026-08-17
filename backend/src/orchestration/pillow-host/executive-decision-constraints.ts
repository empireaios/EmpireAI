/**
 * Material decision-constraint tracking for executive recommendations.
 * Deterministic — no second LLM. Does not encode sealed exam scenarios.
 *
 * Fact/premise → MATERIAL_CONSTRAINTS[] → recommendation must stay compatible.
 */

export type MaterialConstraintClass =
  | "NEGATIVE_UNIT_ECONOMICS"
  | "UNVERIFIED_DEMAND"
  | "CAPACITY_LIMIT"
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

const SCALE_ACTION =
  /\b(?:scale(?:\s+up)?(?:\s+(?:production|marketing|spend|ads|advertising|inventory|operations))?|ramp(?:\s+up)?(?:\s+production)?|expand(?:\s+(?:marketing|production|spend))?|increase\s+(?:production|marketing\s+spend|ad\s+spend)|go\s+all[\s-]in|aggressively\s+(?:scale|expand))\b/i;

const NEGATIVE_ECON =
  /\b(?:negative\s+(?:contribution\s+)?(?:margin|unit\s+economics)|contribution\s+margin\s*(?:=|:)?\s*-|loses?\s+money\s+per\s+(?:sale|unit|order)|loss(?:es)?\s+per\s+(?:completed\s+)?(?:sale|unit)|unit\s+economics?\s+(?:are\s+)?(?:negative|adverse|underwater)|margin\s+(?:is\s+)?negative|unprofitable\s+per\s+(?:sale|unit))\b/i;

const ECON_SUPERSEDED =
  /\b(?:margin\s+(?:is\s+)?(?:now\s+)?positive|contribution\s+(?:is\s+)?(?:now\s+)?positive|unit\s+economics?\s+(?:are\s+)?(?:now\s+)?(?:positive|repaired|fixed)|cost\s+reduction\s+(?:is\s+)?verified|economics?\s+(?:have\s+been\s+)?(?:repaired|resolved|cleared)|profitable\s+per\s+(?:sale|unit)\s+(?:is\s+)?(?:now\s+)?(?:verified|established))\b/i;

const CAPACITY =
  /\b(?:capacity\s+(?:limit|constraint|capped|exhausted)|cannot\s+(?:fulfill|fulfil)|warehouse\s+(?:full|capacity)|throughput\s+(?:limit|constrained)|insufficient\s+capacity)\b/i;

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

  return applyConstraintSupersession(out, draft || userMessage);
}

/** Newer evidence can supersede an active constraint — never silently forget. */
export function applyConstraintSupersession(
  constraints: readonly MaterialConstraint[],
  evidenceText: string,
): MaterialConstraint[] {
  return constraints.map((c) => {
    if (c.status !== "active") return c;
    if (c.class === "NEGATIVE_UNIT_ECONOMICS" && ECON_SUPERSEDED.test(evidenceText)) {
      return {
        ...c,
        status: "superseded",
        summary: `${c.summary} (superseded by verified economics repair)`,
      };
    }
    if (
      c.class === "UNVERIFIED_DEMAND" &&
      /\b(?:demand\s+(?:is\s+)?(?:now\s+)?(?:verified|proven|confirmed)|verified\s+(?:strong\s+)?demand)\b/i.test(
        evidenceText,
      ) &&
      !/\bunverified|unproven\b/i.test(evidenceText.slice(-200))
    ) {
      // Only supersede if clear positive verification language dominates.
      if (/\b(?:verified|proven|confirmed)\s+(?:strong\s+)?demand\b/i.test(evidenceText)) {
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

export function recommendationViolatesConstraints(
  recommendationText: string,
  constraints: readonly MaterialConstraint[],
): MaterialConstraint | null {
  const active = activeConstraints(constraints);
  if (active.length === 0) return null;
  const t = recommendationText;

  const neg = active.find((c) => c.class === "NEGATIVE_UNIT_ECONOMICS");
  if (neg && SCALE_ACTION.test(t)) {
    // Allow scale only if the same slice also repairs economics.
    if (!ECON_SUPERSEDED.test(t) && !/\buntil\s+(?:margin|economics|contribution)\b/i.test(t)) {
      return neg;
    }
  }

  const cap = active.find((c) => c.class === "CAPACITY_LIMIT");
  if (cap && /\b(?:scale|ramp|expand)\s+(?:production|fulfilment|throughput)\b/i.test(t)) {
    if (!/\buntil\s+capacity|after\s+capacity|once\s+capacity\b/i.test(t)) return cap;
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
  const active = activeConstraints(constraints);
  const neg = active.find((c) => c.class === "NEGATIVE_UNIT_ECONOMICS");
  const cap = active.find((c) => c.class === "CAPACITY_LIMIT");
  const auth = active.find((c) => c.class === "AUTHORITY_RESTRICTION");

  if (neg) {
    return [
      "### My recommendation",
      "**Decision:** Do not scale production or marketing while contribution economics remain negative — strong demand alone would scale losses.",
      "",
      "**What demand verification unlocks:** that demand is no longer the blocker. Next resolve unit economics (pricing, cost, fulfilment) until contribution clears an acceptable threshold — then revisit scale.",
      "",
      "**Reversal:** verified repair of unit economics (positive contribution) would reopen scale eligibility.",
    ].join("\n");
  }
  if (cap) {
    return [
      "### My recommendation",
      "**Decision:** Do not scale throughput until the capacity constraint is resolved.",
      "",
      "Verification that demand or economics look attractive does not unlock scale past a hard capacity limit.",
    ].join("\n");
  }
  if (auth) {
    return [
      "### My recommendation",
      "**Decision:** Withhold any action that requires Grand King authority until that approval is explicit.",
      "",
      "Attractive opportunity language does not unlock restricted actions.",
    ].join("\n");
  }
  return [
    "### My recommendation",
    "**Decision:** Proceed only with a bounded next step that respects every unresolved material constraint.",
  ].join("\n");
}

/**
 * If final recommendation/unlock contradicts active constraints, repair that slice only.
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
    /\b(?:do not scale|withhold scale|scale losses|until (?:margin|economics|contribution)|resolve unit economics|economics remain negative|binding (?:economic )?constraint)\b/i.test(
      t,
    );

  // Prefer checking recommendation / decision-unlock slices; fall back to whole text.
  const slices = text.split(/(?=^#{1,3}\s+)/m);
  let repaired = false;
  let violatedClass: string | null = null;
  const out: string[] = [];

  for (const slice of slices) {
    const isRec =
      /#{1,3}\s+(?:My\s+)?recommendation\b/i.test(slice) ||
      /#{1,3}\s+(?:Decision(?:\s+unlock)?|What\s+this\s+(?:verification\s+)?unlocks?)\b/i.test(
        slice,
      ) ||
      /\b(?:what\s+(?:decision|this)\s+(?:would\s+)?unlock|unlocks?\s+(?:the\s+)?(?:decision|scale))\b/i.test(
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
        out.push(slice.replace(SCALE_ACTION, "withhold scale"));
        if (!/\bdo not scale\b/i.test(slice)) {
          out.push("\n\n" + recommendationCompatibleWith(constraints));
        }
      }
    } else {
      out.push(slice);
    }
  }

  let merged = out.join("").replace(/\n{3,}/g, "\n\n").trim();
  // Final whole-text check (LLM may put scale advice outside headed sections).
  if (!repaired) {
    const hit = recommendationViolatesConstraints(merged, constraints);
    if (hit) {
      repaired = true;
      violatedClass = hit.class;
      merged = `${merged}\n\n${recommendationCompatibleWith(constraints)}`.replace(/\n{3,}/g, "\n\n").trim();
    }
  }

  // Dropout class: economics active but answer never carries the constraint into decision/rec.
  const neg = activeConstraints(constraints).find((c) => c.class === "NEGATIVE_UNIT_ECONOMICS");
  if (neg && !respectsNegEcon(merged)) {
    repaired = true;
    violatedClass = violatedClass ?? neg.class;
    merged = `${merged}\n\n${recommendationCompatibleWith(constraints)}`.replace(/\n{3,}/g, "\n\n").trim();
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
    return recommendationCompatibleWith(constraints);
  }
  return [
    "### My recommendation",
    `**Decision:** Treat the scenario claims carefully — verify the highest-risk claim before any irreversible financial action.`,
    "",
    `Regarding “${(subject || "this ask").slice(0, 100)}”: prefer a bounded verification step over acting as if unconstrained scale were already justified.`,
  ].join("\n");
}
