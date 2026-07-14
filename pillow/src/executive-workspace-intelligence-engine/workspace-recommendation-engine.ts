/** T5-08 — Workspace recommendation aggregation engine. */

import { appendWorkspaceLog } from "./ewi-logging.js";
import type { ExecutiveWorkspaceIntelligenceConfiguration } from "./configuration.js";
import type { UxEvolutionRecord } from "../continuous-ux-evolution-engine/types.js";
import type { AdaptiveInterfaceRecord } from "../adaptive-interface-engine/types.js";
import type { WorkflowEvolutionRecord } from "../workflow-evolution-engine/types.js";
import type { ProductivityIntelligenceRecord } from "../productivity-intelligence-engine/types.js";
import type { OpportunityRecord } from "../ux-opportunity-discovery-engine/types.js";
import type { UxAuditRecord } from "../autonomous-ux-audit-engine/types.js";
import { DashboardRecommendationEngine } from "./dashboard-recommendation-engine.js";
import { ExecutiveContextEngine } from "./executive-context-engine.js";
import { ExecutiveWidgetManager } from "./executive-widget-manager.js";
import { MissionContextAnalyzer } from "./mission-context-analyzer.js";
import { WorkspaceLayoutEngine } from "./workspace-layout-engine.js";
import { WorkspaceOptimizationEngine } from "./workspace-optimization-engine.js";
import type {
  ExecutiveContext,
  ExecutiveWorkspaceIntelligenceEngineBundle,
  RawWorkspaceCandidate,
} from "./types.js";

export class WorkspaceRecommendationEngine {
  private readonly contextEngine = new ExecutiveContextEngine();
  private readonly missionAnalyzer = new MissionContextAnalyzer();
  private readonly dashboard = new DashboardRecommendationEngine();
  private readonly layout = new WorkspaceLayoutEngine();
  private readonly widgets = new ExecutiveWidgetManager();
  private readonly optimization = new WorkspaceOptimizationEngine();
  private readonly seenSignatures = new Set<string>();

  generate(input: {
    engines: ExecutiveWorkspaceIntelligenceEngineBundle;
    uxEvolutionRecords: UxEvolutionRecord[];
    adaptiveRecords: AdaptiveInterfaceRecord[];
    evolutionRecords: WorkflowEvolutionRecord[];
    productivityRecords: ProductivityIntelligenceRecord[];
    opportunities: OpportunityRecord[];
    audit: UxAuditRecord | null;
    config: ExecutiveWorkspaceIntelligenceConfiguration;
  }): { context: ExecutiveContext; candidates: RawWorkspaceCandidate[] } {
    const context = this.contextEngine.detect({
      engines: input.engines,
      uxEvolutionRecords: input.uxEvolutionRecords,
      adaptiveRecords: input.adaptiveRecords,
      productivityRecords: input.productivityRecords,
    });

    const candidates: RawWorkspaceCandidate[] = [];

    if (input.config.dashboardRecommendationRulesEnabled) {
      candidates.push(
        ...this.dashboard.recommend({
          context,
          uxEvolutionRecords: input.uxEvolutionRecords,
          adaptiveRecords: input.adaptiveRecords,
        }),
      );
    }

    if (input.config.workspaceOrganizationRulesEnabled) {
      candidates.push(
        ...this.missionAnalyzer.analyze({
          context,
          evolutionRecords: input.evolutionRecords,
          productivityRecords: input.productivityRecords,
        }),
        ...this.layout.recommend({ context, adaptiveRecords: input.adaptiveRecords }),
        ...this.optimization.optimize({
          context,
          adaptiveRecords: input.adaptiveRecords,
          audit: input.audit,
        }),
      );
    }

    if (input.config.widgetRecommendationRulesEnabled) {
      candidates.push(
        ...this.widgets.recommend({
          context,
          uxEvolutionRecords: input.uxEvolutionRecords,
          opportunities: input.opportunities,
        }),
      );
    }

    const filtered = input.config.deduplicateRecommendations
      ? this.deduplicate(candidates)
      : candidates;

    if (filtered.length === 0) {
      filtered.push({
        workspaceCategory: "executive_dashboard",
        activeMissionContext: context.activeMissionContext,
        executivePriorities: context.executivePriorities,
        recommendedDashboardLayout: [
          "Baseline executive dashboard with mission overview",
        ],
        recommendedWorkspaceConfiguration: [
          "Apply default executive workspace organization",
        ],
        recommendedWidgets: ["Executive mission status widget"],
        recommendedShortcuts: ["Access primary mission dashboard"],
        expectedProductivityBenefit: "Provides executive workspace optimization baseline",
        evidenceReferences: context.evidenceReferences,
        confidenceScore: Math.max(0.5, context.confidenceScore),
        impactScore: 0.55,
        sourceEngine: "PILLOW-EWI-001",
      });
    }

    for (const c of filtered) {
      appendWorkspaceLog({
        event: "workspace_optimization",
        level: "info",
        details: `${c.workspaceCategory}: ${c.activeMissionContext.slice(0, 60)}`,
      });
    }

    return { context, candidates: filtered };
  }

  resetForTesting(): void {
    this.seenSignatures.clear();
  }

  private deduplicate(candidates: RawWorkspaceCandidate[]): RawWorkspaceCandidate[] {
    const unique: RawWorkspaceCandidate[] = [];
    for (const c of candidates) {
      const sig = `${c.workspaceCategory}:${c.activeMissionContext.slice(0, 80)}`;
      if (this.seenSignatures.has(sig)) continue;
      this.seenSignatures.add(sig);
      unique.push(c);
    }
    return unique;
  }
}
