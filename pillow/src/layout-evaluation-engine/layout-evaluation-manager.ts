/** T2-04 — Layout Evaluation manager. */

import { appendLayoutEvaluationLog } from "./layout-evaluation-logging.js";
import { DesignSystemValidationEngine } from "./design-system-validation-engine.js";
import { EvaluationReportGenerator } from "./evaluation-report-generator.js";
import { EvaluationValidator } from "./evaluation-validator.js";
import { ExecutivePreferenceValidationEngine } from "./executive-preference-validation-engine.js";
import { LayoutAnalysisEngine } from "./layout-analysis-engine.js";
import { UxRuleValidationEngine } from "./ux-rule-validation-engine.js";
import type { ComponentRecognitionResult } from "../component-recognition-engine/types.js";
import type { DesignSystemModel } from "../design-system-intelligence-engine/types.js";
import type { ExecutiveStyleModel } from "../executive-style-learning-engine/types.js";
import type { LayoutModel } from "../layout-understanding-engine/types.js";
import type { NavigationGraph } from "../navigation-mapping-engine/types.js";
import type { UxRuleEngine } from "../ux-rule-engine/engine.js";
import type { LayoutEvaluationConfiguration } from "./configuration.js";
import type { LayoutEvaluationModel, LayoutEvaluationReport } from "./types.js";
import { EVALUATION_METADATA_VERSION } from "./paths.js";

export class LayoutEvaluationManager {
  private readonly analysisEngine = new LayoutAnalysisEngine();
  private readonly uxRuleValidation = new UxRuleValidationEngine();
  private readonly designSystemValidation = new DesignSystemValidationEngine();
  private readonly executiveValidation = new ExecutivePreferenceValidationEngine();
  private readonly reportGenerator = new EvaluationReportGenerator();
  private readonly validator = new EvaluationValidator();
  private latestModel: LayoutEvaluationModel | null = null;

  runEvaluation(input: {
    config: LayoutEvaluationConfiguration;
    layout: LayoutModel | null;
    recognition: ComponentRecognitionResult | null;
    navigation: NavigationGraph | null;
    designSystem: DesignSystemModel | null;
    executiveStyle: ExecutiveStyleModel | null;
    uxRuleEngine: UxRuleEngine;
  }): LayoutEvaluationReport {
    const started = Date.now();

    appendLayoutEvaluationLog({
      event: "evaluation_start",
      level: "info",
      details: "Starting layout evaluation",
    });

    const findings = this.analysisEngine.analyze({
      layout: input.layout,
      recognition: input.recognition,
      navigation: input.navigation,
      config: input.config,
    });

    const ruleViolations = this.uxRuleValidation.validate(
      input.uxRuleEngine,
      input.layout,
      input.config.ruleValidationEnabled,
    );

    const designSystemDeviations = this.designSystemValidation.validate(
      input.designSystem,
      input.layout,
      input.recognition,
      input.config.designSystemValidationEnabled,
    );

    const executiveDeviations = this.executiveValidation.validate(
      input.executiveStyle,
      input.layout,
      input.config.executivePreferenceValidationEnabled,
    );

    const draftModel: LayoutEvaluationModel = {
      evaluationId: `lev-draft-${Date.now()}`,
      timestamp: new Date().toISOString(),
      screenId: null,
      routeOrViewId: null,
      sourceLayoutId: input.layout?.metadata.layoutId ?? null,
      sourceComponentSetId: input.recognition?.metadata.recognitionId ?? null,
      sourceNavigationGraphId: input.navigation?.metadata.graphId ?? null,
      evaluationScope: "full_page",
      overallEvaluationStatus: "partial",
      layoutStrengths: findings.filter((f) => f.kind === "strength"),
      layoutWeaknesses: findings.filter((f) => f.kind === "weakness"),
      ruleViolations,
      designSystemDeviations,
      executivePreferenceDeviations: executiveDeviations,
      evidenceReferences: [],
      confidenceScore: 0,
      metadataVersion: EVALUATION_METADATA_VERSION,
    };

    const validation = this.validator.validate(draftModel, input.config.validationRulesEnabled);

    const report = this.reportGenerator.build({
      layout: input.layout,
      recognition: input.recognition,
      navigation: input.navigation,
      findings,
      ruleViolations,
      designSystemDeviations,
      executiveDeviations,
      validation,
      durationMs: Date.now() - started,
    });

    this.latestModel = report.model;

    appendLayoutEvaluationLog({
      event: "evaluation_end",
      level: report.validation.decision === "pass" ? "info" : "warn",
      details: `Evaluation ${report.validation.decision.toUpperCase()} · ${report.model.layoutStrengths.length} strengths · ${report.model.layoutWeaknesses.length} weaknesses · ${report.model.ruleViolations.length} violations · ${report.durationMs}ms`,
    });

    appendLayoutEvaluationLog({
      event: "evaluation_results",
      level: "info",
      details: `Overall status: ${report.model.overallEvaluationStatus} · confidence ${report.model.confidenceScore}`,
    });

    return report;
  }

  getLatestModel(): LayoutEvaluationModel | null {
    return this.latestModel;
  }

  reset(): void {
    this.latestModel = null;
  }
}
