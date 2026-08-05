import type {
  BfartInput,
  BusinessFactoryAssessment,
  FactoryReadinessSummary,
  GovernanceSummary,
  ReadinessDecision,
} from "./types.js";

export type GateInputs = {
  matrix: BusinessFactoryAssessment[];
  factoryReadinessSummary: FactoryReadinessSummary;
  governanceSummary: GovernanceSummary;
  integrationsAllBound: boolean;
  q1104Consumed: boolean;
  q1104Attempted: boolean;
  input: BfartInput;
};

/**
 * Fail-closed business factory readiness gate. Per-factory classifications
 * map to the overall decision:
 *   explicit deferAudit input -> defer
 *   any Failed -> escalate
 *   any Missing -> withhold
 *   all certified + governance compliant + integrations bound + approvals
 *     confirmed + Q1104 contract satisfied -> certify
 *   else if any partially_certified -> withhold
 *   else if any blocked -> escalate
 *   else -> defer
 */
export function evaluateBusinessFactoryReadinessGates(inputs: GateInputs): ReadinessDecision {
  if (inputs.input.deferAudit === true) return "defer";
  if (inputs.input.forceFail === true) return "escalate";
  if (inputs.matrix.some((row) => row.readinessClassification === "failed")) return "escalate";
  if (inputs.matrix.some((row) => row.readinessClassification === "missing")) return "withhold";

  const approvalsConfirmed =
    inputs.input.pillowCommandConfirmed !== false && inputs.input.grandKingApproved !== false;

  const allCertified = inputs.factoryReadinessSummary.allCertified;
  const contractSatisfied = !inputs.q1104Attempted || inputs.q1104Consumed;

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
