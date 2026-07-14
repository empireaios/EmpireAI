/** T3-01 — Frontend Builder manager — core build pipeline. */

import { appendBuildLog } from "./build-logging.js";
import { UxRecommendationInterpreter } from "./ux-recommendation-interpreter.js";
import { FrontendArchitectureAnalyzer } from "./frontend-architecture-analyzer.js";
import { DesignSystemConstraintEngine } from "./design-system-constraint-engine.js";
import { ExecutivePreferenceConstraintEngine } from "./executive-preference-constraint-engine.js";
import { ImplementationPlanGenerator } from "./implementation-plan-generator.js";
import { CodeChangeGenerator } from "./code-change-generator.js";
import { CodeSafetyChecker } from "./code-safety-checker.js";
import { BuildOutputValidator } from "./build-output-validator.js";
import { BuildMetadataGenerator } from "./build-metadata-generator.js";
import type { RecommendationRecord } from "../recommendation-engine/types.js";
import type { DesignSystemModel } from "../design-system-intelligence-engine/types.js";
import type { ExecutiveStyleModel } from "../executive-style-learning-engine/types.js";
import type { UxScoreRecord } from "../ux-scoring-engine/types.js";
import type { UxIntelligenceCertificationReport } from "../ux-intelligence-certification-engine/types.js";
import type { FrontendBuilderConfiguration } from "./configuration.js";
import type { FrontendBuildRecord, FrontendBuildReport, BuildStatus } from "./types.js";
import { BUILD_METADATA_VERSION } from "./paths.js";

export class FrontendBuilderManager {
  private readonly interpreter = new UxRecommendationInterpreter();
  private readonly architecture = new FrontendArchitectureAnalyzer();
  private readonly designConstraints = new DesignSystemConstraintEngine();
  private readonly executiveConstraints = new ExecutivePreferenceConstraintEngine();
  private readonly planGenerator = new ImplementationPlanGenerator();
  private readonly codeGenerator = new CodeChangeGenerator();
  private readonly safetyChecker = new CodeSafetyChecker();
  private readonly validator = new BuildOutputValidator();
  private readonly metadata = new BuildMetadataGenerator();

  generateBuildReport(input: {
    config: FrontendBuilderConfiguration;
    recommendations: RecommendationRecord | null;
    uxScore: UxScoreRecord | null;
    designSystem: DesignSystemModel | null;
    executiveStyle: ExecutiveStyleModel | null;
    certification: UxIntelligenceCertificationReport | null;
    screenId: string | null;
    routeOrViewId: string | null;
  }): FrontendBuildReport {
    const started = Date.now();

    appendBuildLog({
      event: "frontend_builder_start",
      level: "info",
      details: "Starting frontend build generation",
    });

    if (input.config.requireUxCertificationPass) {
      const certOk =
        input.certification?.finalCertificationDecision === "pass" ||
        input.certification?.finalCertificationDecision === "conditional";
      if (!certOk) {
        throw new Error("UX Intelligence certification required before frontend building");
      }
    }

    const proposals = input.recommendations?.proposals ?? [];
    const approved = this.interpreter.interpret(proposals, input.config);

    const dsConstraints = this.designConstraints.buildConstraints(
      input.designSystem,
      input.config,
    );
    const execConstraints = this.executiveConstraints.buildConstraints(
      input.executiveStyle,
      input.config,
    );

    const records: FrontendBuildRecord[] = [];

    for (const recommendation of approved) {
      if (records.length >= input.config.maxRecordsPerBuild) break;

      const scope = this.architecture.resolveScope(recommendation);
      if (!input.config.codeGenerationScopes.includes(scope)) continue;

      const targetFiles = this.architecture.resolveTargetFiles(
        recommendation,
        scope,
        input.config,
      );
      const plan = this.planGenerator.generate(recommendation, targetFiles, scope);
      const changes = this.codeGenerator.generate(
        recommendation,
        targetFiles,
        scope,
        dsConstraints,
        execConstraints,
      );
      const safetyChecks = input.config.safetyRulesEnabled
        ? this.safetyChecker.check(changes, input.config)
        : [];

      const allSafetyPassed = safetyChecks.every((c) => c.passed);
      let buildStatus: BuildStatus = "generated";
      if (!allSafetyPassed) buildStatus = "blocked";
      else if (changes.length > 0) buildStatus = "validated";

      const record = this.metadata.enrichRecord({
        buildRecordId: this.metadata.buildRecordId(),
        timestamp: new Date().toISOString(),
        sourceRecommendationId: recommendation.recommendationId,
        sourceUxScoreId:
          recommendation.sourceUxScoreId ?? input.uxScore?.uxScoreId ?? null,
        sourceDesignSystemId: input.designSystem?.designSystemId ?? null,
        sourceExecutiveStyleId: input.executiveStyle?.executiveStyleId ?? null,
        targetScreenId:
          recommendation.screenId ?? input.screenId,
        targetRouteOrViewId:
          recommendation.routeOrViewId ?? input.routeOrViewId,
        targetFiles: changes.map((c) => c.targetFile),
        proposedCodeChanges: changes,
        implementationPlan: plan,
        designSystemConstraints: dsConstraints,
        executivePreferenceConstraints: execConstraints,
        safetyChecks,
        buildStatus,
        confidenceScore: recommendation.confidenceScore,
        metadataVersion: BUILD_METADATA_VERSION,
      });

      records.push(record);
    }

    const validation = this.validator.validate(records, input.config);

    const report: FrontendBuildReport = {
      frontendBuildReportId: this.metadata.buildReportId(),
      buildTimestamp: new Date().toISOString(),
      records,
      validation,
      durationMs: Date.now() - started,
      metadataVersion: BUILD_METADATA_VERSION,
    };

    appendBuildLog({
      event: "frontend_builder_end",
      level: validation.decision === "pass" ? "info" : "warn",
      details: `Build ${validation.decision.toUpperCase()} · ${records.length} records · ${report.durationMs}ms`,
    });

    return report;
  }
}
