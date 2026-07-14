/** T5-04 — Frequently repeated action detection from T1 interaction tracking. */

import type { ObservationRecord } from "../continuous-screen-observation-engine/types.js";
import type { ProductivityIntelligenceEngineBundle, RawProductivityCandidate } from "./types.js";

export class RepetitionAnalyzer {
  analyze(input: {
    engines: ProductivityIntelligenceEngineBundle;
    observation: ObservationRecord | null;
  }): RawProductivityCandidate[] {
    const candidates: RawProductivityCandidate[] = [];

    try {
      const tracking = input.engines.interactionTracking?.getState();
      const events = tracking?.recentEvents ?? [];
      if (events.length < 3) return candidates;

      const signatureCounts = new Map<string, { count: number; eventIds: string[] }>();
      for (const event of events) {
        const sig = `${event.interactionType}:${event.sourceComponentId ?? event.currentScreenId ?? "unknown"}`;
        const entry = signatureCounts.get(sig) ?? { count: 0, eventIds: [] };
        entry.count += 1;
        entry.eventIds.push(event.eventId);
        signatureCounts.set(sig, entry);
      }

      for (const [sig, data] of signatureCounts) {
        if (data.count < 3) continue;
        const [type, target] = sig.split(":");
        candidates.push({
          productivityObservations: ["task_repetition", "operational_efficiency"],
          workflowPatternSummary: `Repeated ${type} actions detected (${data.count} times)`,
          navigationPatternSummary: "Repetition concentrated in current workspace",
          taskSequenceSummary: `Target: ${target}`,
          bottleneckSummary: "Repeated actions may indicate automation opportunity",
          evidenceReferences: data.eventIds.map((id) => `interaction:${id}`),
          confidenceScore: Math.min(0.95, 0.5 + data.count * 0.08),
          impactScore: data.count > 5 ? 0.78 : 0.62,
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
