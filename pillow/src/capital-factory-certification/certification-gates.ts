import type {
  CertificationDecision,
  WorkerCertificationRow,
  GovernanceResults,
  ProductionReadinessAssessment,
  EndToEndWorkflowResults,
  CapcrtInput,
} from "./types.js";

export type GateInputs = {
  matrix: WorkerCertificationRow[];
  integrationsAllBound: boolean;
  productionReadiness: ProductionReadinessAssessment;
  governanceResults: GovernanceResults;
  workflowResults: EndToEndWorkflowResults;
  input: CapcrtInput;
  factoryDeferred?: boolean;
};

/**
 * Fail-closed certification gate. Matrix statuses map to overall decision:
 *   all Certified → Certified
 *   any Failed Certification → Failed
 *   any Blocked → Not_Certified
 *   else if any Partially Certified → Conditionally_Certified
 *   else Deferred
 */
export function evaluateCertificationGates(inputs: GateInputs): CertificationDecision {
  if (inputs.factoryDeferred) return "Deferred";
  if (inputs.input.forceFail === true) return "Failed";
  if (inputs.matrix.some((row) => row.status === "Failed Certification")) return "Failed";
  if (inputs.matrix.some((row) => row.status === "Blocked")) return "Not_Certified";

  const allCertified = inputs.matrix.every((row) => row.status === "Certified");
  const readinessPasses =
    inputs.integrationsAllBound &&
    inputs.productionReadiness.ready &&
    inputs.governanceResults.compliant &&
    inputs.workflowResults.complete &&
    inputs.input.pillowCommandConfirmed !== false &&
    inputs.input.grandKingApproved !== false;

  if (allCertified && readinessPasses) return "Certified";
  if (inputs.matrix.some((row) => row.status === "Partially Certified")) {
    return "Conditionally_Certified";
  }
  if (inputs.matrix.some((row) => row.status === "Deferred")) return "Deferred";
  return "Conditionally_Certified";
}
