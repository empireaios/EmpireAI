import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { UiStateMapperEngine } from "../ui-state-mapper/engine.js";
import type { ComponentRecognitionEngine } from "../component-recognition-engine/engine.js";
import type { LayoutUnderstandingEngine } from "../layout-understanding-engine/engine.js";
import type { NavigationMappingEngine } from "../navigation-mapping-engine/engine.js";
import {
  appendUxRuleLog,
  getUxRuleLogs,
  resetUxRuleLogsForTesting,
} from "./ux-rule-logging.js";
import { RuleController } from "./rule-controller.js";
import {
  buildUxRuleEngineConfiguration,
  type UxRuleEngineConfiguration,
} from "./configuration.js";
import { UX_RULE_ENGINE_SYSTEM_PATH } from "./paths.js";
import type {
  RuleValidationReport,
  UxRuleEngineCockpitSnapshot,
  UxRuleEngineState,
} from "./types.js";

export interface UxRuleEngineOptions {
  configuration?: Partial<UxRuleEngineConfiguration>;
}

/**
 * UX Rule Engine (PILLOW-URE-001 / T2-01).
 * Defines and enforces UX governance rules for the EmpireAI interface.
 */
export class UxRuleEngine {
  private initializedAt: string | null = null;
  private readonly controller: RuleController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    uiStateMapper: UiStateMapperEngine,
    componentRecognition: ComponentRecognitionEngine,
    layoutUnderstanding: LayoutUnderstandingEngine,
    navigationMapping: NavigationMappingEngine,
    options: UxRuleEngineOptions = {},
  ) {
    const config = buildUxRuleEngineConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    this.controller = new RuleController(
      bootstrap.repositoryRoot,
      {
        uiStateMapper,
        componentRecognition,
        layoutUnderstanding,
        navigationMapping,
      },
      config,
    );
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<UxRuleEngineState> {
    const doc = await this.reader.readText(UX_RULE_ENGINE_SYSTEM_PATH);
    if (!doc?.includes("UX Rule Engine")) {
      throw new Error(
        `${UX_RULE_ENGINE_SYSTEM_PATH} missing — UX Rule Engine requires T2-01 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendUxRuleLog({
      event: "ux_rule_engine_initialized",
      level: "info",
      details: "UX Rule Engine initialized",
    });
    return this.getState();
  }

  getState(): UxRuleEngineState {
    if (!this.initializedAt) {
      throw new Error("UX Rule Engine not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const health = this.controller.getHealthMonitor().buildReport({
      config,
      status: this.controller.getStatus(),
      performance,
      rulesLoaded: this.controller.rulesLoaded(),
      rulesEnabled: this.controller.rulesEnabled(),
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-URE-001",
      missionId: "T2-01",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      rulesLoaded: this.controller.rulesLoaded(),
      rulesEnabled: this.controller.rulesEnabled(),
      latestReport: this.controller.getLatestReport(),
      health,
      performance,
    };
  }

  runValidation(): RuleValidationReport {
    return this.controller.runValidation();
  }

  getLatestReport(): RuleValidationReport | null {
    return this.controller.getLatestReport();
  }

  getRules() {
    return this.controller.getManager().getAllRules();
  }

  setRuleEnabled(ruleId: string, enabled: boolean): boolean {
    return this.controller.getManager().setRuleEnabled(ruleId, enabled);
  }

  stopUxRuleEngine(): UxRuleEngineState {
    this.controller.stop();
    return this.getState();
  }

  updateConfiguration(overrides: Partial<UxRuleEngineConfiguration>): UxRuleEngineState {
    const next = buildUxRuleEngineConfiguration(this.bootstrap.repositoryRoot, {
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
      ? report.decision === "pass"
        ? 100
        : report.decision === "partial"
          ? 70
          : 40
      : state.health.healthScore;

    return {
      valid: state.health.status !== "failed",
      health: score >= 75 ? "healthy" : score >= 50 ? "degraded" : "blocked",
      readinessScore: score,
      notes: [
        `Rule engine status: ${state.status}`,
        `Rules loaded: ${state.rulesLoaded} (${state.rulesEnabled} enabled)`,
        report
          ? `Last validation: ${report.decision} · ${report.violations.length} violations`
          : "No validation run yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): UxRuleEngineCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      rulesLoaded: state.rulesLoaded,
      rulesEnabled: state.rulesEnabled,
      lastDecision: report?.decision ?? state.health.lastValidationDecision,
      violationsCount: report?.violations.length ?? 0,
      totalValidations: state.performance.totalValidations,
      recentLogs: getUxRuleLogs(8, state.configuration).map(
        (l) => `${l.event}: ${l.details}`,
      ),
    };
  }
}

export function createUxRuleEngine(
  bootstrap: EmpireBootstrapContext,
  uiStateMapper: UiStateMapperEngine,
  componentRecognition: ComponentRecognitionEngine,
  layoutUnderstanding: LayoutUnderstandingEngine,
  navigationMapping: NavigationMappingEngine,
  options?: UxRuleEngineOptions,
): UxRuleEngine {
  return new UxRuleEngine(
    bootstrap,
    uiStateMapper,
    componentRecognition,
    layoutUnderstanding,
    navigationMapping,
    options,
  );
}

export function resetUxRuleEngineForTesting(): void {
  resetUxRuleLogsForTesting();
}
