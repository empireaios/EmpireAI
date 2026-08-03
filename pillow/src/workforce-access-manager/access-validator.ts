import { EXECUTIVE_ACTIONS, WAM_METADATA_VERSION } from "./paths.js";
import type {
  AccessRecord,
  AccessValidationReport,
  WorkforceAccessManagerInput,
} from "./types.js";

type BoundaryInput = {
  executeWorkerLogic?: boolean;
  replaceWorkerImplementations?: boolean;
  performOrchestration?: boolean;
  makeStrategicDecisions?: boolean;
  overrideGrandKing?: boolean;
  validated?: boolean;
};

export class AccessValidator {
  decide(input: WorkforceAccessManagerInput, supportedActions: string[]): AccessValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (input.validated === false) return "fail";
    if (!input.executiveRequest?.trim()) return "fail";
    const action = (input.requestedAction ?? "locate").toString().trim().toLowerCase().replace(/\s+/g, "_");
    if (action && !supportedActions.includes(action) && !(EXECUTIVE_ACTIONS as readonly string[]).includes(action)) {
      return "fail";
    }
    if (input.executiveRequest.trim().length < 8) return "partial";
    return "pass";
  }

  validateRecords(
    records: AccessRecord[] | null,
    input: WorkforceAccessManagerInput,
    supportedActions: string[],
    started: number,
  ): AccessValidationReport {
    const decision = this.decide(input, supportedActions);
    const errors: string[] = [];
    const warnings: string[] = [];

    this.pushBoundaryErrors(input, errors);
    if (!input.executiveRequest?.trim()) errors.push("Executive request is required");
    if (input.validated === false) errors.push("Workforce access requires validated=true");

    const action = (input.requestedAction ?? "").toString().trim().toLowerCase().replace(/\s+/g, "_");
    if (
      action &&
      !supportedActions.includes(action) &&
      !(EXECUTIVE_ACTIONS as readonly string[]).includes(action)
    ) {
      errors.push(`Unsupported executive action: ${action}`);
    }

    if (!records || records.length === 0) {
      if (decision !== "fail") errors.push("No access records were produced");
    } else {
      for (const record of records) {
        if (!record.accessId) errors.push("Missing access ID");
        if (!record.executiveRequest.trim()) errors.push("Executive request missing on record");
        if (!record.requestedAction) errors.push("Requested action is required");
        if (record.workerLogicExecuted) errors.push("workerLogicExecuted must remain false");
        if (record.workerImplementationsReplaced) {
          errors.push("workerImplementationsReplaced must remain false");
        }
        if (record.orchestrationPerformed) errors.push("orchestrationPerformed must remain false");
        if (record.strategicDecisionsMade) errors.push("strategicDecisionsMade must remain false");
        if (record.grandKingOverridden) errors.push("grandKingOverridden must remain false");
        if (record.accessStatus === "denied") warnings.push(`Access denied for ${record.workerId}`);
      }
    }

    return this.finalize(decision, errors, warnings, started);
  }

  private hasBoundaryViolation(input: BoundaryInput): boolean {
    return (
      input.executeWorkerLogic === true ||
      input.replaceWorkerImplementations === true ||
      input.performOrchestration === true ||
      input.makeStrategicDecisions === true ||
      input.overrideGrandKing === true
    );
  }

  private pushBoundaryErrors(input: BoundaryInput, errors: string[]) {
    if (input.executeWorkerLogic === true) {
      errors.push("Workforce Access Manager must never execute worker logic");
    }
    if (input.replaceWorkerImplementations === true) {
      errors.push("Workforce Access Manager must never replace worker implementations");
    }
    if (input.performOrchestration === true) {
      errors.push("Workforce Access Manager must never perform orchestration");
    }
    if (input.makeStrategicDecisions === true) {
      errors.push("Workforce Access Manager must never make strategic decisions");
    }
    if (input.overrideGrandKing === true) {
      errors.push("Workforce Access Manager must never override Grand King");
    }
  }

  finalize(
    decision: AccessValidationReport["decision"],
    errors: string[],
    warnings: string[],
    started: number,
  ): AccessValidationReport {
    const finalDecision =
      errors.length || decision === "fail" ? "fail" : warnings.length || decision === "partial" ? "partial" : "pass";
    return {
      validationReportId: `wam-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: finalDecision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: WAM_METADATA_VERSION,
    };
  }
}

export class AccessMetadataGenerator {
  generate(accessCount: number, connectedWorkers: number) {
    return {
      metadataVersion: WAM_METADATA_VERSION,
      engineVersion: "PILLOW-WAM-001" as const,
      missionId: "Q0-11" as const,
      accessCount,
      connectedWorkers,
      timestamp: new Date().toISOString(),
    };
  }
}

export class HealthMonitor {
  status(decision: AccessValidationReport["decision"] | null, enabled: boolean) {
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
      workerLogicExecuted: false as const,
      orchestrationPerformed: false as const,
      strategicDecisionsMade: false as const,
      grandKingOverridden: false as const,
    };
  }
  reset() {
    this.failures = 0;
  }
}
