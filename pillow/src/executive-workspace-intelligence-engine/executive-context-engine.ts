/** T5-08 — Executive context from T5 chain and observation records. */

import type { UxEvolutionRecord } from "../continuous-ux-evolution-engine/types.js";
import type { AdaptiveInterfaceRecord } from "../adaptive-interface-engine/types.js";
import type { ProductivityIntelligenceRecord } from "../productivity-intelligence-engine/types.js";
import type { ExecutiveWorkspaceIntelligenceEngineBundle, ExecutiveContext } from "./types.js";

export class ExecutiveContextEngine {
  detect(input: {
    engines: ExecutiveWorkspaceIntelligenceEngineBundle;
    uxEvolutionRecords: UxEvolutionRecord[];
    adaptiveRecords: AdaptiveInterfaceRecord[];
    productivityRecords: ProductivityIntelligenceRecord[];
  }): ExecutiveContext {
    const missionContext = this.resolveMissionContext(input);
    const priorities = this.resolvePriorities(input);
    const operationalContext = this.resolveOperationalContext(input);
    const evidence: string[] = [];

    if (input.uxEvolutionRecords[0]) {
      evidence.push(`cue:${input.uxEvolutionRecords[0].uxEvolutionId}`);
    }
    if (input.adaptiveRecords[0]) {
      evidence.push(`aie:${input.adaptiveRecords[0].adaptiveInterfaceId}`);
    }
    if (input.productivityRecords[0]) {
      evidence.push(`pie:${input.productivityRecords[0].productivityId}`);
    }

    return {
      activeMissionContext: missionContext,
      executivePriorities: priorities,
      operationalContext,
      evidenceReferences: evidence,
      confidenceScore: this.computeConfidence(input),
    };
  }

  private resolveMissionContext(input: {
    uxEvolutionRecords: UxEvolutionRecord[];
    adaptiveRecords: AdaptiveInterfaceRecord[];
  }): string {
    const adaptive = input.adaptiveRecords[0]?.currentWorkflowContext;
    if (adaptive) return `T5-08 Executive Workspace · ${adaptive}`;
    const evolution = input.uxEvolutionRecords[0]?.evolutionCategory;
    if (evolution) return `T5-08 Executive Workspace · ${evolution.replace(/_/g, " ")}`;
    return "T5-08 Executive Workspace · Autonomous Evolution";
  }

  private resolvePriorities(input: {
    uxEvolutionRecords: UxEvolutionRecord[];
    productivityRecords: ProductivityIntelligenceRecord[];
  }): string[] {
    const priorities: string[] = ["Grand King governance preserved"];
    const topEvolution = input.uxEvolutionRecords.find(
      (r) => r.improvementPriority === "critical" || r.improvementPriority === "high",
    );
    if (topEvolution) {
      priorities.push(`Prioritize ${topEvolution.evolutionCategory.replace(/_/g, " ")}`);
    }
    const pie = input.productivityRecords[0];
    if (pie?.workflowPatternSummary) {
      priorities.push(`Optimize for: ${pie.workflowPatternSummary}`);
    }
    priorities.push("Mission-specific dashboard visibility");
    return priorities.slice(0, 5);
  }

  private resolveOperationalContext(input: {
    engines: ExecutiveWorkspaceIntelligenceEngineBundle;
    adaptiveRecords: AdaptiveInterfaceRecord[];
  }): string {
    const adaptive = input.adaptiveRecords[0];
    if (adaptive?.currentRouteOrViewId) {
      return `Active view: ${adaptive.currentRouteOrViewId}`;
    }
    try {
      const cso = input.engines.continuousScreenObservation?.getState();
      const obs = cso?.latestReport?.observation;
      if (obs?.currentRouteOrViewId) return `Observed view: ${obs.currentRouteOrViewId}`;
    } catch {
      /* ignore */
    }
    return "Executive operational context";
  }

  private computeConfidence(input: {
    uxEvolutionRecords: UxEvolutionRecord[];
    adaptiveRecords: AdaptiveInterfaceRecord[];
    productivityRecords: ProductivityIntelligenceRecord[];
  }): number {
    const scores = [
      input.uxEvolutionRecords[0]?.confidenceScore,
      input.adaptiveRecords[0]?.confidenceScore,
      input.productivityRecords[0]?.confidenceScore,
    ].filter((s): s is number => typeof s === "number");
    if (!scores.length) return 0.5;
    return scores.reduce((a, b) => a + b, 0) / scores.length;
  }
}
