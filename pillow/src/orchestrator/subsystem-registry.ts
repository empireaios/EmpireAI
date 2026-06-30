import type { ContextBuilder } from "../context/engine.js";
import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import type { RepositoryIntelligenceContext } from "../intelligence/types.js";
import type { RepositoryMemoryEngine } from "../memory/engine.js";
import type { MissionPlannerEngine } from "../planner/engine.js";
import type { CursorSupervisorEngine } from "../supervisor/engine.js";
import type { RecoveryManagerEngine } from "../recovery/engine.js";
import type { ExecutiveAuditReviewerEngine } from "../audit-reviewer/engine.js";
import type { RepositorySynchronizerEngine } from "../synchronizer/engine.js";
import type { ContinuousDueDiligenceEngine } from "../due-diligence/engine.js";
import type { AutonomousImprovementEngine } from "../improvement/engine.js";
import type { LiveRepositoryWatcherEngine } from "../watcher/engine.js";
import type { GrandKingCommandInterface } from "../command/engine.js";
import type { ObjectiveEngine } from "../objective/engine.js";
import type { AutonomousRuntimeOrchestrator } from "../objective/autonomous-runtime-orchestrator.js";
import type { SubsystemEntry, SubsystemHealth, SubsystemId } from "./types.js";

export interface PillowSubsystemBundle {
  bootstrap: EmpireBootstrapContext;
  intelligence: RepositoryIntelligenceContext;
  contextBuilder: ContextBuilder;
  memory: RepositoryMemoryEngine;
  planner: MissionPlannerEngine;
  supervisor: CursorSupervisorEngine;
  recovery: RecoveryManagerEngine;
  auditReviewer: ExecutiveAuditReviewerEngine;
  synchronizer: RepositorySynchronizerEngine;
  dueDiligence: ContinuousDueDiligenceEngine;
  improvement: AutonomousImprovementEngine;
  watcher?: LiveRepositoryWatcherEngine;
  command?: GrandKingCommandInterface;
  objective?: ObjectiveEngine;
  autonomousRuntime?: AutonomousRuntimeOrchestrator;
}

interface SubsystemDescriptor {
  id: SubsystemId;
  label: string;
  missionId: string | null;
  runtimePath: string | null;
  probe: (bundle: PillowSubsystemBundle) => SubsystemHealth;
}

const SUBSYSTEM_DESCRIPTORS: SubsystemDescriptor[] = [
  {
    id: "bootstrap",
    label: "Repository Bootstrap Engine",
    missionId: "PILLOW-002",
    runtimePath: "pillow/src/bootstrap/",
    probe: () => "ready",
  },
  {
    id: "intelligence",
    label: "Repository Intelligence Engine",
    missionId: "PILLOW-003",
    runtimePath: "pillow/src/intelligence/",
    probe: (b) => (b.intelligence.entities.length > 0 ? "ready" : "degraded"),
  },
  {
    id: "context_builder",
    label: "Context Builder",
    missionId: "PILLOW-004",
    runtimePath: "pillow/src/context/",
    probe: () => "ready",
  },
  {
    id: "memory",
    label: "Repository Memory Engine",
    missionId: "PILLOW-005",
    runtimePath: "pillow/src/memory/",
    probe: (b) => {
      try {
        const mem = b.memory.getMemory();
        return mem.status === "ready" ? "ready" : "degraded";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "mission_planner",
    label: "Mission Planner",
    missionId: "PILLOW-006",
    runtimePath: "pillow/src/planner/",
    probe: (b) => {
      try {
        b.planner.getPlan();
        return "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "cursor_supervisor",
    label: "Cursor Supervisor",
    missionId: "PILLOW-007",
    runtimePath: "pillow/src/supervisor/",
    probe: (b) => {
      try {
        b.supervisor.getState();
        return "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "recovery_manager",
    label: "Recovery Manager",
    missionId: "PILLOW-008",
    runtimePath: "pillow/src/recovery/",
    probe: (b) => {
      try {
        b.recovery.getState();
        return "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "executive_audit_reviewer",
    label: "Executive Audit Reviewer",
    missionId: "PILLOW-009",
    runtimePath: "pillow/src/audit-reviewer/",
    probe: (b) => {
      try {
        b.auditReviewer.getState();
        return "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "repository_synchronizer",
    label: "Repository Synchronizer",
    missionId: "PILLOW-010",
    runtimePath: "pillow/src/synchronizer/",
    probe: (b) => {
      try {
        b.synchronizer.getState();
        return "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "due_diligence",
    label: "Continuous Due Diligence Engine",
    missionId: "PILLOW-011",
    runtimePath: "pillow/src/due-diligence/",
    probe: (b) => {
      try {
        const s = b.dueDiligence.getState();
        return s.interrupted ? "degraded" : "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "autonomous_improvement",
    label: "Autonomous Improvement Engine",
    missionId: "PILLOW-012",
    runtimePath: "pillow/src/improvement/",
    probe: (b) => {
      try {
        b.improvement.getState();
        return "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "live_repository_watcher",
    label: "Live Repository Watcher",
    missionId: "PILLOW-014",
    runtimePath: "pillow/src/watcher/",
    probe: (b) => {
      if (!b.watcher) return "unavailable";
      try {
        b.watcher.getState();
        return "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "grand_king_command_interface",
    label: "Grand King Command Interface",
    missionId: "PILLOW-015",
    runtimePath: "pillow/src/command/",
    probe: (b) => {
      if (!b.command) return "unavailable";
      try {
        b.command.getState();
        return "ready";
      } catch {
        return "unavailable";
      }
    },
  },
  {
    id: "objective_engine",
    label: "Objective-Driven Runtime Orchestrator",
    missionId: "PILLOW-019",
    runtimePath: "pillow/src/objective/",
    probe: (b) => {
      if (!b.objective) return "unavailable";
      try {
        b.objective.getState();
        return "ready";
      } catch {
        return "unavailable";
      }
    },
  },
];

export function discoverSubsystems(
  bundle: PillowSubsystemBundle,
): SubsystemEntry[] {
  const now = new Date().toISOString();
  return SUBSYSTEM_DESCRIPTORS.map((d) => ({
    id: d.id,
    label: d.label,
    missionId: d.missionId,
    health: d.probe(bundle),
    runtimePath: d.runtimePath,
    discoveredAt: now,
  }));
}

export function getSubsystemById(
  registry: SubsystemEntry[],
  id: SubsystemId,
): SubsystemEntry | undefined {
  return registry.find((s) => s.id === id);
}
