import type {
  CommandReadinessSummary,
  GovernanceSummary,
  PcartInput,
  PillowCommandAssessment,
  ReadinessDecision,
} from "./types.js";

export type GateInputs = {
  matrix: PillowCommandAssessment[];
  commandReadinessSummary: CommandReadinessSummary;
  governanceSummary: GovernanceSummary;
  integrationsAllBound: boolean;
  q1103Consumed: boolean;
  q1103Attempted: boolean;
  input: PcartInput;
};

/**
 * Fail-closed command readiness gate. Per-worker classifications map to the
 * overall decision:
 *   any Failed -> Failed
 *   any Missing -> Not_Ready
 *   all Ready + governance compliant + integrations bound + approvals
 *     confirmed + Q1103 contract satisfied -> Ready
 *   else if any Partially Ready -> Conditionally_Ready
 *   else -> Deferred
 */
export function evaluateCommandReadinessGates(inputs: GateInputs): ReadinessDecision {
  if (inputs.input.forceFail === true) return "Failed";
  if (inputs.matrix.some((row) => row.readinessClassification === "Failed")) return "Failed";
  if (inputs.matrix.some((row) => row.readinessClassification === "Missing")) return "Not_Ready";

  const approvalsConfirmed =
    inputs.input.pillowCommandConfirmed !== false && inputs.input.grandKingApproved !== false;

  const allReady = inputs.commandReadinessSummary.ready;
  const contractSatisfied = !inputs.q1103Attempted || inputs.q1103Consumed;

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
