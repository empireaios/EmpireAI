import type {
  GovernanceSummary,
  ReadinessDecision,
  RecartInput,
  RecoveryAssessment,
  RecoveryReadinessSummary,
} from "./types.js";

export type GateInputs = {
  matrix: RecoveryAssessment[];
  recoveryReadinessSummary: RecoveryReadinessSummary;
  governanceSummary: GovernanceSummary;
  integrationsAllBound: boolean;
  q1107Consumed: boolean;
  q1107Attempted: boolean;
  input: RecartInput;
};

export function evaluateRecoveryReadinessGates(inputs: GateInputs): ReadinessDecision {
  if (inputs.input.deferAudit === true) return "defer";
  if (inputs.input.forceFail === true) return "escalate";
  if (inputs.matrix.some((row) => row.resilienceClassification === "failed")) return "escalate";
  if (inputs.matrix.some((row) => row.resilienceClassification === "missing")) return "withhold";

  const approvalsConfirmed =
    inputs.input.pillowCommandConfirmed !== false && inputs.input.grandKingApproved !== false;

  const allCertified = inputs.recoveryReadinessSummary.allCertified;
  const contractSatisfied = !inputs.q1107Attempted || inputs.q1107Consumed;

  if (
    allCertified &&
    inputs.governanceSummary.compliant &&
    inputs.integrationsAllBound &&
    approvalsConfirmed &&
    contractSatisfied
  ) {
    return "certify";
  }

  if (inputs.matrix.some((row) => row.resilienceClassification === "partially_certified")) {
    return "withhold";
  }
  if (inputs.matrix.some((row) => row.resilienceClassification === "blocked")) return "escalate";
  if (inputs.matrix.length === 0) return "defer";
  return "withhold";
}
