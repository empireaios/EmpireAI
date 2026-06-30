import type { PillowSubsystemBundle } from "./subsystem-registry.js";
import type {
  CoordinatedStep,
  SubsystemEntry,
  WorkflowCoordinationResult,
  WorkflowId,
  WorkflowStepStatus,
} from "./types.js";
import { getWorkflow } from "./workflows.js";

export function coordinateWorkflowSteps(
  workflowId: WorkflowId,
  subsystems: SubsystemEntry[],
  bundle: PillowSubsystemBundle,
): CoordinatedStep[] {
  const workflow = getWorkflow(workflowId);
  const healthMap = new Map(subsystems.map((s) => [s.id, s.health]));

  return workflow.steps.map((step) => {
    const health = healthMap.get(step.subsystemId) ?? "unavailable";
    let status: WorkflowStepStatus;
    let notes: string | undefined;

    if (health === "deferred") {
      status = step.optional ? "skipped" : "blocked";
      notes = "Subsystem deferred — future mission";
    } else if (health === "unavailable") {
      status = "blocked";
      notes = "Subsystem unavailable";
    } else if (health === "degraded") {
      status = step.optional ? "skipped" : "delegated";
      notes = "Subsystem degraded — coordinate with caution";
    } else {
      status = "delegated";
    }

    if (step.subsystemId === "memory" && status === "delegated") {
      bundle.memory.ensureFresh();
      status = "completed";
      notes = "Memory refresh coordinated";
    }

    if (
      step.subsystemId === "mission_planner" &&
      status === "delegated" &&
      workflowId === "engineering"
    ) {
      const next = bundle.planner.determineNextMission();
      notes = next ? `Next mission: ${next.id}` : "No next mission determined";
    }

    return {
      step,
      status,
      delegatedTo: step.subsystemId,
      notes,
    };
  });
}

export function buildCoordinationResult(
  workflowId: WorkflowId,
  steps: CoordinatedStep[],
  startedMs: number,
): WorkflowCoordinationResult {
  const blocked = steps.some(
    (s) => s.status === "blocked" && !s.step.optional,
  );
  const delegated = steps.filter((s) => s.status === "delegated").length;

  return {
    workflowId,
    coordinatedAt: new Date().toISOString(),
    durationMs: Math.round(performance.now() - startedMs),
    steps,
    recommendation: blocked
      ? "Pipeline blocked — resolve subsystem availability before execution"
      : `${delegated} step(s) delegated — Orchestrator coordinates only; specialized modules execute`,
  };
}
