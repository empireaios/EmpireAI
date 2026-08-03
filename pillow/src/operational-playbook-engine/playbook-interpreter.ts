import { OPBK_METADATA_VERSION } from "./paths.js";
import type {
  ExecutableWorkflow,
  ExecutionStatus,
  OperationalPlaybookEngineInput,
  PlaybookExecutionRecord,
  PlaybookRecord,
  ValidationStatus,
} from "./types.js";

/** Selects, interprets, and prepares executable playbook workflows. */
export class PlaybookInterpreter {
  select(
    playbooks: PlaybookRecord[],
    input: OperationalPlaybookEngineInput,
  ): { playbook: PlaybookRecord | null; reason: string } {
    const requestedPlaybookId = input.playbookId?.trim();
    if (requestedPlaybookId) {
      const exact = playbooks.find((p) => p.playbookId === requestedPlaybookId && p.active && p.approved);
      if (exact) return { playbook: exact, reason: `Selected by playbookId ${exact.playbookId}` };
    }

    const intent = `${input.intent ?? ""} ${input.nameHint ?? ""}`.toLowerCase();
    const category = input.category?.toString().toLowerCase();
    const scored = playbooks
      .filter((p) => p.active && p.approved)
      .map((playbook) => {
        let score = 0;
        if (category && String(playbook.category).toLowerCase() === category) score += 40;
        if (intent) {
          const hay = `${playbook.name} ${playbook.purpose} ${playbook.category}`.toLowerCase();
          for (const token of intent.split(/\s+/).filter((t) => t.length > 3)) {
            if (hay.includes(token)) score += 8;
          }
        }
        const caps = new Set((input.availableCapabilities ?? []).map((c) => c.toLowerCase()));
        const tools = new Set((input.availableTools ?? []).map((t) => t.toLowerCase()));
        score += playbook.requiredCapabilities.filter((c) => caps.has(c.toLowerCase())).length * 4;
        score += playbook.requiredTools.filter((t) => tools.has(t.toLowerCase())).length * 3;
        return { playbook, score };
      })
      .sort((a, b) => b.score - a.score);

    if (!scored.length || scored[0]!.score <= 0) {
      return { playbook: null, reason: "No approved playbook matched intent/category" };
    }
    return {
      playbook: scored[0]!.playbook,
      reason: `Selected ${scored[0]!.playbook.playbookId} with suitability score ${scored[0]!.score}`,
    };
  }

  validateIntegrity(playbook: PlaybookRecord, supportedCategories: string[]): string[] {
    const errors: string[] = [];
    if (!playbook.playbookId.trim()) errors.push("Playbook ID is required");
    if (!playbook.version.trim()) errors.push("Playbook version is required");
    if (!playbook.name.trim()) errors.push("Playbook name is required");
    if (!playbook.purpose.trim()) errors.push("Playbook purpose is required");
    if (!playbook.executionSteps.length) errors.push("Playbook must include execution steps");
    if (!playbook.approved) errors.push("Playbook must be approved");
    if (!supportedCategories.includes(String(playbook.category)) && supportedCategories.length > 0) {
      // Extensible categories are allowed when explicitly registered in supportedCategories.
      if (!playbook.category) errors.push("Playbook category is required");
    }
    const orders = playbook.executionSteps.map((s) => s.order);
    if (new Set(orders).size !== orders.length) errors.push("Execution step order values must be unique");
    return errors;
  }

  validatePrerequisites(playbook: PlaybookRecord, input: OperationalPlaybookEngineInput): string[] {
    const blocked: string[] = [];
    const caps = new Set((input.availableCapabilities ?? playbook.requiredCapabilities).map((c) => c.toLowerCase()));
    const tools = new Set((input.availableTools ?? playbook.requiredTools).map((t) => t.toLowerCase()));
    const approvals = new Set((input.approvalsPresent ?? playbook.approvalRequirements).map((a) => a.toLowerCase()));

    for (const capability of playbook.requiredCapabilities) {
      if (!caps.has(capability.toLowerCase())) blocked.push(`missing_capability:${capability}`);
    }
    for (const tool of playbook.requiredTools) {
      if (!tools.has(tool.toLowerCase())) blocked.push(`missing_tool:${tool}`);
    }
    for (const approval of playbook.approvalRequirements) {
      if (!approvals.has(approval.toLowerCase())) blocked.push(`missing_approval:${approval}`);
    }
    return blocked;
  }

  prepareWorkflow(playbook: PlaybookRecord, input: OperationalPlaybookEngineInput): ExecutableWorkflow {
    const blockedReasons = this.validatePrerequisites(playbook, {
      ...input,
      availableCapabilities: input.availableCapabilities ?? playbook.requiredCapabilities,
      availableTools: input.availableTools ?? playbook.requiredTools,
      approvalsPresent: input.approvalsPresent ?? playbook.approvalRequirements,
    });
    return {
      workflowId: `opbk-wf-${Date.now()}-${++workflowSequence}`,
      playbookId: playbook.playbookId,
      playbookVersion: playbook.version,
      category: String(playbook.category),
      prerequisitesSatisfied: blockedReasons.length === 0,
      blockedReasons,
      steps: playbook.executionSteps.map((step) => ({
        stepId: step.stepId,
        order: step.order,
        action: step.action,
        requiredCapability: step.requiredCapability ?? null,
        requiredTool: step.requiredTool ?? null,
        status: (blockedReasons.length ? "blocked" : "prepared") as ExecutionStatus,
        notes: step.notes ?? "Interpreted for workforce coordination; worker tasks not executed",
      })),
    };
  }

  buildExecutionRecord(
    playbook: PlaybookRecord,
    workflow: ExecutableWorkflow,
    input: OperationalPlaybookEngineInput,
    selectionReason: string,
    integrityValid: boolean,
    validationStatus: ValidationStatus,
  ): PlaybookExecutionRecord {
    executionSequence += 1;
    const prerequisitesValid = workflow.prerequisitesSatisfied;
    const status: ExecutionStatus = !integrityValid
      ? "failed"
      : !prerequisitesValid
        ? "blocked"
        : "prepared";
    return {
      executionId: `opbk-exec-${Date.now()}-${executionSequence}`,
      timestamp: new Date().toISOString(),
      playbookId: playbook.playbookId,
      playbookVersion: playbook.version,
      category: String(playbook.category),
      name: playbook.name,
      intent: input.intent?.trim() || playbook.purpose,
      status,
      currentStepId: workflow.steps[0]?.stepId ?? null,
      completedStepIds: [],
      workflow: {
        ...workflow,
        steps: workflow.steps.map((s) => ({ ...s })),
        blockedReasons: [...workflow.blockedReasons],
      },
      selectionReason,
      integrityValid,
      prerequisitesValid,
      confidenceScore: Math.max(
        0,
        Math.min(100, 70 + (integrityValid ? 15 : 0) + (prerequisitesValid ? 15 : -20)),
      ),
      metadataVersion: OPBK_METADATA_VERSION,
      executionTraceId: `opbk-trace-${Date.now()}-${executionSequence}`,
      validationStatus,
      neverExecuteWorkerTasks: true,
      neverReplaceWorkers: true,
      neverReplaceWorkforceOrchestrator: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      workerTasksExecuted: false,
      workersReplaced: false,
      workforceOrchestratorReplaced: false,
      pillowOverridden: false,
      grandKingOverridden: false,
      preservePlaybookTraceability: true,
      preserveAuditability: true,
      structuralSignalOnly: true,
      maskSensitiveValues: true,
    };
  }

  trackProgress(
    record: PlaybookExecutionRecord,
    progressStepId?: string | null,
    progressStatus?: string | null,
  ): PlaybookExecutionRecord {
    const stepId = progressStepId?.trim() || record.currentStepId;
    const nextStatus = normalizeExecutionStatus(progressStatus) ?? "in_progress";
    const steps = record.workflow.steps.map((step) =>
      step.stepId === stepId ? { ...step, status: nextStatus } : { ...step },
    );
    const completedStepIds = steps.filter((s) => s.status === "completed").map((s) => s.stepId);
    const allCompleted = steps.length > 0 && steps.every((s) => s.status === "completed");
    const anyFailed = steps.some((s) => s.status === "failed" || s.status === "blocked");
    const current =
      steps.find((s) => s.stepId === stepId) ??
      steps.find((s) => s.status === "in_progress" || s.status === "prepared") ??
      steps[steps.length - 1] ??
      null;

    return {
      ...record,
      timestamp: new Date().toISOString(),
      status: allCompleted ? "completed" : anyFailed ? (nextStatus === "failed" ? "failed" : "blocked") : "in_progress",
      currentStepId: current?.stepId ?? null,
      completedStepIds,
      workflow: {
        ...record.workflow,
        steps,
        blockedReasons: [...record.workflow.blockedReasons],
      },
      workerTasksExecuted: false,
    };
  }
}

let workflowSequence = 0;
let executionSequence = 0;

export function resetPlaybookSequencesForTesting() {
  workflowSequence = 0;
  executionSequence = 0;
}

function normalizeExecutionStatus(value?: string | null): ExecutionStatus | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase().replace(/\s+/g, "_");
  const allowed = ["prepared", "prerequisites_met", "in_progress", "blocked", "completed", "failed"] as const;
  return (allowed as readonly string[]).includes(normalized) ? (normalized as ExecutionStatus) : null;
}
