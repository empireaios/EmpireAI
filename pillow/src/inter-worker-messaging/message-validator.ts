import { IWM_METADATA_VERSION } from "./paths.js";
import type {
  InterWorkerMessagingInput,
  InterWorkerMessagingValidationReport,
  MessageRecord,
} from "./types.js";

type BoundaryInput = {
  executeWorkerLogic?: boolean;
  modifyWorkerDecisions?: boolean;
  replaceWorkforceOrchestrator?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  validated?: boolean;
};

export class MessageValidator {
  decide(
    input: InterWorkerMessagingInput,
    requireParticipants = false,
  ): InterWorkerMessagingValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (input.validated === false) return "fail";
    if (
      requireParticipants &&
      !input.broadcast &&
      (!input.senderWorker?.trim() || !input.receiverWorker?.trim())
    ) {
      return "partial";
    }
    return "pass";
  }

  validateRecords(
    records: MessageRecord[] | null,
    input: InterWorkerMessagingInput,
    started: number,
    requireParticipants = false,
  ): InterWorkerMessagingValidationReport {
    const decision = this.decide(input, requireParticipants);
    const errors: string[] = [];
    const warnings: string[] = [];

    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Inter-Worker Messaging requires validated=true");
    }
    if (
      requireParticipants &&
      !input.broadcast &&
      (!input.senderWorker?.trim() || !input.receiverWorker?.trim())
    ) {
      warnings.push("senderWorker and receiverWorker are recommended for directed messages");
    }

    if (!records || records.length === 0) {
      if (decision !== "fail") errors.push("No message records were produced");
    } else {
      for (const record of records) {
        if (!record.messageId) errors.push("Missing message ID");
        if (!record.missionId) warnings.push(`Mission context missing for ${record.messageId}`);
        if (!record.businessId) warnings.push(`Business context missing for ${record.messageId}`);
        if (record.workerLogicExecuted) errors.push("workerLogicExecuted must remain false");
        if (record.workerDecisionsModified) {
          errors.push("workerDecisionsModified must remain false");
        }
        if (record.workforceOrchestratorReplaced) {
          errors.push("workforceOrchestratorReplaced must remain false");
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
      input.modifyWorkerDecisions === true ||
      input.replaceWorkforceOrchestrator === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true
    );
  }

  private pushBoundaryErrors(input: BoundaryInput, errors: string[]) {
    if (input.executeWorkerLogic === true) {
      errors.push("Inter-Worker Messaging must never execute worker logic");
    }
    if (input.modifyWorkerDecisions === true) {
      errors.push("Inter-Worker Messaging must never modify worker decisions");
    }
    if (input.replaceWorkforceOrchestrator === true) {
      errors.push("Inter-Worker Messaging must never replace Workforce Orchestrator");
    }
    if (input.overridePillow === true) {
      errors.push("Inter-Worker Messaging must never override Pillow");
    }
    if (input.overrideGrandKing === true) {
      errors.push("Inter-Worker Messaging must never override Grand King");
    }
  }

  finalize(
    decision: InterWorkerMessagingValidationReport["decision"],
    errors: string[],
    warnings: string[],
    started: number,
  ): InterWorkerMessagingValidationReport {
    const finalDecision =
      errors.length || decision === "fail"
        ? "fail"
        : warnings.length || decision === "partial"
          ? "partial"
          : "pass";
    return {
      validationReportId: `iwm-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: finalDecision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: IWM_METADATA_VERSION,
    };
  }
}

export class InterWorkerMessagingMetadataGenerator {
  generate(messageCount: number, conversationCount: number) {
    return {
      metadataVersion: IWM_METADATA_VERSION,
      engineVersion: "PILLOW-IWM-001" as const,
      missionId: "Q0-24" as const,
      messageCount,
      conversationCount,
      timestamp: new Date().toISOString(),
    };
  }
}

export class HealthMonitor {
  status(decision: InterWorkerMessagingValidationReport["decision"] | null, enabled: boolean) {
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
