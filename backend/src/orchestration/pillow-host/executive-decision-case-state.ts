/**
 * Authoritative multi-candidate decision case state.
 * ONE authority for: gates → eligibility → eligible set → recommendation.
 * Does not encode sealed examination content (Pioneer etc.).
 */
import type { DecisionGateStatus } from "./executive-decision-constraints.js";

export type CommercialGateId =
  | "cost_ceiling"
  | "margin_floor"
  | "delivery_sla"
  | "approval"
  | "stock"
  | "policy"
  | "quality"
  | "capacity"
  | "evidence"
  | "return_threshold"
  | "contribution_min"
  | "other";

export type CommercialGate = {
  id: CommercialGateId;
  label: string;
  status: DecisionGateStatus;
  /** Soft preference only — never overrides FAIL/UNKNOWN on hard gates. */
  soft?: boolean;
  raw?: string;
};

export type CandidateDecisionState = {
  candidateId: string;
  displayName: string;
  gates: CommercialGate[];
  failedGates: CommercialGate[];
  unknownGates: CommercialGate[];
  currentlyEligible: boolean;
  potentiallyAttractiveIfChanged: boolean;
  supportedMetric: number | null;
  evidenceNote: string | null;
};

export type DecisionObjective =
  | "select_sole_eligible"
  | "select_cheapest_eligible"
  | "select_highest_metric_eligible"
  | "select_none_unless_eligible"
  | "unresolved";

export type DecisionCaseState = {
  caseId: string;
  objective: DecisionObjective;
  tieBreak: string | null;
  mandatoryGateIds: CommercialGateId[];
  candidates: CandidateDecisionState[];
  eligibleSet: string[];
  /** Canonical current action — never invent per-section. */
  recommendation: {
    status: "SELECT" | "DO_NOT_SELECT" | "UNRESOLVED";
    selectedId: string | null;
    rationale: string;
  };
  reversalConditions: string[];
  decisionConfidence: "high" | "medium" | "low";
};

function key(s: string): string {
  return String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

function parseMoney(raw: string): number | null {
  const m = String(raw || "").replace(/,/g, "").match(/(-?\d+(?:\.\d+)?)/);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : null;
}

function parsePct(raw: string): number | null {
  const m = String(raw || "").match(/(\d+(?:\.\d+)?)\s*%/);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : null;
}

/** Explicit PASS/FAIL/PENDING tokens in a candidate line. */
function explicitStatus(fragment: string): DecisionGateStatus | null {
  if (/\bPENDING\b/i.test(fragment) && !/\b(?:granted|cleared|PASS)\b/i.test(fragment)) {
    return "FAIL"; // pending mandatory approval ≠ PASS
  }
  if (/\bFAIL(?:ED|S|URE)?\b/i.test(fragment)) return "FAIL";
  if (/\bPASS(?:ED|ES)?\b/i.test(fragment) || /\bgranted\b/i.test(fragment)) return "PASS";
  if (/\bUNKNOWN\b|\bmissing\b|\bunstated\b|\bnot\s+(?:yet\s+)?(?:known|established)\b/i.test(fragment)) {
    return "UNKNOWN";
  }
  return null;
}

export type ParsedRule = {
  costCeiling: number | null;
  costOp: "<=" | "<";
  deliveryFloor: number | null;
  deliveryOp: ">=" | ">";
  approvalRequired: boolean;
  marginFloor: number | null;
  objective: DecisionObjective;
};

export function parseDecisionRules(userMessage: string): ParsedRule {
  const t = String(userMessage || "");
  let costCeiling: number | null = null;
  let costOp: "<=" | "<" = "<=";
  const costM =
    /(?:cost|procurement\s+cost|expenditure|budget)\s*(?:ceiling|cap|limit)?\s*(?:<=|≤|<|no\s+more\s+than|at\s+most)\s*(?:S\$|SGD|\$)?\s*([\d,]+(?:\.\d+)?)/i.exec(
      t,
    ) ||
    /(?:<=|≤|no\s+more\s+than|at\s+most)\s*(?:S\$|SGD|\$)?\s*([\d,]+(?:\.\d+)?)/i.exec(t);
  if (costM) costCeiling = parseMoney(costM[1]!);
  if (/\bcost\b[^.\n]{0,40}<\s*(?:S\$|\$)?\s*\d/i.test(t) && !/<=|≤|at\s+most|no\s+more/i.test(t)) {
    costOp = "<";
  }

  let deliveryFloor: number | null = null;
  let deliveryOp: ">=" | ">" = ">=";
  const delM =
    /(?:on[- ]?time\s+delivery|delivery(?:\s+SLA)?|OTD)\s*(?:>=|≥|>|at\s+least)\s*(\d+(?:\.\d+)?)\s*%/i.exec(
      t,
    );
  if (delM) deliveryFloor = Number(delM[1]);
  if (/\bdelivery\b[^.\n]{0,30}>\s*\d/i.test(t) && !/>=|≥|at\s+least/i.test(t)) deliveryOp = ">";

  const approvalRequired =
    /\b(?:NO\s+mandatory\s+(?:compliance\s+)?approval\s+pending|approval\s+(?:must\s+be\s+)?(?:granted|cleared)|no\s+pending\s+approval|mandatory\s+(?:compliance\s+)?approval)\b/i.test(
      t,
    );

  let marginFloor: number | null = null;
  const marM = /(?:margin|contribution)\s*(?:floor|min(?:imum)?)?\s*(?:>=|≥|at\s+least)\s*(\d+(?:\.\d+)?)\s*%/i.exec(
    t,
  );
  if (marM) marginFloor = Number(marM[1]);

  let objective: DecisionObjective = "select_sole_eligible";
  if (/\bcheapest\s+eligible\b|\blowest\s+(?:eligible\s+)?cost\b/i.test(t)) {
    objective = "select_cheapest_eligible";
  } else if (
    /\bhighest\s+(?:supported\s+)?(?:contribution|margin|metric|score)\b|\bbest\s+eligible\b/i.test(t)
  ) {
    objective = "select_highest_metric_eligible";
  } else if (
    /\bif\s+exactly\s+one\s+eligible|\bselect\s+that\s+(?:supplier|candidate|option)\b|\bsole\s+eligible\b/i.test(
      t,
    )
  ) {
    objective = "select_sole_eligible";
  } else if (
    /\bno\s+selection\s+unless|\bdo\s+not\s+select\s+any\s+unless|\bunless\s+two\s+independent\b/i.test(t)
  ) {
    objective = "select_none_unless_eligible";
  } else if (!/\beligible\b|\bselect\b|\brecommend\b/i.test(t)) {
    objective = "unresolved";
  }

  return {
    costCeiling,
    costOp,
    deliveryFloor,
    deliveryOp,
    approvalRequired,
    marginFloor,
    objective,
  };
}

/**
 * Extract named candidate blocks:
 * FLINT: cost 360000 PASS; delivery 96% PASS; approval granted PASS.
 * Candidate A: ...
 */
export function extractNamedCandidateBlocks(userMessage: string): Array<{ name: string; body: string }> {
  const text = String(userMessage || "");
  const out: Array<{ name: string; body: string }> = [];
  const seen = new Set<string>();

  // NAME: body until next NAME: or blank-line section
  const named =
    /(?:^|\n)\s*([A-Z][A-Z0-9_-]{1,24})\s*:\s*([^\n]+(?:\n(?!\s*[A-Z][A-Z0-9_-]{1,24}\s*:)[^\n]+)*)/g;
  let m: RegExpExecArray | null;
  while ((m = named.exec(text)) !== null) {
    const name = m[1]!;
    if (
      /^(?:ANSWER|AUDIT|RULE|NOTE|PACK|CLAIM|SECTION|SNAPSHOT|CLOSING|ALSO|THEN|GIVEN|ASSESS|SYNTHETIC)/i.test(
        name,
      )
    ) {
      continue;
    }
    const body = m[2]!.trim();
    if (!/\b(?:cost|delivery|approval|margin|stock|PASS|FAIL|PENDING|eligible|gate)\b/i.test(body)) {
      continue;
    }
    const k = key(name);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push({ name, body });
  }

  // Candidate A / Candidate B blocks
  const candRe = /\bCandidate\s+([A-Z0-9_-]+)\b\s*:?\s*([\s\S]{0,500}?)(?=\bCandidate\s+[A-Z0-9_-]+\b|$)/gi;
  while ((m = candRe.exec(text)) !== null) {
    const name = `Candidate ${m[1]}`;
    const k = key(name);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push({ name, body: m[2]!.trim() });
  }

  return out.slice(0, 50);
}

function evaluateCandidateGates(
  body: string,
  rules: ParsedRule,
): CommercialGate[] {
  const gates: CommercialGate[] = [];
  const t = body;

  // Cost
  if (rules.costCeiling != null || /\bcost\b/i.test(t)) {
    const costTok =
      /cost\s*[:=]?\s*(?:S\$|SGD|\$)?\s*([\d,]+(?:\.\d+)?)(?:\s*(PASS|FAIL|PENDING|UNKNOWN))?/i.exec(t);
    const explicit = costTok?.[2] ? explicitStatus(costTok[2]) : explicitStatus(
      /cost[^;\n]{0,40}/i.exec(t)?.[0] || "",
    );
    let status: DecisionGateStatus = "UNKNOWN";
    const val = costTok ? parseMoney(costTok[1]!) : null;
    if (explicit) status = explicit;
    else if (val != null && rules.costCeiling != null) {
      status =
        rules.costOp === "<"
          ? val < rules.costCeiling
            ? "PASS"
            : "FAIL"
          : val <= rules.costCeiling
            ? "PASS"
            : "FAIL";
    } else if (val != null) status = "PASS";
    gates.push({
      id: "cost_ceiling",
      label: "cost ceiling",
      status,
      raw: costTok?.[0],
    });
  }

  // Delivery SLA
  if (rules.deliveryFloor != null || /\b(?:delivery|on[- ]?time|OTD)\b/i.test(t)) {
    const delTok =
      /(?:on[- ]?time\s+)?delivery\s*[:=]?\s*(\d+(?:\.\d+)?)\s*%(?:\s*(PASS|FAIL|PENDING|UNKNOWN))?/i.exec(
        t,
      );
    const explicit = delTok?.[2]
      ? explicitStatus(delTok[2])
      : explicitStatus(/(?:delivery|OTD)[^;\n]{0,40}/i.exec(t)?.[0] || "");
    let status: DecisionGateStatus = "UNKNOWN";
    const val = delTok ? Number(delTok[1]) : parsePct(t);
    if (explicit) status = explicit;
    else if (val != null && rules.deliveryFloor != null) {
      status =
        rules.deliveryOp === ">"
          ? val > rules.deliveryFloor
            ? "PASS"
            : "FAIL"
          : val >= rules.deliveryFloor
            ? "PASS"
            : "FAIL";
    } else if (val != null) status = "PASS";
    gates.push({
      id: "delivery_sla",
      label: "on-time delivery SLA",
      status,
      raw: delTok?.[0],
    });
  }

  // Approval (mandatory pending = FAIL)
  if (rules.approvalRequired || /\bapproval\b/i.test(t)) {
    const frag = /approval[^;\n]{0,60}/i.exec(t)?.[0] || t;
    let status = explicitStatus(frag);
    if (!status) {
      if (/\b(?:granted|cleared|approved|obtained)\b/i.test(frag)) status = "PASS";
      else if (/\bpending\b/i.test(frag)) status = "FAIL";
      else status = "UNKNOWN";
    }
    // Pending never counts as PASS for mandatory approval
    if (/\bpending\b/i.test(frag) && rules.approvalRequired) status = "FAIL";
    gates.push({
      id: "approval",
      label: "mandatory compliance approval",
      status,
      raw: frag.slice(0, 80),
    });
  }

  // Margin floor (optional)
  if (rules.marginFloor != null || /\bmargin\b|\bcontribution\b/i.test(t)) {
    const marTok =
      /(?:margin|contribution)\s*[:=]?\s*(\d+(?:\.\d+)?)\s*%(?:\s*(PASS|FAIL|UNKNOWN))?/i.exec(t);
    if (marTok || rules.marginFloor != null) {
      const explicit = marTok?.[2] ? explicitStatus(marTok[2]) : null;
      let status: DecisionGateStatus = "UNKNOWN";
      const val = marTok ? Number(marTok[1]) : null;
      if (explicit) status = explicit;
      else if (val != null && rules.marginFloor != null) {
        status = val >= rules.marginFloor ? "PASS" : "FAIL";
      }
      gates.push({
        id: "margin_floor",
        label: "margin floor",
        status,
        soft: false,
      });
    }
  }

  // Stock / capacity soft-or-hard if mentioned
  if (/\bstock\b|\binventory\b/i.test(t)) {
    const frag = /(?:stock|inventory)[^;\n]{0,40}/i.exec(t)?.[0] || "";
    let status = explicitStatus(frag) || (/unavailable|zero|out\s+of\s+stock/i.test(frag) ? "FAIL" : "PASS");
    gates.push({ id: "stock", label: "stock availability", status });
  }

  return gates;
}

function metricFromBody(body: string): number | null {
  const contrib = /(?:contribution|margin|score|metric)\s*[:=]?\s*(-?\d+(?:\.\d+)?)/i.exec(body);
  if (contrib) return Number(contrib[1]);
  const cost = /cost\s*[:=]?\s*(?:S\$|\$)?\s*([\d,]+(?:\.\d+)?)/i.exec(body);
  if (cost) return -parseMoney(cost[1]!)!; // lower cost → higher attractiveness when negated
  return null;
}

export function buildDecisionCaseState(userMessage: string): DecisionCaseState | null {
  const text = String(userMessage || "");
  const rules = parseDecisionRules(text);
  const blocks = extractNamedCandidateBlocks(text);
  if (blocks.length < 1) return null;

  const mandatory: CommercialGateId[] = [];
  if (rules.costCeiling != null) mandatory.push("cost_ceiling");
  if (rules.deliveryFloor != null) mandatory.push("delivery_sla");
  if (rules.approvalRequired) mandatory.push("approval");
  if (rules.marginFloor != null) mandatory.push("margin_floor");

  const candidates: CandidateDecisionState[] = blocks.map((b) => {
    const gates = evaluateCandidateGates(b.body, rules);
    // Ensure mandatory gates exist even if line omitted them
    for (const id of mandatory) {
      if (!gates.some((g) => g.id === id)) {
        gates.push({
          id,
          label: id.replace(/_/g, " "),
          status: "UNKNOWN",
        });
      }
    }
    const hard = gates.filter((g) => !g.soft);
    const failedGates = hard.filter((g) => g.status === "FAIL");
    const unknownGates = hard.filter((g) => g.status === "UNKNOWN");
    const currentlyEligible =
      hard.length > 0 && hard.every((g) => g.status === "PASS");
    const potentiallyAttractiveIfChanged =
      !currentlyEligible &&
      (failedGates.some((g) => g.id === "approval") || unknownGates.length > 0);
    return {
      candidateId: key(b.name),
      displayName: b.name,
      gates,
      failedGates,
      unknownGates,
      currentlyEligible,
      potentiallyAttractiveIfChanged,
      supportedMetric: metricFromBody(b.body),
      evidenceNote: null,
    };
  });

  const eligibleSet = candidates.filter((c) => c.currentlyEligible).map((c) => c.displayName);

  let recommendation: DecisionCaseState["recommendation"] = {
    status: "UNRESOLVED",
    selectedId: null,
    rationale: "Insufficient rule/evidence for a unique selection.",
  };

  const objective = rules.objective;
  if (objective !== "unresolved" || eligibleSet.length >= 0) {
    if (eligibleSet.length === 0) {
      recommendation = {
        status: "DO_NOT_SELECT",
        selectedId: null,
        rationale: "No candidate currently passes every mandatory gate.",
      };
    } else if (eligibleSet.length === 1 || objective === "select_sole_eligible") {
      if (eligibleSet.length === 1) {
        recommendation = {
          status: "SELECT",
          selectedId: eligibleSet[0]!,
          rationale: `${eligibleSet[0]} is the sole currently eligible candidate.`,
        };
      } else if (objective === "select_cheapest_eligible" || objective === "select_highest_metric_eligible") {
        // fall through to multi
      } else {
        recommendation = {
          status: "SELECT",
          selectedId: eligibleSet[0]!,
          rationale: `Multiple eligible; defaulting to first eligible under sole-eligible preference is unsafe — applying comparative rule if present.`,
        };
      }
    }

    if (eligibleSet.length > 1) {
      const eligibleObjs = candidates.filter((c) => c.currentlyEligible);
      if (objective === "select_cheapest_eligible") {
        const ranked = [...eligibleObjs].sort(
          (a, b) => (a.supportedMetric ?? 0) - (b.supportedMetric ?? 0),
        );
        // supportedMetric for cost is negated cost; higher = cheaper
        ranked.sort((a, b) => (b.supportedMetric ?? -Infinity) - (a.supportedMetric ?? -Infinity));
        recommendation = {
          status: "SELECT",
          selectedId: ranked[0]!.displayName,
          rationale: `Cheapest eligible among ${eligibleSet.join(", ")}.`,
        };
      } else if (objective === "select_highest_metric_eligible") {
        const ranked = [...eligibleObjs].sort(
          (a, b) => (b.supportedMetric ?? -Infinity) - (a.supportedMetric ?? -Infinity),
        );
        recommendation = {
          status: "SELECT",
          selectedId: ranked[0]!.displayName,
          rationale: `Highest supported metric among eligible: ${eligibleSet.join(", ")}.`,
        };
      } else if (eligibleSet.length === 1) {
        recommendation = {
          status: "SELECT",
          selectedId: eligibleSet[0]!,
          rationale: `${eligibleSet[0]} is the sole currently eligible candidate.`,
        };
      } else {
        // Multiple eligible, sole-eligible objective → still pick first deterministic by name for stability? 
        // Mission: if multiple apply comparison rule; if no comparison → UNRESOLVED
        recommendation = {
          status: "UNRESOLVED",
          selectedId: null,
          rationale: `Multiple eligible (${eligibleSet.join(", ")}) without a comparative rule.`,
        };
      }
    }
  }

  // Fix sole-eligible when length===1 already set above; when length>1 and select_sole_eligible without compare → UNRESOLVED (done)

  if (eligibleSet.length === 1) {
    recommendation = {
      status: "SELECT",
      selectedId: eligibleSet[0]!,
      rationale: `${eligibleSet[0]} is the sole currently eligible candidate.`,
    };
  }

  const reversalConditions: string[] = [];
  for (const c of candidates) {
    if (c.currentlyEligible) continue;
    if (c.failedGates.length + c.unknownGates.length === 0) continue;
    const blockers = [...c.failedGates, ...c.unknownGates].map((g) => g.label);
    reversalConditions.push(
      `${c.displayName} becomes eligible only if ALL remaining blockers clear: ${blockers.join("; ")}.`,
    );
  }

  return {
    caseId: `decision_${candidates.map((c) => c.candidateId).slice(0, 4).join("_")}`,
    objective,
    tieBreak: null,
    mandatoryGateIds: mandatory,
    candidates,
    eligibleSet,
    recommendation,
    reversalConditions,
    decisionConfidence: candidates.every((c) => c.unknownGates.length === 0) ? "high" : "medium",
  };
}

export function eligibleSetOf(state: DecisionCaseState): string[] {
  return state.candidates.filter((c) => c.currentlyEligible).map((c) => c.displayName);
}

export function isCandidateEligible(state: DecisionCaseState, name: string): boolean | null {
  const k = key(name);
  const c = state.candidates.find((x) => key(x.displayName) === k || x.candidateId === k);
  return c ? c.currentlyEligible : null;
}

export function formatDecisionCaseBrief(state: DecisionCaseState): string {
  const lines = [
    "### Decision state (canonical)",
    `**ELIGIBLE_SET:** ${state.eligibleSet.length ? state.eligibleSet.join(", ") : "(none)"}`,
    `**CURRENT_RECOMMENDATION:** ${
      state.recommendation.status === "SELECT"
        ? `SELECT ${state.recommendation.selectedId}`
        : state.recommendation.status === "DO_NOT_SELECT"
          ? "DO NOT SELECT ANY"
          : "UNRESOLVED"
    }`,
    `**Rationale:** ${state.recommendation.rationale}`,
  ];
  for (const c of state.candidates) {
    lines.push(
      `- ${c.displayName}: ELIGIBLE=${c.currentlyEligible ? "YES" : "NO"}; gates=${c.gates
        .map((g) => `${g.id}=${g.status}`)
        .join(", ")}`,
    );
  }
  if (state.reversalConditions.length) {
    lines.push("**REVERSAL_CONDITIONS:**", ...state.reversalConditions.map((r) => `- ${r}`));
  }
  return lines.join("\n");
}

/**
 * Detect material contradictions between visible answer and canonical decision state.
 * Returns telemetry codes only — never append these to the user-visible answer.
 */
export function assessDecisionVisibilityConsistency(
  answer: string,
  state: DecisionCaseState,
): { ok: boolean; failures: string[] } {
  const text = String(answer || "");
  const failures: string[] = [];
  const eligible = new Set(state.eligibleSet.map((n) => key(n)));

  for (const c of state.candidates) {
    const name = c.displayName;
    const reElig = new RegExp(
      `\\b${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b[^\\n.]{0,40}\\b(?:is\\s+)?(?:currently\\s+)?eligible\\b`,
      "i",
    );
    const reInelig = new RegExp(
      `\\b${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b[^\\n.]{0,40}\\b(?:ineligible|not\\s+eligible)\\b`,
      "i",
    );
    if (!c.currentlyEligible && reElig.test(text) && !reInelig.test(text)) {
      // Allow "not eligible" / "would become eligible"
      if (!/\b(?:not|never|no\s+longer)\s+eligible\b/i.test(text) && !/\bbecause\s+approval\s+is\s+pending\b/i.test(text)) {
        failures.push(`FALSE_ELIGIBLE_ASSERTION:${name}`);
      }
      // Explicit false claim "eligible because pending"
      if (new RegExp(`${name}[^\\n]{0,80}eligible[^\\n]{0,40}pending`, "i").test(text)) {
        failures.push(`PENDING_AS_ELIGIBLE:${name}`);
      }
    }
    if (c.currentlyEligible && reInelig.test(text)) {
      failures.push(`FALSE_INELIGIBLE_ASSERTION:${name}`);
    }
  }

  // Eligible set cardinality
  if (state.eligibleSet.length === 1) {
    if (/\bat\s+least\s+two\b[^.\n]{0,40}(?:eligible|qualify)/i.test(text)) {
      failures.push("FALSE_ELIGIBLE_COUNT_GE2");
    }
    if (
      /\bEligible\s+Suppliers?\s*:\s*([^\n]+)/i.test(text)
    ) {
      const list = /\bEligible\s+Suppliers?\s*:\s*([^\n]+)/i.exec(text)?.[1] || "";
      const named = state.candidates.filter((c) => new RegExp(`\\b${c.displayName}\\b`, "i").test(list));
      for (const n of named) {
        if (!eligible.has(key(n.displayName))) failures.push(`SUMMARY_LIST_INCLUDES_INELIGIBLE:${n.displayName}`);
      }
    }
  }

  // Recommendation
  if (state.recommendation.status === "SELECT" && state.recommendation.selectedId) {
    if (/\bDO\s+NOT\s+SELECT\s+ANY\b/i.test(text)) {
      failures.push("FALSE_DO_NOT_SELECT_WHILE_SOLE_ELIGIBLE");
    }
    for (const c of state.candidates) {
      if (
        !c.currentlyEligible &&
        new RegExp(`\\b(?:select|recommend|choose)\\s+${c.displayName}\\b`, "i").test(text)
      ) {
        failures.push(`SELECTS_INELIGIBLE:${c.displayName}`);
      }
    }
  }
  if (state.recommendation.status === "DO_NOT_SELECT") {
    if (/\b(?:select|recommend|choose)\s+[A-Z]{2,}\b/i.test(text) && !/\bdo\s+not\s+select\b/i.test(text)) {
      // soft — only if clearly selecting a named candidate
      for (const c of state.candidates) {
        if (new RegExp(`\\b(?:select|recommend)\\s+${c.displayName}\\b`, "i").test(text)) {
          failures.push(`SELECT_WHILE_NONE_ELIGIBLE:${c.displayName}`);
        }
      }
    }
  }

  return { ok: failures.length === 0, failures };
}

/**
 * Repair visible answer to align with canonical decision (no diagnostic append).
 */
export function repairDecisionVisibility(
  answer: string,
  state: DecisionCaseState,
): string {
  let out = String(answer || "");
  const assess = assessDecisionVisibilityConsistency(out, state);
  if (assess.ok) return out;

  // Fix eligible-suppliers summary lines
  out = out.replace(
    /\bEligible\s+Suppliers?\s*:\s*[^\n]+/gi,
    `Eligible Suppliers: ${state.eligibleSet.length ? state.eligibleSet.join(" and ") : "none"}`,
  );

  // Soften false "eligible because pending"
  for (const c of state.candidates) {
    if (c.currentlyEligible) continue;
    const re = new RegExp(
      `(\\b${c.displayName}\\b[^\\n]{0,100})\\beligible\\b([^\\n]{0,60}pending)`,
      "gi",
    );
    out = out.replace(re, `$1not currently eligible$2`);
  }

  // DO NOT SELECT ANY vs sole eligible
  if (state.recommendation.status === "SELECT" && state.recommendation.selectedId) {
    out = out.replace(
      /\bDO\s+NOT\s+SELECT\s+ANY(?:\s+YET)?\b/gi,
      `SELECT ${state.recommendation.selectedId}`,
    );
  }

  // Inject locked recommendation note only if recommendation section is empty of action — avoid spam
  if (
    state.recommendation.status === "SELECT" &&
    state.recommendation.selectedId &&
    !new RegExp(`\\bSELECT\\s+${state.recommendation.selectedId}\\b`, "i").test(out) &&
    /\brecommend/i.test(out)
  ) {
    out = out.replace(
      /(#{1,3}\s*Recommendation[^\n]*\n)/i,
      `$1**Current action:** SELECT ${state.recommendation.selectedId}. ${state.recommendation.rationale}\n\n`,
    );
  }

  return out.replace(/\n{3,}/g, "\n\n").trim();
}
