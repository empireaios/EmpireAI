import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { UxIntelligenceCertificationEngine } from "../ux-intelligence-certification-engine/engine.js";
import type { RecommendationEngine } from "../recommendation-engine/engine.js";
import type { DesignSystemIntelligenceEngine } from "../design-system-intelligence-engine/engine.js";
import type { ExecutiveStyleLearningEngine } from "../executive-style-learning-engine/engine.js";
import type { FrontendBuilder } from "../frontend-builder/engine.js";
import type { ComponentGenerator } from "../component-generator/engine.js";
import type { LayoutRefactoringEngine } from "../layout-refactoring/engine.js";
import type { ThemeBuilder } from "../theme-builder/engine.js";
import type { PreviewGenerator } from "../preview-generator/engine.js";
import type { ValidationEngine } from "../validation-engine/engine.js";
import type { RegressionProtectionEngine } from "../regression-protection/engine.js";
import type { RollbackManagerEngine } from "../rollback-manager/engine.js";
import type { ChangeDocumentationEngine } from "../change-documentation/engine.js";
import {
  appendCertificationLog,
  getCertificationLogs,
  resetCertificationLogsForTesting,
} from "./certification-logging.js";
import { CertificationController } from "./certification-controller.js";
import {
  buildAutonomousBuilderCertificationConfiguration,
  type AutonomousBuilderCertificationConfiguration,
} from "./configuration.js";
import { AUTONOMOUS_BUILDER_CERTIFICATION_SYSTEM_PATH } from "./paths.js";
import type {
  AutonomousBuilderCertificationReport,
  AutonomousBuilderCertificationState,
  CertificationCockpitSnapshot,
} from "./types.js";

export interface AutonomousBuilderCertificationEngineOptions {
  configuration?: Partial<AutonomousBuilderCertificationConfiguration>;
}

/**
 * Autonomous Builder Certification Engine (PILLOW-ABC-001 / T3-10).
 * Validates the complete T3 Autonomous Builder pipeline (T3-01 through T3-09).
 */
export class AutonomousBuilderCertificationEngine {
  private initializedAt: string | null = null;
  private readonly controller: CertificationController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    uxIntelligenceCertification: UxIntelligenceCertificationEngine,
    recommendationEngine: RecommendationEngine,
    designSystemIntelligence: DesignSystemIntelligenceEngine,
    executiveStyleLearning: ExecutiveStyleLearningEngine,
    frontendBuilder: FrontendBuilder,
    componentGenerator: ComponentGenerator,
    layoutRefactoring: LayoutRefactoringEngine,
    themeBuilder: ThemeBuilder,
    previewGenerator: PreviewGenerator,
    validationEngine: ValidationEngine,
    regressionProtection: RegressionProtectionEngine,
    rollbackManager: RollbackManagerEngine,
    changeDocumentation: ChangeDocumentationEngine,
    options: AutonomousBuilderCertificationEngineOptions = {},
  ) {
    const config = buildAutonomousBuilderCertificationConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    this.controller = new CertificationController(
      bootstrap.repositoryRoot,
      {
        uxIntelligenceCertification,
        recommendationEngine,
        designSystemIntelligence,
        executiveStyleLearning,
        frontendBuilder,
        componentGenerator,
        layoutRefactoring,
        themeBuilder,
        previewGenerator,
        validationEngine,
        regressionProtection,
        rollbackManager,
        changeDocumentation,
      },
      config,
    );
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<AutonomousBuilderCertificationState> {
    const doc = await this.reader.readText(AUTONOMOUS_BUILDER_CERTIFICATION_SYSTEM_PATH);
    if (!doc?.includes("Autonomous Builder Certification")) {
      throw new Error(
        `${AUTONOMOUS_BUILDER_CERTIFICATION_SYSTEM_PATH} missing — Autonomous Builder Certification requires T3-10 system doc.`,
      );
    }
    this.initializedAt = new Date().toISOString();
    appendCertificationLog({
      event: "certification_engine_initialized",
      level: "info",
      details: "Autonomous Builder Certification Engine initialized",
    });
    return this.getState();
  }

  getState(): AutonomousBuilderCertificationState {
    if (!this.initializedAt) {
      throw new Error(
        "Autonomous Builder Certification Engine not initialized. Call initialize() first.",
      );
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const health = this.controller.getHealthMonitor().buildReport({
      config,
      status: this.controller.getStatus(),
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-ABC-001",
      missionId: "T3-10",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      health,
      performance,
    };
  }

  async runCertification(): Promise<AutonomousBuilderCertificationReport> {
    return this.controller.runCertification();
  }

  getLatestReport(): AutonomousBuilderCertificationReport | null {
    return this.controller.getLatestReport();
  }

  updateConfiguration(
    overrides: Partial<AutonomousBuilderCertificationConfiguration>,
  ): AutonomousBuilderCertificationState {
    const next = buildAutonomousBuilderCertificationConfiguration(this.bootstrap.repositoryRoot, {
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
      ? report.finalCertificationDecision === "pass"
        ? 100
        : report.finalCertificationDecision === "conditional"
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
          ? `Last decision: ${report.finalCertificationDecision} · ${report.missionResults.filter((m) => m.passed).length}/${report.missionResults.length} missions passed`
          : "No certification run yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): CertificationCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;
    const missionsPassed = report?.missionResults.filter((m) => m.passed).length ?? 0;
    const missionsFailed = report ? report.missionResults.length - missionsPassed : 0;

    return {
      certificationStatus: state.status,
      healthStatus: state.health.status,
      lastDecision: report?.finalCertificationDecision ?? state.health.lastCertificationDecision,
      missionsPassed,
      missionsFailed,
      endToEndPassed: report?.endToEndValidationResult.passed ?? false,
      totalCertifications: state.performance.totalCertifications,
      recentLogs: getCertificationLogs(8, state.configuration).map(
        (l) => `${l.event}: ${l.details}`,
      ),
    };
  }
}

export function createAutonomousBuilderCertificationEngine(
  bootstrap: EmpireBootstrapContext,
  uxIntelligenceCertification: UxIntelligenceCertificationEngine,
  recommendationEngine: RecommendationEngine,
  designSystemIntelligence: DesignSystemIntelligenceEngine,
  executiveStyleLearning: ExecutiveStyleLearningEngine,
  frontendBuilder: FrontendBuilder,
  componentGenerator: ComponentGenerator,
  layoutRefactoring: LayoutRefactoringEngine,
  themeBuilder: ThemeBuilder,
  previewGenerator: PreviewGenerator,
  validationEngine: ValidationEngine,
  regressionProtection: RegressionProtectionEngine,
  rollbackManager: RollbackManagerEngine,
  changeDocumentation: ChangeDocumentationEngine,
  options?: AutonomousBuilderCertificationEngineOptions,
): AutonomousBuilderCertificationEngine {
  return new AutonomousBuilderCertificationEngine(
    bootstrap,
    uxIntelligenceCertification,
    recommendationEngine,
    designSystemIntelligence,
    executiveStyleLearning,
    frontendBuilder,
    componentGenerator,
    layoutRefactoring,
    themeBuilder,
    previewGenerator,
    validationEngine,
    regressionProtection,
    rollbackManager,
    changeDocumentation,
    options,
  );
}

export function resetAutonomousBuilderCertificationForTesting(): void {
  resetCertificationLogsForTesting();
}
