import type {
  CertificationDecision,
  CertificationResult,
  GovernanceResults,
  PccrtInput,
  ReadinessSummary,
} from "./types.js";

export type GateInputs = {
  matrix: CertificationResult[];
  readinessSummary: ReadinessSummary;
  governanceResults: GovernanceResults;
  integrationsAllBound: boolean;
  q1101Consumed: boolean;
  q1101Attempted: boolean;
  input: PccrtInput;
};

/**
 * Fail-closed certification gate. Component statuses map to the overall
 * decision:
 *   any Failed Certification -> Failed
 *   any Blocked -> Not_Certified
 *   all Certified/Registered/Discovered + governance compliant + integrations
 *     bound + approvals confirmed + Q1101 contract satisfied -> Certified
 *   else if any Partially Certified -> Conditionally_Certified
 *   else if any Pending -> Conditionally_Certified
 *   else -> Deferred
 */
export function evaluateCertificationGates(inputs: GateInputs): CertificationDecision {
  if (inputs.input.forceFail === true) return "Failed";
  if (inputs.matrix.some((row) => row.certificationStatus === "Failed Certification")) return "Failed";
  if (inputs.matrix.some((row) => row.certificationStatus === "Blocked")) return "Not_Certified";

  const approvalsConfirmed =
    inputs.input.pillowCommandConfirmed !== false && inputs.input.grandKingApproved !== false;

  const allReady = inputs.readinessSummary.ready;
  const contractSatisfied = !inputs.q1101Attempted || inputs.q1101Consumed;

  if (
    allReady &&
    inputs.governanceResults.compliant &&
    inputs.integrationsAllBound &&
    approvalsConfirmed &&
    contractSatisfied
  ) {
    return "Certified";
  }

  if (inputs.matrix.some((row) => row.certificationStatus === "Partially Certified")) {
    return "Conditionally_Certified";
  }
  if (inputs.matrix.some((row) => row.certificationStatus === "Pending")) {
    return "Conditionally_Certified";
  }
  if (inputs.matrix.some((row) => row.certificationStatus === "Deferred")) return "Deferred";
  return "Conditionally_Certified";
}
