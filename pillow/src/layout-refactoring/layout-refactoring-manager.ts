/** T3-03 — Layout Refactoring manager — core refactoring pipeline. */

import { appendRefactoringLog } from "./refactoring-logging.js";
import { LayoutRequirementInterpreter } from "./layout-requirement-interpreter.js";
import { CurrentLayoutAnalyzer } from "./current-layout-analyzer.js";
import { TargetLayoutPlanner } from "./target-layout-planner.js";
import { ComponentPlacementEngine } from "./component-placement-engine.js";
import { ResponsiveStructureBuilder } from "./responsive-structure-builder.js";
import { DesignSystemConstraintEngine } from "./design-system-constraint-engine.js";
import { ExecutivePreferenceConstraintEngine } from "./executive-preference-constraint-engine.js";
import { LayoutCodeGenerator } from "./layout-code-generator.js";
import { LayoutSafetyChecker } from "./layout-safety-checker.js";
import { LayoutOutputValidator } from "./layout-output-validator.js";
import { LayoutMetadataGenerator } from "./layout-metadata-generator.js";
import type { FrontendBuildReport } from "../frontend-builder/types.js";
import type { RecommendationRecord } from "../recommendation-engine/types.js";
import type { DesignSystemModel } from "../design-system-intelligence-engine/types.js";
import type { ExecutiveStyleModel } from "../executive-style-learning-engine/types.js";
import type { LayoutEvaluationModel } from "../layout-evaluation-engine/types.js";
import type { LayoutModel } from "../layout-understanding-engine/types.js";
import type { UxScoreRecord } from "../ux-scoring-engine/types.js";
import type { WorkflowOptimizationRecord } from "../workflow-optimization-engine/types.js";
import type { ComponentGenerationReport } from "../component-generator/types.js";
import type { LayoutRefactoringConfiguration } from "./configuration.js";
import type { LayoutRefactoringRecord, LayoutRefactoringReport, RefactoringStatus } from "./types.js";
import { REFACTORING_METADATA_VERSION } from "./paths.js";

export class LayoutRefactoringManager {
  private readonly interpreter = new LayoutRequirementInterpreter();
  private readonly currentAnalyzer = new CurrentLayoutAnalyzer();
  private readonly planner = new TargetLayoutPlanner();
  private readonly placementEngine = new ComponentPlacementEngine();
  private readonly responsiveBuilder = new ResponsiveStructureBuilder();
  private readonly designConstraints = new DesignSystemConstraintEngine();
  private readonly executiveConstraints = new ExecutivePreferenceConstraintEngine();
  private readonly codeGenerator = new LayoutCodeGenerator();
  private readonly safetyChecker = new LayoutSafetyChecker();
  private readonly validator = new LayoutOutputValidator();
  private readonly metadata = new LayoutMetadataGenerator();

  generateReport(input: {
    config: LayoutRefactoringConfiguration;
    recommendations: RecommendationRecord | null;
    uxScore: UxScoreRecord | null;
    layoutEvaluation: LayoutEvaluationModel | null;
    workflowOptimization: WorkflowOptimizationRecord | null;
    designSystem: DesignSystemModel | null;
    executiveStyle: ExecutiveStyleModel | null;
    frontendBuild: FrontendBuildReport | null;
    componentGeneration: ComponentGenerationReport | null;
    layoutModel: LayoutModel | null;
  }): LayoutRefactoringReport {
    const started = Date.now();

    appendRefactoringLog({
      event: "layout_refactoring_start",
      level: "info",
      details: "Starting layout refactoring",
    });

    const proposals = input.recommendations?.proposals ?? [];
    const buildRecords = input.frontendBuild?.records ?? [];
    const componentRecords = input.componentGeneration?.records ?? [];

    const requirements = this.interpreter.interpret(
      proposals,
      buildRecords,
      input.layoutEvaluation,
      componentRecords,
      input.config,
    );

    const dsConstraints = this.designConstraints.buildConstraints(
      input.designSystem,
      input.config,
    );
    const execConstraints = this.executiveConstraints.buildConstraints(
      input.executiveStyle,
      input.config,
    );

    const records: LayoutRefactoringRecord[] = [];

    for (const req of requirements) {
      if (records.length >= input.config.maxLayoutsPerRefactoring) break;

      const analysis = this.currentAnalyzer.analyze(
        req,
        input.layoutModel,
        input.layoutEvaluation,
      );
      const plan = this.planner.plan(req, analysis, input.config);

      if (!input.config.allowedLayoutScopes.includes(plan.scope)) continue;

      const placements = this.placementEngine.buildPlacementMap(
        plan,
        req.relatedComponents,
        input.config,
      );
      const responsiveRules = this.responsiveBuilder.build(plan.scope, input.config);

      const code = this.codeGenerator.generate({
        requirement: req,
        plan,
        placements,
        responsiveRules,
        designConstraints: dsConstraints,
        executiveConstraints: execConstraints,
      });

      const safetyChecks = input.config.safetyRulesEnabled
        ? this.safetyChecker.check(plan.targetFiles, code, input.config)
        : [];

      const allSafetyPassed = safetyChecks.every((c) => c.passed);
      let refactoringStatus: RefactoringStatus = "refactored";
      if (!allSafetyPassed) refactoringStatus = "blocked";
      else if (code.length > 0) refactoringStatus = "validated";

      records.push(
        this.metadata.enrichRecord({
          layoutRefactoringId: this.metadata.buildRecordId(),
          timestamp: new Date().toISOString(),
          sourceRecommendationId: req.recommendation.recommendationId,
          sourceUxScoreId:
            input.uxScore?.uxScoreId ?? req.recommendation.sourceUxScoreId ?? null,
          sourceLayoutEvaluationId: input.layoutEvaluation?.evaluationId ?? null,
          sourceWorkflowOptimizationId: input.workflowOptimization?.optimizationRecordId ?? null,
          sourceDesignSystemId: input.designSystem?.designSystemId ?? null,
          sourceExecutiveStyleId: input.executiveStyle?.executiveStyleId ?? null,
          sourceFrontendBuildRecordId: req.buildRecord?.buildRecordId ?? null,
          sourceComponentGenerationIds: req.relatedComponents.map(
            (c) => c.componentGenerationId,
          ),
          targetScreenId: analysis.screenId,
          targetRouteOrViewId: analysis.routeOrViewId,
          targetFiles: plan.targetFiles,
          currentLayoutSummary: [
            `${analysis.regionCount} regions`,
            ...analysis.hierarchySummary,
          ].join(" · "),
          proposedLayoutStructure: plan.structure,
          refactoredLayoutCode: code,
          componentPlacementMap: placements,
          responsiveBehaviorSummary: responsiveRules,
          safetyChecks,
          refactoringStatus,
          confidenceScore: req.confidenceScore,
          metadataVersion: REFACTORING_METADATA_VERSION,
        }),
      );
    }

    const validation = this.validator.validate(records, input.config);

    const report: LayoutRefactoringReport = {
      layoutRefactoringReportId: this.metadata.buildReportId(),
      refactoringTimestamp: new Date().toISOString(),
      records,
      validation,
      durationMs: Date.now() - started,
      metadataVersion: REFACTORING_METADATA_VERSION,
    };

    appendRefactoringLog({
      event: "layout_refactoring_end",
      level: validation.decision === "pass" ? "info" : "warn",
      details: `Refactoring ${validation.decision.toUpperCase()} · ${records.length} layouts · ${report.durationMs}ms`,
    });

    return report;
  }
}
