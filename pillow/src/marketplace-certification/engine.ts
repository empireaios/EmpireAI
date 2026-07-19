import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildMarketplaceCertificationConfiguration,
  type MarketplaceCertificationConfiguration,
} from "./configuration.js";
import {
  appendCertificationLog,
  getCertificationLogs,
  resetCertificationLogsForTesting,
} from "./mct-logging.js";
import {
  MARKETPLACE_CERTIFICATION_SYSTEM_PATH,
  CERTIFICATION_SCHEMA_VERSION,
} from "./paths.js";
import type {
  MarketplaceCertificationCockpitSnapshot,
  MarketplaceCertificationReport,
  MarketplaceCertificationState,
  RunCertificationInput,
} from "./types.js";
import { MarketplaceCertificationController } from "./marketplace-certification-controller.js";
import { MarketplaceCertificationManager } from "./marketplace-certification-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import type { MarketplaceCertificationContext } from "./marketplace-certification-context.js";

export interface MarketplaceCertificationEngineOptions {
  configuration?: Partial<MarketplaceCertificationConfiguration>;
}

/**
 * Marketplace Certification (PILLOW-MCT-001 / R1-15).
 * Validates the complete Marketplace Integration programme (R1-01 through R1-14).
 */
export class MarketplaceCertificationEngine {
  private initializedAt: string | null = null;
  private readonly controller: MarketplaceCertificationController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    ctx: MarketplaceCertificationContext,
    options: MarketplaceCertificationEngineOptions = {},
  ) {
    const config = buildMarketplaceCertificationConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new MarketplaceCertificationManager();
    this.controller = new MarketplaceCertificationController(ctx, manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<MarketplaceCertificationState> {
    const doc = await this.reader.readText(MARKETPLACE_CERTIFICATION_SYSTEM_PATH);
    if (!doc?.includes("Marketplace Certification")) {
      throw new Error(
        `${MARKETPLACE_CERTIFICATION_SYSTEM_PATH} missing — Marketplace Certification requires R1-15 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendCertificationLog({
      event: "engine_initialization",
      level: "info",
      details: "R1-15 Marketplace Certification initialized",
    });
    return this.getState();
  }

  getState(): MarketplaceCertificationState {
    if (!this.initializedAt) {
      throw new Error(
        "Marketplace Certification not initialized. Call initialize() first.",
      );
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const health = this.controller.getHealthMonitor().buildReport({
      config,
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-MCT-001",
      missionId: "R1-15",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      health,
      performance,
    };
  }

  async runCertification(
    input: RunCertificationInput = {},
  ): Promise<MarketplaceCertificationReport> {
    return this.controller.runCertification(input);
  }

  validateLatestReport() {
    return this.controller.validateLatestReport();
  }

  getLatestReport(): MarketplaceCertificationReport | null {
    return this.controller.getLatestReport();
  }

  getCertifiedMissionCatalog() {
    return this.controller.getManager().getCertifiedMissionCatalog();
  }

  updateConfiguration(
    overrides: Partial<MarketplaceCertificationConfiguration>,
  ): MarketplaceCertificationState {
    const next = buildMarketplaceCertificationConfiguration(this.bootstrap.repositoryRoot, {
      ...this.controller.getConfiguration(),
      ...overrides,
    });
    this.controller.updateConfiguration(next);
    return this.getState();
  }

  validateForSupervisorSync(): {
    valid: boolean;
    health: "healthy" | "degraded" | "blocked";
    readinessScore: number;
    notes: string[];
  } {
    const state = this.getState();
    const report = state.latestReport;
    const score = report
      ? report.overallCertificationStatus === "certified"
        ? 100
        : report.overallCertificationStatus === "partial"
          ? 70
          : 40
      : state.health.healthScore;

    return {
      valid: state.health.status !== "failed",
      health: score >= 75 ? "healthy" : score >= 50 ? "degraded" : "blocked",
      readinessScore: score,
      notes: [
        `Certification status: ${state.status}`,
        report
          ? `Last certification: ${report.overallCertificationStatus} · ${report.certificationId}`
          : "No certification runs yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): MarketplaceCertificationCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      lastCertificationAt: state.health.lastCertificationAt,
      lastCertificationStatus: state.health.lastCertificationStatus,
      missionsCertified: state.health.missionsCertified,
      overallCertificationStatus: report?.overallCertificationStatus ?? null,
      schemaVersion: CERTIFICATION_SCHEMA_VERSION,
      recentLogs: getCertificationLogs(8, state.configuration).map(
        (l) => `${l.event}: ${l.details}`,
      ),
    };
  }
}

export function createMarketplaceCertificationEngine(
  bootstrap: EmpireBootstrapContext,
  ctx: MarketplaceCertificationContext,
  options?: MarketplaceCertificationEngineOptions,
): MarketplaceCertificationEngine {
  return new MarketplaceCertificationEngine(bootstrap, ctx, options);
}

export function resetMarketplaceCertificationForTesting(): void {
  resetCertificationLogsForTesting();
  new MarketplaceCertificationManager().resetForTesting();
  new HealthMonitor().resetForTesting();
  new RecoveryManager().reset();
}
