/** T5-06 — Adaptive Interface Manager — core adaptation pipeline. */

import type { ProductivityIntelligenceRecord } from "../productivity-intelligence-engine/types.js";
import type { WorkflowEvolutionRecord } from "../workflow-evolution-engine/types.js";
import type { OpportunityRecord } from "../ux-opportunity-discovery-engine/types.js";
import type { UxAuditRecord } from "../autonomous-ux-audit-engine/types.js";
import type { AdaptiveInterfaceConfiguration } from "./configuration.js";
import { appendAdaptiveLog } from "./adaptive-logging.js";
import { AdaptiveMetadataGenerator } from "./adaptive-metadata-generator.js";
import { AdaptivePrioritizationEngine } from "./adaptive-prioritization-engine.js";
import { AdaptiveRecommendationEngine } from "./adaptive-recommendation-engine.js";
import { AdaptiveValidator } from "./adaptive-validator.js";
import { AdaptationSessionManager } from "./adaptation-session-manager.js";
import { InterfaceProfileManager } from "./interface-profile-manager.js";
import { ADAPTIVE_METADATA_VERSION } from "./paths.js";
import type {
  AdaptiveInterfaceEngineBundle,
  AdaptiveInterfaceInput,
  AdaptiveInterfaceRecord,
  AdaptiveInterfaceRunReport,
} from "./types.js";

export class AdaptiveInterfaceManager {
  private readonly sessions = new AdaptationSessionManager();
  private readonly recommendation = new AdaptiveRecommendationEngine();
  private readonly prioritization = new AdaptivePrioritizationEngine();
  private readonly metadata = new AdaptiveMetadataGenerator();
  private readonly validator = new AdaptiveValidator();
  private readonly profiles = new InterfaceProfileManager();
  private topAdaptations: AdaptiveInterfaceRecord[] = [];

  adapt(input: {
    adaptationInput: AdaptiveInterfaceInput;
    config: AdaptiveInterfaceConfiguration;
    engines: AdaptiveInterfaceEngineBundle;
  }): AdaptiveInterfaceRunReport {
    const started = Date.now();
    appendAdaptiveLog({
      event: "adaptive_interface_start",
      level: "info",
      details: "Starting adaptive interface cycle",
    });

    const session =
      this.sessions.getActiveSession() ??
      this.sessions.startSession(input.adaptationInput.sessionId);

    const evolutionRecords = this.resolveEvolutionRecords(
      input.engines,
      input.adaptationInput,
    );
    const productivityRecords = this.resolveProductivityRecords(input.engines);
    const opportunities = this.resolveOpportunities(input.engines);
    const audit = this.resolveAudit(input.engines);

    const generated = this.recommendation.generate({
      engines: input.engines,
      evolutionRecords,
      productivityRecords,
      opportunities,
      audit,
      config: input.config,
    });

    const prioritized = this.prioritization.prioritize(
      generated.candidates,
      input.config,
    );

    const records = this.metadata.buildRecords({
      currentScreenId: generated.context.currentScreenId,
      currentRouteOrViewId: generated.context.currentRouteOrViewId,
      candidates: prioritized,
      recordStatus: prioritized.length > 0 ? "recommended" : "validated",
    });

    this.topAdaptations = this.prioritization.rankAdaptations(records);
    const activeProfile = this.profiles.updateProfile({
      sessionId: session.adaptationSessionId,
      candidates: generated.candidates,
      recurringPatterns: generated.recurringPatterns,
    });

    const validation = input.config.validationRulesEnabled
      ? this.validator.validate(records, input.config)
      : {
          validationReportId: `aie-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "pass" as const,
          recordsValidated: records.length,
          errors: [],
          warnings: [],
          durationMs: 0,
          metadataVersion: ADAPTIVE_METADATA_VERSION,
        };

    const success = validation.decision !== "fail";
    this.sessions.recordAdaptation(
      generated.context.currentScreenId,
      generated.context.currentRouteOrViewId,
      success,
      records.length,
    );

    appendAdaptiveLog({
      event: "adaptation_generation",
      level: success ? "info" : "warn",
      details: `Generated ${records.length} adaptive records · ${validation.decision}`,
    });

    const report: AdaptiveInterfaceRunReport = {
      adaptationRunReportId: `aie-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      records,
      activeProfile,
      validation,
      durationMs: Date.now() - started,
      metadataVersion: ADAPTIVE_METADATA_VERSION,
    };

    appendAdaptiveLog({
      event: "adaptive_interface_end",
      level: "info",
      details: `Adaptation completed in ${report.durationMs}ms`,
    });

    return report;
  }

  getTopAdaptations(): AdaptiveInterfaceRecord[] {
    return this.topAdaptations;
  }

  getSessionManager(): AdaptationSessionManager {
    return this.sessions;
  }

  getProfileManager(): InterfaceProfileManager {
    return this.profiles;
  }

  resetForTesting(): void {
    this.sessions.resetForTesting();
    this.profiles.resetForTesting();
    this.recommendation.resetForTesting();
    this.topAdaptations = [];
  }

  private resolveEvolutionRecords(
    engines: AdaptiveInterfaceEngineBundle,
    input: AdaptiveInterfaceInput,
  ): WorkflowEvolutionRecord[] {
    try {
      const wfe = engines.workflowEvolution?.getState();
      if (input.workflowEvolutionId) {
        const match = (wfe?.topRecommendations ?? []).find(
          (r) => r.workflowEvolutionId === input.workflowEvolutionId,
        );
        if (match) return [match];
        const fromReport = (wfe?.latestReport?.records ?? []).find(
          (r) => r.workflowEvolutionId === input.workflowEvolutionId,
        );
        if (fromReport) return [fromReport];
      }
      if (wfe?.latestReport?.records?.length) return wfe.latestReport.records;
      if (wfe?.topRecommendations?.length) return wfe.topRecommendations;
      if (engines.workflowEvolution && input.forceAdaptation) {
        return engines.workflowEvolution.evolve({}).records;
      }
    } catch {
      appendAdaptiveLog({
        event: "partial_t5_evolution",
        level: "warn",
        details: "Workflow evolution unavailable for adaptive interface",
      });
    }
    return [];
  }

  private resolveProductivityRecords(
    engines: AdaptiveInterfaceEngineBundle,
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
    engines: AdaptiveInterfaceEngineBundle,
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
    engines: AdaptiveInterfaceEngineBundle,
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
