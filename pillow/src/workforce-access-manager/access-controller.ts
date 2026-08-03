import { EXECUTIVE_ACTIONS, WAM_METADATA_VERSION } from "./paths.js";
import type { AccessDirectory } from "./access-directory.js";
import type {
  AccessRecord,
  AccessStatus,
  AccessibleWorker,
  ExecutiveAction,
  ValidationStatus,
  WorkforceAccessManagerInput,
} from "./types.js";

let accessSequence = 0;

/** Applies executive access actions without executing worker logic. */
export class AccessController {
  constructor(private readonly directory: AccessDirectory) {}

  execute(
    action: ExecutiveAction | string,
    input: WorkforceAccessManagerInput,
    validationStatus: ValidationStatus,
  ): { record: AccessRecord; workers: AccessibleWorker[] } {
    const normalized = normalizeAction(action);
    const target = this.resolveTarget(input);
    if (!target) {
      return {
        record: this.denied(input, normalized, "Worker not found for executive access", validationStatus),
        workers: this.directory.list(),
      };
    }

    let worker = this.directory.connect(target.workerId) ?? target;
    let accessStatus: AccessStatus = "granted";
    let reason = input.reason?.trim() || defaultReason(normalized, worker);
    let capabilitiesInspected: string[] = [];

    switch (normalized) {
      case "locate":
        accessStatus = "completed";
        reason = `Located worker ${worker.workerId} for Pillow access`;
        break;
      case "invoke":
        worker = this.directory.setStatus(worker.workerId, "invoked") ?? worker;
        accessStatus = "completed";
        reason = `Invoked worker ${worker.workerId} through Access Manager (no task logic executed)`;
        break;
      case "suspend":
        worker = this.directory.setStatus(worker.workerId, "suspended") ?? worker;
        accessStatus = "completed";
        reason = `Suspended worker ${worker.workerId}`;
        break;
      case "resume":
        worker = this.directory.setStatus(worker.workerId, "connected") ?? worker;
        accessStatus = "completed";
        reason = `Resumed worker ${worker.workerId}`;
        break;
      case "pause":
        worker = this.directory.setStatus(worker.workerId, "paused") ?? worker;
        accessStatus = "completed";
        reason = `Paused worker ${worker.workerId}`;
        break;
      case "continue":
        worker = this.directory.setStatus(worker.workerId, "busy") ?? worker;
        accessStatus = "completed";
        reason = `Continued worker ${worker.workerId}`;
        break;
      case "reassign": {
        const destinationId = input.reassignToWorkerId?.trim();
        const destination = destinationId ? this.directory.get(destinationId) : null;
        if (!destination) {
          return {
            record: this.denied(
              input,
              normalized,
              "Reassignment target worker not found",
              validationStatus,
              worker,
            ),
            workers: this.directory.list(),
          };
        }
        this.directory.setStatus(worker.workerId, "reassigned");
        worker = this.directory.setStatus(destination.workerId, "connected") ?? destination;
        accessStatus = "completed";
        reason =
          input.reason?.trim() ||
          `Reassigned executive access from ${target.workerId} to ${destination.workerId}`;
        break;
      }
      case "inspect":
        capabilitiesInspected = [...worker.capabilities];
        accessStatus = "completed";
        reason = `Inspected status and capabilities for ${worker.workerId}`;
        break;
      case "restart":
        worker = this.directory.setStatus(worker.workerId, "connected") ?? worker;
        accessStatus = "completed";
        reason = `Restarted access session for ${worker.workerId}`;
        break;
      case "stop":
        worker = this.directory.setStatus(worker.workerId, "stopped") ?? worker;
        accessStatus = "completed";
        reason = `Stopped worker execution access for ${worker.workerId}`;
        break;
      default:
        accessStatus = "denied";
        reason = `Unsupported executive action: ${normalized}`;
        break;
    }

    const fresh = this.directory.get(worker.workerId) ?? worker;
    return {
      record: this.buildRecord(
        input,
        normalized,
        fresh,
        accessStatus,
        reason,
        capabilitiesInspected,
        validationStatus,
      ),
      workers: this.directory.list(),
    };
  }

  private resolveTarget(input: WorkforceAccessManagerInput): AccessibleWorker | null {
    if (input.workerId?.trim()) {
      return this.directory.get(input.workerId.trim());
    }
    const located = this.directory.locate({
      workerId: input.workerId,
      workerNameHint: input.workerNameHint,
      capabilityHints: input.capabilityHints,
    });
    return located[0] ?? null;
  }

  private denied(
    input: WorkforceAccessManagerInput,
    action: string,
    reason: string,
    validationStatus: ValidationStatus,
    worker?: AccessibleWorker | null,
  ): AccessRecord {
    accessSequence += 1;
    return {
      accessId: `wam-acc-${Date.now()}-${accessSequence}`,
      timestamp: new Date().toISOString(),
      executiveRequest: input.executiveRequest.trim(),
      workerId: worker?.workerId ?? input.workerId?.trim() ?? "unknown",
      workerName: worker?.workerName ?? input.workerNameHint?.trim() ?? "unknown",
      requestedAction: action,
      accessStatus: "denied",
      workerStatus: worker?.runtimeStatus ?? "unknown",
      reason,
      metadataVersion: WAM_METADATA_VERSION,
      accessTraceId: `wam-trace-${Date.now()}-${accessSequence}`,
      capabilitiesInspected: [],
      connectedToPillow: worker?.connectedToPillow ?? false,
      validationStatus,
      neverExecuteWorkerLogic: true,
      neverReplaceWorkerImplementations: true,
      neverPerformOrchestration: true,
      neverMakeStrategicDecisions: true,
      neverOverrideGrandKing: true,
      workerLogicExecuted: false,
      workerImplementationsReplaced: false,
      orchestrationPerformed: false,
      strategicDecisionsMade: false,
      grandKingOverridden: false,
      preserveAccessTraceability: true,
      preserveAuditability: true,
      preserveAccessIntegrity: true,
      structuralSignalOnly: true,
      maskSensitiveValues: true,
    };
  }

  private buildRecord(
    input: WorkforceAccessManagerInput,
    action: string,
    worker: AccessibleWorker,
    accessStatus: AccessStatus,
    reason: string,
    capabilitiesInspected: string[],
    validationStatus: ValidationStatus,
  ): AccessRecord {
    accessSequence += 1;
    return {
      accessId: `wam-acc-${Date.now()}-${accessSequence}`,
      timestamp: new Date().toISOString(),
      executiveRequest: input.executiveRequest.trim(),
      workerId: worker.workerId,
      workerName: worker.workerName,
      requestedAction: action,
      accessStatus,
      workerStatus: worker.runtimeStatus,
      reason,
      metadataVersion: WAM_METADATA_VERSION,
      accessTraceId: `wam-trace-${Date.now()}-${accessSequence}`,
      capabilitiesInspected: [...capabilitiesInspected],
      connectedToPillow: worker.connectedToPillow,
      validationStatus,
      neverExecuteWorkerLogic: true,
      neverReplaceWorkerImplementations: true,
      neverPerformOrchestration: true,
      neverMakeStrategicDecisions: true,
      neverOverrideGrandKing: true,
      workerLogicExecuted: false,
      workerImplementationsReplaced: false,
      orchestrationPerformed: false,
      strategicDecisionsMade: false,
      grandKingOverridden: false,
      preserveAccessTraceability: true,
      preserveAuditability: true,
      preserveAccessIntegrity: true,
      structuralSignalOnly: true,
      maskSensitiveValues: true,
    };
  }
}

export function resetAccessSequenceForTesting() {
  accessSequence = 0;
}

export function isSupportedAction(action: string, supported: string[]): boolean {
  const normalized = normalizeAction(action);
  return supported.includes(normalized) || (EXECUTIVE_ACTIONS as readonly string[]).includes(normalized);
}

function normalizeAction(action: string): string {
  return action.trim().toLowerCase().replace(/\s+/g, "_");
}

function defaultReason(action: string, worker: AccessibleWorker): string {
  return `Executive ${action} applied to ${worker.workerName} (${worker.workerId})`;
}
