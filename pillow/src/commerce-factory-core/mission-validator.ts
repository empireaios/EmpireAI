import { CMF_METADATA_VERSION } from "./paths.js";
import type {
  CommerceBuildMission,
  CommerceFactoryCoreInput,
  CommerceFactoryCoreValidationReport,
} from "./types.js";

type BoundaryInput = {
  buildStores?: boolean;
  importProducts?: boolean;
  configureMarketplaces?: boolean;
  executeCommerceImplementation?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  implementQ302OrLater?: boolean;
  validated?: boolean;
};

export class MissionValidator {
  decide(input: CommerceFactoryCoreInput): CommerceFactoryCoreValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (input.validated === false) return "fail";
    return "pass";
  }

  validateMissions(
    missions: CommerceBuildMission[] | null,
    input: CommerceFactoryCoreInput,
    started: number,
    options: { requireReadyMission?: boolean } = {},
  ): CommerceFactoryCoreValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];

    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Commerce Factory Core requires validated=true");
    }

    if (!missions || missions.length === 0) {
      if (decision !== "fail") {
        warnings.push("No commerce build missions were produced yet");
      }
    } else {
      for (const mission of missions) {
        if (!mission.commerceBuildMissionId) errors.push("Missing commerce build mission ID");
        if (!mission.timestamp) errors.push("Missing timestamp");
        if (!mission.businessBlueprintId) errors.push("Missing business blueprint ID");
        if (!mission.businessApprovalPackId) errors.push("Missing business approval pack ID");
        if (!mission.businessType) errors.push("Missing business type");
        if (!mission.commerceCategory) errors.push("Missing commerce category");
        if (!mission.missionObjective?.trim()) errors.push("Missing mission objective");
        if (!mission.traceabilityReference?.trim()) {
          errors.push("Missing traceability reference");
        }
        if (!mission.metadataVersion) errors.push("Missing metadata version");

        if (mission.approvalStatus !== "approved") {
          if (options.requireReadyMission) {
            errors.push(
              `Commerce Build Mission ${mission.commerceBuildMissionId} is not approved`,
            );
          } else {
            warnings.push(
              `Commerce Build Mission ${mission.commerceBuildMissionId} approvalStatus=${mission.approvalStatus}`,
            );
          }
        }
        if (mission.missingPrerequisites.length && mission.approvalStatus === "approved") {
          warnings.push(
            `Mission ${mission.commerceBuildMissionId} still lists missing prerequisites`,
          );
        }
        if (!mission.neverExecuteCommerceImplementation) {
          errors.push("Commerce Factory Core must never execute commerce implementation");
        }
        if (!mission.neverImplementQ302OrLater) {
          errors.push("Commerce Factory Core must never implement Q3-02 or later");
        }
        if (!mission.traceabilityRefs.some((r) => r.includes("q2-06"))) {
          warnings.push(`Mission ${mission.commerceBuildMissionId} missing Q2-06 traceability`);
        }
        if (!mission.traceabilityRefs.some((r) => r.includes("q2-09"))) {
          warnings.push(`Mission ${mission.commerceBuildMissionId} missing Q2-09 traceability`);
        }
      }
    }

    return this.finalize(
      errors.length || decision === "fail"
        ? "fail"
        : decision === "pass" && warnings.length
          ? "partial"
          : decision,
      errors,
      warnings,
      started,
    );
  }

  private hasBoundaryViolation(input: BoundaryInput): boolean {
    return (
      input.buildStores === true ||
      input.importProducts === true ||
      input.configureMarketplaces === true ||
      input.executeCommerceImplementation === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.implementQ302OrLater === true
    );
  }

  private pushBoundaryErrors(input: BoundaryInput, errors: string[]) {
    if (input.buildStores === true) {
      errors.push("Commerce Factory Core must never build stores");
    }
    if (input.importProducts === true) {
      errors.push("Commerce Factory Core must never import products");
    }
    if (input.configureMarketplaces === true) {
      errors.push("Commerce Factory Core must never configure marketplaces");
    }
    if (input.executeCommerceImplementation === true) {
      errors.push("Commerce Factory Core must never execute commerce implementation");
    }
    if (input.overridePillow === true) {
      errors.push("Commerce Factory Core must never override Pillow");
    }
    if (input.overrideGrandKing === true) {
      errors.push("Commerce Factory Core must never override Grand King");
    }
    if (input.implementQ302OrLater === true) {
      errors.push("Commerce Factory Core must never implement Q3-02 or later");
    }
  }

  finalize(
    decision: CommerceFactoryCoreValidationReport["decision"],
    errors: string[],
    warnings: string[],
    started: number,
  ): CommerceFactoryCoreValidationReport {
    const finalDecision =
      errors.length || decision === "fail"
        ? "fail"
        : warnings.length || decision === "partial"
          ? "partial"
          : "pass";
    return {
      validationReportId: `cmf-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: finalDecision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: CMF_METADATA_VERSION,
    };
  }
}

export class HealthMonitor {
  status(
    decision: CommerceFactoryCoreValidationReport["decision"] | null,
    enabled: boolean,
  ) {
    if (!enabled) return "standby" as const;
    if (decision === "fail" || decision === "partial") return "degraded" as const;
    return "healthy" as const;
  }
}

export class RecoveryManager {
  private failures = 0;
  recordFailure() {
    this.failures += 1;
    return this.failures;
  }
  reset() {
    this.failures = 0;
  }
  failureCount() {
    return this.failures;
  }
}
