import type { ContextBuilder } from "../context/engine.js";
import type { ContinuousDueDiligenceEngine } from "../due-diligence/engine.js";
import type { MissionPlannerEngine } from "../planner/engine.js";
import type { EmpireAIOrchestrator } from "../orchestrator/engine.js";
import type { LiveRepositoryWatcherEngine } from "../watcher/engine.js";
import type {
  CommandContextAwareness,
  CommandIntent,
  ExecutionPlan,
} from "./types.js";

export interface CoordinationResult {
  summary: string;
  details: string[];
}

export async function coordinateCommand(
  intent: CommandIntent,
  plan: ExecutionPlan,
  awareness: CommandContextAwareness,
  deps: {
    planner: MissionPlannerEngine;
    orchestrator: EmpireAIOrchestrator;
    watcher: LiveRepositoryWatcherEngine;
    dueDiligence: ContinuousDueDiligenceEngine;
    contextBuilder: ContextBuilder;
  },
): Promise<CoordinationResult> {
  const details: string[] = [];

  switch (intent) {
    case "whats_next": {
      const next = deps.planner.determineNextMission();
      details.push(
        next
          ? `Next: ${next.id} — ${next.title} [${next.priority}] readiness=${next.readiness}`
          : "No next mission determined",
      );
      break;
    }
    case "build_next_mission":
    case "generate_cursor_mission": {
      const doc = deps.planner.generateNextMission();
      details.push(
        doc
          ? `Cursor mission generated: ${doc.missionId}`
          : "Mission not ready — dependencies incomplete or blocked",
      );
      break;
    }
    case "review_repository": {
      const obs = await deps.watcher.observe();
      details.push(`Scanned ${obs.scannedPaths} paths · ${obs.batch.events.length} event(s)`);
      details.push(obs.recommendation);
      break;
    }
    case "review_architecture":
    case "review_empire_health": {
      const coord = deps.orchestrator.coordinate({ workflowId: "continuous_due_diligence" });
      details.push(coord.coordination.recommendation);
      details.push(`Health score: ${awareness.repositoryHealthScore}`);
      break;
    }
    case "review_commercial_readiness": {
      const report = await deps.dueDiligence.runAnalysisCycle();
      const commercial = report.recommendations.filter(
        (r) => r.kind === "commercial_opportunity",
      );
      details.push(`${commercial.length} commercial recommendation(s)`);
      details.push(`Blockers: ${awareness.commercialBlockers.join(", ")}`);
      break;
    }
    case "review_progress": {
      details.push(`Journey: ${awareness.journeyPosition ?? "unknown"}`);
      details.push(`Outstanding missions: ${awareness.outstandingMissions}`);
      details.push(`Active engineering: ${awareness.activeEngineeringMissions}`);
      break;
    }
    case "recover_cursor": {
      const coord = deps.orchestrator.coordinate({ workflowId: "recovery" });
      details.push(coord.coordination.recommendation);
      break;
    }
    case "prepare_version_1": {
      details.push("Version 1 requires: Pillow V1 complete · PROOF-001 · GK-GOLIVE-APPROVAL");
      details.push(`Commercial blockers: ${awareness.commercialBlockers.join(", ")}`);
      break;
    }
    case "begin_pillow": {
      details.push("Pillow session operational — Bootstrap through Command Interface ready");
      break;
    }
    case "continue": {
      const next = deps.planner.determineNextMission();
      details.push(next ? `Continuing toward: ${next.id}` : "No queued mission");
      break;
    }
    case "pause_autonomous":
    case "resume_autonomous":
      break;
    default: {
      const ctx = await deps.contextBuilder.build({ userMessage: plan.objective });
      details.push(`Context assembled: ${ctx.manifest.task} · ${ctx.manifest.sliceCount} slices`);
    }
  }

  return {
    summary: `${plan.objective} — coordinated via ${plan.relevantModules.join(", ")}`,
    details,
  };
}

export function composeResponseMessage(
  plan: ExecutionPlan,
  coordination: CoordinationResult,
  awareness: CommandContextAwareness,
): string {
  const lines = [
    coordination.summary,
    "",
    `Journey: ${awareness.journeyPosition ?? "unknown"}`,
    `Repository health: ${awareness.repositoryHealthScore}/100`,
  ];

  if (plan.requiresGrandKingConfirmation) {
    lines.push("", "Grand King confirmation required before execution.");
  }

  if (coordination.details.length > 0) {
    lines.push("", ...coordination.details.map((d) => `• ${d}`));
  }

  lines.push("", "Repository truth governs — conversation does not override Journey.");
  return lines.join("\n");
}
