/** T4-04 — Multi-Proposal Generator orchestration controller. */

import { appendProposalLog } from "./proposal-logging.js";
import {
  MultiProposalGeneratorManager,
  type MultiProposalGeneratorEngineBundle,
} from "./multi-proposal-generator-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import type { MultiProposalGeneratorConfiguration } from "./configuration.js";
import type {
  EngineStatus,
  ProposalGenerationInput,
  ProposalGenerationRunReport,
  ProposalGeneratorPerformanceStats,
} from "./types.js";

export class MultiProposalGeneratorController {
  private config: MultiProposalGeneratorConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: ProposalGenerationRunReport | null = null;
  private readonly manager = new MultiProposalGeneratorManager();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: ProposalGeneratorPerformanceStats = {
    totalGenerations: 0,
    successfulGenerations: 0,
    failedGenerations: 0,
    totalProposalsGenerated: 0,
    averageProposalsPerRun: 0,
    uxFindingsLinked: 0,
    builderCapabilitiesLinked: 0,
    averageGenerationDurationMs: 0,
    peakGenerationDurationMs: 0,
  };

  constructor(
    private readonly engines: MultiProposalGeneratorEngineBundle,
    config: MultiProposalGeneratorConfiguration,
  ) {
    this.config = config;
  }

  initialize(): void {
    appendProposalLog({
      event: "multi_proposal_generator_initialized",
      level: "info",
      details: "Multi-Proposal Generator started",
    });
    try {
      void this.engines.autonomousBuilderCertification?.getState();
      void this.engines.recommendationEngine?.getState();
    } catch {
      appendProposalLog({
        event: "partial_proposal_input",
        level: "warn",
        details: "Upstream engine state unavailable at init",
      });
    }
  }

  stop(): void {
    this.status = "stopped";
    appendProposalLog({
      event: "multi_proposal_generator_stop",
      level: "info",
      details: "Multi-Proposal Generator stopped",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): MultiProposalGeneratorConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: MultiProposalGeneratorConfiguration): void {
    this.config = config;
  }

  getLatestReport(): ProposalGenerationRunReport | null {
    return this.latestReport;
  }

  getPerformance(): ProposalGeneratorPerformanceStats {
    return { ...this.performance };
  }

  getHealthMonitor(): HealthMonitor {
    return this.healthMonitor;
  }

  getRecoveryManager(): RecoveryManager {
    return this.recoveryManager;
  }

  getManager(): MultiProposalGeneratorManager {
    return this.manager;
  }

  generateProposals(input: ProposalGenerationInput): ProposalGenerationRunReport {
    if (!this.config.enabled) {
      throw new Error("Multi-Proposal Generator is disabled by configuration");
    }

    this.status = "interpreting";

    try {
      this.status = "generating";
      const report = this.manager.generateProposals({
        generationInput: input,
        config: this.config,
        engines: this.engines,
      });

      this.status = "validating";
      this.latestReport = report;
      const count = report.proposals.length;
      this.performance.totalGenerations += 1;
      this.performance.totalProposalsGenerated += count;
      this.performance.averageProposalsPerRun = Math.round(
        this.performance.totalProposalsGenerated / this.performance.totalGenerations,
      );
      this.performance.uxFindingsLinked += report.proposals.reduce(
        (sum, p) => sum + p.linkedUxFindingIds.length,
        0,
      );
      this.performance.builderCapabilitiesLinked += report.proposals.reduce(
        (sum, p) => sum + p.linkedBuilderCapabilities.length,
        0,
      );
      this.performance.peakGenerationDurationMs = Math.max(
        this.performance.peakGenerationDurationMs,
        report.durationMs,
      );
      this.performance.averageGenerationDurationMs = Math.round(
        (this.performance.averageGenerationDurationMs *
          (this.performance.totalGenerations - 1) +
          report.durationMs) /
          this.performance.totalGenerations,
      );

      const success =
        report.validation.decision === "pass" || report.validation.decision === "partial";
      if (success) {
        this.performance.successfulGenerations += 1;
        this.recoveryManager.recordSuccess();
      } else {
        this.performance.failedGenerations += 1;
        const shouldRecover = this.recoveryManager.recordFailure(
          `Generation decision: ${report.validation.decision}`,
          this.config,
        );
        if (shouldRecover) {
          this.status = "recovering";
          this.status = "idle";
        }
      }

      this.healthMonitor.recordGeneration(success, report.validation.decision);
      this.status = "idle";
      return report;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Proposal generation failed";
      this.status = "failed";
      this.recoveryManager.recordFailure(message, this.config);
      this.performance.failedGenerations += 1;
      appendProposalLog({
        event: "proposal_generation_failure",
        level: "error",
        details: message,
      });
      throw error;
    }
  }
}
