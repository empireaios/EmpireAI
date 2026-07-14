/** T5-07 — Continuous UX Evolution Manager — core evolution pipeline. */

import type { AdaptiveInterfaceRecord } from "../adaptive-interface-engine/types.js";
import type { ProductivityIntelligenceRecord } from "../productivity-intelligence-engine/types.js";
import type { WorkflowEvolutionRecord } from "../workflow-evolution-engine/types.js";
import type { OpportunityRecord } from "../ux-opportunity-discovery-engine/types.js";
import type { UxAuditRecord } from "../autonomous-ux-audit-engine/types.js";
import type { ContinuousUxEvolutionConfiguration } from "./configuration.js";
import { appendEvolutionLog } from "./cue-logging.js";
import { EvolutionMetadataGenerator } from "./evolution-metadata-generator.js";
import { EvolutionPrioritizationEngine } from "./evolution-prioritization-engine.js";
import { EvolutionValidator } from "./evolution-validator.js";
import { EvolutionHistoryManager } from "./evolution-history-manager.js";
import { EvolutionSessionManager } from "./evolution-session-manager.js";
import { UxRecommendationEngine } from "./ux-recommendation-engine.js";
import { UX_EVOLUTION_METADATA_VERSION } from "./paths.js";
import type {
  ContinuousUxEvolutionEngineBundle,
  ContinuousUxEvolutionInput,
  ContinuousUxEvolutionRunReport,
  UxEvolutionRecord,
} from "./types.js";

export class ContinuousUxEvolutionManager {
  private readonly sessions = new EvolutionSessionManager();
  private readonly recommendation = new UxRecommendationEngine();
  private readonly prioritization = new EvolutionPrioritizationEngine();
  private readonly metadata = new EvolutionMetadataGenerator();
  private readonly validator = new EvolutionValidator();
  private readonly history = new EvolutionHistoryManager();
  private topImprovements: UxEvolutionRecord[] = [];

  optimize(input: {
    evolutionInput: ContinuousUxEvolutionInput;
    config: ContinuousUxEvolutionConfiguration;
    engines: ContinuousUxEvolutionEngineBundle;
  }): ContinuousUxEvolutionRunReport {
    const started = Date.now();
    appendEvolutionLog({
      event: "continuous_ux_evolution_start",
      level: "info",
      details: "Starting continuous UX evolution cycle",
    });

    const session =
      this.sessions.getActiveSession() ??
      this.sessions.startSession(input.evolutionInput.sessionId);

    const adaptiveRecords = this.resolveAdaptiveRecords(input.engines, input.evolutionInput);
    const evolutionRecords = this.resolveEvolutionRecords(input.engines);
    const productivityRecords = this.resolveProductivityRecords(input.engines);
    const opportunities = this.resolveOpportunities(input.engines);
    const audit = this.resolveAudit(input.engines);
    const { currentScreenId, currentRouteOrViewId } = this.resolveScreenContext(
      adaptiveRecords,
      input.engines,
    );

    const candidates = this.recommendation.generate({
      engines: input.engines,
      adaptiveRecords,
      evolutionRecords,
      productivityRecords,
      opportunities,
      audit,
      currentScreenId,
      currentRouteOrViewId,
      config: input.config,
    });

    const prioritized = this.prioritization.prioritize(candidates, input.config);

    const records = this.metadata.buildRecords({
      currentScreenId,
      currentRouteOrViewId,
      candidates: prioritized,
      recordStatus: prioritized.length > 0 ? "recommended" : "validated",
    });

    this.topImprovements = this.prioritization.rankImprovements(records);
    const historyEntries = this.history.recordEntries({
      sessionId: session.evolutionSessionId,
      candidates: prioritized,
      maxEntries: input.config.maxHistoryEvolutionCycles,
    });

    const validation = input.config.validationRulesEnabled
      ? this.validator.validate(records, input.config)
      : {
          validationReportId: `cue-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "pass" as const,
          recordsValidated: records.length,
          errors: [],
          warnings: [],
          durationMs: 0,
          metadataVersion: UX_EVOLUTION_METADATA_VERSION,
        };

    const success = validation.decision !== "fail";
    this.sessions.recordEvolution(
      currentScreenId,
      currentRouteOrViewId,
      success,
      records.length,
    );

    appendEvolutionLog({
      event: "recommendation_generation",
      level: success ? "info" : "warn",
      details: `Generated ${records.length} UX evolution records · ${validation.decision}`,
    });

    const report: ContinuousUxEvolutionRunReport = {
      evolutionRunReportId: `cue-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      records,
      historyEntries,
      validation,
      durationMs: Date.now() - started,
      metadataVersion: UX_EVOLUTION_METADATA_VERSION,
    };

    appendEvolutionLog({
      event: "continuous_ux_evolution_end",
      level: "info",
      details: `Evolution completed in ${report.durationMs}ms`,
    });

    return report;
  }

  getTopImprovements(): UxEvolutionRecord[] {
    return this.topImprovements;
  }

  getSessionManager(): EvolutionSessionManager {
    return this.sessions;
  }

  getHistoryManager(): EvolutionHistoryManager {
    return this.history;
  }

  resetForTesting(): void {
    this.sessions.resetForTesting();
    this.history.resetForTesting();
    this.recommendation.resetForTesting();
    this.topImprovements = [];
  }

  private resolveAdaptiveRecords(
    engines: ContinuousUxEvolutionEngineBundle,
    input: ContinuousUxEvolutionInput,
  ): AdaptiveInterfaceRecord[] {
    try {
      const aie = engines.adaptiveInterface?.getState();
      if (input.adaptiveInterfaceId) {
        const match = (aie?.topAdaptations ?? []).find(
          (r) => r.adaptiveInterfaceId === input.adaptiveInterfaceId,
        );
        if (match) return [match];
        const fromReport = (aie?.latestReport?.records ?? []).find(
          (r) => r.adaptiveInterfaceId === input.adaptiveInterfaceId,
        );
        if (fromReport) return [fromReport];
      }
      if (aie?.latestReport?.records?.length) return aie.latestReport.records;
      if (aie?.topAdaptations?.length) return aie.topAdaptations;
      if (engines.adaptiveInterface && input.forceEvolution) {
        return engines.adaptiveInterface.adapt({}).records;
      }
    } catch {
      appendEvolutionLog({
        event: "partial_t5_adaptive",
        level: "warn",
        details: "Adaptive interface unavailable for UX evolution",
      });
    }
    return [];
  }

  private resolveEvolutionRecords(
    engines: ContinuousUxEvolutionEngineBundle,
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
    engines: ContinuousUxEvolutionEngineBundle,
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
    engines: ContinuousUxEvolutionEngineBundle,
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
    engines: ContinuousUxEvolutionEngineBundle,
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

  private resolveScreenContext(
    adaptiveRecords: AdaptiveInterfaceRecord[],
    engines: ContinuousUxEvolutionEngineBundle,
  ): { currentScreenId: string | null; currentRouteOrViewId: string | null } {
    const top = adaptiveRecords[0];
    if (top?.currentScreenId || top?.currentRouteOrViewId) {
      return {
        currentScreenId: top.currentScreenId,
        currentRouteOrViewId: top.currentRouteOrViewId,
      };
    }
    try {
      const cso = engines.continuousScreenObservation?.getState();
      const obs = cso?.latestReport?.observation;
      return {
        currentScreenId: obs?.currentScreenId ?? null,
        currentRouteOrViewId: obs?.currentRouteOrViewId ?? null,
      };
    } catch {
      return { currentScreenId: null, currentRouteOrViewId: null };
    }
  }
}
