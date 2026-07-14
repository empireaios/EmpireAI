/** T2-05 — Repeated action detection. */

import type { InteractionEvent } from "../interaction-tracking-engine/types.js";
import { WorkflowMetadataGenerator } from "./workflow-metadata-generator.js";
import type { WorkflowFrictionPoint } from "./types.js";
import type { WorkflowOptimizationConfiguration } from "./configuration.js";

export class RepetitionDetector {
  private readonly metadata = new WorkflowMetadataGenerator();

  analyze(
    events: InteractionEvent[],
    config: WorkflowOptimizationConfiguration,
  ): WorkflowFrictionPoint[] {
    const findings: WorkflowFrictionPoint[] = [];
    const actionCounts = new Map<string, { count: number; screenId: string | null; componentId: string | null }>();

    for (const event of events) {
      const key = `${event.interactionType}:${event.sourceComponentId ?? "unknown"}`;
      const existing = actionCounts.get(key) ?? {
        count: 0,
        screenId: event.currentScreenId,
        componentId: event.sourceComponentId,
      };
      existing.count += 1;
      actionCounts.set(key, existing);
    }

    for (const [key, data] of actionCounts) {
      if (data.count < config.repetitionThreshold) continue;
      const [actionType] = key.split(":");
      findings.push({
        frictionId: this.metadata.buildFrictionId("repeated_actions"),
        category: "repeated_actions",
        description: `Action '${actionType}' repeated ${data.count} times on same target`,
        severity: data.count >= config.repetitionThreshold + 2 ? "warning" : "info",
        affectedScreens: data.screenId ? [data.screenId] : [],
        affectedComponents: data.componentId ? [data.componentId] : [],
        affectedNavigationNodes: [],
        evidenceRef: `repetition-${key}`,
        confidence: Math.min(0.9, 0.5 + data.count * 0.1),
      });
    }

    return findings;
  }
}
