/** T5-08 — Executive Workspace Intelligence Manager — core optimization pipeline. */

import type { UxEvolutionRecord } from "../continuous-ux-evolution-engine/types.js";
import type { AdaptiveInterfaceRecord } from "../adaptive-interface-engine/types.js";
import type { WorkflowEvolutionRecord } from "../workflow-evolution-engine/types.js";
import type { ProductivityIntelligenceRecord } from "../productivity-intelligence-engine/types.js";
import type { OpportunityRecord } from "../ux-opportunity-discovery-engine/types.js";
import type { UxAuditRecord } from "../autonomous-ux-audit-engine/types.js";
import type { ExecutiveWorkspaceIntelligenceConfiguration } from "./configuration.js";
import { appendWorkspaceLog } from "./ewi-logging.js";
import { WorkspaceMetadataGenerator } from "./workspace-metadata-generator.js";
import { WorkspacePrioritizationEngine } from "./workspace-prioritization-engine.js";
import { WorkspaceRecommendationEngine } from "./workspace-recommendation-engine.js";
import { WorkspaceSessionManager } from "./workspace-session-manager.js";
import { WorkspaceValidator } from "./workspace-validator.js";
import { WORKSPACE_INTELLIGENCE_METADATA_VERSION } from "./paths.js";
import type {
  ExecutiveWorkspaceIntelligenceEngineBundle,
  ExecutiveWorkspaceIntelligenceInput,
  ExecutiveWorkspaceIntelligenceRunReport,
  WorkspaceIntelligenceRecord,
} from "./types.js";

export class ExecutiveWorkspaceIntelligenceManager {
  private readonly sessions = new WorkspaceSessionManager();
  private readonly recommendation = new WorkspaceRecommendationEngine();
  private readonly prioritization = new WorkspacePrioritizationEngine();
  private readonly metadata = new WorkspaceMetadataGenerator();
  private readonly validator = new WorkspaceValidator();
  private topRecommendations: WorkspaceIntelligenceRecord[] = [];

  optimizeWorkspace(input: {
    workspaceInput: ExecutiveWorkspaceIntelligenceInput;
    config: ExecutiveWorkspaceIntelligenceConfiguration;
    engines: ExecutiveWorkspaceIntelligenceEngineBundle;
  }): ExecutiveWorkspaceIntelligenceRunReport {
    const started = Date.now();
    appendWorkspaceLog({
      event: "executive_workspace_optimization_start",
      level: "info",
      details: "Starting executive workspace optimization cycle",
    });

    const session =
      this.sessions.getActiveSession() ??
      this.sessions.startSession(input.workspaceInput.sessionId);

    const uxEvolutionRecords = this.resolveUxEvolutionRecords(
      input.engines,
      input.workspaceInput,
    );
    const adaptiveRecords = this.resolveAdaptiveRecords(input.engines);
    const evolutionRecords = this.resolveEvolutionRecords(input.engines);
    const productivityRecords = this.resolveProductivityRecords(input.engines);
    const opportunities = this.resolveOpportunities(input.engines);
    const audit = this.resolveAudit(input.engines);

    const generated = this.recommendation.generate({
      engines: input.engines,
      uxEvolutionRecords,
      adaptiveRecords,
      evolutionRecords,
      productivityRecords,
      opportunities,
      audit,
      config: input.config,
    });

    const prioritized = this.prioritization.prioritize(generated.candidates, input.config);

    const records = this.metadata.buildRecords({
      candidates: prioritized,
      recordStatus: prioritized.length > 0 ? "recommended" : "validated",
    });

    this.topRecommendations = this.prioritization.rankRecommendations(records);

    const validation = input.config.validationRulesEnabled
      ? this.validator.validate(records, input.config)
      : {
          validationReportId: `ewi-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "pass" as const,
          recordsValidated: records.length,
          errors: [],
          warnings: [],
          durationMs: 0,
          metadataVersion: WORKSPACE_INTELLIGENCE_METADATA_VERSION,
        };

    const success = validation.decision !== "fail";
    this.sessions.recordOptimization(
      generated.context.activeMissionContext,
      success,
      records.length,
    );

    appendWorkspaceLog({
      event: "recommendation_generation",
      level: success ? "info" : "warn",
      details: `Generated ${records.length} workspace records · ${validation.decision}`,
    });

    const report: ExecutiveWorkspaceIntelligenceRunReport = {
      workspaceRunReportId: `ewi-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      records,
      validation,
      durationMs: Date.now() - started,
      metadataVersion: WORKSPACE_INTELLIGENCE_METADATA_VERSION,
    };

    appendWorkspaceLog({
      event: "executive_workspace_optimization_end",
      level: "info",
      details: `Optimization completed in ${report.durationMs}ms`,
    });

    return report;
  }

  getTopRecommendations(): WorkspaceIntelligenceRecord[] {
    return this.topRecommendations;
  }

  getSessionManager(): WorkspaceSessionManager {
    return this.sessions;
  }

  resetForTesting(): void {
    this.sessions.resetForTesting();
    this.recommendation.resetForTesting();
    this.topRecommendations = [];
  }

  private resolveUxEvolutionRecords(
    engines: ExecutiveWorkspaceIntelligenceEngineBundle,
    input: ExecutiveWorkspaceIntelligenceInput,
  ): UxEvolutionRecord[] {
    try {
      const cue = engines.continuousUxEvolution?.getState();
      if (input.uxEvolutionId) {
        const match = (cue?.topImprovements ?? []).find(
          (r) => r.uxEvolutionId === input.uxEvolutionId,
        );
        if (match) return [match];
        const fromReport = (cue?.latestReport?.records ?? []).find(
          (r) => r.uxEvolutionId === input.uxEvolutionId,
        );
        if (fromReport) return [fromReport];
      }
      if (cue?.latestReport?.records?.length) return cue.latestReport.records;
      if (cue?.topImprovements?.length) return cue.topImprovements;
      if (engines.continuousUxEvolution && input.forceOptimization) {
        return engines.continuousUxEvolution.optimize({}).records;
      }
    } catch {
      appendWorkspaceLog({
        event: "partial_t5_evolution",
        level: "warn",
        details: "UX evolution unavailable for workspace intelligence",
      });
    }
    return [];
  }

  private resolveAdaptiveRecords(
    engines: ExecutiveWorkspaceIntelligenceEngineBundle,
  ): AdaptiveInterfaceRecord[] {
    try {
      const aie = engines.adaptiveInterface?.getState();
      if (aie?.latestReport?.records?.length) return aie.latestReport.records;
      if (aie?.topAdaptations?.length) return aie.topAdaptations;
    } catch {
      return [];
    }
    return [];
  }

  private resolveEvolutionRecords(
    engines: ExecutiveWorkspaceIntelligenceEngineBundle,
  ): WorkflowEvolutionRecord[] {
    try {
      const wfe = engines.workflowEvolution?.getState();
      if (wfe?.latestReport?.records?.length) return wfe.latestReport.records;
      if (wfe?.topRecommendations?.length) return wfe.topRecommendations;
    } catch {
      return [];
    }
    return [];
  }

  private resolveProductivityRecords(
    engines: ExecutiveWorkspaceIntelligenceEngineBundle,
  ): ProductivityIntelligenceRecord[] {
    try {
      const pie = engines.productivityIntelligence?.getState();
      if (pie?.latestReport?.records?.length) return pie.latestReport.records;
      if (pie?.topPatterns?.length) return pie.topPatterns;
    } catch {
      return [];
    }
    return [];
  }

  private resolveOpportunities(
    engines: ExecutiveWorkspaceIntelligenceEngineBundle,
  ): OpportunityRecord[] {
    try {
      const uod = engines.uxOpportunityDiscovery?.getState();
      if (uod?.latestReport?.opportunities?.length) return uod.latestReport.opportunities;
      if (uod?.topOpportunities?.length) return uod.topOpportunities;
    } catch {
      return [];
    }
    return [];
  }

  private resolveAudit(
    engines: ExecutiveWorkspaceIntelligenceEngineBundle,
  ): UxAuditRecord | null {
    try {
      const aua = engines.autonomousUxAudit?.getState();
      if (aua?.latestAudit) return aua.latestAudit;
      if (aua?.latestReport?.audit) return aua.latestReport.audit;
    } catch {
      return null;
    }
    return null;
  }
}
