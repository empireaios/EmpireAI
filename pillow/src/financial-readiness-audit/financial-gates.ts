import type {
  GovernanceSummary,
  ReadinessDecision,
  FinartInput,
  FinancialAssessment,
  FinancialReadinessSummary,
} from "./types.js";

export type GateInputs = {
  matrix: FinancialAssessment[];
  financialReadinessSummary: FinancialReadinessSummary;
  governanceSummary: GovernanceSummary;
  integrationsAllBound: boolean;
  q1108Consumed: boolean;
  q1108Attempted: boolean;
  input: FinartInput;
};

export function evaluateFinancialReadinessGates(inputs: GateInputs): ReadinessDecision {
  if (inputs.input.deferAudit === true) return "defer";
  if (inputs.input.forceFail === true) return "escalate";
  if (inputs.matrix.some((row) => row.readinessClassification === "failed")) return "escalate";
  if (inputs.matrix.some((row) => row.readinessClassification === "missing")) return "withhold";

  const approvalsConfirmed =
    inputs.input.pillowCommandConfirmed !== false && inputs.input.grandKingApproved !== false;

  const allCertified = inputs.financialReadinessSummary.allCertified;
  const contractSatisfied = !inputs.q1108Attempted || inputs.q1108Consumed;

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
