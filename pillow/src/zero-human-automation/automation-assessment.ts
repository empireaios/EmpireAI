import type {
  ZeroHumanAutomationAnalysis,
  ZeroHumanAutomationMetrics,
  PhaseP6CompletionReview,
} from "./types.js";
import { SUBSYSTEM_AUTOMATION_LEVELS } from "./automation-levels-registry.js";

export function analyzeAutomationQuality(input: {
  metrics: ZeroHumanAutomationMetrics;
  successRate: number;
  safetyStopCount: number;
}): ZeroHumanAutomationAnalysis {
  const { metrics, successRate, safetyStopCount } = input;

  return {
    automationOpportunities: SUBSYSTEM_AUTOMATION_LEVELS.filter(
      (s) => s.currentLevel !== s.targetLevel,
    ).map((s) => `Upgrade ${s.label} from ${s.currentLevel} → ${s.targetLevel}`),
    automationQuality: [
      `Success rate: ${Math.round(successRate * 100)}%`,
      `Readiness: ${metrics.readinessScore}/100`,
    ],
    automationSafety: [
      safetyStopCount > 0
        ? `${safetyStopCount} safety stop(s) active — automation halted where required`
        : "No active safety stops — constitutional gates clear",
    ],
    automationEfficiency: [
      `${metrics.subsystemCount} subsystems under automation governance`,
      `Pipeline: ${metrics.pipelineStages} stages`,
    ],
    automationDrift: [
      metrics.trend === "degrading"
        ? "Automation quality trending down — review subsystem levels"
        : "Automation aligned with constitutional targets",
    ],
    recommendations: [
      successRate < 0.8 ? "Increase observability before raising automation levels" : "Automation within policy",
      "Grand King retains ultimate authority — human override always available",
    ],
  };
}

export function buildPhaseP6CompletionReview(): PhaseP6CompletionReview {
  const items = [
    { id: "P6-01", label: "Execution Control Center (ECC)", status: "complete" as const },
    { id: "P6-02", label: "Vision Integrity Engine (VIE)", status: "complete" as const },
    { id: "P6-03", label: "Supervisor System", status: "complete" as const },
    { id: "P6-04", label: "Builder Monitor", status: "complete" as const },
    { id: "P6-05", label: "ETA Engine", status: "complete" as const },
    { id: "P6-06", label: "Autonomous Recovery", status: "complete" as const },
    { id: "P6-07", label: "Zero-Human Automation", status: "complete" as const },
  ];

  const findings = [
    {
      id: "P6-GAP-001",
      area: "Production blockers",
      classification: "medium" as const,
      summary: "Production browser verification remains Grand King gated per Browser Truth doctrine",
    },
    {
      id: "P6-GAP-002",
      area: "Automation gaps",
      classification: "low" as const,
      summary: "Cursor Bridge at Level 2 — target Level 3 requires sustained validation evidence",
    },
    {
      id: "P6-GAP-003",
      area: "Coordination gaps",
      classification: "low" as const,
      summary: "Guardian at Level 2 — upgrade to Level 3 when alert tuning complete",
    },
  ];

  return {
    complete: items.every((i) => i.status === "complete"),
    items,
    findings,
  };
}
