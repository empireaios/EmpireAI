import type {
  GovernanceSummary,
  ReadinessDecision,
  SecartInput,
  SecurityAssessment,
  SecurityReadinessSummary,
} from "./types.js";

export type GateInputs = {
  matrix: SecurityAssessment[];
  securityReadinessSummary: SecurityReadinessSummary;
  governanceSummary: GovernanceSummary;
  integrationsAllBound: boolean;
  q1105Consumed: boolean;
  q1105Attempted: boolean;
  input: SecartInput;
};

/**
 * Fail-closed security readiness gate. Per-component classifications map
 * to the overall decision:
 *   explicit deferAudit input -> defer
 *   any Failed -> escalate
 *   any Missing -> withhold
 *   all certified + governance compliant + integrations bound + approvals
 *     confirmed + Q1105 contract satisfied -> certify
 *   else if any partially_certified -> withhold
 *   else if any blocked -> escalate
 *   else -> defer
 */
export function evaluateSecurityReadinessGates(inputs: GateInputs): ReadinessDecision {
  if (inputs.input.deferAudit === true) return "defer";
  if (inputs.input.forceFail === true) return "escalate";
  if (inputs.matrix.some((row) => row.readinessClassification === "failed")) return "escalate";
  if (inputs.matrix.some((row) => row.readinessClassification === "missing")) return "withhold";

  const approvalsConfirmed =
    inputs.input.pillowCommandConfirmed !== false && inputs.input.grandKingApproved !== false;

  const allCertified = inputs.securityReadinessSummary.allCertified;
  const contractSatisfied = !inputs.q1105Attempted || inputs.q1105Consumed;

  if (
    allCertified &&
    inputs.governanceSummary.compliant &&
    inputs.integrationsAllBound &&
    approvalsConfirmed &&
    contractSatisfied
  ) {
    return "certify";
  }

  if (inputs.matrix.some((row) => row.readinessClassification === "partially_certified")) {
    return "withhold";
  }
  if (inputs.matrix.some((row) => row.readinessClassification === "blocked")) return "escalate";
  if (inputs.matrix.length === 0) return "defer";
  return "withhold";
}
