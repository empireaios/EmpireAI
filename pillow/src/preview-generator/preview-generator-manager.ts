/** T3-05 — Preview Generator manager — core preview pipeline. */

import { appendPreviewLog } from "./preview-logging.js";
import { PreviewSourceCollector } from "./preview-source-collector.js";
import { PreviewEnvironmentManager } from "./preview-environment-manager.js";
import { PreviewScopeResolver } from "./preview-scope-resolver.js";
import { PreviewRouteManager } from "./preview-route-manager.js";
import { ResponsivePreviewEngine } from "./responsive-preview-engine.js";
import { PreviewAssemblyEngine } from "./preview-assembly-engine.js";
import { PreviewSafetyChecker } from "./preview-safety-checker.js";
import { PreviewOutputValidator } from "./preview-output-validator.js";
import { PreviewMetadataGenerator } from "./preview-metadata-generator.js";
import type { FrontendBuildReport } from "../frontend-builder/types.js";
import type { ComponentGenerationReport } from "../component-generator/types.js";
import type { LayoutRefactoringReport } from "../layout-refactoring/types.js";
import type { ThemeGenerationReport } from "../theme-builder/types.js";
import type { PreviewGeneratorConfiguration } from "./configuration.js";
import type { PreviewBuildRecord, PreviewGenerationReport, BuildStatus } from "./types.js";
import { PREVIEW_METADATA_VERSION } from "./paths.js";

export class PreviewGeneratorManager {
  private readonly collector = new PreviewSourceCollector();
  private readonly envManager = new PreviewEnvironmentManager();
  private readonly scopeResolver = new PreviewScopeResolver();
  private readonly routeManager = new PreviewRouteManager();
  private readonly responsiveEngine = new ResponsivePreviewEngine();
  private readonly assemblyEngine = new PreviewAssemblyEngine();
  private readonly safetyChecker = new PreviewSafetyChecker();
  private readonly validator = new PreviewOutputValidator();
  private readonly metadata = new PreviewMetadataGenerator();

  generateReport(input: {
    config: PreviewGeneratorConfiguration;
    frontendBuild: FrontendBuildReport | null;
    componentGeneration: ComponentGenerationReport | null;
    layoutRefactoring: LayoutRefactoringReport | null;
    themeGeneration: ThemeGenerationReport | null;
  }): PreviewGenerationReport {
    const started = Date.now();

    appendPreviewLog({
      event: "preview_generator_start",
      level: "info",
      details: "Starting preview generation",
    });

    this.envManager.cleanup(input.config);

    const sources = this.collector.collect({
      frontendBuild: input.frontendBuild,
      componentGeneration: input.componentGeneration,
      layoutRefactoring: input.layoutRefactoring,
      themeGeneration: input.themeGeneration,
    });

    const records: PreviewBuildRecord[] = [];

    for (const bundle of sources) {
      if (records.length >= input.config.maxPreviewsPerGeneration) break;
      if (this.envManager.getActiveCount() >= input.config.maxActiveEnvironments) break;

      const scope = this.scopeResolver.resolve(bundle);
      if (!input.config.allowedPreviewScopes.includes(scope)) continue;

      const env = this.envManager.create(input.config);
      const { previewUrl, localReference } = this.routeManager.buildRoute(
        env,
        bundle.screenId,
        input.config,
      );
      const responsiveStates = this.responsiveEngine.buildStates(scope);
      const { previewFiles } = this.assemblyEngine.assemble({
        bundle,
        env,
        scope,
        responsiveStates,
        previewUrl,
      });

      const safetyChecks = this.safetyChecker.check(
        previewFiles,
        previewUrl,
        input.config,
      );

      const allPassed = safetyChecks.every((c) => c.passed);
      let buildStatus: BuildStatus = "built";
      if (!allPassed) buildStatus = "blocked";
      else buildStatus = "validated";

      env.status = "active";

      records.push(
        this.metadata.enrichRecord({
          previewBuildId: this.metadata.buildRecordId(),
          timestamp: new Date().toISOString(),
          sourceFrontendBuildRecordIds: bundle.frontendBuildIds,
          sourceComponentGenerationIds: bundle.componentGenerationIds,
          sourceLayoutRefactoringIds: bundle.layoutRefactoringIds,
          sourceThemeIds: bundle.themeIds,
          previewScope: scope,
          previewTargetScreenId: bundle.screenId,
          previewTargetRouteOrViewId: bundle.routeOrViewId ?? previewUrl,
          previewFiles,
          previewUrl,
          previewLocalReference: localReference,
          previewEnvironmentStatus: env.status,
          buildStatus,
          safetyChecks,
          confidenceScore: bundle.confidenceScore,
          metadataVersion: PREVIEW_METADATA_VERSION,
        }),
      );
    }

    const validation = this.validator.validate(records, input.config);

    const report: PreviewGenerationReport = {
      previewGenerationReportId: this.metadata.buildReportId(),
      generationTimestamp: new Date().toISOString(),
      records,
      validation,
      durationMs: Date.now() - started,
      metadataVersion: PREVIEW_METADATA_VERSION,
    };

    appendPreviewLog({
      event: "preview_generator_end",
      level: validation.decision === "pass" ? "info" : "warn",
      details: `Preview ${validation.decision.toUpperCase()} · ${records.length} builds · ${report.durationMs}ms`,
    });

    return report;
  }

  cleanupEnvironments(config: PreviewGeneratorConfiguration): number {
    return this.envManager.cleanup(config);
  }

  getActiveEnvironmentCount(): number {
    return this.envManager.getActiveCount();
  }
}
