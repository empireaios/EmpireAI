import { PWO_METADATA_VERSION } from "./paths.js";
import type {
  CompletionStatus,
  CoordinationMode,
  EscalationRecord,
  ExecutionStep,
  OrchestrationRecord,
  ValidationStatus,
  WorkerDescriptor,
  WorkerState,
  WorkerStatusEntry,
  WorkforceOrchestratorInput,
} from "./types.js";
import type { WorkforceOrchestratorConfiguration } from "./configuration.js";

let orchestrationSequence = 0;
let escalationSequence = 0;
let stepSequence = 0;

/** Coordinates workers without performing their tasks. */
export class WorkforceCoordinator {
  coordinate(
    input: WorkforceOrchestratorInput,
    discovered: WorkerDescriptor[],
    selected: WorkerDescriptor[],
    configuration: WorkforceOrchestratorConfiguration,
    validationStatus: ValidationStatus,
  ): OrchestrationRecord {
    orchestrationSequence += 1;
    const mode = resolveMode(input, selected, configuration);
    const sequence = buildSequence(selected, mode, input);
    const failure = detectFailure(input);
    const timeout = detectTimeout(input, configuration);
    const escalations = buildEscalations(input, selected, failure, timeout);
    const workerStatus = buildWorkerStatus(selected, sequence, failure, timeout, escalations);
    const completionStatus = resolveCompletion(workerStatus, escalations, failure, timeout);
    const currentProgress = computeProgress(workerStatus, completionStatus);

    return {
      orchestrationId: `pwo-orc-${Date.now()}-${orchestrationSequence}`,
      timestamp: new Date().toISOString(),
      executiveRequest: input.executiveRequest.trim(),
      missionId: input.missionId?.trim() || null,
      workersSelected: selected.map((w) => ({ ...w, capabilities: [...w.capabilities] })),
      executionSequence: sequence,
      workerStatus,
      currentProgress,
      escalations,
      completionStatus,
      metadataVersion: PWO_METADATA_VERSION,
      orchestrationTraceId: `pwo-trace-${Date.now()}-${orchestrationSequence}`,
      coordinationMode: mode,
      discoveredWorkerCount: discovered.length,
      validationStatus,
      neverPerformWorkerTasks: true,
      neverReplaceWorkerLogic: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverPerformStrategicPlanning: true,
      workerTasksPerformed: false,
      workerLogicReplaced: false,
      pillowOverridden: false,
      grandKingOverridden: false,
      strategicPlanningPerformed: false,
      preserveOrchestrationTraceability: true,
      preserveAuditability: true,
      preserveOrchestrationIntegrity: true,
      structuralSignalOnly: true,
      maskSensitiveValues: true,
    };
  }
}

export function resetOrchestrationSequenceForTesting() {
  orchestrationSequence = 0;
  escalationSequence = 0;
  stepSequence = 0;
}

function resolveMode(
  input: WorkforceOrchestratorInput,
  selected: WorkerDescriptor[],
  configuration: WorkforceOrchestratorConfiguration,
): CoordinationMode {
  if (input.coordinationMode) return input.coordinationMode;
  if ((input.escalationHints?.length ?? 0) > 0) return "escalation";
  if ((input.handoffHints?.length ?? 0) > 0) return "handoff";
  if ((input.dependencyHints?.length ?? 0) > 0) return "dependency";
  if (selected.length <= 1) return "single";
  if (selected.length >= 3 && /parallel|simultaneous|concurrent/i.test(input.executiveRequest)) {
    return "parallel";
  }
  return selected.length > 1 ? "multi" : configuration.defaultCoordinationMode;
}

function buildSequence(
  selected: WorkerDescriptor[],
  mode: CoordinationMode,
  input: WorkforceOrchestratorInput,
): ExecutionStep[] {
  if (selected.length === 0) return [];

  if (mode === "parallel") {
    stepSequence += 1;
    return [
      {
        stepId: `pwo-step-${Date.now()}-${stepSequence}`,
        order: 1,
        mode: "parallel",
        workerIds: selected.map((w) => w.workerId),
        dependsOn: [],
        status: "busy",
      },
    ];
  }

  if (mode === "handoff" || (input.handoffHints?.length ?? 0) > 0) {
    return selected.map((worker, index) => {
      stepSequence += 1;
      const prev = index > 0 ? selected[index - 1]!.workerId : null;
      return {
        stepId: `pwo-step-${Date.now()}-${stepSequence}`,
        order: index + 1,
        mode: "handoff" as const,
        workerIds: [worker.workerId],
        dependsOn: prev ? [prev] : [],
        status: index === 0 ? ("busy" as const) : ("waiting" as const),
      };
    });
  }

  // sequential / multi / dependency / single / recovery / escalation default path
  return selected.map((worker, index) => {
    stepSequence += 1;
    const dependsOn =
      mode === "dependency" || (input.dependencyHints?.length ?? 0) > 0
        ? index > 0
          ? [selected[index - 1]!.workerId]
          : []
        : mode === "sequential" || mode === "multi" || mode === "single"
          ? index > 0
            ? [selected[index - 1]!.workerId]
            : []
          : [];
    return {
      stepId: `pwo-step-${Date.now()}-${stepSequence}`,
      order: index + 1,
      mode: "sequential" as const,
      workerIds: [worker.workerId],
      dependsOn,
      status: index === 0 ? ("busy" as const) : ("waiting" as const),
    };
  });
}

function detectFailure(input: WorkforceOrchestratorInput): boolean {
  return (
    (input.failureHints?.length ?? 0) > 0 ||
    /fail|crash|error|unavailable/i.test(input.executiveRequest)
  );
}

function detectTimeout(
  input: WorkforceOrchestratorInput,
  configuration: WorkforceOrchestratorConfiguration,
): boolean {
  const timeout = input.timeoutMsHint ?? configuration.defaultTimeoutMs;
  return (
    /timeout|timed.?out|deadline.?miss/i.test(input.executiveRequest) ||
    (input.timeoutMsHint !== undefined && input.timeoutMsHint <= 0) ||
    (/urgent.?timeout/i.test([...(input.failureHints ?? [])].join(" ")) && timeout < 100)
  );
}

function buildEscalations(
  input: WorkforceOrchestratorInput,
  selected: WorkerDescriptor[],
  failure: boolean,
  timeout: boolean,
): EscalationRecord[] {
  const escalations: EscalationRecord[] = [];
  const target = selected[0];
  if (!target) return escalations;

  const hints = [...(input.escalationHints ?? [])];
  if (failure) hints.push("Worker failure detected during orchestration monitoring");
  if (timeout) hints.push("Worker timeout detected during orchestration monitoring");

  for (const reason of hints) {
    escalationSequence += 1;
    escalations.push({
      escalationId: `pwo-esc-${Date.now()}-${escalationSequence}`,
      workerId: target.workerId,
      reason: reason.trim(),
      timestamp: new Date().toISOString(),
      status: "open",
    });
  }
  return escalations;
}

function buildWorkerStatus(
  selected: WorkerDescriptor[],
  sequence: ExecutionStep[],
  failure: boolean,
  timeout: boolean,
  escalations: EscalationRecord[],
): WorkerStatusEntry[] {
  return selected.map((worker, index) => {
    const escalated = escalations.some((e) => e.workerId === worker.workerId);
    let state: WorkerState = sequence.find((s) => s.workerIds.includes(worker.workerId))?.status ?? "busy";
    let progressPercent = state === "busy" ? 55 : state === "waiting" ? 10 : 0;
    let note = `Orchestrating ${worker.category} worker without performing task logic`;

    if (index === 0 && failure) {
      state = "failed";
      progressPercent = 35;
      note = "Worker failure detected — orchestration recorded failure without executing work";
    } else if (index === 0 && timeout) {
      state = "blocked";
      progressPercent = 40;
      note = "Worker timeout detected — orchestration blocked pending recovery/escalation";
    } else if (escalated && state !== "failed") {
      state = "escalated";
      progressPercent = Math.max(progressPercent, 45);
      note = "Worker escalated to executive governance path";
    } else if (!failure && !timeout && !escalated && index === selected.length - 1 && selected.length === 1) {
      state = "completed";
      progressPercent = 100;
      note = "Single-worker orchestration sequence completed (status only)";
    } else if (!failure && !timeout && !escalated && state === "busy" && selected.length > 1 && index === 0) {
      state = "completed";
      progressPercent = 100;
      note = "Lead worker handoff/sequence step marked complete for coordination tracking";
      if (selected[1]) {
        /* trailing workers remain waiting/busy via sequence */
      }
    }

    return {
      workerId: worker.workerId,
      category: worker.category,
      state,
      progressPercent,
      note,
    };
  });
}

function resolveCompletion(
  workerStatus: WorkerStatusEntry[],
  escalations: EscalationRecord[],
  failure: boolean,
  timeout: boolean,
): CompletionStatus {
  if (timeout) return "timed_out";
  if (failure || workerStatus.some((w) => w.state === "failed")) return "failed";
  if (escalations.length > 0 || workerStatus.some((w) => w.state === "escalated")) return "escalated";
  if (workerStatus.every((w) => w.state === "completed")) return "completed";
  if (workerStatus.some((w) => w.state === "completed") && workerStatus.some((w) => w.state === "waiting" || w.state === "busy")) {
    return "in_progress";
  }
  if (workerStatus.some((w) => w.state === "busy" || w.state === "waiting")) return "in_progress";
  return "partial";
}

function computeProgress(workerStatus: WorkerStatusEntry[], completion: CompletionStatus): number {
  if (completion === "completed") return 100;
  if (workerStatus.length === 0) return 0;
  const avg = workerStatus.reduce((sum, w) => sum + w.progressPercent, 0) / workerStatus.length;
  return Math.max(0, Math.min(100, Math.round(avg)));
}
