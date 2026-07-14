/** T2-05 — Workflow Optimization manager. */

import { appendWorkflowOptimizationLog } from "./workflow-optimization-logging.js";
import { WorkflowAnalysisEngine } from "./workflow-analysis-engine.js";
import { WorkflowFindingGenerator } from "./workflow-finding-generator.js";
import { WorkflowValidator } from "./workflow-validator.js";
import type { WorkflowContextModel } from "../context-awareness-engine/types.js";
import type { InteractionEvent } from "../interaction-tracking-engine/types.js";
import type { NavigationGraph } from "../navigation-mapping-engine/types.js";
import type { LayoutEvaluationModel } from "../layout-evaluation-engine/types.js";
import type { WorkflowOptimizationConfiguration } from "./configuration.js";
import type { WorkflowOptimizationRecord, WorkflowOptimizationReport } from "./types.js";
import { WORKFLOW_METADATA_VERSION } from "./paths.js";

export class WorkflowOptimizationManager {
  private readonly analysisEngine = new WorkflowAnalysisEngine();
  private readonly findingGenerator = new WorkflowFindingGenerator();
  private readonly validator = new WorkflowValidator();
  private latestRecord: WorkflowOptimizationRecord | null = null;

  runAnalysis(input: {
    config: WorkflowOptimizationConfiguration;
    context: WorkflowContextModel | null;
    events: InteractionEvent[];
    navigation: NavigationGraph | null;
    layoutEvaluation: LayoutEvaluationModel | null;
  }): WorkflowOptimizationReport {
    const started = Date.now();

    appendWorkflowOptimizationLog({
      event: "workflow_optimization_start",
      level: "info",
      details: "Starting workflow optimization analysis",
    });

    const { friction, strengths } = this.analysisEngine.analyze({
      context: input.context,
      events: input.events,
      navigation: input.navigation,
      layoutEvaluation: input.layoutEvaluation,
      config: input.config,
    });

    for (const point of friction) {
      appendWorkflowOptimizationLog({
        event: "friction_detection",
        level: point.severity === "error" ? "error" : "warn",
        details: `${point.category}: ${point.description}`,
      });
    }

    for (const strength of strengths) {
      appendWorkflowOptimizationLog({
        event: "strength_detection",
        level: "info",
        details: strength.description,
      });
    }

    const record = this.findingGenerator.build({
      context: input.context,
      events: input.events,
      navigation: input.navigation,
      layoutEvaluation: input.layoutEvaluation,
      friction,
      strengths,
    });

    const validation = this.validator.validate(record, input.config.validationRulesEnabled);
    this.latestRecord = record;

    const report: WorkflowOptimizationReport = {
      optimizationReportId: `wfo-report-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      optimizationTimestamp: new Date().toISOString(),
      record,
      validation,
      durationMs: Date.now() - started,
      metadataVersion: WORKFLOW_METADATA_VERSION,
    };

    appendWorkflowOptimizationLog({
      event: "workflow_optimization_end",
      level: validation.decision === "pass" ? "info" : "warn",
      details: `Analysis ${validation.decision.toUpperCase()} · ${friction.length} friction · ${strengths.length} strengths · ${report.durationMs}ms`,
    });

    return report;
  }

  getLatestRecord(): WorkflowOptimizationRecord | null {
    return this.latestRecord;
  }

  reset(): void {
    this.latestRecord = null;
  }
}
