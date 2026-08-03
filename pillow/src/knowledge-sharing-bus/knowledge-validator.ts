import { KSB_METADATA_VERSION } from "./paths.js";
import type {
  KnowledgeRecord,
  KnowledgeSharingBusInput,
  KnowledgeSharingBusValidationReport,
} from "./types.js";

type BoundaryInput = {
  executeWorkerTasks?: boolean;
  replaceExecutionMemory?: boolean;
  replaceDecisionMemory?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  validated?: boolean;
};

export class KnowledgeValidator {
  decide(
    input: KnowledgeSharingBusInput,
    requireContent = false,
  ): KnowledgeSharingBusValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (input.validated === false) return "fail";
    if (requireContent && !input.knowledgeTitle?.trim() && !input.knowledgeSummary?.trim()) {
      return "partial";
    }
    return "pass";
  }

  validateRecords(
    records: KnowledgeRecord[] | null,
    input: KnowledgeSharingBusInput,
    started: number,
    requireContent = false,
  ): KnowledgeSharingBusValidationReport {
    const decision = this.decide(input, requireContent);
    const errors: string[] = [];
    const warnings: string[] = [];

    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Knowledge Sharing Bus requires validated=true");
    }
    if (requireContent && !input.knowledgeTitle?.trim() && !input.knowledgeSummary?.trim()) {
      warnings.push("knowledgeTitle or knowledgeSummary is recommended");
    }

    if (!records || records.length === 0) {
      if (decision !== "fail") errors.push("No knowledge records were produced");
    } else {
      for (const record of records) {
        if (!record.knowledgeId) errors.push("Missing knowledge ID");
        if (!record.knowledgeCategory) {
          warnings.push(`Knowledge category empty for ${record.knowledgeId}`);
        }
        if (record.workerTasksExecuted) errors.push("workerTasksExecuted must remain false");
        if (record.executionMemoryReplaced) {
          errors.push("executionMemoryReplaced must remain false");
        }
        if (record.decisionMemoryReplaced) {
          errors.push("decisionMemoryReplaced must remain false");
        }
        if (record.pillowOverridden) errors.push("pillowOverridden must remain false");
        if (record.grandKingOverridden) errors.push("grandKingOverridden must remain false");
      }
    }

    return this.finalize(decision, errors, warnings, started);
  }

  private hasBoundaryViolation(input: BoundaryInput): boolean {
    return (
      input.executeWorkerTasks === true ||
      input.replaceExecutionMemory === true ||
      input.replaceDecisionMemory === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true
    );
  }

  private pushBoundaryErrors(input: BoundaryInput, errors: string[]) {
    if (input.executeWorkerTasks === true) {
      errors.push("Knowledge Sharing Bus must never execute worker tasks");
    }
    if (input.replaceExecutionMemory === true) {
      errors.push("Knowledge Sharing Bus must never replace Execution Memory");
    }
    if (input.replaceDecisionMemory === true) {
      errors.push("Knowledge Sharing Bus must never replace Decision Memory");
    }
    if (input.overridePillow === true) {
      errors.push("Knowledge Sharing Bus must never override Pillow");
    }
    if (input.overrideGrandKing === true) {
      errors.push("Knowledge Sharing Bus must never override Grand King");
    }
  }

  finalize(
    decision: KnowledgeSharingBusValidationReport["decision"],
    errors: string[],
    warnings: string[],
    started: number,
  ): KnowledgeSharingBusValidationReport {
    const finalDecision =
      errors.length || decision === "fail"
        ? "fail"
        : warnings.length || decision === "partial"
          ? "partial"
          : "pass";
    return {
      validationReportId: `ksb-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: finalDecision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: KSB_METADATA_VERSION,
    };
  }
}

export class KnowledgeSharingBusMetadataGenerator {
  generate(knowledgeCount: number, publishedCount: number) {
    return {
      metadataVersion: KSB_METADATA_VERSION,
      engineVersion: "PILLOW-KSB-001" as const,
      missionId: "Q0-23" as const,
      knowledgeCount,
      publishedCount,
      timestamp: new Date().toISOString(),
    };
  }
}

export class HealthMonitor {
  status(decision: KnowledgeSharingBusValidationReport["decision"] | null, enabled: boolean) {
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
