import type { MissionPlannerEngine } from "../planner/engine.js";
import type {
  CommandCategory,
  CommandContextAwareness,
  CommandIntent,
  ExecutionPlan,
  ExecutionPlanStep,
} from "./types.js";

const MODULE_MAP: Record<CommandIntent, string[]> = {
  continue: ["mission_planner", "cursor_supervisor"],
  whats_next: ["repository_memory", "mission_planner"],
  build_next_mission: ["mission_planner", "cursor_supervisor"],
  review_repository: ["live_repository_watcher", "repository_intelligence"],
  review_progress: ["repository_memory", "mission_planner"],
  recover_cursor: ["cursor_supervisor", "recovery_manager"],
  review_architecture: ["repository_intelligence", "continuous_due_diligence"],
  review_empire_health: ["repository_memory", "empire_ai_orchestrator"],
  generate_cursor_mission: ["mission_planner", "context_builder"],
  review_commercial_readiness: ["continuous_due_diligence", "mission_planner"],
  prepare_version_1: ["mission_planner", "executive_audit_reviewer"],
  begin_pillow: ["repository_bootstrap", "repository_memory"],
  pause_autonomous: ["empire_ai_orchestrator", "continuous_due_diligence"],
  resume_autonomous: ["empire_ai_orchestrator", "continuous_due_diligence"],
  unknown: ["repository_memory", "empire_ai_orchestrator"],
};

export function buildExecutionPlan(
  intent: CommandIntent,
  category: CommandCategory,
  awareness: CommandContextAwareness,
  planner: MissionPlannerEngine,
): ExecutionPlan {
  const next = planner.determineNextMission();
  const steps = planSteps(intent, awareness, next?.id ?? null);
  const requiresConfirmation = steps.some((s) => s.status === "requires_confirmation");

  const dependencyChecks = [
    {
      id: "BOOTSTRAP",
      label: "Pillow bootstrapped",
      satisfied: true,
    },
    {
      id: "MEMORY",
      label: "Repository memory ready",
      satisfied: awareness.repositoryHealthScore > 0,
    },
    {
      id: "SYNC",
      label: "Repository synchronized",
      satisfied: awareness.repositorySynchronized,
    },
  ];

  if (intent === "build_next_mission" || intent === "generate_cursor_mission") {
    dependencyChecks.push({
      id: "MISSION_READY",
      label: "Next mission dependencies satisfied",
      satisfied: next?.readiness === "ready" && (next?.blockedBy.length ?? 0) === 0,
    });
  }

  return {
    intent,
    category,
    objective: objectiveForIntent(intent, awareness, next?.title ?? null),
    relevantModules: MODULE_MAP[intent],
    dependencyChecks,
    steps,
    requiresGrandKingConfirmation: requiresConfirmation,
    repositoryEvidence: evidenceForIntent(intent, awareness, next?.id ?? null),
  };
}

function planSteps(
  intent: CommandIntent,
  awareness: CommandContextAwareness,
  nextMissionId: string | null,
): ExecutionPlanStep[] {
  const base = (label: string, module: string, status: ExecutionPlanStep["status"]): ExecutionPlanStep => ({
    order: 0,
    label,
    module,
    status,
  });

  switch (intent) {
    case "whats_next":
      return [
        { ...base("Load repository memory", "repository_memory", "coordinated"), order: 1 },
        { ...base("Determine next mission", "mission_planner", "coordinated"), order: 2 },
      ];
    case "build_next_mission":
    case "generate_cursor_mission":
      return [
        { ...base("Verify dependencies", "mission_planner", "coordinated"), order: 1 },
        {
          ...base("Generate Cursor mission document", "mission_planner", "requires_confirmation"),
          order: 2,
        },
        { ...base("Handoff to Cursor Supervisor", "cursor_supervisor", "planned"), order: 3 },
      ];
    case "recover_cursor":
      return [
        { ...base("Inspect mission state", "cursor_supervisor", "coordinated"), order: 1 },
        { ...base("Coordinate recovery strategy", "recovery_manager", "requires_confirmation"), order: 2 },
      ];
    case "review_repository":
      return [
        { ...base("Observe repository changes", "live_repository_watcher", "coordinated"), order: 1 },
        { ...base("Summarize intelligence", "repository_intelligence", "coordinated"), order: 2 },
      ];
    case "pause_autonomous":
      return [
        { ...base("Pause autonomous workflows", "empire_ai_orchestrator", "coordinated"), order: 1 },
        { ...base("Interrupt due diligence", "continuous_due_diligence", "coordinated"), order: 2 },
      ];
    case "resume_autonomous":
      return [
        { ...base("Resume after Grand King command", "empire_ai_orchestrator", "coordinated"), order: 1 },
      ];
    case "review_commercial_readiness":
      return [
        { ...base("Run due diligence analysis", "continuous_due_diligence", "coordinated"), order: 1 },
        { ...base("Report commercial blockers", "mission_planner", "coordinated"), order: 2 },
      ];
    default:
      return [
        {
          ...base(`Execute ${intent.replace(/_/g, " ")}`, "empire_ai_orchestrator", "coordinated"),
          order: 1,
        },
      ];
  }
}

function objectiveForIntent(
  intent: CommandIntent,
  awareness: CommandContextAwareness,
  nextTitle: string | null,
): string {
  switch (intent) {
    case "whats_next":
      return nextTitle
        ? `Determine next action: ${nextTitle}`
        : "Determine next Pillow mission from repository state";
    case "continue":
      return `Continue from ${awareness.currentMission ?? "current position"}`;
    case "pause_autonomous":
      return "Pause autonomous Pillow workflows — Grand King priority";
    case "resume_autonomous":
      return "Resume autonomous workflows after Grand King command";
    case "review_empire_health":
      return `Empire health review — score ${awareness.repositoryHealthScore}`;
    default:
      return `Grand King command: ${intent.replace(/_/g, " ")}`;
  }
}

function evidenceForIntent(
  intent: CommandIntent,
  awareness: CommandContextAwareness,
  nextMissionId: string | null,
): string[] {
  const evidence = [
    `Journey: ${awareness.journeyPosition ?? "unknown"}`,
    `Health score: ${awareness.repositoryHealthScore}`,
    `Current mission: ${awareness.currentMission ?? "none"}`,
  ];
  if (nextMissionId) evidence.push(`Next mission candidate: ${nextMissionId}`);
  if (!awareness.repositorySynchronized) {
    evidence.push("Drift: repository not fully synchronized");
  }
  if (intent === "review_commercial_readiness") {
    evidence.push(`Blockers: ${awareness.commercialBlockers.join(", ")}`);
  }
  return evidence;
}
