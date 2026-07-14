/** T5-03 — UX Opportunity Discovery Manager — core discovery pipeline. */

import type { UxAuditRecord } from "../autonomous-ux-audit-engine/types.js";
import type { ObservationRecord } from "../continuous-screen-observation-engine/types.js";
import type { UxOpportunityDiscoveryConfiguration } from "./configuration.js";
import { appendDiscoveryLog } from "./opportunity-logging.js";
import { OpportunityDetectionEngine } from "./opportunity-detection-engine.js";
import { OpportunityMetadataGenerator } from "./opportunity-metadata-generator.js";
import { OpportunitySessionManager } from "./opportunity-session-manager.js";
import { OpportunityValidator } from "./opportunity-validator.js";
import { OPPORTUNITY_METADATA_VERSION } from "./paths.js";
import type {
  OpportunityDiscoveryRunReport,
  OpportunityRecord,
  UxOpportunityDiscoveryEngineBundle,
  UxOpportunityDiscoveryInput,
} from "./types.js";
import { UxPrioritizationEngine } from "./ux-prioritization-engine.js";

export class UxOpportunityDiscoveryManager {
  private readonly sessions = new OpportunitySessionManager();
  private readonly detection = new OpportunityDetectionEngine();
  private readonly prioritization = new UxPrioritizationEngine();
  private readonly metadata = new OpportunityMetadataGenerator();
  private readonly validator = new OpportunityValidator();
  private topOpportunities: OpportunityRecord[] = [];

  discover(input: {
    discoveryInput: UxOpportunityDiscoveryInput;
    config: UxOpportunityDiscoveryConfiguration;
    engines: UxOpportunityDiscoveryEngineBundle;
  }): OpportunityDiscoveryRunReport {
    const started = Date.now();
    appendDiscoveryLog({
      event: "opportunity_discovery_start",
      level: "info",
      details: "Starting UX opportunity discovery cycle",
    });

    this.sessions.getActiveSession() ??
      this.sessions.startSession(input.discoveryInput.sessionId);

    const audit = this.resolveAudit(input.engines, input.discoveryInput);
    const observation = this.resolveObservation(input.engines);

    const candidates = this.detection.detect({
      engines: input.engines,
      audit,
      observation,
      config: input.config,
    });

    const prioritized = this.prioritization.prioritize(candidates, input.config);
    const opportunities = this.metadata.buildRecords({
      sourceAuditId: audit?.auditId ?? input.discoveryInput.auditId ?? null,
      sourceObservationId: audit?.sourceObservationId ?? observation?.observationId ?? null,
      currentScreenId: audit?.currentScreenId ?? observation?.currentScreenId ?? null,
      currentRouteOrViewId:
        audit?.currentRouteOrViewId ?? observation?.currentRouteOrViewId ?? null,
      candidates: prioritized,
      opportunityStatus: prioritized.length > 0 ? "discovered" : "validated",
    });

    this.topOpportunities = this.prioritization.rankOpportunities(opportunities);

    const validation = input.config.validationRulesEnabled
      ? this.validator.validate(opportunities, input.config)
      : {
          validationReportId: `uod-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "pass" as const,
          opportunitiesValidated: opportunities.length,
          errors: [],
          warnings: [],
          durationMs: 0,
          metadataVersion: OPPORTUNITY_METADATA_VERSION,
        };

    const success = validation.decision !== "fail";
    this.sessions.recordDiscovery(
      audit?.currentScreenId ?? observation?.currentScreenId ?? null,
      audit?.currentRouteOrViewId ?? observation?.currentRouteOrViewId ?? null,
      success,
      opportunities.length,
    );

    appendDiscoveryLog({
      event: "opportunity_record_generation",
      level: success ? "info" : "warn",
      details: `Generated ${opportunities.length} opportunities · ${validation.decision}`,
    });

    const report: OpportunityDiscoveryRunReport = {
      discoveryRunReportId: `uod-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      opportunities,
      validation,
      durationMs: Date.now() - started,
      metadataVersion: OPPORTUNITY_METADATA_VERSION,
    };

    appendDiscoveryLog({
      event: "opportunity_discovery_end",
      level: "info",
      details: `Discovery completed in ${report.durationMs}ms`,
    });

    return report;
  }

  getTopOpportunities(): OpportunityRecord[] {
    return this.topOpportunities;
  }

  getSessionManager(): OpportunitySessionManager {
    return this.sessions;
  }

  resetForTesting(): void {
    this.sessions.resetForTesting();
    this.detection.resetForTesting();
    this.topOpportunities = [];
  }

  private resolveAudit(
    engines: UxOpportunityDiscoveryEngineBundle,
    input: UxOpportunityDiscoveryInput,
  ): UxAuditRecord | null {
    try {
      const aua = engines.autonomousUxAudit?.getState();
      if (input.auditId && aua?.latestAudit?.auditId === input.auditId) {
        return aua.latestAudit;
      }
      if (aua?.latestAudit) return aua.latestAudit;
      if (aua?.latestReport?.audit) return aua.latestReport.audit;
      if (engines.autonomousUxAudit && input.forceDiscovery) {
        return engines.autonomousUxAudit.audit({}).audit;
      }
    } catch {
      appendDiscoveryLog({
        event: "partial_t5_audit",
        level: "warn",
        details: "Autonomous UX audit unavailable for discovery",
      });
    }
    return null;
  }

  private resolveObservation(
    engines: UxOpportunityDiscoveryEngineBundle,
  ): ObservationRecord | null {
    try {
      const cso = engines.continuousScreenObservation?.getState();
      return cso?.latestObservation ?? cso?.latestReport?.observation ?? null;
    } catch {
      return null;
    }
  }
}
