import { EXA_METADATA_VERSION } from "./paths.js";
import type {
  AuditReport,
  AuditValidationReport,
  ExecutiveAuditInput,
} from "./types.js";

export class AuditValidator {
  decide(input: ExecutiveAuditInput): AuditValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (input.validated === false) return "fail";
    const signalCount =
      (input.decisionHints?.length ?? 0) +
      (input.missionHints?.length ?? 0) +
      (input.workforceHints?.length ?? 0) +
      (input.governanceHints?.length ?? 0) +
      (input.approvalHints?.length ?? 0) +
      (input.businessHints?.length ?? 0) +
      (input.memoryHints?.length ?? 0) +
      (input.recommendationHints?.length ?? 0) +
      (input.evidenceHints?.length ?? 0) +
      (input.violationHints?.length ?? 0) +
      (input.summary ? 1 : 0) +
      (input.targetObject ? 1 : 0) +
      (input.objectId ? 1 : 0) +
      (input.auditType ? 1 : 0);
    if (signalCount === 0) return "partial";
    return "pass";
  }

  validateReports(
    reports: AuditReport[] | null,
    input: ExecutiveAuditInput,
    started: number,
  ): AuditValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];

    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Executive audit requires validated=true");
    }

    if (!reports || reports.length === 0) {
      if (decision !== "fail") errors.push("No audit reports were produced");
    } else {
      for (const report of reports) {
        if (!report.auditId) errors.push("Missing audit ID");
        if (!report.auditType) errors.push("Audit type is required");
        if (!report.targetObject) errors.push("Target object is required");
        if (!report.objectId) errors.push("Object ID is required");
        if (!report.findings.length) errors.push("Findings are required");
        if (!report.severity) errors.push("Severity is required");
        if (report.correctionsExecuted) errors.push("correctionsExecuted must remain false");
        if (report.missionsApproved) errors.push("missionsApproved must remain false");
        if (report.workersAssigned) errors.push("workersAssigned must remain false");
        if (report.businessStateModified) errors.push("businessStateModified must remain false");
        if (report.pillowOverridden) errors.push("pillowOverridden must remain false");
        if (report.grandKingOverridden) errors.push("grandKingOverridden must remain false");
        if (!report.evidence.length) warnings.push(`Empty evidence for ${report.auditId}`);
        if (report.violations.length > 0 && report.auditStatus === "passed") {
          errors.push("Reports with violations cannot have passed status");
        }
      }
    }

    return this.finalize(decision, errors, warnings, started);
  }

  private hasBoundaryViolation(input: {
    executeCorrections?: boolean;
    approveMissions?: boolean;
    assignWorkers?: boolean;
    modifyBusinessState?: boolean;
    overridePillow?: boolean;
    overrideGrandKing?: boolean;
  }): boolean {
    return (
      input.executeCorrections === true ||
      input.approveMissions === true ||
      input.assignWorkers === true ||
      input.modifyBusinessState === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true
    );
  }

  private pushBoundaryErrors(
    input: {
      executeCorrections?: boolean;
      approveMissions?: boolean;
      assignWorkers?: boolean;
      modifyBusinessState?: boolean;
      overridePillow?: boolean;
      overrideGrandKing?: boolean;
    },
    errors: string[],
  ) {
    if (input.executeCorrections === true) {
      errors.push("Executive Audit Engine must never execute corrections");
    }
    if (input.approveMissions === true) {
      errors.push("Executive Audit Engine must never approve missions");
    }
    if (input.assignWorkers === true) {
      errors.push("Executive Audit Engine must never assign workers");
    }
    if (input.modifyBusinessState === true) {
      errors.push("Executive Audit Engine must never modify business state");
    }
    if (input.overridePillow === true) {
      errors.push("Executive Audit Engine must never override Pillow");
    }
    if (input.overrideGrandKing === true) {
      errors.push("Executive Audit Engine must never override Grand King");
    }
  }

  private finalize(
    decision: AuditValidationReport["decision"],
    errors: string[],
    warnings: string[],
    started: number,
  ): AuditValidationReport {
    const finalDecision =
      errors.length || decision === "fail" ? "fail" : warnings.length || decision === "partial" ? "partial" : "pass";
    return {
      validationReportId: `exa-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: finalDecision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: EXA_METADATA_VERSION,
    };
  }
}

export class AuditMetadataGenerator {
  generate(auditCount: number, violationCount: number) {
    return {
      metadataVersion: EXA_METADATA_VERSION,
      engineVersion: "PILLOW-EXA-001" as const,
      missionId: "Q0-08" as const,
      auditCount,
      violationCount,
      timestamp: new Date().toISOString(),
    };
  }
}

export class HealthMonitor {
  status(decision: AuditValidationReport["decision"] | null, enabled: boolean) {
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
    return {
      recoveryAttempted: true,
      failures: this.failures,
      correctionsExecuted: false as const,
      missionsApproved: false as const,
      workersAssigned: false as const,
      businessStateModified: false as const,
    };
  }
  reset() {
    this.failures = 0;
  }
}
