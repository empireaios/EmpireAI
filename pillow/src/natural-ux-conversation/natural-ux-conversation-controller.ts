/** T4-01 — Natural UX Conversation orchestration controller. */

import type { AutonomousBuilderCertificationEngine } from "../autonomous-builder-certification-engine/engine.js";
import type { RecommendationEngine } from "../recommendation-engine/engine.js";
import type { FrontendBuilder } from "../frontend-builder/engine.js";
import type { UxIntelligenceCertificationEngine } from "../ux-intelligence-certification-engine/engine.js";
import { appendConversationLog } from "./conversation-logging.js";
import { NaturalUxConversationManager } from "./natural-ux-conversation-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import type { NaturalUxConversationConfiguration } from "./configuration.js";
import type {
  ConversationPerformanceStats,
  ConversationRunReport,
  EngineStatus,
} from "./types.js";

export type NaturalUxConversationEngineBundle = {
  autonomousBuilderCertification: AutonomousBuilderCertificationEngine;
  uxIntelligenceCertification: UxIntelligenceCertificationEngine;
  recommendationEngine: RecommendationEngine;
  frontendBuilder: FrontendBuilder;
};

export class NaturalUxConversationController {
  private config: NaturalUxConversationConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: ConversationRunReport | null = null;
  private readonly manager = new NaturalUxConversationManager();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: ConversationPerformanceStats = {
    totalConversations: 0,
    successfulConversations: 0,
    failedConversations: 0,
    totalTurns: 0,
    clarificationsRequested: 0,
    builderRequestsGenerated: 0,
    averageConversationDurationMs: 0,
    peakConversationDurationMs: 0,
  };

  constructor(
    private readonly engines: NaturalUxConversationEngineBundle,
    config: NaturalUxConversationConfiguration,
  ) {
    this.config = config;
  }

  initialize(): void {
    appendConversationLog({
      event: "conversation_engine_initialized",
      level: "info",
      details: "Natural UX Conversation started",
    });
    // Touch certified upstream readiness without executing builder changes
    try {
      void this.engines.autonomousBuilderCertification.getState();
      void this.engines.uxIntelligenceCertification.getState();
    } catch {
      appendConversationLog({
        event: "partial_conversation_input",
        level: "warn",
        details: "Upstream certification state unavailable at init",
      });
    }
  }

  stop(): void {
    this.status = "stopped";
    appendConversationLog({
      event: "conversation_engine_stop",
      level: "info",
      details: "Natural UX Conversation stopped",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): NaturalUxConversationConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: NaturalUxConversationConfiguration): void {
    this.config = config;
  }

  getLatestReport(): ConversationRunReport | null {
    return this.latestReport;
  }

  getPerformance(): ConversationPerformanceStats {
    return { ...this.performance };
  }

  getHealthMonitor(): HealthMonitor {
    return this.healthMonitor;
  }

  getRecoveryManager(): RecoveryManager {
    return this.recoveryManager;
  }

  getManager(): NaturalUxConversationManager {
    return this.manager;
  }

  converse(userRequest: string, sessionId?: string): ConversationRunReport {
    if (!this.config.enabled) {
      throw new Error("Natural UX Conversation is disabled by configuration");
    }

    this.status = "conversing";

    try {
      const report = this.manager.converse({
        userRequest,
        sessionId,
        config: this.config,
      });

      if (report.latestTurn?.clarificationStatus === "pending") {
        this.status = "clarifying";
      } else if (report.latestTurn?.generatedBuilderRequests.some((r) => !r.requiresClarification)) {
        this.status = "planning";
      } else {
        this.status = "idle";
      }

      this.latestReport = report;
      this.performance.totalConversations += 1;
      this.performance.totalTurns += 1;
      this.performance.clarificationsRequested +=
        report.latestTurn?.clarificationQuestions.length ?? 0;
      this.performance.builderRequestsGenerated +=
        report.latestTurn?.generatedBuilderRequests.length ?? 0;
      this.performance.peakConversationDurationMs = Math.max(
        this.performance.peakConversationDurationMs,
        report.durationMs,
      );
      this.performance.averageConversationDurationMs = Math.round(
        (this.performance.averageConversationDurationMs *
          (this.performance.totalConversations - 1) +
          report.durationMs) /
          this.performance.totalConversations,
      );

      const success =
        report.validation.decision === "pass" || report.validation.decision === "partial";
      if (success) {
        this.performance.successfulConversations += 1;
        this.recoveryManager.recordSuccess();
      } else {
        this.performance.failedConversations += 1;
        const shouldRecover = this.recoveryManager.recordFailure(
          `Conversation decision: ${report.validation.decision}`,
          this.config,
        );
        if (shouldRecover) {
          this.status = "recovering";
          this.status = "idle";
        }
      }

      this.healthMonitor.recordConversation(success, report.validation.decision);
      if (this.status === "clarifying" || this.status === "planning") {
        // leave clarifying/planning visible briefly then settle for next turn readiness
      } else {
        this.status = "idle";
      }

      return report;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Conversation failed";
      this.status = "failed";
      this.recoveryManager.recordFailure(message, this.config);
      this.performance.failedConversations += 1;
      appendConversationLog({
        event: "conversation_failure",
        level: "error",
        details: message,
      });
      throw error;
    }
  }
}
