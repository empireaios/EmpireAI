import type {
  BenchmarkResult,
  GovernanceSummary,
  PerfartInput,
  PerformanceReadinessSummary,
  ReadinessDecision,
} from "./types.js";

export type GateInputs = {
  matrix: BenchmarkResult[];
  performanceReadinessSummary: PerformanceReadinessSummary;
  governanceSummary: GovernanceSummary;
  integrationsAllBound: boolean;
  q1106Consumed: boolean;
  q1106Attempted: boolean;
  input: PerfartInput;
};

/**
 * Fail-closed performance readiness gate. Per-component classifications
 * map to the overall decision:
 *   explicit deferAudit input -> defer
 *   any Failed -> escalate
 *   any Missing -> withhold
 *   all certified + governance compliant + integrations bound + approvals
 *     confirmed + Q1106 contract satisfied -> certify
 *   else if any partially_certified -> withhold
 *   else if any blocked -> escalate
 *   else -> defer
 */
export function evaluatePerformanceReadinessGates(inputs: GateInputs): ReadinessDecision {
  if (inputs.input.deferAudit === true) return "defer";
  if (inputs.input.forceFail === true) return "escalate";
  if (inputs.matrix.some((row) => row.performanceClassification === "failed")) return "escalate";
  if (inputs.matrix.some((row) => row.performanceClassification === "missing")) return "withhold";

  const approvalsConfirmed =
    inputs.input.pillowCommandConfirmed !== false && inputs.input.grandKingApproved !== false;

  const allCertified = inputs.performanceReadinessSummary.allCertified;
  const contractSatisfied = !inputs.q1106Attempted || inputs.q1106Consumed;

  if (
    allCertified &&
    inputs.governanceSummary.compliant &&
    inputs.integrationsAllBound &&
    approvalsConfirmed &&
    contractSatisfied
  ) {
    return "certify";
  }

  if (inputs.matrix.some((row) => row.performanceClassification === "partially_certified")) {
    return "withhold";
  }
  if (inputs.matrix.some((row) => row.performanceClassification === "blocked")) return "escalate";
  if (inputs.matrix.length === 0) return "defer";
  return "withhold";
}
