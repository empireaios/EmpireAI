/**
 * Independent-closure invariant catalogue + change-impact mapping.
 * Permanent CROSS_REPAIR_INVARIANT_PRESERVATION layer.
 * Does not encode sealed examination content.
 */

export type IndependentClosureInvariantId =
  | "IC-01"
  | "IC-02"
  | "IC-03"
  | "IC-04"
  | "IC-05"
  | "IC-06"
  | "IC-07"
  | "IC-08"
  | "IC-09"
  | "IC-10"
  | "IC-11"
  | "IC-12"
  | "IC-13"
  | "IC-14"
  | "IC-15"
  | "IC-16"
  | "IC-17"
  | "IC-18"
  | "IC-19"
  | "IC-20"
  | "IC-21"
  | "IC-22"
  | "IC-23"
  | "IC-24"
  | "IC-25";

export type IndependentClosureInvariant = {
  id: IndependentClosureInvariantId;
  name: string;
  failureClass: string;
  severity: "P0" | "P1";
};

export const INDEPENDENT_CLOSURE_INVARIANTS: readonly IndependentClosureInvariant[] = [
  { id: "IC-01", name: "CURRENT_STATE_AUTHORITY", failureClass: "HISTORICAL_OVERRIDES_CURRENT", severity: "P0" },
  { id: "IC-02", name: "HISTORICAL_ELIGIBILITY_DOES_NOT_PERSIST", failureClass: "STALE_ELIGIBILITY", severity: "P0" },
  { id: "IC-03", name: "INDIRECT_CAUSAL_CONNECTION", failureClass: "DIFFERENT_MECHANISM_IMPLIES_UNRELATED", severity: "P0" },
  { id: "IC-04", name: "COMMON_ROOT_VS_CONNECTION", failureClass: "CONNECTED_EQUALS_SAME_ROOT", severity: "P0" },
  { id: "IC-05", name: "RESOLVED_VERDICT_OWNERSHIP", failureClass: "LLM_RESOLVED_VERDICT_OVERRIDE", severity: "P0" },
  { id: "IC-06", name: "TRUE_PREMISE_FALSE_CONCLUSION", failureClass: "COMPOUND_SUPPORTED_FROM_PREMISE", severity: "P0" },
  { id: "IC-07", name: "MULTI_GATE_DECISION", failureClass: "PARTIAL_GATE_FULL_UNLOCK", severity: "P0" },
  { id: "IC-08", name: "ELIGIBILITY_NE_PREFERENCE", failureClass: "ELIGIBLE_MEANS_BEST", severity: "P0" },
  { id: "IC-09", name: "HISTORICAL_OCCURRENCE", failureClass: "LATER_OUTCOME_ERASES_OCCURRENCE", severity: "P0" },
  { id: "IC-10", name: "POPULATION_SCOPE", failureClass: "SUBSET_GENERALIZED_TO_POPULATION", severity: "P0" },
  { id: "IC-11", name: "FORECAST_NE_REALISED", failureClass: "FORECAST_AS_REALISED", severity: "P0" },
  { id: "IC-12", name: "VERIFIED_IDENTITY_PRECEDENCE", failureClass: "PLANNING_OVERRIDES_REGISTRY", severity: "P0" },
  { id: "IC-13", name: "EXPLICIT_CLAIM_COMPLETENESS", failureClass: "MIDDLE_CLAIM_DROPPED", severity: "P0" },
  { id: "IC-14", name: "CROSS_SECTION_CONSISTENCY", failureClass: "LATER_SECTION_REVERSES_EARLIER", severity: "P0" },
  { id: "IC-15", name: "TIMESTAMPS_ARE_EVIDENCE", failureClass: "TIMESTAMPS_ARE_NOT_TASKS", severity: "P0" },
  { id: "IC-16", name: "REQUESTED_STRUCTURE", failureClass: "SECTION_CONTRACT_BROKEN", severity: "P0" },
  { id: "IC-17", name: "SYNTHETIC_SCOPE", failureClass: "SYNTHETIC_PROMOTED_TO_LIVE", severity: "P0" },
  { id: "IC-18", name: "NO_LIVE_COMMERCE_CONTAMINATION", failureClass: "MINI_FAN_IN_SYNTHETIC", severity: "P0" },
  { id: "IC-19", name: "NO_IRRELEVANT_BIRTH_GOVERNANCE", failureClass: "IRRELEVANT_BIRTH_INJECTION", severity: "P0" },
  { id: "IC-20", name: "MEMORY_RELEVANCE", failureClass: "IRRELEVANT_VISIBLE_DOCTRINE", severity: "P0" },
  { id: "IC-21", name: "NO_LESSON_TEXT_DUMP", failureClass: "EKLS_DOCTRINE_TEXT_DUMP", severity: "P0" },
  { id: "IC-22", name: "NO_POST_COMPLETION_SEMANTIC_APPEND", failureClass: "POST_COMPLETION_UNREQUESTED_SEMANTIC_APPEND", severity: "P0" },
  { id: "IC-23", name: "CURRENT_CERTIFICATE_NE_INSPECTION", failureClass: "INSPECTION_AS_CERTIFICATE", severity: "P1" },
  { id: "IC-24", name: "UNKNOWN_NE_PASS", failureClass: "UNKNOWN_AUTHORIZES_ACTION", severity: "P0" },
  { id: "IC-25", name: "ACCEPTED_REQUEST_COMPLETION", failureClass: "FIRST_REQUEST_DEGRADED", severity: "P0" },
] as const;

/** High-risk pairs for FIX_A_BREAKS_B detection. */
export const CRITICAL_INVARIANT_PAIRS: readonly [IndependentClosureInvariantId, IndependentClosureInvariantId][] = [
  ["IC-03", "IC-05"],
  ["IC-03", "IC-06"],
  ["IC-03", "IC-20"],
  ["IC-03", "IC-01"],
  ["IC-05", "IC-20"],
  ["IC-05", "IC-13"],
  ["IC-05", "IC-14"],
  ["IC-05", "IC-06"],
  ["IC-20", "IC-21"],
  ["IC-20", "IC-22"],
  ["IC-20", "IC-09"],
  ["IC-20", "IC-15"],
  ["IC-09", "IC-21"],
  ["IC-15", "IC-16"],
  ["IC-15", "IC-13"],
  ["IC-07", "IC-08"],
  ["IC-07", "IC-11"],
  ["IC-10", "IC-01"],
  ["IC-12", "IC-05"],
  ["IC-17", "IC-18"],
  ["IC-17", "IC-19"],
  ["IC-17", "IC-20"],
  ["IC-13", "IC-14"],
  ["IC-04", "IC-03"],
  ["IC-06", "IC-03"],
];

const PATH_TO_INVARIANTS: Array<{ match: RegExp; ids: IndependentClosureInvariantId[] }> = [
  { match: /executive-causal-state/, ids: ["IC-03", "IC-04", "IC-06"] },
  { match: /executive-claim-proposition/, ids: ["IC-03", "IC-05", "IC-06", "IC-13"] },
  { match: /executive-conclusion-ledger/, ids: ["IC-05", "IC-06", "IC-13", "IC-14"] },
  { match: /executive-canonical-state/, ids: ["IC-01", "IC-05", "IC-12", "IC-13", "IC-03"] },
  { match: /executive-memory-relevance|executive-event-state|executive-memory-realization/, ids: ["IC-09", "IC-20", "IC-21", "IC-22"] },
  { match: /executive-response-polish|executive-final-release|executive-release-gate/, ids: ["IC-05", "IC-16", "IC-20", "IC-22", "IC-18"] },
  { match: /executive-task-contract|executive-section-contract|timestamps|lineStartsWithTemporal/, ids: ["IC-15", "IC-16", "IC-13"] },
  { match: /executive-evidence-ranking/, ids: ["IC-10", "IC-16", "IC-13"] },
  { match: /executive-scoped-reasoning/, ids: ["IC-17", "IC-18", "IC-19", "IC-09"] },
  { match: /executive-decision|decision-gate|decision-constraints/, ids: ["IC-07", "IC-08", "IC-24"] },
  { match: /executive-deliberation|signals\.ts/, ids: ["IC-20", "IC-21", "IC-22"] },
  { match: /accepted-request|recovery/, ids: ["IC-25"] },
  { match: /constitutional-regression/, ids: ["IC-03", "IC-05", "IC-20", "IC-18"] },
];

export function changeImpactForFile(path: string): IndependentClosureInvariantId[] {
  const p = String(path || "").replace(/\\/g, "/");
  const out = new Set<IndependentClosureInvariantId>();
  for (const row of PATH_TO_INVARIANTS) {
    if (row.match.test(p)) for (const id of row.ids) out.add(id);
  }
  return [...out];
}

export function requiredRegressionsForPaths(paths: readonly string[]): IndependentClosureInvariantId[] {
  const out = new Set<IndependentClosureInvariantId>();
  for (const p of paths) for (const id of changeImpactForFile(p)) out.add(id);
  return [...out].sort();
}

/** Structured change-impact row for semantic-change workflow. */
export function describeChangeImpact(path: string): {
  changedComponent: string;
  primaryCapability: string;
  possibleAffected: IndependentClosureInvariantId[];
  requiredRegressions: IndependentClosureInvariantId[];
} {
  const possibleAffected = changeImpactForFile(path);
  const primary =
    possibleAffected[0] != null
      ? (INDEPENDENT_CLOSURE_INVARIANTS.find((i) => i.id === possibleAffected[0])?.name ??
        possibleAffected[0])
      : "UNKNOWN";
  return {
    changedComponent: String(path || "").replace(/\\/g, "/").split("/").pop() || String(path),
    primaryCapability: primary,
    possibleAffected,
    requiredRegressions: [...possibleAffected].sort(),
  };
}

/** Pairwise interaction matrix scaffold (TEST_EXISTS filled by deploy/full gates). */
export type InteractionMatrixRow = {
  invariantA: IndependentClosureInvariantId;
  invariantB: IndependentClosureInvariantId;
  testExists: boolean;
  pass: boolean | null;
  failureClass: string;
};

export function buildCriticalInteractionMatrix(
  results: ReadonlyMap<string, boolean> = new Map(),
): InteractionMatrixRow[] {
  return CRITICAL_INVARIANT_PAIRS.map(([a, b]) => {
    const key = `${a}+${b}`;
    const pass = results.has(key) ? results.get(key)! : null;
    const fa = INDEPENDENT_CLOSURE_INVARIANTS.find((i) => i.id === a)?.failureClass ?? a;
    const fb = INDEPENDENT_CLOSURE_INVARIANTS.find((i) => i.id === b)?.failureClass ?? b;
    return {
      invariantA: a,
      invariantB: b,
      testExists: true,
      pass,
      failureClass: `FIX_${fa}_BREAKS_${fb}`,
    };
  });
}

/** Minimum raw variants required per invariant (mission floor). */
export const RAW_VARIANTS_PER_INVARIANT_MIN = 5;
export const CROSS_INVARIANT_CASES_MIN = 100;
export const PAIRWISE_INTERACTION_CASES_MIN = 100;
