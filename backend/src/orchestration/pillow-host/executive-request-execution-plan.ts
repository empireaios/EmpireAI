/**
 * Request execution mode + bounded decision obligation synthesis.
 * Separates SCENARIO_TRUTH_FOR_ANALYSIS from LIVE_WORLD_VERIFIED.
 * Does not invent new gate/recommendation rules — consumes DecisionCaseState.
 */
import {
  buildDecisionCaseState,
  type DecisionCaseState,
} from "./executive-decision-case-state.js";

export type RequestExecutionMode =
  | "BOUNDED_HYPOTHETICAL_ANALYSIS"
  | "LIVE_EMPIREAI_FACT_QUERY"
  | "LIVE_EMPIREAI_DECISION"
  | "GENERAL_REASONING"
  | "CASE_CONTINUATION"
  | "EXPLICIT_CROSS_CASE_COMPARISON"
  | "LIVE_CONTEXT_COUNTERFACTUAL";

export function isLiveEmpireAiFactQuery(message: string): boolean {
  const t = String(message || "");
  if (/\b(?:how many|what (?:is|are)|current(?:ly)?|right now)\b[\s\S]{0,80}\b(?:orders?|revenue|stock|listing|supplier\s+(?:charge|price)|realised)\b/i.test(t)) {
    if (/\b(?:assume|suppose|hypothetical|scenario|synthetic|if .{0,40}were)\b/i.test(t) && !/\bEmpireAI\b/i.test(t)) {
      return false;
    }
    return (
      /\b(?:EmpireAI|our (?:current|live|realised)|Mini\s*Fan|Birth)\b/i.test(t) ||
      /\b(?:how many|current(?:ly)?)\b[\s\S]{0,40}\b(?:orders?|revenue)\b/i.test(t)
    );
  }
  return /\b(?:EmpireAI|our)\b[\s\S]{0,40}\b(?:current|live|realised)\b[\s\S]{0,40}\b(?:orders?|revenue|stock|supplier)\b/i.test(
    t,
  );
}

export function isLiveEmpireAiDecisionAsk(message: string): boolean {
  const t = String(message || "");
  return (
    /\b(?:EmpireAI|our (?:live|current))\b/i.test(t) &&
    /\b(?:should (?:we|i)|recommend|select|pause|reprice|change supplier)\b/i.test(t) &&
    !/\b(?:assume|suppose|hypothetical|synthetic|scenario[- ]only)\b/i.test(t)
  );
}

/** Named commercial candidates + rules ⇒ bounded scenario (magic words optional). */
export function isBoundedDecisionScenario(message: string): boolean {
  const t = String(message || "");
  if (isLiveEmpireAiFactQuery(t) || isLiveEmpireAiDecisionAsk(t)) return false;
  const d = buildDecisionCaseState(t);
  if (!d || d.candidates.length < 1) return false;
  // Prefer multi-candidate / explicit select-eligible language
  if (d.candidates.length >= 2) return true;
  return /\b(?:select|eligible|recommend|gate|procurement|supplier|corridor)\b/i.test(t);
}

export function detectRequestExecutionMode(message: string): RequestExecutionMode {
  const t = String(message || "");
  if (
    /\b(?:continue|same case|now .{0,40}(?:granted|cleared|updated)|recompute)\b/i.test(t) &&
    !/\bnew bounded case\b/i.test(t)
  ) {
    if (isBoundedDecisionScenario(t) || buildDecisionCaseState(t)) return "CASE_CONTINUATION";
  }
  if (
    /\bcompar(?:e|ison)\b/i.test(t) &&
    /\b(?:prior|previous|earlier|both cases|cross[- ]case)\b/i.test(t)
  ) {
    return "EXPLICIT_CROSS_CASE_COMPARISON";
  }
  if (
    /\b(?:using (?:our|current) live|if .{0,60}rises?|what happens if)\b/i.test(t) &&
    /\b(?:EmpireAI|our (?:product|supplier|cost))\b/i.test(t)
  ) {
    return "LIVE_CONTEXT_COUNTERFACTUAL";
  }
  if (isLiveEmpireAiFactQuery(t)) return "LIVE_EMPIREAI_FACT_QUERY";
  if (isLiveEmpireAiDecisionAsk(t)) return "LIVE_EMPIREAI_DECISION";
  if (isBoundedDecisionScenario(t)) return "BOUNDED_HYPOTHETICAL_ANALYSIS";
  if (
    /\b(?:synthetic|hypothetical|scenario[- ]only|thought experiment|for analysis)\b/i.test(t)
  ) {
    return "BOUNDED_HYPOTHETICAL_ANALYSIS";
  }
  return "GENERAL_REASONING";
}

/**
 * When a section title / obligation is a decision task (not a factual claim),
 * emit scenario analysis from canonical decision state — never Unsupported stub.
 * Returns null if this subject should use another synthesizer (e.g. quoted claim).
 */
export function synthesizeBoundedDecisionObligation(
  subject: string,
  state: DecisionCaseState,
  _userMessage?: string,
): string | null {
  const label = (subject || "analysis").replace(/^Claim\s*\d+\s*:\s*/i, "").trim().slice(0, 100);
  const s = label.toLowerCase();

  // Explicit claim subjects stay on claim path (polish binds verdicts).
  if (/^claim\s*\d+/i.test(subject.trim()) || /^["'“]/.test(label)) {
    return null;
  }

  const gateLines = state.candidates.map((c) => {
    const gates = c.gates.map((g) => `${g.label}=${g.status}`).join("; ");
    return `- **${c.displayName}**: ${gates || "(no gates)"} → currentlyEligible=${c.currentlyEligible ? "YES" : "NO"}`;
  });
  const eligibleLine = state.eligibleSet.length
    ? `Eligible Suppliers: ${state.eligibleSet.join(" and ")}`
    : "Eligible Suppliers: none";
  const action =
    state.recommendation.status === "SELECT" && state.recommendation.selectedId
      ? `SELECT ${state.recommendation.selectedId}`
      : state.recommendation.status === "DO_NOT_SELECT"
        ? "DO NOT SELECT ANY"
        : "UNRESOLVED — insufficient rule/evidence for a unique selection";
  const reversal =
    state.reversalConditions.length > 0
      ? state.reversalConditions.map((r) => `- ${r}`).join("\n")
      : "- No reversal blockers listed beyond current gate state.";

  if (/snapshot|overview|context|situation|brief(?!ing)/i.test(s)) {
    return [
      `### ${label}`,
      "**Scope:** supplied scenario analysis only — not live EmpireAI verified fact.",
      "",
      `Candidates evaluated: ${state.candidates.map((c) => c.displayName).join(", ")}.`,
      eligibleLine + ".",
      `**Current action:** ${action}. ${state.recommendation.rationale}`,
      "",
      "Scenario-given facts are admissible for this hypothetical case; they are not promoted to real-world EmpireAI state.",
    ].join("\n");
  }

  if (/gate|criteria|eligibility detail|mandatory/i.test(s)) {
    return [
      `### ${label}`,
      "**Scope:** scenario gate evaluation from supplied PASS/FAIL/PENDING tokens and thresholds.",
      "",
      ...gateLines,
      "",
      "Hard gates: any FAIL or UNKNOWN blocks current eligibility. Pending mandatory approval ≠ PASS.",
    ].join("\n");
  }

  if (/eligible\s*set|eligible supplier|who qualifies|qualify/i.test(s)) {
    return [
      `### ${label}`,
      eligibleLine + ".",
      "",
      ...state.candidates.map(
        (c) =>
          `- ${c.displayName}: ${c.currentlyEligible ? "currently eligible" : "not currently eligible"}`,
      ),
    ].join("\n");
  }

  if (/recommend|selection|current action|decision(?!\s+state)/i.test(s)) {
    return [
      `### ${label}`,
      `**Current action:** ${action}.`,
      state.recommendation.rationale,
      "",
      "This is a scenario recommendation only — it does not authorise live EmpireAI commercial execution.",
    ].join("\n");
  }

  if (/reversal|future|what could change|what evidence could/i.test(s)) {
    return [
      `### ${label}`,
      "**Reversal conditions** (scenario — not current selection):",
      reversal,
      "",
      "Clearing one blocker does not unlock eligibility until every remaining mandatory gate is PASS.",
    ].join("\n");
  }

  if (/econom|calculat|twelve-week|cost table|arithmetic|contribution|landed/i.test(s)) {
    const econ = state.candidates.map((c) => {
      const metric =
        c.supportedMetric != null ? `supportedMetric=${c.supportedMetric}` : "metric from pack lines";
      return `- **${c.displayName}**: ${metric}; eligible=${c.currentlyEligible ? "YES" : "NO"}`;
    });
    return [
      `### ${label}`,
      "**Scope:** arithmetic and economics from supplied scenario figures only.",
      "",
      ...econ,
      "",
      "Perform stated calculations from pack values. Do not demand external verification for owner-supplied scenario operands.",
    ].join("\n");
  }

  if (/evidence|forecast|realis|correct|reconcil/i.test(s)) {
    return [
      `### ${label}`,
      "**Evidence discipline (scenario):**",
      "- Forecast ≠ realised — keep them separate.",
      "- Corrected evidence supersedes earlier pack figures for the same metric.",
      "- Measured value ≠ evidence strength.",
      "",
      "Use only admissible current-case facts for this bounded analysis.",
    ].join("\n");
  }

  if (/closing|conclusion|executive summary|synthesis/i.test(s)) {
    return [
      `### ${label}`,
      `${eligibleLine}.`,
      `**Current action:** ${action}.`,
      state.recommendation.rationale,
      "",
      "Future improvements appear only as reversal conditions — they do not defer a currently resolved selection.",
    ].join("\n");
  }

  // Short section titles / generic multipart obligations under a valid decision case
  if (label.length <= 90 && !/\bis (?:already |currently )?eligible\b/i.test(label)) {
    return [
      `### ${label}`,
      "**Scope:** supplied scenario analysis only — not live EmpireAI verified fact.",
      "",
      eligibleLine + ".",
      `**Current action:** ${action}.`,
      "",
      ...gateLines.slice(0, 8),
    ].join("\n");
  }

  return null;
}

/** Telemetry-friendly plan summary (never user-visible). */
export function buildRequestExecutionPlanSummary(message: string): {
  mode: RequestExecutionMode;
  decisionCaseCreated: boolean;
  candidateCount: number;
  eligibleCount: number;
  recommendationStatus: string | null;
} {
  const mode = detectRequestExecutionMode(message);
  const d = buildDecisionCaseState(message);
  return {
    mode,
    decisionCaseCreated: Boolean(d),
    candidateCount: d?.candidates.length ?? 0,
    eligibleCount: d?.eligibleSet.length ?? 0,
    recommendationStatus: d?.recommendation.status ?? null,
  };
}
