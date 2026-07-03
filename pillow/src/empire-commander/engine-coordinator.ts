import type { EmpireCommanderDeps, EngineCoordinationPlan, EnginePriority } from "./types.js";

const ENGINE_CATALOG: Array<{ id: string; label: string; basePriority: number }> = [
  { id: "infrastructure_commander", label: "Infrastructure Commander", basePriority: 95 },
  { id: "technical_chief", label: "Technical Chief", basePriority: 90 },
  { id: "recovery_manager", label: "Recovery Manager", basePriority: 88 },
  { id: "cursor_bridge", label: "Autonomous Cursor Bridge", basePriority: 85 },
  { id: "commerce_intelligence", label: "Commerce Intelligence", basePriority: 80 },
  { id: "ux_designer", label: "AI UX Designer", basePriority: 75 },
  { id: "mission_planner", label: "Mission Planner", basePriority: 70 },
  { id: "due_diligence", label: "Continuous Due Diligence", basePriority: 65 },
  { id: "autonomous_improvement", label: "Autonomous Improvement", basePriority: 60 },
  { id: "empire_commander", label: "Empire Commander", basePriority: 55 },
];

export function coordinateEngines(deps: EmpireCommanderDeps): EngineCoordinationPlan {
  const subsystems = deps.orchestrator?.getSubsystems() ?? [];
  const healthById = new Map(subsystems.map((s) => [s.id, s.health]));

  const priorities: EnginePriority[] = ENGINE_CATALOG.map((engine) => {
    const health = healthById.get(engine.id as import("../orchestrator/types.js").SubsystemId);
    const status =
      health === "ready" ? "ready" as const :
      health === "degraded" ? "degraded" as const :
      health === "unavailable" ? "blocked" as const :
      "ready" as const;

    return {
      engineId: engine.id,
      label: engine.label,
      priority: engine.basePriority,
      status,
      dependencyNotes: dependencyNotesFor(engine.id),
    };
  }).sort((a, b) => b.priority - a.priority);

  const conflicts = detectConflicts(deps);
  const deduplicationNotes = [
    "Cursor Bridge consolidates UX + Technical Chief missions — avoid parallel Cursor dispatches",
    "Commerce Intelligence and Mission Planner share launch sequencing — single source of truth via Empire Commander",
    "Infrastructure Commander scans cached between executive reports to prevent probe storms",
  ];
  const scheduledActions = buildScheduledActions(deps, priorities);

  return { priorities, conflicts, deduplicationNotes, scheduledActions };
}

function dependencyNotesFor(engineId: string): string[] {
  const notes: Record<string, string[]> = {
    cursor_bridge: ["Requires Technical Chief diagnosis for failure missions", "Requires UX Designer for design missions"],
    commerce_intelligence: ["Launch plans require Infrastructure Commander readiness"],
    mission_planner: ["Depends on Memory and Intelligence bootstrap chain"],
    empire_commander: ["Coordinates all phase engines — init after orchestrator"],
  };
  return notes[engineId] ?? [];
}

function detectConflicts(deps: EmpireCommanderDeps): string[] {
  const conflicts: string[] = [];
  const snapshot = deps.infrastructureCommander.getLastSnapshot();
  const commerce = deps.commerceIntelligence.analyzeCommerce();

  if (snapshot?.overallHealth === "critical" && commerce.recommendedProducts.length > 0) {
    conflicts.push("Commerce launch ready but infrastructure critical — resolve platform before launch");
  }

  const health = deps.intelligence.health.score;
  if (health < 70 && commerce.recommendedProducts.length > 2) {
    conflicts.push("Multiple commerce opportunities while engineering health degraded — sequence carefully");
  }

  if (deps.orchestrator?.getRuntimeAwareness()?.grandKingPriorityActive) {
    conflicts.push("Grand King priority active — autonomous scheduling suspended");
  }

  return conflicts;
}

function buildScheduledActions(
  deps: EmpireCommanderDeps,
  priorities: EnginePriority[],
): string[] {
  const actions: string[] = [];
  const top = priorities.filter((p) => p.status === "ready").slice(0, 3);

  for (const engine of top) {
    actions.push(`Priority ${engine.priority}: ${engine.label}`);
  }

  if (!deps.infrastructureCommander.getLastSnapshot()) {
    actions.push("Schedule Infrastructure Commander scan");
  }

  actions.push("Run Commerce Intelligence analysis before launch decisions");
  actions.push("Sync Mission Planner with Empire Commander strategic plan");

  return actions.slice(0, 6);
}
