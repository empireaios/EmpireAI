import type {
  CertificationDecision,
  ComponentStatusRow,
  GovernanceCompliance,
  OperationalReadiness,
  ProductionReadiness,
} from "./types.js";

export type GateInputs = {
  matrix: ComponentStatusRow[];
  integrationsAllBound: boolean;
  productionReadiness: ProductionReadiness;
  governanceCompliance: GovernanceCompliance;
  operationalReadiness: OperationalReadiness;
  workflowComplete: boolean;
  /** Rare, whole-factory explicit deferral requested by the input — never inferred. */
  factoryDeferred?: boolean;
};

/**
 * Fail-closed certification gate. Every branch requires an observed,
 * unambiguous condition — the default (no evidence, mixed evidence, or a
 * contradiction) always resolves to a status below Certified.
 */
export function evaluateCertificationGates(inputs: GateInputs): CertificationDecision {
  if (inputs.factoryDeferred) return "Deferred";
  if (inputs.matrix.some((row) => row.status === "Broken / Deviating")) return "Failed";
  if (inputs.matrix.some((row) => row.status === "Missing")) return "Not_Certified";

  const allCompleted = inputs.matrix.every((row) => row.status === "Completed");
  const readinessPasses =
    inputs.integrationsAllBound &&
    inputs.productionReadiness.ready &&
    inputs.governanceCompliance.compliant &&
    inputs.operationalReadiness.ready &&
    inputs.workflowComplete;

  if (allCompleted && readinessPasses) return "Certified";
  return "Conditionally_Certified";
}
