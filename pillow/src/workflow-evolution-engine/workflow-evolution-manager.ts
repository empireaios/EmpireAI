/** T5-05 — Workflow Evolution Manager — core evolution pipeline. */

import type { ProductivityIntelligenceRecord } from "../productivity-intelligence-engine/types.js";
import type { OpportunityRecord } from "../ux-opportunity-discovery-engine/types.js";
import type { UxAuditRecord } from "../autonomous-ux-audit-engine/types.js";
import type { ObservationRecord } from "../continuous-screen-observation-engine/types.js";
import type { WorkflowEvolutionConfiguration } from "./configuration.js";
import { appendEvolutionLog } from "./workflow-logging.js";
import { WorkflowAnalysisEngine } from "./workflow-analysis-engine.js";
import { WorkflowMetadataGenerator } from "./workflow-metadata-generator.js";
import { WorkflowPrioritizationEngine } from "./workflow-prioritization-engine.js";
import { WorkflowSessionManager } from "./workflow-session-manager.js";
import { WorkflowValidator } from "./workflow-validator.js";
import { WORKFLOW_EVOLUTION_METADATA_VERSION } from "./paths.js";
import type {
  WorkflowEvolutionEngineBundle,
  WorkflowEvolutionInput,
  WorkflowEvolutionRecord,
  WorkflowEvolutionRunReport,
} from "./types.js";

export class WorkflowEvolutionManager {
  private readonly sessions = new WorkflowSessionManager();
  private readonly analysis = new WorkflowAnalysisEngine();
  private readonly prioritization = new WorkflowPrioritizationEngine();
  private readonly metadata = new WorkflowMetadataGenerator();
  private readonly validator = new WorkflowValidator();
  private topRecommendations: WorkflowEvolutionRecord[] = [];

  evolve(input: {
    evolutionInput: WorkflowEvolutionInput;
    config: WorkflowEvolutionConfiguration;
    engines: WorkflowEvolutionEngineBundle;
  }): WorkflowEvolutionRunReport {
    const started = Date.now();
    appendEvolutionLog({
      event: "workflow_evolution_start",
      level: "info",
      details: "Starting workflow evolution analysis cycle",
    });

    this.sessions.getActiveSession() ??
      this.sessions.startSession(input.evolutionInput.sessionId);

    const productivityRecords = this.resolveProductivityRecords(
      input.engines,
      input.evolutionInput,
    );
    const opportunities = this.resolveOpportunities(input.engines);
    const audit = this.resolveAudit(input.engines);
    const observation = this.resolveObservation(input.engines);

    const candidates = this.analysis.analyze({
      productivityRecords,
      opportunities,
      audit,
      observation,
      config: input.config,
    });

    const prioritized = this.prioritization.prioritize(candidates, input.config);
    const records = this.metadata.buildRecords({
      sourceAuditId: audit?.auditId ?? null,
      sourceObservationId: audit?.sourceObservationId ?? observation?.observationId ?? null,
      currentScreenId: audit?.currentScreenId ?? observation?.currentScreenId ?? null,
      currentRouteOrViewId:
        audit?.currentRouteOrViewId ?? observation?.currentRouteOrViewId ?? null,
      candidates: prioritized,
      recordStatus: prioritized.length > 0 ? "recommended" : "validated",
    });

    this.topRecommendations = this.prioritization.rankRecommendations(records);

    const validation = input.config.validationRulesEnabled
      ? this.validator.validate(records, input.config)
      : {
          validationReportId: `wfe-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "pass" as const,
          recordsValidated: records.length,
          errors: [],
          warnings: [],
          durationMs: 0,
          metadataVersion: WORKFLOW_EVOLUTION_METADATA_VERSION,
        };

    const success = validation.decision !== "fail";
    this.sessions.recordEvolution(
      audit?.currentScreenId ?? observation?.currentScreenId ?? null,
      audit?.currentRouteOrViewId ?? observation?.currentRouteOrViewId ?? null,
      success,
      records.length,
    );

    appendEvolutionLog({
      event: "recommendation_generation",
      level: success ? "info" : "warn",
      details: `Generated ${records.length} workflow recommendations · ${validation.decision}`,
    });

    const report: WorkflowEvolutionRunReport = {
      evolutionRunReportId: `wfe-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      records,
      validation,
      durationMs: Date.now() - started,
      metadataVersion: WORKFLOW_EVOLUTION_METADATA_VERSION,
    };

    appendEvolutionLog({
      event: "workflow_evolution_end",
      level: "info",
      details: `Evolution completed in ${report.durationMs}ms`,
    });

    return report;
  }

  getTopRecommendations(): WorkflowEvolutionRecord[] {
    return this.topRecommendations;
  }

  getSessionManager(): WorkflowSessionManager {
    return this.sessions;
  }

  resetForTesting(): void {
    this.sessions.resetForTesting();
    this.analysis.resetForTesting();
    this.topRecommendations = [];
  }

  private resolveProductivityRecords(
    engines: WorkflowEvolutionEngineBundle,
    input: WorkflowEvolutionInput,
  ): ProductivityIntelligenceRecord[] {
    try {
      const pie = engines.productivityIntelligence?.getState();
      if (input.productivityId) {
        const match = (pie?.topPatterns ?? []).find(
          (r) => r.productivityId === input.productivityId,
        );
        if (match) return [match];
        const fromReport = (pie?.latestReport?.records ?? []).find(
          (r) => r.productivityId === input.productivityId,
        );
        if (fromReport) return [fromReport];
      }
      if (pie?.latestReport?.records?.length) return pie.latestReport.records;
      if (pie?.topPatterns?.length) return pie.topPatterns;
      if (engines.productivityIntelligence && input.forceEvolution) {
        const report = engines.productivityIntelligence.learn({});
        return report.records;
      }
    } catch {
      appendEvolutionLog({
        event: "partial_t5_productivity",
        level: "warn",
        details: "Productivity intelligence unavailable for workflow evolution",
      });
    }
    return [];
  }

  private resolveOpportunities(
    engines: WorkflowEvolutionEngineBundle,
  ): OpportunityRecord[] {
    try {
      const uod = engines.uxOpportunityDiscovery?.getState();
      if (uod?.latestReport?.opportunities?.length) {
        return uod.latestReport.opportunities;
      }
      if (uod?.topOpportunities?.length) return uod.topOpportunities;
    } catch {
      appendEvolutionLog({
        event: "partial_t5_opportunities",
        level: "warn",
        details: "UX opportunity discovery unavailable for workflow evolution",
      });
    }
    return [];
  }

  private resolveAudit(
    engines: WorkflowEvolutionEngineBundle,
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

  private resolveObservation(
    engines: WorkflowEvolutionEngineBundle,
  ): ObservationRecord | null {
    try {
      const cso = engines.continuousScreenObservation?.getState();
      return cso?.latestObservation ?? cso?.latestReport?.observation ?? null;
    } catch {
      return null;
    }
  }
}
