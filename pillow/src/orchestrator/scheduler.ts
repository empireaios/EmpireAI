import type { PillowSubsystemBundle } from "./subsystem-registry.js";
import type {
  RuntimeAwareness,
  ScheduledWorkItem,
  SchedulingResult,
  SubsystemEntry,
  WorkerEntry,
  WorkflowId,
} from "./types.js";
import { WORKFLOW_CATALOG } from "./workflows.js";

const PRIORITY_WEIGHT: Record<string, number> = {
  critical: 100,
  high: 75,
  normal: 50,
  low: 25,
  future: 10,
};

export function scheduleWork(
  bundle: PillowSubsystemBundle,
  subsystems: SubsystemEntry[],
  workers: WorkerEntry[],
  options: {
    grandKingOverride?: boolean;
    maxItems?: number;
  } = {},
): SchedulingResult {
  const max = options.maxItems ?? 10;
  const queue: ScheduledWorkItem[] = [];
  bundle.memory.ensureFresh();
  const mem = bundle.memory.getMemory();
  const next = bundle.planner.determineNextMission();

  if (next && !options.grandKingOverride) {
    queue.push({
      id: next.id,
      label: next.title,
      priority: PRIORITY_WEIGHT[next.priority] ?? 50,
      workflowId: "engineering",
      reason: "Next Pillow Part 7 mission from repository state",
      blocked: next.readiness !== "ready" || next.blockedBy.length > 0,
    });
  }

  if (!mem.consistency.synchronized) {
    queue.push({
      id: "sync-pending",
      label: "Repository synchronization",
      priority: 80,
      workflowId: "repository_synchronization",
      reason: "Repository drift detected — sync before governance mutations",
      blocked: false,
    });
  }

  const cursor = workers.find((w) => w.id === "cursor");
  if (cursor?.availability === "available" && next?.readiness === "ready") {
    queue.push({
      id: `engineer-${next?.id ?? "next"}`,
      label: "Engineering pipeline",
      priority: (PRIORITY_WEIGHT[next?.priority ?? "normal"] ?? 50) + 5,
      workflowId: "engineering",
      reason: "Cursor worker available — coordinate engineering pipeline",
      blocked: false,
    });
  }

  if (!options.grandKingOverride) {
    queue.push({
      id: "due-diligence-idle",
      label: "Continuous Due Diligence cycle",
      priority: 20,
      workflowId: "continuous_due_diligence",
      reason: "Idle autonomous analysis per BL-C",
      blocked: subsystems.find((s) => s.id === "due_diligence")?.health === "degraded",
    });
  }

  queue.sort((a, b) => b.priority - a.priority);

  return {
    scheduledAt: new Date().toISOString(),
    queue: queue.slice(0, max),
    grandKingOverride: options.grandKingOverride ?? false,
  };
}

export function collectRuntimeAwareness(
  bundle: PillowSubsystemBundle,
  subsystems: SubsystemEntry[],
  workers: WorkerEntry[],
  grandKingPriorityActive: boolean,
): RuntimeAwareness {
  bundle.memory.ensureFresh();
  const mem = bundle.memory.getMemory();
  const supervisorState = bundle.supervisor.getState();
  const recoveryState = bundle.recovery.getState();
  const syncState = bundle.synchronizer.getState();
  const auditState = bundle.auditReviewer.getState();

  const subsystemHealth = Object.fromEntries(
    subsystems.map((s) => [s.id, s.health]),
  ) as RuntimeAwareness["subsystemHealth"];

  const workerAvailability = Object.fromEntries(
    workers.map((w) => [w.id, w.availability]),
  ) as RuntimeAwareness["workerAvailability"];

  const registry = supervisorState.registry;

  return {
    activeMissions: registry.activeMission ? 1 : 0,
    queuedMissions: registry.queued.length,
    workerAvailability,
    repositoryHealthScore: mem.domains.repositoryHealth.value.score,
    journeyPosition: bundle.bootstrap.journeyPosition ?? null,
    currentMission: bundle.bootstrap.currentMission ?? null,
    recoveryStatus: recoveryState.status,
    synchronizationStatus: syncState.status,
    executiveAuditStatus: auditState.status,
    subsystemHealth,
    grandKingPriorityActive,
  };
}

export function workflowLabel(id: WorkflowId): string {
  return WORKFLOW_CATALOG.find((w) => w.id === id)?.label ?? id;
}
