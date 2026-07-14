/** T2-10 — Per-mission T2 subsystem validators. */

import type { UxRuleEngine } from "../ux-rule-engine/engine.js";
import type { DesignSystemIntelligenceEngine } from "../design-system-intelligence-engine/engine.js";
import type { ExecutiveStyleLearningEngine } from "../executive-style-learning-engine/engine.js";
import type { LayoutEvaluationEngine } from "../layout-evaluation-engine/engine.js";
import type { WorkflowOptimizationEngine } from "../workflow-optimization-engine/engine.js";
import type { AccessibilityIntelligenceEngine } from "../accessibility-intelligence-engine/engine.js";
import type { VisualConsistencyEngine } from "../visual-consistency-engine/engine.js";
import type { UxScoringEngine } from "../ux-scoring-engine/engine.js";
import type { RecommendationEngine } from "../recommendation-engine/engine.js";
import type { UiStateMapperEngine } from "../ui-state-mapper/engine.js";
import type { ComponentRecognitionEngine } from "../component-recognition-engine/engine.js";
import type { LayoutUnderstandingEngine } from "../layout-understanding-engine/engine.js";
import type { NavigationMappingEngine } from "../navigation-mapping-engine/engine.js";
import type { InteractionTrackingEngine } from "../interaction-tracking-engine/engine.js";
import type { VisualFoundationCertificationEngine } from "../visual-foundation-certification-engine/engine.js";
import type { UxIntelligenceCertificationConfiguration } from "./configuration.js";
import type { MissionValidationResult, T2MissionId } from "./types.js";
import { appendCertificationLog } from "./certification-logging.js";

export type T2EngineBundle = {
  uxRuleEngine: UxRuleEngine;
  designSystemIntelligence: DesignSystemIntelligenceEngine;
  executiveStyleLearning: ExecutiveStyleLearningEngine;
  layoutEvaluation: LayoutEvaluationEngine;
  workflowOptimization: WorkflowOptimizationEngine;
  accessibilityIntelligence: AccessibilityIntelligenceEngine;
  visualConsistency: VisualConsistencyEngine;
  uxScoring: UxScoringEngine;
  recommendationEngine: RecommendationEngine;
  uiStateMapper: UiStateMapperEngine;
  componentRecognition: ComponentRecognitionEngine;
  layoutUnderstanding: LayoutUnderstandingEngine;
  navigationMapping: NavigationMappingEngine;
  interactionTracking: InteractionTrackingEngine;
  visualFoundationCertification: VisualFoundationCertificationEngine | null;
};

function baseResult(
  missionId: T2MissionId,
  missionName: string,
  started: number,
): MissionValidationResult {
  return {
    missionId,
    missionName,
    passed: false,
    healthStatus: "unknown",
    readinessScore: 0,
    details: [],
    warnings: [],
    errors: [],
    durationMs: Date.now() - started,
  };
}

function validateEngine(
  missionId: T2MissionId,
  missionName: string,
  started: number,
  run: () => {
    state: { health: { status: string }; missionId?: string; engineVersion?: string };
    supervisor: { valid: boolean; readinessScore: number; notes: string[] };
    extra?: () => void;
  },
  config: UxIntelligenceCertificationConfiguration,
): MissionValidationResult {
  const result = baseResult(missionId, missionName, started);
  try {
    const { state, supervisor, extra } = run();
    result.healthStatus = state.health.status;
    result.readinessScore = supervisor.readinessScore;
    result.details.push(`Engine version: ${state.engineVersion ?? "unknown"}`);
    result.details.push(`Health: ${state.health.status}`);
    result.details.push(...supervisor.notes);

    if (config.validateHealthReporting && state.health.status === "failed") {
      result.errors.push("Health reporting indicates failed status");
    }
    if (supervisor.readinessScore < config.requiredPassThreshold) {
      result.warnings.push(
        `Readiness score ${supervisor.readinessScore} below threshold ${config.requiredPassThreshold}`,
      );
    }
    if (!supervisor.valid) {
      result.errors.push("Supervisor validation returned invalid");
    }

    extra?.();

    result.passed =
      supervisor.valid &&
      result.errors.length === 0 &&
      supervisor.readinessScore >= config.requiredPassThreshold;
    result.durationMs = Date.now() - started;

    appendCertificationLog({
      event: "mission_validation_end",
      level: result.passed ? "info" : "warn",
      details: `${missionId} ${result.passed ? "PASS" : "FAIL"} · ${result.durationMs}ms`,
    });
  } catch (error) {
    result.errors.push(error instanceof Error ? error.message : "Validation failed");
    result.durationMs = Date.now() - started;
  }
  return result;
}

export class T2CapabilityValidator {
  validateMission(
    missionId: T2MissionId,
    engines: T2EngineBundle,
    config: UxIntelligenceCertificationConfiguration,
  ): MissionValidationResult {
    appendCertificationLog({
      event: "mission_validation_start",
      level: "info",
      details: `Validating ${missionId}`,
    });
    const started = Date.now();

    switch (missionId) {
      case "T2-01": {
        const report = engines.uxRuleEngine.runValidation();
        const result = validateEngine("T2-01", "UX Rule Engine", started, () => ({
          state: engines.uxRuleEngine.getState(),
          supervisor: engines.uxRuleEngine.validateForSupervisorSync(),
        }), config);
        if (!report.validationReportId) result.errors.push("Missing validation report ID");
        else result.details.push(`Report: ${report.validationReportId}`);
        result.passed =
          result.errors.length === 0 && result.readinessScore >= config.requiredPassThreshold;
        return result;
      }

      case "T2-02": {
        const report = engines.designSystemIntelligence.runAnalysis();
        const result = validateEngine("T2-02", "Design System Intelligence", started, () => ({
          state: engines.designSystemIntelligence.getState(),
          supervisor: engines.designSystemIntelligence.validateForSupervisorSync(),
        }), config);
        const model = engines.designSystemIntelligence.getLatestModel();
        if (!report.analysisReportId) result.errors.push("Missing analysis report ID");
        if (!model?.designSystemId) result.warnings.push("No design system model yet");
        else result.details.push(`Model: ${model.designSystemId}`);
        result.passed =
          result.errors.length === 0 && result.readinessScore >= config.requiredPassThreshold;
        return result;
      }

      case "T2-03": {
        const learningReport = engines.executiveStyleLearning.runLearning();
        const result = validateEngine("T2-03", "Executive Style Learning", started, () => ({
          state: engines.executiveStyleLearning.getState(),
          supervisor: engines.executiveStyleLearning.validateForSupervisorSync(),
        }), config);
        if (!learningReport.model?.executiveStyleId) {
          result.warnings.push("Executive style model not yet produced");
        } else {
          result.details.push(`Style model: ${learningReport.model.executiveStyleId}`);
        }
        result.passed =
          result.errors.length === 0 && result.readinessScore >= config.requiredPassThreshold;
        return result;
      }

      case "T2-04": {
        const evalReport = engines.layoutEvaluation.runEvaluation();
        const result = validateEngine("T2-04", "Layout Evaluation", started, () => ({
          state: engines.layoutEvaluation.getState(),
          supervisor: engines.layoutEvaluation.validateForSupervisorSync(),
        }), config);
        if (!evalReport.model?.evaluationId) result.warnings.push("No layout evaluation model");
        else result.details.push(`Evaluation: ${evalReport.model.evaluationId}`);
        result.passed =
          result.errors.length === 0 && result.readinessScore >= config.requiredPassThreshold;
        return result;
      }

      case "T2-05": {
        const workflowReport = engines.workflowOptimization.runAnalysis();
        const result = validateEngine("T2-05", "Workflow Optimization", started, () => ({
          state: engines.workflowOptimization.getState(),
          supervisor: engines.workflowOptimization.validateForSupervisorSync(),
        }), config);
        if (!workflowReport.record?.optimizationRecordId) {
          result.warnings.push("No workflow optimization record");
        } else {
          result.details.push(`Record: ${workflowReport.record.optimizationRecordId}`);
        }
        result.passed =
          result.errors.length === 0 && result.readinessScore >= config.requiredPassThreshold;
        return result;
      }

      case "T2-06": {
        const accessibilityReport = engines.accessibilityIntelligence.runReview();
        const result = validateEngine("T2-06", "Accessibility Intelligence", started, () => ({
          state: engines.accessibilityIntelligence.getState(),
          supervisor: engines.accessibilityIntelligence.validateForSupervisorSync(),
        }), config);
        if (!accessibilityReport.record?.accessibilityReviewId) {
          result.warnings.push("No accessibility review record");
        } else {
          result.details.push(`Review: ${accessibilityReport.record.accessibilityReviewId}`);
        }
        result.passed =
          result.errors.length === 0 && result.readinessScore >= config.requiredPassThreshold;
        return result;
      }

      case "T2-07": {
        const consistencyReport = engines.visualConsistency.runReview();
        const result = validateEngine("T2-07", "Visual Consistency Engine", started, () => ({
          state: engines.visualConsistency.getState(),
          supervisor: engines.visualConsistency.validateForSupervisorSync(),
        }), config);
        if (!consistencyReport.record?.consistencyReviewId) {
          result.warnings.push("No consistency review record");
        } else {
          result.details.push(`Review: ${consistencyReport.record.consistencyReviewId}`);
        }
        result.passed =
          result.errors.length === 0 && result.readinessScore >= config.requiredPassThreshold;
        return result;
      }

      case "T2-08": {
        const report = engines.uxScoring.runScoring();
        const result = validateEngine("T2-08", "UX Scoring Engine", started, () => ({
          state: engines.uxScoring.getState(),
          supervisor: engines.uxScoring.validateForSupervisorSync(),
        }), config);
        if (!report.scoringReportId) result.errors.push("Missing scoring report ID");
        if (report.record.overallUxScore < 0 || report.record.overallUxScore > 100) {
          result.errors.push("UX score out of range");
        } else {
          result.details.push(`Overall UX score: ${report.record.overallUxScore}`);
        }
        result.passed =
          result.errors.length === 0 && result.readinessScore >= config.requiredPassThreshold;
        return result;
      }

      case "T2-09": {
        const report = engines.recommendationEngine.generateRecommendations();
        const result = validateEngine("T2-09", "Recommendation Engine", started, () => ({
          state: engines.recommendationEngine.getState(),
          supervisor: engines.recommendationEngine.validateForSupervisorSync(),
        }), config);
        if (!report.recommendationReportId) {
          result.errors.push("Missing recommendation report ID");
        } else {
          result.details.push(`Report: ${report.recommendationReportId}`);
          result.details.push(`Proposals: ${report.record.proposals.length}`);
        }
        const withEvidence = report.record.proposals.filter(
          (p) => p.evidenceReferences.length > 0 || p.sourceFindingIds.length > 0,
        );
        result.details.push(`Evidence-linked proposals: ${withEvidence.length}`);
        result.passed =
          result.errors.length === 0 && result.readinessScore >= config.requiredPassThreshold;
        return result;
      }

      default:
        return baseResult(missionId, "Unknown", started);
    }
  }

  validateAll(
    engines: T2EngineBundle,
    config: UxIntelligenceCertificationConfiguration,
  ): MissionValidationResult[] {
    const results = config.validationScope.map((missionId) =>
      this.validateMission(missionId, engines, config),
    );

    if (config.validateSensitiveDataProtection) {
      const maskEnabled = engines.interactionTracking.getState().configuration.maskSensitiveValues;
      for (const result of results) {
        if (maskEnabled) result.details.push("Upstream sensitive masking active");
        else result.warnings.push("Interaction tracking sensitive masking disabled");
      }
    }

    if (config.requireT1FoundationCertified && engines.visualFoundationCertification) {
      const vfc = engines.visualFoundationCertification.getLatestReport();
      if (!vfc || vfc.finalCertificationDecision !== "pass") {
        for (const result of results) {
          result.warnings.push("T1 Visual Foundation not certified");
        }
      }
    }

    return results;
  }
}
