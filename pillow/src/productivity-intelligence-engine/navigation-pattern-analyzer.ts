/** T5-04 — Navigation behavior learning from T5-01 observations and T1 interaction tracking. */

import type { OpportunityRecord } from "../ux-opportunity-discovery-engine/types.js";
import type { ObservationRecord } from "../continuous-screen-observation-engine/types.js";
import type { ProductivityIntelligenceEngineBundle, RawProductivityCandidate } from "./types.js";

export class NavigationPatternAnalyzer {
  analyze(input: {
    engines: ProductivityIntelligenceEngineBundle;
    opportunities: OpportunityRecord[];
    observation: ObservationRecord | null;
  }): RawProductivityCandidate[] {
    const candidates: RawProductivityCandidate[] = [];

    for (const opp of input.opportunities.filter(
      (o) => o.opportunityCategory === "navigation_improvement",
    )) {
      candidates.push({
        productivityObservations: ["navigation_pattern", "operational_efficiency"],
        workflowPatternSummary: "Workflow navigation overhead observed",
        navigationPatternSummary: opp.opportunitySummary,
        taskSequenceSummary: "Navigation steps add overhead to task completion",
        bottleneckSummary: "Navigation path may be suboptimal",
        evidenceReferences: [...opp.evidenceReferences, `opportunity:${opp.opportunityId}`],
        confidenceScore: opp.confidenceScore,
        impactScore: 0.7,
        sourceEngine: "PILLOW-UOD-001",
        sourceOpportunityId: opp.opportunityId,
        sourceAuditId: opp.sourceAuditId,
        sourceObservationId: opp.sourceObservationId,
      });
    }

    if (input.observation?.detectedStateChanges?.length) {
      const transitions = input.observation.detectedStateChanges.filter((c) =>
        c.startsWith("screen_changed:"),
      );
      if (transitions.length > 0) {
        candidates.push({
          productivityObservations: ["screen_transition_pattern", "navigation_pattern"],
          workflowPatternSummary: "Screen transitions observed during active workflow",
          navigationPatternSummary: `${transitions.length} screen transition(s) in observation window`,
          taskSequenceSummary: `Transitions: ${transitions.slice(0, 3).join(", ")}`,
          bottleneckSummary: transitions.length > 2 ? "Frequent screen transitions may reduce focus" : "Normal transition cadence",
          evidenceReferences: [
            `observation:${input.observation.observationId}:transitions`,
          ],
          confidenceScore: input.observation.confidenceScore,
          impactScore: transitions.length > 2 ? 0.65 : 0.45,
          sourceEngine: "PILLOW-CSO-001",
          sourceObservationId: input.observation.observationId,
        });
      }
    }

    try {
      const tracking = input.engines.interactionTracking?.getState();
      const navEvents = (tracking?.recentEvents ?? []).filter(
        (e) => e.destinationNavigationNodeId || e.triggeredNavigationEdgeId,
      );
      if (navEvents.length > 0) {
        const latest = navEvents[navEvents.length - 1]!;
        candidates.push({
          productivityObservations: ["navigation_pattern", "workspace_usage"],
          workflowPatternSummary: "User navigates between workspace regions",
          navigationPatternSummary: `${navEvents.length} navigation interaction(s) recorded`,
          taskSequenceSummary: `Latest navigation: ${latest.interactionType} to ${latest.destinationNavigationNodeId ?? "unknown"}`,
          bottleneckSummary: navEvents.length > 5 ? "High navigation frequency detected" : "Moderate navigation activity",
          evidenceReferences: navEvents.slice(-3).map((e) => `interaction:${e.eventId}`),
          confidenceScore: latest.confidence,
          impactScore: navEvents.length > 5 ? 0.7 : 0.5,
          sourceEngine: "PILLOW-ITE-001",
          sourceObservationId: input.observation?.observationId ?? null,
        });
      }
    } catch {
      /* interaction tracking unavailable */
    }

    return candidates;
  }
}
