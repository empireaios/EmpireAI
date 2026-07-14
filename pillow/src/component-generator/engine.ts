import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { DesignSystemIntelligenceEngine } from "../design-system-intelligence-engine/engine.js";
import type { ExecutiveStyleLearningEngine } from "../executive-style-learning-engine/engine.js";
import type { RecommendationEngine } from "../recommendation-engine/engine.js";
import type { FrontendBuilder } from "../frontend-builder/engine.js";
import {
  appendGenerationLog,
  getGenerationLogs,
  resetGenerationLogsForTesting,
} from "./generation-logging.js";
import { GenerationController } from "./generation-controller.js";
import {
  buildComponentGeneratorConfiguration,
  type ComponentGeneratorConfiguration,
} from "./configuration.js";
import { COMPONENT_GENERATOR_SYSTEM_PATH } from "./paths.js";
import type {
  ComponentGeneratorCockpitSnapshot,
  ComponentGeneratorState,
  ComponentGenerationReport,
} from "./types.js";
import { resetComponentRegistryForTesting } from "./component-registry-manager.js";

export interface ComponentGeneratorOptions {
  configuration?: Partial<ComponentGeneratorConfiguration>;
}

/**
 * Component Generator (PILLOW-CG-001 / T3-02).
 * Generates reusable UI components from approved UX recommendations and frontend build plans.
 */
export class ComponentGenerator {
  private initializedAt: string | null = null;
  private readonly controller: GenerationController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    recommendationEngine: RecommendationEngine,
    frontendBuilder: FrontendBuilder,
    designSystemIntelligence: DesignSystemIntelligenceEngine,
    executiveStyleLearning: ExecutiveStyleLearningEngine,
    options: ComponentGeneratorOptions = {},
  ) {
    const config = buildComponentGeneratorConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    this.controller = new GenerationController(
      {
        recommendationEngine,
        frontendBuilder,
        designSystemIntelligence,
        executiveStyleLearning,
      },
      config,
    );
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<ComponentGeneratorState> {
    const doc = await this.reader.readText(COMPONENT_GENERATOR_SYSTEM_PATH);
    if (!doc?.includes("Component Generator")) {
      throw new Error(
        `${COMPONENT_GENERATOR_SYSTEM_PATH} missing — Component Generator requires T3-02 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendGenerationLog({
      event: "component_generator_ready",
      level: "info",
      details: "Component Generator initialized",
    });
    return this.getState();
  }

  getState(): ComponentGeneratorState {
    if (!this.initializedAt) {
      throw new Error("Component Generator not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const health = this.controller.getHealthMonitor().buildReport({
      config,
      status: this.controller.getStatus(),
      performance,
      generationsCompleted: performance.totalGenerations,
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-CG-001",
      missionId: "T3-02",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      health,
      performance,
    };
  }

  generateComponents(): ComponentGenerationReport {
    return this.controller.generateComponents();
  }

  getLatestReport(): ComponentGenerationReport | null {
    return this.controller.getLatestReport();
  }

  stopComponentGenerator(): ComponentGeneratorState {
    this.controller.stop();
    return this.getState();
  }

  updateConfiguration(
    overrides: Partial<ComponentGeneratorConfiguration>,
  ): ComponentGeneratorState {
    const next = buildComponentGeneratorConfiguration(this.bootstrap.repositoryRoot, {
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
      ? report.validation.decision === "pass"
        ? 100
        : report.validation.decision === "partial"
          ? 70
          : 40
      : state.health.healthScore;

    return {
      valid: state.health.status !== "failed",
      health: score >= 75 ? "healthy" : score >= 50 ? "degraded" : "blocked",
      readinessScore: score,
      notes: [
        `Engine status: ${state.status}`,
        `Generations completed: ${state.performance.totalGenerations}`,
        report
          ? `Last generation: ${report.validation.decision} · ${report.records.length} components`
          : "No components generated yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): ComponentGeneratorCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      componentsCount: report?.records.length ?? 0,
      validatedCount:
        report?.records.filter((r) => r.generationStatus === "validated").length ?? 0,
      blockedCount: report?.records.filter((r) => r.generationStatus === "blocked").length ?? 0,
      duplicatesSkipped:
        report?.records.filter((r) => r.generationStatus === "duplicate_skipped").length ?? 0,
      confidenceScore:
        report && report.records.length > 0
          ? Math.round(
              report.records.reduce((s, r) => s + r.confidenceScore, 0) / report.records.length,
            )
          : 0,
      totalGenerations: state.performance.totalGenerations,
      recentLogs: getGenerationLogs(8, state.configuration).map(
        (l) => `${l.event}: ${l.details}`,
      ),
    };
  }
}

export function createComponentGenerator(
  bootstrap: EmpireBootstrapContext,
  recommendationEngine: RecommendationEngine,
  frontendBuilder: FrontendBuilder,
  designSystemIntelligence: DesignSystemIntelligenceEngine,
  executiveStyleLearning: ExecutiveStyleLearningEngine,
  options?: ComponentGeneratorOptions,
): ComponentGenerator {
  return new ComponentGenerator(
    bootstrap,
    recommendationEngine,
    frontendBuilder,
    designSystemIntelligence,
    executiveStyleLearning,
    options,
  );
}

export function resetComponentGeneratorForTesting(): void {
  resetGenerationLogsForTesting();
  resetComponentRegistryForTesting();
}
