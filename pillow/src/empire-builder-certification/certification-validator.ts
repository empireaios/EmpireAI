import { EBC_METADATA_VERSION } from "./paths.js";
import type {
  EmpireBuilderCertificationInput,
  EmpireBuilderCertificationReport,
  EmpireBuilderCertificationValidationReport,
} from "./types.js";

type BoundaryInput = {
  executeBusinessImplementation?: boolean;
  modifyFactoryComponents?: boolean;
  repairFailuresAutomatically?: boolean;
  beginQ3Implementation?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  validated?: boolean;
};

export class CertificationValidator {
  decide(
    input: EmpireBuilderCertificationInput,
  ): EmpireBuilderCertificationValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (input.validated === false) return "fail";
    return "pass";
  }

  validateReports(
    reports: EmpireBuilderCertificationReport[] | null,
    input: EmpireBuilderCertificationInput,
    started: number,
  ): EmpireBuilderCertificationValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];

    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Empire Builder Certification requires validated=true");
    }

    if (!reports || reports.length === 0) {
      if (decision !== "fail") {
        errors.push("No empire builder certification reports were produced");
      }
    } else {
      for (const report of reports) {
        if (!report.certificationId) errors.push("Missing certification ID");
        if (!report.originalGrandKingCommand?.trim()) {
          errors.push("Missing original Grand King command");
        }
        if (!report.componentsTested.length) {
          warnings.push(`No components tested for ${report.certificationId}`);
        }
        if (!report.planningCompleteness) {
          errors.push("Missing planning completeness");
        }
        if (!report.traceabilityChain.length) {
          warnings.push(`No traceability chain for ${report.certificationId}`);
        }
        if (report.businessImplementationExecuted) {
          errors.push("businessImplementationExecuted must remain false");
        }
        if (report.factoryComponentsModified) {
          errors.push("factoryComponentsModified must remain false");
        }
        if (report.failuresRepairedAutomatically) {
          errors.push("failuresRepairedAutomatically must remain false");
        }
        if (report.q3ImplementationBegun) {
          errors.push("q3ImplementationBegun must remain false");
        }
        if (report.pillowOverridden) errors.push("pillowOverridden must remain false");
        if (report.grandKingOverridden) errors.push("grandKingOverridden must remain false");
      }
    }

    return this.finalize(decision, errors, warnings, started);
  }

  private hasBoundaryViolation(input: BoundaryInput): boolean {
    return (
      input.executeBusinessImplementation === true ||
      input.modifyFactoryComponents === true ||
      input.repairFailuresAutomatically === true ||
      input.beginQ3Implementation === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true
    );
  }

  private pushBoundaryErrors(input: BoundaryInput, errors: string[]) {
    if (input.executeBusinessImplementation === true) {
      errors.push("Empire Builder Certification must never execute business implementation");
    }
    if (input.modifyFactoryComponents === true) {
      errors.push("Empire Builder Certification must never modify factory components");
    }
    if (input.repairFailuresAutomatically === true) {
      errors.push("Empire Builder Certification must never repair failures automatically");
    }
    if (input.beginQ3Implementation === true) {
      errors.push("Empire Builder Certification must never begin Q3 implementation");
    }
    if (input.overridePillow === true) {
      errors.push("Empire Builder Certification must never override Pillow");
    }
    if (input.overrideGrandKing === true) {
      errors.push("Empire Builder Certification must never override Grand King");
    }
  }

  finalize(
    decision: EmpireBuilderCertificationValidationReport["decision"],
    errors: string[],
    warnings: string[],
    started: number,
  ): EmpireBuilderCertificationValidationReport {
    const finalDecision =
      errors.length || decision === "fail"
        ? "fail"
        : warnings.length || decision === "partial"
          ? "partial"
          : "pass";
    return {
      validationReportId: `ebc-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: finalDecision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: EBC_METADATA_VERSION,
    };
  }
}

export class EmpireBuilderCertificationMetadataGenerator {
  generate(reportCount: number, certifiedCount: number) {
    return {
      metadataVersion: EBC_METADATA_VERSION,
      engineVersion: "PILLOW-EBC-001" as const,
      missionId: "Q2-10" as const,
      reportCount,
      certifiedCount,
      timestamp: new Date().toISOString(),
    };
  }
}

export class HealthMonitor {
  status(
    decision: EmpireBuilderCertificationValidationReport["decision"] | null,
    enabled: boolean,
  ) {
    if (!enabled) return "standby" as const;
    if (decision === "fail") return "degraded" as const;
    if (decision === "partial") return "degraded" as const;
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
