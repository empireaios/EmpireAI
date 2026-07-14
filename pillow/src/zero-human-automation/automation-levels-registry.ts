import type { SubsystemAutomationLevel } from "./types.js";

/** Subsystem automation levels (P6-07). */
export const SUBSYSTEM_AUTOMATION_LEVELS: SubsystemAutomationLevel[] = [
  {
    subsystemId: "execution_control_center",
    label: "Execution Control Center",
    currentLevel: "level_3_supervised_autonomous",
    targetLevel: "level_4_constitutional_autonomous",
    upgradeRequirements: ["P6-07 automation pipeline active", "ECC coordination score ≥ 80"],
    safetyConstraints: ["Grand King override always available", "No hidden orchestration"],
  },
  {
    subsystemId: "vision_integrity_engine",
    label: "Vision Integrity Engine",
    currentLevel: "level_3_supervised_autonomous",
    targetLevel: "level_4_constitutional_autonomous",
    upgradeRequirements: ["Vision sync continuous", "Integrity gate on all missions"],
    safetyConstraints: ["Stop on vision conflict", "Escalate irreversible drift"],
  },
  {
    subsystemId: "cursor_supervisor",
    label: "Supervisor System",
    currentLevel: "level_3_supervised_autonomous",
    targetLevel: "level_4_constitutional_autonomous",
    upgradeRequirements: ["Builder Monitor attached", "Recovery doctrine ready"],
    safetyConstraints: ["Supervisor observes — does not execute", "Escalate blocked missions"],
  },
  {
    subsystemId: "builder_monitor",
    label: "Builder Monitor",
    currentLevel: "level_3_supervised_autonomous",
    targetLevel: "level_4_constitutional_autonomous",
    upgradeRequirements: ["Continuous telemetry", "Supervisor interrogation active"],
    safetyConstraints: ["Near real-time observability required"],
  },
  {
    subsystemId: "eta_engine",
    label: "ETA Engine",
    currentLevel: "level_3_supervised_autonomous",
    targetLevel: "level_4_constitutional_autonomous",
    upgradeRequirements: ["Builder + Supervisor evidence synced"],
    safetyConstraints: ["Confidence threshold before scheduling decisions"],
  },
  {
    subsystemId: "autonomous_recovery_engine",
    label: "Autonomous Recovery",
    currentLevel: "level_3_supervised_autonomous",
    targetLevel: "level_4_constitutional_autonomous",
    upgradeRequirements: ["Recovery confidence ≥ threshold", "Constitutional safety validated"],
    safetyConstraints: ["No irreversible rollback without Grand King", "Escalation chain preserved"],
  },
  {
    subsystemId: "guardian_monitoring",
    label: "Guardian Monitoring",
    currentLevel: "level_2_semi_autonomous",
    targetLevel: "level_3_supervised_autonomous",
    upgradeRequirements: ["Alert thresholds tuned", "ECC integration complete"],
    safetyConstraints: ["Stop automation on critical alerts"],
  },
  {
    subsystemId: "cursor_bridge",
    label: "Builder (Cursor Bridge)",
    currentLevel: "level_2_semi_autonomous",
    targetLevel: "level_3_supervised_autonomous",
    upgradeRequirements: ["Mission preamble chain complete", "Validation pipeline pass"],
    safetyConstraints: ["Grand King approval for production deploy", "Dry-run default in production"],
  },
  {
    subsystemId: "mission_planner",
    label: "Mission Generation",
    currentLevel: "level_2_semi_autonomous",
    targetLevel: "level_3_supervised_autonomous",
    upgradeRequirements: ["Repository intelligence fresh", "Journey aligned"],
    safetyConstraints: ["Constitutional mission candidates only"],
  },
  {
    subsystemId: "journey_system",
    label: "Journey",
    currentLevel: "level_2_semi_autonomous",
    targetLevel: "level_3_supervised_autonomous",
    upgradeRequirements: ["Journey sync on structural changes"],
    safetyConstraints: ["Record all automation journeys"],
  },
];

export function aggregateAutomationLevel(): import("./types.js").AutomationLevel {
  const levels = SUBSYSTEM_AUTOMATION_LEVELS.map((s) => s.currentLevel);
  if (levels.every((l) => l === "level_4_constitutional_autonomous")) {
    return "level_4_constitutional_autonomous";
  }
  if (levels.some((l) => l === "level_3_supervised_autonomous")) {
    return "level_3_supervised_autonomous";
  }
  if (levels.some((l) => l === "level_2_semi_autonomous")) {
    return "level_2_semi_autonomous";
  }
  if (levels.some((l) => l === "level_1_assisted")) {
    return "level_1_assisted";
  }
  return "level_0_manual";
}
