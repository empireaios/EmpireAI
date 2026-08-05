import type {
  GovernanceSummary,
  ReadinessDecision,
  ReadinessSummary,
  WorkerReadinessAssessment,
  WrartInput,
} from "./types.js";

export type GateInputs = {
  matrix: WorkerReadinessAssessment[];
  readinessSummary: ReadinessSummary;
  governanceSummary: GovernanceSummary;
  integrationsAllBound: boolean;
  q1102Consumed: boolean;
  q1102Attempted: boolean;
  input: WrartInput;
};

/**
 * Fail-closed readiness gate. Per-worker classifications map to the overall
 * decision:
 *   any Failed -> Failed
 *   any Missing -> Not_Ready
 *   all Ready + governance compliant + integrations bound + approvals
 *     confirmed + Q1102 contract satisfied -> Ready
 *   else if any Partially Ready -> Conditionally_Ready
 *   else -> Deferred
 */
export function evaluateReadinessGates(inputs: GateInputs): ReadinessDecision {
  if (inputs.input.forceFail === true) return "Failed";
  if (inputs.matrix.some((row) => row.readinessClassification === "Failed")) return "Failed";
  if (inputs.matrix.some((row) => row.readinessClassification === "Missing")) return "Not_Ready";

  const approvalsConfirmed =
    inputs.input.pillowCommandConfirmed !== false && inputs.input.grandKingApproved !== false;

  const allReady = inputs.readinessSummary.ready;
  const contractSatisfied = !inputs.q1102Attempted || inputs.q1102Consumed;

  if (
    allReady &&
    inputs.governanceSummary.compliant &&
    inputs.integrationsAllBound &&
    approvalsConfirmed &&
    contractSatisfied
  ) {
    return "Ready";
  }

  if (inputs.matrix.some((row) => row.readinessClassification === "Partially Ready")) {
    return "Conditionally_Ready";
  }
  if (inputs.matrix.some((row) => row.readinessClassification === "Blocked")) return "Not_Ready";
  if (inputs.matrix.length === 0) return "Deferred";
  return "Conditionally_Ready";
}
