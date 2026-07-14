/** T5-03 — UX Opportunity Discovery orchestration controller. */

import { appendDiscoveryLog } from "./opportunity-logging.js";
import type { UxOpportunityDiscoveryConfiguration } from "./configuration.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import type {
  EngineStatus,
  OpportunityCategory,
  OpportunityDiscoveryRunReport,
  UxOpportunityDiscoveryEngineBundle,
  UxOpportunityDiscoveryInput,
  UxOpportunityDiscoveryPerformanceStats,
} from "./types.js";
import { UxOpportunityDiscoveryManager } from "./ux-opportunity-discovery-manager.js";

function countCategory(
  opps: { opportunityCategory: OpportunityCategory }[],
  categories: OpportunityCategory[],
): number {
  return opps.filter((o) => categories.includes(o.opportunityCategory)).length;
}

export class UxOpportunityDiscoveryController {
  private config: UxOpportunityDiscoveryConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: OpportunityDiscoveryRunReport | null = null;
  private readonly manager = new UxOpportunityDiscoveryManager();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private continuousDiscoveryActive = false;
  private discoveryTimer: ReturnType<typeof setInterval> | null = null;
  private readonly performance: UxOpportunityDiscoveryPerformanceStats = {
    totalDiscoveries: 0,
    successfulDiscoveries: 0,
    failedDiscoveries: 0,
    totalOpportunitiesDiscovered: 0,
    layoutOpportunities: 0,
    componentOpportunities: 0,
    navigationOpportunities: 0,
    workflowOpportunities: 0,
    accessibilityOpportunities: 0,
    consistencyOpportunities: 0,
    duplicatesSkipped: 0,
    averageDiscoveryDurationMs: 0,
    peakDiscoveryDurationMs: 0,
    skippedCycles: 0,
  };

  constructor(
    private readonly engines: UxOpportunityDiscoveryEngineBundle,
    config: UxOpportunityDiscoveryConfiguration,
  ) {
    this.config = config;
  }

  initialize(): void {
    appendDiscoveryLog({
      event: "ux_opportunity_discovery_initialized",
      level: "info",
      details: "UX Opportunity Discovery engine ready (discover-only)",
    });
    if (this.config.continuousDiscoveryEnabled && this.config.enabled) {
      this.startContinuousDiscovery();
    }
  }

  stop(): void {
    this.stopContinuousDiscovery();
    this.status = "stopped";
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  isContinuousDiscoveryActive(): boolean {
    return this.continuousDiscoveryActive;
  }

  getConfiguration(): UxOpportunityDiscoveryConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: UxOpportunityDiscoveryConfiguration): void {
    const wasActive = this.continuousDiscoveryActive;
    if (wasActive) this.stopContinuousDiscovery();
    this.config = config;
    if (config.continuousDiscoveryEnabled && config.enabled) {
      this.startContinuousDiscovery();
    }
  }

  getLatestReport(): OpportunityDiscoveryRunReport | null {
    return this.latestReport;
  }

  getTopOpportunities() {
    return this.manager.getTopOpportunities();
  }

  getActiveSession() {
    return this.manager.getSessionManager().getActiveSession();
  }

  getPerformance(): UxOpportunityDiscoveryPerformanceStats {
    return { ...this.performance };
  }

  getHealthMonitor(): HealthMonitor {
    return this.healthMonitor;
  }

  getRecoveryManager(): RecoveryManager {
    return this.recoveryManager;
  }

  getManager(): UxOpportunityDiscoveryManager {
    return this.manager;
  }

  startContinuousDiscovery(): void {
    if (!this.config.enabled || this.discoveryTimer) return;
    this.continuousDiscoveryActive = true;
    this.status = "discovering";
    this.manager.getSessionManager().setContinuousDiscoveryActive(true);
    appendDiscoveryLog({
      event: "opportunity_discovery_start",
      level: "info",
      details: "Continuous innovation activated",
    });
    this.discoveryTimer = setInterval(() => {
      try {
        this.discover({});
      } catch {
        this.performance.skippedCycles += 1;
      }
    }, this.config.discoveryFrequencyMs);
  }

  stopContinuousDiscovery(): void {
    if (this.discoveryTimer) {
      clearInterval(this.discoveryTimer);
      this.discoveryTimer = null;
    }
    this.continuousDiscoveryActive = false;
    this.manager.getSessionManager().setContinuousDiscoveryActive(false);
    const session = this.manager.getSessionManager().getActiveSession();
    if (session) {
      this.manager.getSessionManager().endSession(session.discoverySessionId);
    }
    appendDiscoveryLog({
      event: "opportunity_discovery_end",
      level: "info",
      details: "Continuous innovation deactivated",
    });
  }

  discover(input: UxOpportunityDiscoveryInput = {}): OpportunityDiscoveryRunReport {
    if (!this.config.enabled) {
      throw new Error("UX Opportunity Discovery is disabled by configuration");
    }
    if (!this.config.discoverOnlyMode) {
      throw new Error("UX Opportunity Discovery must remain discover-only");
    }

    this.status = "detecting_opportunities";

    try {
      this.status = "prioritizing";
      const report = this.manager.discover({
        discoveryInput: input,
        config: this.config,
        engines: this.engines,
      });

      this.status = "validating";
      this.latestReport = report;
      this.performance.totalDiscoveries += 1;
      this.performance.totalOpportunitiesDiscovered += report.opportunities.length;

      const opps = report.opportunities;
      this.performance.layoutOpportunities += countCategory(opps, [
        "layout_improvement",
        "readability_improvement",
        "information_hierarchy_improvement",
      ]);
      this.performance.componentOpportunities += countCategory(opps, ["component_improvement"]);
      this.performance.navigationOpportunities += countCategory(opps, ["navigation_improvement"]);
      this.performance.workflowOpportunities += countCategory(opps, ["workflow_improvement"]);
      this.performance.accessibilityOpportunities += countCategory(opps, [
        "accessibility_improvement",
        "feedback_improvement",
      ]);
      this.performance.consistencyOpportunities += countCategory(opps, [
        "visual_consistency_improvement",
        "responsive_improvement",
      ]);

      this.performance.peakDiscoveryDurationMs = Math.max(
        this.performance.peakDiscoveryDurationMs,
        report.durationMs,
      );
      this.performance.averageDiscoveryDurationMs = Math.round(
        (this.performance.averageDiscoveryDurationMs * (this.performance.totalDiscoveries - 1) +
          report.durationMs) /
          this.performance.totalDiscoveries,
      );

      const success =
        report.validation.decision === "pass" || report.validation.decision === "partial";
      if (success) {
        this.performance.successfulDiscoveries += 1;
        this.recoveryManager.recordSuccess();
        this.healthMonitor.recordDiscovery(true, report.validation.decision);
        this.status = this.continuousDiscoveryActive ? "discovering" : "idle";
      } else {
        this.performance.failedDiscoveries += 1;
        this.recoveryManager.recordFailure("Validation failed", this.config);
        this.healthMonitor.recordDiscovery(false, report.validation.decision);
        this.status = "failed";
      }

      return report;
    } catch (error) {
      this.status = "failed";
      this.performance.failedDiscoveries += 1;
      const message = error instanceof Error ? error.message : "Discovery failed";
      this.recoveryManager.recordFailure(message, this.config);
      throw error;
    }
  }
}
