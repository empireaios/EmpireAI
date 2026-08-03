import { ERT_METADATA_VERSION } from "./paths.js";
import type {
  ExecutiveReportingRuntimeInput,
  ExecutiveReportingRuntimeValidationReport,
  ReportRecord,
} from "./types.js";

type BoundaryInput = {
  executeWorkerLogic?: boolean;
  replaceMonitoringRuntime?: boolean;
  replaceMissionCoordination?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  validated?: boolean;
};

export class ReportValidator {
  decide(
    input: ExecutiveReportingRuntimeInput,
    requireEntity = false,
  ): ExecutiveReportingRuntimeValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (input.validated === false) return "fail";
    if (requireEntity && !input.reportingEntity?.trim()) return "partial";
    return "pass";
  }

  validateRecords(
    records: ReportRecord[] | null,
    input: ExecutiveReportingRuntimeInput,
    started: number,
    requireEntity = false,
  ): ExecutiveReportingRuntimeValidationReport {
    const decision = this.decide(input, requireEntity);
    const errors: string[] = [];
    const warnings: string[] = [];

    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Executive Reporting Runtime requires validated=true");
    }
    if (requireEntity && !input.reportingEntity?.trim()) {
      warnings.push("reportingEntity is recommended");
    }

    if (!records || records.length === 0) {
      if (decision !== "fail") errors.push("No reporting records were produced");
    } else {
      for (const record of records) {
        if (!record.reportId) errors.push("Missing report ID");
        if (!record.reportingEntity) {
          warnings.push(`Reporting entity empty for ${record.reportId}`);
        }
        if (record.workerLogicExecuted) errors.push("workerLogicExecuted must remain false");
        if (record.monitoringRuntimeReplaced) {
          errors.push("monitoringRuntimeReplaced must remain false");
        }
        if (record.missionCoordinationReplaced) {
          errors.push("missionCoordinationReplaced must remain false");
        }
        if (record.pillowOverridden) errors.push("pillowOverridden must remain false");
        if (record.grandKingOverridden) errors.push("grandKingOverridden must remain false");
      }
    }

    return this.finalize(decision, errors, warnings, started);
  }

  private hasBoundaryViolation(input: BoundaryInput): boolean {
    return (
      input.executeWorkerLogic === true ||
      input.replaceMonitoringRuntime === true ||
      input.replaceMissionCoordination === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true
    );
  }

  private pushBoundaryErrors(input: BoundaryInput, errors: string[]) {
    if (input.executeWorkerLogic === true) {
      errors.push("Executive Reporting Runtime must never execute worker logic");
    }
    if (input.replaceMonitoringRuntime === true) {
      errors.push("Executive Reporting Runtime must never replace Monitoring Runtime");
    }
    if (input.replaceMissionCoordination === true) {
      errors.push("Executive Reporting Runtime must never replace Mission Coordination");
    }
    if (input.overridePillow === true) {
      errors.push("Executive Reporting Runtime must never override Pillow");
    }
    if (input.overrideGrandKing === true) {
      errors.push("Executive Reporting Runtime must never override Grand King");
    }
  }

  finalize(
    decision: ExecutiveReportingRuntimeValidationReport["decision"],
    errors: string[],
    warnings: string[],
    started: number,
  ): ExecutiveReportingRuntimeValidationReport {
    const finalDecision =
      errors.length || decision === "fail"
        ? "fail"
        : warnings.length || decision === "partial"
          ? "partial"
          : "pass";
    return {
      validationReportId: `ert-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: finalDecision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: ERT_METADATA_VERSION,
    };
  }
}

export class ExecutiveReportingRuntimeMetadataGenerator {
  generate(reportCount: number, averageProgress: number) {
    return {
      metadataVersion: ERT_METADATA_VERSION,
      engineVersion: "PILLOW-ERT-001" as const,
      missionId: "Q0-26" as const,
      reportCount,
      averageProgress,
      timestamp: new Date().toISOString(),
    };
  }
}

export class HealthMonitor {
  status(
    decision: ExecutiveReportingRuntimeValidationReport["decision"] | null,
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
