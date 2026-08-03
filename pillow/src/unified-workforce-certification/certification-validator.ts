import { UWC_METADATA_VERSION } from "./paths.js";
import type {
  UnifiedCertificationReport,
  UnifiedWorkforceCertificationInput,
  UnifiedWorkforceCertificationValidationReport,
} from "./types.js";

type BoundaryInput = {
  executeWorkerTasks?: boolean;
  modifyExecutiveComponents?: boolean;
  repairFailuresAutomatically?: boolean;
  beginQ1Implementation?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  validated?: boolean;
};

export class CertificationValidator {
  decide(
    input: UnifiedWorkforceCertificationInput,
  ): UnifiedWorkforceCertificationValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (input.validated === false) return "fail";
    return "pass";
  }

  validateReports(
    reports: UnifiedCertificationReport[] | null,
    input: UnifiedWorkforceCertificationInput,
    started: number,
  ): UnifiedWorkforceCertificationValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];

    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Unified Workforce Certification requires validated=true");
    }

    if (!reports || reports.length === 0) {
      if (decision !== "fail") errors.push("No unified certification reports were produced");
    } else {
      for (const report of reports) {
        if (!report.certificationId) errors.push("Missing certification ID");
        if (!report.executiveComponentsTested.length) {
          warnings.push(`No components tested for ${report.certificationId}`);
        }
        if (report.workerTasksExecuted) errors.push("workerTasksExecuted must remain false");
        if (report.executiveComponentsModified) {
          errors.push("executiveComponentsModified must remain false");
        }
        if (report.failuresRepairedAutomatically) {
          errors.push("failuresRepairedAutomatically must remain false");
        }
        if (report.q1ImplementationBegun) {
          errors.push("q1ImplementationBegun must remain false");
        }
        if (report.pillowOverridden) errors.push("pillowOverridden must remain false");
        if (report.grandKingOverridden) errors.push("grandKingOverridden must remain false");
      }
    }

    return this.finalize(decision, errors, warnings, started);
  }

  private hasBoundaryViolation(input: BoundaryInput): boolean {
    return (
      input.executeWorkerTasks === true ||
      input.modifyExecutiveComponents === true ||
      input.repairFailuresAutomatically === true ||
      input.beginQ1Implementation === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true
    );
  }

  private pushBoundaryErrors(input: BoundaryInput, errors: string[]) {
    if (input.executeWorkerTasks === true) {
      errors.push("Unified Workforce Certification must never execute worker tasks");
    }
    if (input.modifyExecutiveComponents === true) {
      errors.push("Unified Workforce Certification must never modify executive components");
    }
    if (input.repairFailuresAutomatically === true) {
      errors.push("Unified Workforce Certification must never repair failures automatically");
    }
    if (input.beginQ1Implementation === true) {
      errors.push("Unified Workforce Certification must never begin Q1 implementation");
    }
    if (input.overridePillow === true) {
      errors.push("Unified Workforce Certification must never override Pillow");
    }
    if (input.overrideGrandKing === true) {
      errors.push("Unified Workforce Certification must never override Grand King");
    }
  }

  finalize(
    decision: UnifiedWorkforceCertificationValidationReport["decision"],
    errors: string[],
    warnings: string[],
    started: number,
  ): UnifiedWorkforceCertificationValidationReport {
    const finalDecision =
      errors.length || decision === "fail"
        ? "fail"
        : warnings.length || decision === "partial"
          ? "partial"
          : "pass";
    return {
      validationReportId: `uwc-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: finalDecision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: UWC_METADATA_VERSION,
    };
  }
}

export class UnifiedWorkforceCertificationMetadataGenerator {
  generate(reportCount: number, certifiedCount: number) {
    return {
      metadataVersion: UWC_METADATA_VERSION,
      engineVersion: "PILLOW-UWC-001" as const,
      missionId: "Q0-30" as const,
      reportCount,
      certifiedCount,
      timestamp: new Date().toISOString(),
    };
  }
}

export class HealthMonitor {
  status(
    decision: UnifiedWorkforceCertificationValidationReport["decision"] | null,
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
