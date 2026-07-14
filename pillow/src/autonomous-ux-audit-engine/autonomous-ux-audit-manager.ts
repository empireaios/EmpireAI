/** T5-02 — Autonomous UX Audit Manager — core audit pipeline. */

import type { ObservationRecord } from "../continuous-screen-observation-engine/types.js";
import type { AutonomousUxAuditConfiguration } from "./configuration.js";
import { appendAuditLog } from "./audit-logging.js";
import { AuditMetadataGenerator } from "./audit-metadata-generator.js";
import { AuditSessionManager } from "./audit-session-manager.js";
import { AuditValidator } from "./audit-validator.js";
import { AUDIT_METADATA_VERSION } from "./paths.js";
import type {
  AutonomousUxAuditEngineBundle,
  AutonomousUxAuditInput,
  AutonomousUxAuditRunReport,
  DetectedUxIssue,
  UxAuditRecord,
} from "./types.js";
import { UxAuditEngine } from "./ux-audit-engine.js";

export class AutonomousUxAuditManager {
  private readonly sessions = new AuditSessionManager();
  private readonly auditEngine = new UxAuditEngine();
  private readonly metadata = new AuditMetadataGenerator();
  private readonly validator = new AuditValidator();
  private latestAudit: UxAuditRecord | null = null;

  audit(input: {
    auditInput: AutonomousUxAuditInput;
    config: AutonomousUxAuditConfiguration;
    engines: AutonomousUxAuditEngineBundle;
  }): AutonomousUxAuditRunReport {
    const started = Date.now();
    appendAuditLog({
      event: "autonomous_ux_audit_start",
      level: "info",
      details: "Starting UX audit cycle",
    });

    const session =
      this.sessions.getActiveSession() ??
      this.sessions.startSession(input.auditInput.sessionId);

    const observation = this.resolveObservation(input.engines, input.auditInput);
    const issues = this.auditEngine.detectIssues({
      engines: input.engines,
      observation,
      config: input.config,
    });

    const confidence = this.computeConfidence(observation, issues);
    const audit = this.metadata.buildRecord({
      sourceObservationId: observation?.observationId ?? input.auditInput.observationId ?? null,
      currentScreenId: observation?.currentScreenId ?? null,
      currentRouteOrViewId: observation?.currentRouteOrViewId ?? null,
      issues,
      confidenceScore: confidence,
      auditStatus: issues.length > 0 ? "recorded" : "validated",
    });

    const validation = input.config.validationRulesEnabled
      ? this.validator.validate(audit, input.config)
      : {
          validationReportId: audit.auditId,
          validationTimestamp: new Date().toISOString(),
          decision: "pass" as const,
          auditsValidated: 1,
          errors: [],
          warnings: [],
          durationMs: 0,
          metadataVersion: AUDIT_METADATA_VERSION,
        };

    this.latestAudit = audit;
    const success = validation.decision !== "fail";
    this.sessions.recordAudit(
      audit.currentScreenId,
      audit.currentRouteOrViewId,
      success,
      issues.length,
    );

    appendAuditLog({
      event: "audit_record_created",
      level: success ? "info" : "warn",
      details: `Audit ${audit.auditId} · ${issues.length} issues · ${validation.decision}`,
    });

    const report: AutonomousUxAuditRunReport = {
      auditRunReportId: audit.auditId,
      runTimestamp: new Date().toISOString(),
      audit,
      validation,
      durationMs: Date.now() - started,
      metadataVersion: AUDIT_METADATA_VERSION,
    };

    appendAuditLog({
      event: "autonomous_ux_audit_end",
      level: "info",
      details: `UX audit completed in ${report.durationMs}ms`,
    });

    return report;
  }

  getLatestAudit(): UxAuditRecord | null {
    return this.latestAudit;
  }

  getSessionManager(): AuditSessionManager {
    return this.sessions;
  }

  resetForTesting(): void {
    this.sessions.resetForTesting();
    this.latestAudit = null;
  }

  private resolveObservation(
    engines: AutonomousUxAuditEngineBundle,
    input: AutonomousUxAuditInput,
  ): ObservationRecord | null {
    try {
      const cso = engines.continuousScreenObservation?.getState();
      if (input.observationId && cso?.latestObservation?.observationId === input.observationId) {
        return cso.latestObservation;
      }
      if (cso?.latestObservation) return cso.latestObservation;
      if (cso?.latestReport?.observation) return cso.latestReport.observation;

      if (engines.continuousScreenObservation && input.forceAudit) {
        const report = engines.continuousScreenObservation.observe({});
        return report.observation;
      }
    } catch {
      appendAuditLog({
        event: "partial_t5_observation",
        level: "warn",
        details: "Continuous screen observation unavailable for audit",
      });
    }
    return null;
  }

  private computeConfidence(
    observation: ObservationRecord | null,
    issues: DetectedUxIssue[],
  ): number {
    let confidence = 0.45;
    if (observation) confidence = Math.max(confidence, observation.confidenceScore);
    if (issues.length > 0) {
      const avg =
        issues.reduce((sum, i) => sum + i.detectionConfidence, 0) / issues.length;
      confidence = Math.max(confidence, avg);
    }
    return Math.min(1, confidence);
  }
}
