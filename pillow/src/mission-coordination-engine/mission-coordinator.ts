import type { MissionCoordinationEngineConfiguration } from "./configuration.js";
import { MISSION_PHASES } from "./paths.js";
import type {
  ApprovalCheckpoint,
  CompletionStatus,
  MissionCoordinationEngineInput,
  MissionPhase,
  MissionRecord,
  MissionStatus,
  WorkerDependency,
} from "./types.js";

export type CoordinationBundle = {
  missionName: string;
  missionOwner: string;
  businessId: string;
  missionStatus: MissionStatus | string;
  currentPhase: MissionPhase | string;
  assignedWorkers: string[];
  dependencies: WorkerDependency[];
  approvalCheckpoints: ApprovalCheckpoint[];
  progress: number;
  blockers: string[];
  completionStatus: CompletionStatus;
  stalled: boolean;
};

/** Pure mission lifecycle coordination helpers for Q0-25. */
export class MissionCoordinator {
  plan(
    input: MissionCoordinationEngineInput,
    _config: MissionCoordinationEngineConfiguration,
  ): CoordinationBundle {
    const assignedWorkers = unique(input.assignedWorkers ?? []);
    const dependencies = this.buildDependencies(input, assignedWorkers);
    const approvalCheckpoints = this.buildCheckpoints(input);
    const blockers = unique(input.blockers ?? []);
    const unsatisfied = dependencies.filter((d) => !d.satisfied).length > 0;
    const missionStatus: MissionStatus =
      blockers.length || input.forceBlocked
        ? "blocked"
        : unsatisfied
          ? "waiting"
          : "planned";

    return {
      missionName: input.missionName?.trim() || "Untitled Mission",
      missionOwner: input.missionOwner?.trim() || "owner-unspecified",
      businessId: input.businessId?.trim() || "biz-unspecified",
      missionStatus: input.missionStatus?.toString().trim() || missionStatus,
      currentPhase: input.currentPhase?.toString().trim() || "planning",
      assignedWorkers,
      dependencies,
      approvalCheckpoints,
      progress:
        input.progress != null && Number.isFinite(input.progress) ? Number(input.progress) : 0,
      blockers,
      completionStatus: "not_started",
      stalled: input.forceStalled === true,
    };
  }

  nextPhase(current: string, phases: string[] = [...MISSION_PHASES]): MissionPhase | string {
    const idx = phases.indexOf(current);
    if (idx < 0) return phases[0] ?? "planning";
    if (idx >= phases.length - 1) return phases[phases.length - 1]!;
    return phases[idx + 1]!;
  }

  statusForPhase(phase: string, record: MissionRecord): MissionStatus | string {
    if (record.blockers.length > 0) return "blocked";
    switch (phase) {
      case "planning":
        return "planned";
      case "preparation":
        return record.dependencies.every((d) => d.satisfied) ? "ready" : "waiting";
      case "execution":
        return "running";
      case "review":
        return "running";
      case "approval":
        return record.approvalCheckpoints.every((c) => !c.required || c.approved)
          ? "running"
          : "waiting_approval";
      case "completion":
        return "completed";
      case "closure":
        return "completed";
      default:
        return record.missionStatus;
    }
  }

  progressForPhase(phase: string): number {
    const map: Record<string, number> = {
      planning: 10,
      preparation: 25,
      execution: 55,
      review: 70,
      approval: 85,
      completion: 95,
      closure: 100,
    };
    return map[phase] ?? 0;
  }

  completionForPhase(phase: string): CompletionStatus {
    if (phase === "closure") return "closed";
    if (phase === "completion") return "completed";
    if (phase === "planning") return "not_started";
    return "in_progress";
  }

  buildDependencies(
    input: MissionCoordinationEngineInput,
    assignedWorkers: string[],
  ): WorkerDependency[] {
    if (input.dependencies?.length) {
      return input.dependencies.map((d) => {
        const dependsOn = unique(d.dependsOn ?? []);
        const satisfied = dependsOn.every((dep) => assignedWorkers.includes(dep));
        return {
          workerId: d.workerId.trim(),
          dependsOn,
          satisfied,
        };
      });
    }
    return assignedWorkers.map((workerId, index) => ({
      workerId,
      dependsOn: index === 0 ? [] : [assignedWorkers[index - 1]!],
      satisfied: index === 0 || assignedWorkers.includes(assignedWorkers[index - 1]!),
    }));
  }

  buildCheckpoints(input: MissionCoordinationEngineInput): ApprovalCheckpoint[] {
    if (input.approvalCheckpoints?.length) {
      return input.approvalCheckpoints.map((c, index) => ({
        checkpointId: c.checkpointId?.trim() || `cp-${index + 1}`,
        name: c.name.trim(),
        required: c.required !== false,
        approved: false,
        approvedBy: null,
        approvedAt: null,
      }));
    }
    return [
      {
        checkpointId: "cp-executive-approval",
        name: "Executive Approval",
        required: true,
        approved: false,
        approvedBy: null,
        approvedAt: null,
      },
    ];
  }

  refreshDependencies(record: MissionRecord): WorkerDependency[] {
    return record.dependencies.map((d) => ({
      ...d,
      dependsOn: [...d.dependsOn],
      satisfied: d.dependsOn.every((dep) => record.assignedWorkers.includes(dep)),
    }));
  }

  isStalled(
    record: MissionRecord,
    config: MissionCoordinationEngineConfiguration,
    stallIdleMs?: number | null,
  ): boolean {
    if (record.completionStatus === "closed" || record.completionStatus === "completed") {
      return false;
    }
    if (record.missionStatus === "blocked") return false;
    const threshold = stallIdleMs ?? config.stallThresholdMs;
    const age = Date.now() - Date.parse(record.timestamp);
    return Number.isFinite(age) && age >= threshold;
  }
}

function unique(values: string[]) {
  return Array.from(new Set(values.map((v) => v.trim()).filter(Boolean)));
}
