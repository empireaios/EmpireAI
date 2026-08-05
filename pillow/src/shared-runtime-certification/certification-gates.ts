import type {
  CertificationDecision,
  CertificationResult,
  GovernanceResults,
  CertificationSummary,
  IntegrationVerification,
  SrcrtInput,
} from "./types.js";

export type GateInputs = {
  matrix: CertificationResult[];
  integrationsAllBound: boolean;
  certificationSummary: CertificationSummary;
  governanceResults: GovernanceResults;
  monitoringVerified: boolean;
  recoveryVerified: boolean;
  auditabilityVerified: boolean;
  reportingVerified: boolean;
  input: SrcrtInput;
  runtimeDeferred?: boolean;
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
  if (inputs.runtimeDeferred) return "Deferred";
  if (inputs.input.forceFail === true) return "Failed";
  if (inputs.matrix.some((row) => row.certificationStatus === "Failed Certification")) return "Failed";
  if (inputs.matrix.some((row) => row.certificationStatus === "Blocked")) return "Not_Certified";

  const allCertified = inputs.matrix.every((row) => row.certificationStatus === "Certified");
  const readinessPasses =
    inputs.integrationsAllBound &&
    inputs.certificationSummary.ready &&
    inputs.governanceResults.compliant &&
    inputs.monitoringVerified &&
    inputs.recoveryVerified &&
    inputs.auditabilityVerified &&
    inputs.reportingVerified &&
    inputs.input.pillowCommandConfirmed !== false &&
    inputs.input.grandKingApproved !== false;

  if (allCertified && readinessPasses) return "Certified";
  if (inputs.matrix.some((row) => row.certificationStatus === "Partially Certified")) {
    return "Conditionally_Certified";
  }
  if (inputs.matrix.some((row) => row.certificationStatus === "Deferred")) return "Deferred";
  return "Conditionally_Certified";
}
