import { WFC_METADATA_VERSION } from "./paths.js";
import type {
  WorkforceFactoryCertificationInput,
  WorkforceFactoryCertificationReport,
  WorkforceFactoryCertificationValidationReport,
} from "./types.js";

type BoundaryInput = {
  executeWorkerTasks?: boolean;
  modifyWorkforceComponents?: boolean;
  repairFailuresAutomatically?: boolean;
  beginQ2Implementation?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  validated?: boolean;
};

export class CertificationValidator {
  decide(
    input: WorkforceFactoryCertificationInput,
  ): WorkforceFactoryCertificationValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (input.validated === false) return "fail";
    return "pass";
  }

  validateReports(
    reports: WorkforceFactoryCertificationReport[] | null,
    input: WorkforceFactoryCertificationInput,
    started: number,
  ): WorkforceFactoryCertificationValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];

    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Workforce Factory Certification requires validated=true");
    }

    if (!reports || reports.length === 0) {
      if (decision !== "fail") errors.push("No workforce factory certification reports were produced");
    } else {
      for (const report of reports) {
        if (!report.certificationId) errors.push("Missing certification ID");
        if (!report.componentsTested.length) {
          warnings.push(`No components tested for ${report.certificationId}`);
        }
        if (report.workerTasksExecuted) errors.push("workerTasksExecuted must remain false");
        if (report.workforceComponentsModified) {
          errors.push("workforceComponentsModified must remain false");
        }
        if (report.failuresRepairedAutomatically) {
          errors.push("failuresRepairedAutomatically must remain false");
        }
        if (report.q2ImplementationBegun) {
          errors.push("q2ImplementationBegun must remain false");
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
      input.modifyWorkforceComponents === true ||
      input.repairFailuresAutomatically === true ||
      input.beginQ2Implementation === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true
    );
  }

  private pushBoundaryErrors(input: BoundaryInput, errors: string[]) {
    if (input.executeWorkerTasks === true) {
      errors.push("Workforce Factory Certification must never execute worker tasks");
    }
    if (input.modifyWorkforceComponents === true) {
      errors.push("Workforce Factory Certification must never modify workforce components");
    }
    if (input.repairFailuresAutomatically === true) {
      errors.push("Workforce Factory Certification must never repair failures automatically");
    }
    if (input.beginQ2Implementation === true) {
      errors.push("Workforce Factory Certification must never begin Q2 implementation");
    }
    if (input.overridePillow === true) {
      errors.push("Workforce Factory Certification must never override Pillow");
    }
    if (input.overrideGrandKing === true) {
      errors.push("Workforce Factory Certification must never override Grand King");
    }
  }

  finalize(
    decision: WorkforceFactoryCertificationValidationReport["decision"],
    errors: string[],
    warnings: string[],
    started: number,
  ): WorkforceFactoryCertificationValidationReport {
    const finalDecision =
      errors.length || decision === "fail"
        ? "fail"
        : warnings.length || decision === "partial"
          ? "partial"
          : "pass";
    return {
      validationReportId: `wfc-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: finalDecision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: WFC_METADATA_VERSION,
    };
  }
}

export class WorkforceFactoryCertificationMetadataGenerator {
  generate(reportCount: number, certifiedCount: number) {
    return {
      metadataVersion: WFC_METADATA_VERSION,
      engineVersion: "PILLOW-WFC-001" as const,
      missionId: "Q1-13" as const,
      reportCount,
      certifiedCount,
      timestamp: new Date().toISOString(),
    };
  }
}

export class HealthMonitor {
  status(
    decision: WorkforceFactoryCertificationValidationReport["decision"] | null,
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
