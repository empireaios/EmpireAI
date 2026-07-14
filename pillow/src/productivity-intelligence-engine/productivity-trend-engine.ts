/** T5-04 — Productivity trend and interruption pattern analysis. */

import type { OpportunityRecord } from "../ux-opportunity-discovery-engine/types.js";
import type { ObservationRecord } from "../continuous-screen-observation-engine/types.js";
import type { ProductivityIntelligenceEngineBundle, RawProductivityCandidate } from "./types.js";
import { appendProductivityLog } from "./productivity-logging.js";

export class ProductivityTrendEngine {
  analyze(input: {
    engines: ProductivityIntelligenceEngineBundle;
    opportunities: OpportunityRecord[];
    observation: ObservationRecord | null;
  }): RawProductivityCandidate[] {
    const candidates: RawProductivityCandidate[] = [];

    try {
      const ux = input.engines.uxScoring?.getState();
      const record = ux?.latestRecord;
      if (record) {
        const trend =
          record.overallUxScore >= 75
            ? "positive"
            : record.overallUxScore >= 50
              ? "stable"
              : "declining";
        candidates.push({
          productivityObservations: ["productivity_trend", "operational_efficiency"],
          workflowPatternSummary: `UX productivity baseline score: ${record.overallUxScore}`,
          navigationPatternSummary: "Trend reflects holistic workspace experience",
          taskSequenceSummary: `Trend direction: ${trend}`,
          bottleneckSummary:
            trend === "declining"
              ? "Declining UX score may correlate with productivity loss"
              : "Productivity trend within acceptable range",
          evidenceReferences: [`ux-score:${record.uxScoreId}`],
          confidenceScore: 0.7,
          impactScore: trend === "declining" ? 0.75 : 0.5,
          sourceEngine: "PILLOW-UXS-001",
          sourceObservationId: input.observation?.observationId ?? null,
        });
        appendProductivityLog({
          event: "trend_analysis",
          level: "info",
          details: `Productivity trend: ${trend} (score ${record.overallUxScore})`,
        });
      }
    } catch {
      /* ux scoring unavailable */
    }

    if (input.observation?.detectedStateChanges?.length) {
      const interruptions = input.observation.detectedStateChanges.filter(
        (c) => c.startsWith("state_entered:error") || c.startsWith("modal_opened:"),
      );
      if (interruptions.length > 0) {
        candidates.push({
          productivityObservations: ["user_interruption", "context_switching"],
          workflowPatternSummary: "Workflow interrupted by error or modal state",
          navigationPatternSummary: "Interruption shifts user focus away from primary task",
          taskSequenceSummary: `${interruptions.length} interruption event(s) detected`,
          bottleneckSummary: "Interruptions reduce continuous task flow",
          evidenceReferences: [
            `observation:${input.observation.observationId}:interruptions`,
          ],
          confidenceScore: input.observation.confidenceScore,
          impactScore: 0.68,
          sourceEngine: "PILLOW-CSO-001",
          sourceObservationId: input.observation.observationId,
        });
      }
    }

    try {
      const context = input.engines.contextAwareness?.getState();
      const latest = context?.latestContext;
      const previous = context?.previousContext;
      if (latest && previous) {
        const screenChanged = latest.currentScreenId !== previous.currentScreenId;
        const workflowChanged = latest.currentWorkflowName !== previous.currentWorkflowName;
        if (screenChanged || workflowChanged) {
          candidates.push({
            productivityObservations: ["context_switching", "screen_transition_pattern"],
            workflowPatternSummary: workflowChanged
              ? "Workflow context switch detected"
              : "Screen context maintained",
            navigationPatternSummary: screenChanged
              ? "Screen transition shifts operational context"
              : "Navigation context stable",
            taskSequenceSummary: `Mode: ${latest.currentInteractionMode} · state: ${latest.contextState}`,
            bottleneckSummary:
              screenChanged && workflowChanged
                ? "Dual context switch may increase cognitive load"
                : "Single-dimension context change",
            evidenceReferences: [`context-change:${latest.contextId}`],
            confidenceScore: latest.confidence,
            impactScore: screenChanged && workflowChanged ? 0.72 : 0.55,
            sourceEngine: "PILLOW-CAE-001",
            sourceObservationId: input.observation?.observationId ?? null,
          });
        }
      }
    } catch {
      /* context awareness unavailable */
    }

    try {
      const cc = input.engines.continuousCollaboration?.getState();
      const session = cc?.activeSession;
      if (session?.activeUxGoals?.length) {
        candidates.push({
          productivityObservations: ["workspace_usage", "task_completion_flow"],
          workflowPatternSummary: `Collaboration session with ${session.activeUxGoals.length} active UX goal(s)`,
          navigationPatternSummary: "Workspace shared between user and collaboration engine",
          taskSequenceSummary: `Goals: ${session.activeUxGoals.slice(0, 2).join(", ")}`,
          bottleneckSummary:
            (session.pendingProposalIds?.length ?? 0) > 0
              ? "Pending proposals may slow task completion"
              : "Collaboration flow unobstructed",
          evidenceReferences: [`collaboration:${session.collaborationSessionId}`],
          confidenceScore: session.confidenceScore,
          impactScore: 0.6,
          sourceEngine: "PILLOW-CC-001",
        });
      }
    } catch {
      /* collaboration unavailable */
    }

    return candidates;
  }
}
