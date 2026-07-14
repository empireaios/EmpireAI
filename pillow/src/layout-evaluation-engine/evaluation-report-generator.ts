/** T2-04 — Evaluation report generation. */

import { EVALUATION_METADATA_VERSION } from "./paths.js";
import { EvaluationMetadataGenerator } from "./evaluation-metadata-generator.js";
import type {
  ExecutivePreferenceDeviation,
  LayoutEvaluationModel,
  LayoutEvaluationReport,
  LayoutEvaluationValidationReport,
  LayoutFinding,
  OverallEvaluationStatus,
} from "./types.js";
import type { RuleViolation } from "../ux-rule-engine/types.js";
import type { DesignSystemDeviation } from "../design-system-intelligence-engine/types.js";
import type { LayoutModel } from "../layout-understanding-engine/types.js";
import type { NavigationGraph } from "../navigation-mapping-engine/types.js";
import type { ComponentRecognitionResult } from "../component-recognition-engine/types.js";

export class EvaluationReportGenerator {
  private readonly metadata = new EvaluationMetadataGenerator();

  build(input: {
    layout: LayoutModel | null;
    recognition: ComponentRecognitionResult | null;
    navigation: NavigationGraph | null;
    findings: LayoutFinding[];
    ruleViolations: RuleViolation[];
    designSystemDeviations: DesignSystemDeviation[];
    executiveDeviations: ExecutivePreferenceDeviation[];
    validation: LayoutEvaluationValidationReport;
    durationMs: number;
  }): LayoutEvaluationReport {
    const strengths = input.findings.filter((f) => f.kind === "strength");
    const weaknesses = input.findings.filter((f) => f.kind === "weakness");

    const errorWeaknesses = weaknesses.filter((w) => w.severity === "error").length;
    const errorViolations = input.ruleViolations.filter((v) => v.severity === "error").length;
    const errorDeviations =
      input.designSystemDeviations.filter((d) => d.severity === "error").length +
      input.executiveDeviations.filter((d) => d.severity === "error").length;

    let overallStatus: OverallEvaluationStatus = "pass";
    if (!input.layout) overallStatus = "skipped";
    else if (errorWeaknesses > 0 || errorViolations > 0 || errorDeviations > 0) {
      overallStatus = "fail";
    } else if (
      weaknesses.length > 0 ||
      input.ruleViolations.length > 0 ||
      input.designSystemDeviations.some((d) => d.severity === "warning") ||
      input.executiveDeviations.some((d) => d.severity === "warning")
    ) {
      overallStatus = "partial";
    }

    const confidenceValues = [
      ...strengths.map((s) => s.confidence),
      input.layout?.metadata.confidenceScore ?? 0,
    ].filter((c) => c > 0);
    const confidenceScore =
      confidenceValues.length > 0
        ? Math.round(
            (confidenceValues.reduce((a, b) => a + b, 0) / confidenceValues.length) * 100,
          )
        : 0;

    const evidenceReferences = [
      input.layout?.metadata.layoutId,
      input.recognition?.metadata.recognitionId,
      input.navigation?.metadata.graphId,
      ...strengths.map((s) => s.evidenceRef),
      ...weaknesses.map((w) => w.evidenceRef),
    ].filter((ref): ref is string => !!ref);

    const model: LayoutEvaluationModel = this.metadata.enrichModel({
      evaluationId: this.metadata.buildEvaluationId(),
      timestamp: new Date().toISOString(),
      screenId: input.layout?.metadata.screenId ?? input.navigation?.metadata.currentScreenId ?? null,
      routeOrViewId:
        input.navigation?.metadata.currentRouteId ??
        input.navigation?.metadata.currentViewId ??
        null,
      sourceLayoutId: input.layout?.metadata.layoutId ?? null,
      sourceComponentSetId: input.recognition?.metadata.recognitionId ?? null,
      sourceNavigationGraphId: input.navigation?.metadata.graphId ?? null,
      evaluationScope: "full_page",
      overallEvaluationStatus: overallStatus,
      layoutStrengths: strengths,
      layoutWeaknesses: weaknesses,
      ruleViolations: input.ruleViolations,
      designSystemDeviations: input.designSystemDeviations,
      executivePreferenceDeviations: input.executiveDeviations,
      evidenceReferences: [...new Set(evidenceReferences)],
      confidenceScore,
      metadataVersion: EVALUATION_METADATA_VERSION,
    });

    return {
      evaluationReportId: `lev-report-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      evaluationTimestamp: new Date().toISOString(),
      model,
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: EVALUATION_METADATA_VERSION,
    };
  }
}
