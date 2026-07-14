/** T5-04 — Productivity Intelligence Manager — core learning pipeline. */

import type { OpportunityRecord } from "../ux-opportunity-discovery-engine/types.js";
import type { UxAuditRecord } from "../autonomous-ux-audit-engine/types.js";
import type { ObservationRecord } from "../continuous-screen-observation-engine/types.js";
import type { ProductivityIntelligenceConfiguration } from "./configuration.js";
import { appendProductivityLog } from "./productivity-logging.js";
import { ProductivityAnalysisEngine } from "./productivity-analysis-engine.js";
import { ProductivityMetadataGenerator } from "./productivity-metadata-generator.js";
import { ProductivitySessionManager } from "./productivity-session-manager.js";
import { ProductivityValidator } from "./productivity-validator.js";
import { PRODUCTIVITY_METADATA_VERSION } from "./paths.js";
import type {
  ProductivityIntelligenceEngineBundle,
  ProductivityIntelligenceInput,
  ProductivityIntelligenceRecord,
  ProductivityLearningRunReport,
} from "./types.js";

export class ProductivityIntelligenceManager {
  private readonly sessions = new ProductivitySessionManager();
  private readonly analysis = new ProductivityAnalysisEngine();
  private readonly metadata = new ProductivityMetadataGenerator();
  private readonly validator = new ProductivityValidator();
  private topPatterns: ProductivityIntelligenceRecord[] = [];

  learn(input: {
    learningInput: ProductivityIntelligenceInput;
    config: ProductivityIntelligenceConfiguration;
    engines: ProductivityIntelligenceEngineBundle;
  }): ProductivityLearningRunReport {
    const started = Date.now();
    appendProductivityLog({
      event: "productivity_learning_start",
      level: "info",
      details: "Starting productivity intelligence learning cycle",
    });

    const session =
      this.sessions.getActiveSession() ??
      this.sessions.startSession(input.learningInput.sessionId);

    const opportunities = this.resolveOpportunities(input.engines, input.learningInput);
    const audit = this.resolveAudit(input.engines);
    const observation = this.resolveObservation(input.engines);

    const candidates = this.analysis.analyze({
      engines: input.engines,
      opportunities,
      audit,
      observation,
      config: input.config,
    });

    const records = this.metadata.buildRecords({
      sessionId: session.learningSessionId,
      sourceAuditId: audit?.auditId ?? null,
      sourceObservationId: audit?.sourceObservationId ?? observation?.observationId ?? null,
      sourceOpportunityId: input.learningInput.opportunityId ?? opportunities[0]?.opportunityId ?? null,
      currentScreenId: audit?.currentScreenId ?? observation?.currentScreenId ?? null,
      currentRouteOrViewId:
        audit?.currentRouteOrViewId ?? observation?.currentRouteOrViewId ?? null,
      candidates,
      recordStatus: candidates.length > 0 ? "learned" : "validated",
    });

    this.topPatterns = this.rankPatterns(records);

    const validation = input.config.validationRulesEnabled
      ? this.validator.validate(records, input.config)
      : {
          validationReportId: `pie-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "pass" as const,
          recordsValidated: records.length,
          errors: [],
          warnings: [],
          durationMs: 0,
          metadataVersion: PRODUCTIVITY_METADATA_VERSION,
        };

    const success = validation.decision !== "fail";
    this.sessions.recordLearning(
      audit?.currentScreenId ?? observation?.currentScreenId ?? null,
      audit?.currentRouteOrViewId ?? observation?.currentRouteOrViewId ?? null,
      success,
      records.length,
    );

    appendProductivityLog({
      event: "productivity_record_generation",
      level: success ? "info" : "warn",
      details: `Generated ${records.length} productivity records · ${validation.decision}`,
    });

    const report: ProductivityLearningRunReport = {
      learningRunReportId: `pie-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      records,
      validation,
      durationMs: Date.now() - started,
      metadataVersion: PRODUCTIVITY_METADATA_VERSION,
    };

    appendProductivityLog({
      event: "productivity_learning_end",
      level: "info",
      details: `Learning completed in ${report.durationMs}ms`,
    });

    return report;
  }

  getTopPatterns(): ProductivityIntelligenceRecord[] {
    return this.topPatterns;
  }

  getSessionManager(): ProductivitySessionManager {
    return this.sessions;
  }

  resetForTesting(): void {
    this.sessions.resetForTesting();
    this.analysis.resetForTesting();
    this.topPatterns = [];
  }

  private rankPatterns(
    records: ProductivityIntelligenceRecord[],
  ): ProductivityIntelligenceRecord[] {
    return [...records].sort((a, b) => b.confidenceScore - a.confidenceScore);
  }

  private resolveOpportunities(
    engines: ProductivityIntelligenceEngineBundle,
    input: ProductivityIntelligenceInput,
  ): OpportunityRecord[] {
    try {
      const uod = engines.uxOpportunityDiscovery?.getState();
      if (input.opportunityId) {
        const match = (uod?.topOpportunities ?? []).find(
          (o) => o.opportunityId === input.opportunityId,
        );
        if (match) return [match];
        const fromReport = (uod?.latestReport?.opportunities ?? []).find(
          (o) => o.opportunityId === input.opportunityId,
        );
        if (fromReport) return [fromReport];
      }
      if (uod?.latestReport?.opportunities?.length) {
        return uod.latestReport.opportunities;
      }
      if (uod?.topOpportunities?.length) return uod.topOpportunities;
      if (engines.uxOpportunityDiscovery && input.forceLearning) {
        const report = engines.uxOpportunityDiscovery.discover({});
        return report.opportunities;
      }
    } catch {
      appendProductivityLog({
        event: "partial_t5_opportunities",
        level: "warn",
        details: "UX opportunity discovery unavailable for productivity learning",
      });
    }
    return [];
  }

  private resolveAudit(
    engines: ProductivityIntelligenceEngineBundle,
  ): UxAuditRecord | null {
    try {
      const aua = engines.autonomousUxAudit?.getState();
      if (aua?.latestAudit) return aua.latestAudit;
      if (aua?.latestReport?.audit) return aua.latestReport.audit;
    } catch {
      appendProductivityLog({
        event: "partial_t5_audit",
        level: "warn",
        details: "Autonomous UX audit unavailable for productivity learning",
      });
    }
    return null;
  }

  private resolveObservation(
    engines: ProductivityIntelligenceEngineBundle,
  ): ObservationRecord | null {
    try {
      const cso = engines.continuousScreenObservation?.getState();
      return cso?.latestObservation ?? cso?.latestReport?.observation ?? null;
    } catch {
      return null;
    }
  }
}
