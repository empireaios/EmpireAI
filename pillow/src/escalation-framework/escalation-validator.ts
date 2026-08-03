import { ESF_METADATA_VERSION } from "./paths.js";
import type {
  EscalationFrameworkInput,
  EscalationFrameworkValidationReport,
  EscalationRecord,
} from "./types.js";

type BoundaryInput = {
  executeWorkerTasks?: boolean;
  resolveBusinessDisputes?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  replaceExecutiveJudgement?: boolean;
  validated?: boolean;
};

export class EscalationValidator {
  decide(
    input: EscalationFrameworkInput,
    requireContext = false,
  ): EscalationFrameworkValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (input.validated === false) return "fail";
    if (requireContext && !input.taskId?.trim() && !input.missionId?.trim()) return "partial";
    return "pass";
  }

  validateRecords(
    records: EscalationRecord[] | null,
    input: EscalationFrameworkInput,
    started: number,
    requireContext = false,
  ): EscalationFrameworkValidationReport {
    const decision = this.decide(input, requireContext);
    const errors: string[] = [];
    const warnings: string[] = [];

    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Escalation Framework requires validated=true");
    }
    if (requireContext && !input.taskId?.trim() && !input.missionId?.trim()) {
      warnings.push("taskId or missionId is recommended for escalation context");
    }

    if (!records || records.length === 0) {
      if (decision !== "fail") errors.push("No escalation records were produced");
    } else {
      for (const record of records) {
        if (!record.escalationId) errors.push("Missing escalation ID");
        if (!record.escalationCategory) {
          warnings.push(`Escalation category empty for ${record.escalationId}`);
        }
        if (record.workerTasksExecuted) errors.push("workerTasksExecuted must remain false");
        if (record.businessDisputesResolved) {
          errors.push("businessDisputesResolved must remain false");
        }
        if (record.pillowOverridden) errors.push("pillowOverridden must remain false");
        if (record.grandKingOverridden) errors.push("grandKingOverridden must remain false");
        if (record.executiveJudgementReplaced) {
          errors.push("executiveJudgementReplaced must remain false");
        }
      }
    }

    return this.finalize(decision, errors, warnings, started);
  }

  private hasBoundaryViolation(input: BoundaryInput): boolean {
    return (
      input.executeWorkerTasks === true ||
      input.resolveBusinessDisputes === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.replaceExecutiveJudgement === true
    );
  }

  private pushBoundaryErrors(input: BoundaryInput, errors: string[]) {
    if (input.executeWorkerTasks === true) {
      errors.push("Escalation Framework must never execute worker tasks");
    }
    if (input.resolveBusinessDisputes === true) {
      errors.push("Escalation Framework must never resolve business disputes");
    }
    if (input.overridePillow === true) {
      errors.push("Escalation Framework must never override Pillow");
    }
    if (input.overrideGrandKing === true) {
      errors.push("Escalation Framework must never override Grand King");
    }
    if (input.replaceExecutiveJudgement === true) {
      errors.push("Escalation Framework must never replace executive judgement");
    }
  }

  finalize(
    decision: EscalationFrameworkValidationReport["decision"],
    errors: string[],
    warnings: string[],
    started: number,
  ): EscalationFrameworkValidationReport {
    const finalDecision =
      errors.length || decision === "fail"
        ? "fail"
        : warnings.length || decision === "partial"
          ? "partial"
          : "pass";
    return {
      validationReportId: `esf-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: finalDecision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: ESF_METADATA_VERSION,
    };
  }
}

export class EscalationFrameworkMetadataGenerator {
  generate(escalationCount: number, openCount: number) {
    return {
      metadataVersion: ESF_METADATA_VERSION,
      engineVersion: "PILLOW-ESF-001" as const,
      missionId: "Q0-22" as const,
      escalationCount,
      openCount,
      timestamp: new Date().toISOString(),
    };
  }
}

export class HealthMonitor {
  status(decision: EscalationFrameworkValidationReport["decision"] | null, enabled: boolean) {
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
