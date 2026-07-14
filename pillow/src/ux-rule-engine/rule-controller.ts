/** T2-01 — UX Rule Engine controller. */

import type { ComponentRecognitionEngine } from "../component-recognition-engine/engine.js";
import type { LayoutUnderstandingEngine } from "../layout-understanding-engine/engine.js";
import type { NavigationMappingEngine } from "../navigation-mapping-engine/engine.js";
import type { UiStateMapperEngine } from "../ui-state-mapper/engine.js";
import type { ComponentRecognitionResult } from "../component-recognition-engine/types.js";
import type { LayoutModel } from "../layout-understanding-engine/types.js";
import type { NavigationGraph } from "../navigation-mapping-engine/types.js";
import type { UiStateModel } from "../ui-state-mapper/types.js";
import { appendUxRuleLog } from "./ux-rule-logging.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import { RuleValidationReporter } from "./rule-validation-reporter.js";
import { UxRuleEngineManager } from "./ux-rule-engine-manager.js";
import { UxRuleEvaluator } from "./ux-rule-evaluator.js";
import type { UxRuleEngineConfiguration } from "./configuration.js";
import type {
  RuleEnginePerformanceStats,
  RuleEngineStatus,
  RuleValidationReport,
} from "./types.js";

export type T1ValidationBundle = {
  uiStateMapper: UiStateMapperEngine;
  componentRecognition: ComponentRecognitionEngine;
  layoutUnderstanding: LayoutUnderstandingEngine;
  navigationMapping: NavigationMappingEngine;
};

export class RuleController {
  private config: UxRuleEngineConfiguration;
  private status: RuleEngineStatus = "idle";
  private latestReport: RuleValidationReport | null = null;
  private readonly manager = new UxRuleEngineManager();
  private readonly evaluator = new UxRuleEvaluator();
  private readonly reporter = new RuleValidationReporter();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: RuleEnginePerformanceStats = {
    totalValidations: 0,
    successfulValidations: 0,
    failedValidations: 0,
    totalRulesEvaluated: 0,
    totalViolations: 0,
    averageValidationDurationMs: 0,
    peakValidationDurationMs: 0,
  };

  constructor(
    private readonly repositoryRoot: string,
    private readonly engines: T1ValidationBundle,
    config: UxRuleEngineConfiguration,
  ) {
    this.config = config;
  }

  initialize(): void {
    this.manager.loadRules(this.repositoryRoot, this.config);
    appendUxRuleLog({
      event: "ux_rule_engine_start",
      level: "info",
      details: `UX Rule Engine started with ${this.manager.rulesLoaded()} rules`,
    });
  }

  stop(): void {
    this.status = "stopped";
    appendUxRuleLog({
      event: "ux_rule_engine_stop",
      level: "info",
      details: "UX Rule Engine stopped",
    });
  }

  getStatus(): RuleEngineStatus {
    return this.status;
  }

  getConfiguration(): UxRuleEngineConfiguration {
    return this.config;
  }

  updateConfiguration(config: UxRuleEngineConfiguration): void {
    this.config = config;
    this.manager.loadRules(this.repositoryRoot, this.config);
  }

  getLatestReport(): RuleValidationReport | null {
    return this.latestReport;
  }

  getPerformance(): RuleEnginePerformanceStats {
    return { ...this.performance };
  }

  getHealthMonitor(): HealthMonitor {
    return this.healthMonitor;
  }

  getRecoveryManager(): RecoveryManager {
    return this.recoveryManager;
  }

  getManager(): UxRuleEngineManager {
    return this.manager;
  }

  rulesLoaded(): number {
    return this.manager.rulesLoaded();
  }

  rulesEnabled(): number {
    return this.manager.rulesEnabled();
  }

  runValidation(context?: {
    uiState?: UiStateModel | null;
    recognition?: ComponentRecognitionResult | null;
    layout?: LayoutModel | null;
    navigation?: NavigationGraph | null;
  }): RuleValidationReport {
    const started = Date.now();
    this.status = "validating";
    const errors: string[] = [];
    const warnings: string[] = [];

    appendUxRuleLog({
      event: "rule_validation_start",
      level: "info",
      details: `Validating ${this.manager.rulesEnabled()} enabled UX rules`,
    });

    try {
      const evalContext = {
        uiState: context?.uiState ?? this.engines.uiStateMapper.getLatestState(),
        recognition:
          context?.recognition ?? this.engines.componentRecognition.getLatestResult(),
        layout: context?.layout ?? this.engines.layoutUnderstanding.getLatestLayout(),
        navigation:
          context?.navigation ?? this.engines.navigationMapping.getLatestGraph(),
      };

      if (!evalContext.uiState) warnings.push("No UI state data — UI state rules may fail");
      if (!evalContext.recognition) {
        warnings.push("No component data — component rules may fail");
      }
      if (!evalContext.layout) warnings.push("No layout data — layout rules may fail");
      if (!evalContext.navigation) {
        warnings.push("No navigation data — navigation rules may fail");
      }

      const rules = this.manager.getEnabledRules();
      const results = this.evaluator.evaluateRules(rules, evalContext);
      const durationMs = Date.now() - started;

      const report = this.reporter.buildReport({
        results,
        errors,
        warnings,
        durationMs,
        config: this.config,
      });

      this.latestReport = report;
      this.status = "idle";
      this.performance.totalValidations += 1;
      this.performance.totalRulesEvaluated += report.rulesEvaluated;
      this.performance.totalViolations += report.violations.length;
      this.performance.peakValidationDurationMs = Math.max(
        this.performance.peakValidationDurationMs,
        durationMs,
      );
      this.performance.averageValidationDurationMs = Math.round(
        (this.performance.averageValidationDurationMs *
          (this.performance.totalValidations - 1) +
          durationMs) /
          this.performance.totalValidations,
      );

      const success = report.decision === "pass" || report.decision === "partial";
      if (success) {
        this.performance.successfulValidations += 1;
        this.recoveryManager.recordSuccess();
      } else {
        this.performance.failedValidations += 1;
        const shouldRecover = this.recoveryManager.recordFailure(
          `Validation decision: ${report.decision}`,
          this.config,
        );
        if (shouldRecover) {
          this.status = "recovering";
          this.manager.loadRules(this.repositoryRoot, this.config);
          this.status = "idle";
        }
      }

      this.healthMonitor.recordValidation(durationMs, success, report.decision);

      appendUxRuleLog({
        event: "rule_validation_end",
        level: report.decision === "pass" ? "info" : "warn",
        details: `Validation ${report.decision.toUpperCase()} · ${report.rulesPassed}/${report.rulesEvaluated} passed · ${report.violations.length} violations · ${durationMs}ms`,
      });

      for (const violation of report.violations) {
        appendUxRuleLog({
          event: "rule_violation",
          level: violation.severity === "critical" ? "error" : "warn",
          details: `${violation.ruleId}: ${violation.violationDescription}`,
        });
      }

      return report;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Validation failed";
      errors.push(message);
      this.status = "failed";
      this.recoveryManager.recordFailure(message, this.config);
      appendUxRuleLog({
        event: "evaluation_failure",
        level: "error",
        details: message,
      });

      const report = this.reporter.buildReport({
        results: [],
        errors,
        warnings,
        durationMs: Date.now() - started,
        config: this.config,
      });
      this.latestReport = report;
      this.performance.totalValidations += 1;
      this.performance.failedValidations += 1;
      return report;
    }
  }
}
