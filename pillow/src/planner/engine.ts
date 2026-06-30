import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import type { RepositoryIntelligenceContext } from "../intelligence/types.js";
import type { RepositoryMemoryEngine } from "../memory/engine.js";
import { generateCursorMission } from "./generator.js";
import { buildMissionPlan } from "./sequencer.js";
import type {
  CursorMissionDocument,
  MissionPlan,
  MissionPlannerOptions,
} from "./types.js";

/**
 * Mission Planner (PILLOW-006).
 * Strategic planning engine — repository-derived mission sequencing and generation.
 */
export class MissionPlannerEngine {
  private plan: MissionPlan | null = null;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    private intelligence: RepositoryIntelligenceContext,
    private memory: RepositoryMemoryEngine,
    private options: MissionPlannerOptions = {},
  ) {}

  /** Initialize plan after Memory is ready (PILLOW-006). */
  initialize(): MissionPlan {
    this.memory.ensureFresh();
    this.plan = buildMissionPlan(
      this.bootstrap,
      this.intelligence,
      this.memory.getMemory(),
    );
    return this.plan;
  }

  /** Rebuild plan from current repository memory. */
  refresh(): MissionPlan {
    this.memory.ensureFresh();
    this.plan = buildMissionPlan(
      this.bootstrap,
      this.intelligence,
      this.memory.getMemory(),
    );
    return this.plan;
  }

  getPlan(): MissionPlan {
    if (!this.plan) {
      throw new Error("Mission Planner not initialized. Call initialize() first.");
    }
    return this.plan;
  }

  /** Determine the correct next mission from repository state. */
  determineNextMission(): MissionPlan["nextMission"] {
    const plan = this.refresh();
    if (this.options.forceMissionId) {
      return (
        plan.queue.find((c) => c.id === this.options.forceMissionId) ??
        plan.nextMission
      );
    }
    return plan.nextMission;
  }

  /**
   * Generate a Cursor-ready mission for the next repository-valid mission.
   * Returns null if mandatory dependencies are incomplete.
   */
  generateNextMission(): CursorMissionDocument | null {
    const next = this.determineNextMission();
    if (!next) return null;
    if (next.readiness !== "ready") return null;
    if (next.blockedBy.length > 0) return null;
    return generateCursorMission(next);
  }

  /** Generate Cursor-ready mission for a specific candidate id when ready. */
  generateMission(missionId: string): CursorMissionDocument | null {
    const plan = this.refresh();
    const candidate = plan.queue.find((c) => c.id === missionId);
    if (!candidate) return null;
    if (candidate.readiness !== "ready" || candidate.blockedBy.length > 0) {
      return null;
    }
    return generateCursorMission(candidate);
  }

  updateSources(
    bootstrap: EmpireBootstrapContext,
    intelligence: RepositoryIntelligenceContext,
    memory: RepositoryMemoryEngine,
  ): MissionPlan {
    this.bootstrap = bootstrap;
    this.intelligence = intelligence;
    this.memory = memory;
    return this.refresh();
  }
}

export function createMissionPlannerEngine(
  bootstrap: EmpireBootstrapContext,
  intelligence: RepositoryIntelligenceContext,
  memory: RepositoryMemoryEngine,
  options?: MissionPlannerOptions,
): MissionPlannerEngine {
  const engine = new MissionPlannerEngine(
    bootstrap,
    intelligence,
    memory,
    options,
  );
  engine.initialize();
  return engine;
}

export { buildMissionPlan, generateCursorMission };
