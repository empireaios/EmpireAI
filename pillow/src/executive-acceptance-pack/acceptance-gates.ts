import type {
  AuditSummary,
  CertificationSummary,
  EaprtInput,
  ProductionReadinessSummary,
  Q1109ContractConsumption,
  ReadinessDecision,
} from "./types.js";

export type GateInputs = {
  certificationSummary: CertificationSummary;
  auditSummary: AuditSummary;
  productionReadinessSummary: ProductionReadinessSummary;
  q1109ContractConsumed: Q1109ContractConsumption;
  integrationsAllBound: boolean;
  governanceCompliant: boolean;
  input: EaprtInput;
};

export function evaluateAcceptanceGates(inputs: GateInputs): ReadinessDecision {
  if (inputs.input.deferPack === true) return "defer";
  if (inputs.input.forceFail === true) return "escalate";

  const finartMissing = !inputs.q1109ContractConsumed.consumed;
  const anyFailed =
    inputs.certificationSummary.failedCount > 0 || inputs.auditSummary.failedCount > 0;
  const anyMissing =
    inputs.certificationSummary.missingCount > 0 || inputs.auditSummary.missingCount > 0;
  const anyBlocked =
    inputs.certificationSummary.blockedCount > 0 || inputs.auditSummary.blockedCount > 0;

  if (anyFailed) return "escalate";
  if (finartMissing || anyMissing || anyBlocked) return "withhold";

  const approvalsConfirmed =
    inputs.input.pillowCommandConfirmed !== false && inputs.input.grandKingApproved !== false;

  const allCertified =
    inputs.certificationSummary.certifiedCount === inputs.certificationSummary.boundCount &&
    inputs.auditSummary.certifiedCount === inputs.auditSummary.boundCount &&
    inputs.productionReadinessSummary.overallClassification === "certified" &&
    inputs.q1109ContractConsumed.consumed;

  if (
    allCertified &&
    inputs.governanceCompliant &&
    inputs.integrationsAllBound &&
    approvalsConfirmed
  ) {
    return "certify";
  }

  if (
    inputs.certificationSummary.partiallyCertifiedCount > 0 ||
    inputs.auditSummary.partiallyCertifiedCount > 0 ||
    inputs.productionReadinessSummary.overallClassification === "partially_certified"
  ) {
    return "withhold";
  }

  return "withhold";
}
