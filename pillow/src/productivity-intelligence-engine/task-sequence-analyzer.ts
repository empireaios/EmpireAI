/** T5-04 — Task execution sequence learning from T1 interaction and context awareness. */

import type { ObservationRecord } from "../continuous-screen-observation-engine/types.js";
import type { ProductivityIntelligenceEngineBundle, RawProductivityCandidate } from "./types.js";

export class TaskSequenceAnalyzer {
  analyze(input: {
    engines: ProductivityIntelligenceEngineBundle;
    observation: ObservationRecord | null;
  }): RawProductivityCandidate[] {
    const candidates: RawProductivityCandidate[] = [];

    try {
      const tracking = input.engines.interactionTracking?.getState();
      const events = tracking?.recentEvents ?? [];
      if (events.length >= 2) {
        const sequence = events
          .slice(-5)
          .map((e) => e.interactionType)
          .join(" → ");
        candidates.push({
          productivityObservations: ["task_completion_flow", "workflow_pattern"],
          workflowPatternSummary: "Recurring task execution sequence identified",
          navigationPatternSummary: "Task sequence spans current workspace context",
          taskSequenceSummary: `Sequence: ${sequence}`,
          bottleneckSummary:
            events.length > 8 ? "Long interaction chain may indicate task complexity" : "Compact task sequence",
          evidenceReferences: events.slice(-5).map((e) => `interaction:${e.eventId}`),
          confidenceScore: events[events.length - 1]!.confidence,
          impactScore: events.length > 8 ? 0.72 : 0.58,
          sourceEngine: "PILLOW-ITE-001",
          sourceObservationId: input.observation?.observationId ?? null,
        });
      }
    } catch {
      /* interaction tracking unavailable */
    }

    try {
      const context = input.engines.contextAwareness?.getState();
      const latest = context?.latestContext;
      if (latest?.currentUserTask) {
        candidates.push({
          productivityObservations: ["task_completion_flow", "workspace_usage"],
          workflowPatternSummary: `User task: ${latest.currentUserTask}`,
          navigationPatternSummary: `Active screen: ${latest.currentScreenId ?? "unknown"}`,
          taskSequenceSummary: `Workflow ${latest.currentWorkflowName ?? "unknown"} · stage ${latest.currentWorkflowStage ?? "unknown"}`,
          bottleneckSummary: latest.waitingOrLoading
            ? "Task blocked by loading/waiting state"
            : "Task progressing without blocking states",
          evidenceReferences: [`context:${latest.contextId}`],
          confidenceScore: latest.confidence,
          impactScore: latest.waitingOrLoading ? 0.75 : 0.6,
          sourceEngine: "PILLOW-CAE-001",
          sourceObservationId: input.observation?.observationId ?? null,
        });
      }
    } catch {
      /* context awareness unavailable */
    }

    return candidates;
  }
}
