import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { UiStateMapperEngine } from "../ui-state-mapper/engine.js";
import type { ComponentRecognitionEngine } from "../component-recognition-engine/engine.js";
import type { LayoutUnderstandingEngine } from "../layout-understanding-engine/engine.js";
import type { NavigationMappingEngine } from "../navigation-mapping-engine/engine.js";
import type { UxRuleEngine } from "../ux-rule-engine/engine.js";
import {
  appendDesignSystemLog,
  getDesignSystemLogs,
  resetDesignSystemLogsForTesting,
} from "./design-system-logging.js";
import { IntelligenceController } from "./intelligence-controller.js";
import {
  buildDesignSystemIntelligenceConfiguration,
  type DesignSystemIntelligenceConfiguration,
} from "./configuration.js";
import { DESIGN_SYSTEM_INTELLIGENCE_SYSTEM_PATH } from "./paths.js";
import type {
  DesignSystemAnalysisReport,
  DesignSystemIntelligenceCockpitSnapshot,
  DesignSystemIntelligenceState,
  DesignSystemModel,
} from "./types.js";

export interface DesignSystemIntelligenceEngineOptions {
  configuration?: Partial<DesignSystemIntelligenceConfiguration>;
}

/**
 * Design System Intelligence Engine (PILLOW-DSI-001 / T2-02).
 * Learns and validates the EmpireAI design system for component consistency.
 */
export class DesignSystemIntelligenceEngine {
  private initializedAt: string | null = null;
  private readonly controller: IntelligenceController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    uiStateMapper: UiStateMapperEngine,
    componentRecognition: ComponentRecognitionEngine,
    layoutUnderstanding: LayoutUnderstandingEngine,
    navigationMapping: NavigationMappingEngine,
    uxRuleEngine: UxRuleEngine,
    options: DesignSystemIntelligenceEngineOptions = {},
  ) {
    const config = buildDesignSystemIntelligenceConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    this.controller = new IntelligenceController(
      bootstrap.repositoryRoot,
      {
        uiStateMapper,
        componentRecognition,
        layoutUnderstanding,
        navigationMapping,
        uxRuleEngine,
      },
      config,
    );
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<DesignSystemIntelligenceState> {
    const doc = await this.reader.readText(DESIGN_SYSTEM_INTELLIGENCE_SYSTEM_PATH);
    if (!doc?.includes("Design System Intelligence")) {
      throw new Error(
        `${DESIGN_SYSTEM_INTELLIGENCE_SYSTEM_PATH} missing — Design System Intelligence requires T2-02 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendDesignSystemLog({
      event: "design_system_intelligence_initialized",
      level: "info",
      details: "Design System Intelligence Engine initialized",
    });
    return this.getState();
  }

  getState(): DesignSystemIntelligenceState {
    if (!this.initializedAt) {
      throw new Error(
        "Design System Intelligence Engine not initialized. Call initialize() first.",
      );
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const health = this.controller.getHealthMonitor().buildReport({
      config,
      status: this.controller.getStatus(),
      performance,
      componentsLearned: this.controller.componentsLearned(),
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-DSI-001",
      missionId: "T2-02",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestModel: this.controller.getLatestModel(),
      latestReport: this.controller.getLatestReport(),
      health,
      performance,
    };
  }

  runAnalysis(): DesignSystemAnalysisReport {
    return this.controller.runAnalysis();
  }

  getLatestReport(): DesignSystemAnalysisReport | null {
    return this.controller.getLatestReport();
  }

  getLatestModel(): DesignSystemModel | null {
    return this.controller.getLatestModel();
  }

  stopDesignSystemIntelligence(): DesignSystemIntelligenceState {
    this.controller.stop();
    return this.getState();
  }

  updateConfiguration(
    overrides: Partial<DesignSystemIntelligenceConfiguration>,
  ): DesignSystemIntelligenceState {
    const next = buildDesignSystemIntelligenceConfiguration(this.bootstrap.repositoryRoot, {
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
        `Intelligence status: ${state.status}`,
        `Components learned: ${state.latestModel?.componentLibrary.length ?? 0}`,
        report
          ? `Last analysis: ${report.validation.decision} · ${report.validation.deviations.length} deviations`
          : "No analysis run yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): DesignSystemIntelligenceCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;
    const model = state.latestModel;

    return {
      intelligenceStatus: state.status,
      healthStatus: state.health.status,
      designSystemVersion: model?.version ?? null,
      componentsLearned: model?.componentLibrary.length ?? 0,
      familiesIdentified: model?.componentFamilies.length ?? 0,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      deviationsCount: report?.validation.deviations.length ?? 0,
      totalAnalyses: state.performance.totalAnalyses,
      recentLogs: getDesignSystemLogs(8, state.configuration).map(
        (l) => `${l.event}: ${l.details}`,
      ),
    };
  }
}

export function createDesignSystemIntelligenceEngine(
  bootstrap: EmpireBootstrapContext,
  uiStateMapper: UiStateMapperEngine,
  componentRecognition: ComponentRecognitionEngine,
  layoutUnderstanding: LayoutUnderstandingEngine,
  navigationMapping: NavigationMappingEngine,
  uxRuleEngine: UxRuleEngine,
  options?: DesignSystemIntelligenceEngineOptions,
): DesignSystemIntelligenceEngine {
  return new DesignSystemIntelligenceEngine(
    bootstrap,
    uiStateMapper,
    componentRecognition,
    layoutUnderstanding,
    navigationMapping,
    uxRuleEngine,
    options,
  );
}

export function resetDesignSystemIntelligenceForTesting(): void {
  resetDesignSystemLogsForTesting();
}
