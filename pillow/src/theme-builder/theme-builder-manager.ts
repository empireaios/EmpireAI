/** T3-04 — Theme Builder manager — core generation pipeline. */

import { appendThemeLog } from "./theme-logging.js";
import { ThemeRequirementInterpreter } from "./theme-requirement-interpreter.js";
import { DesignSystemThemeConstraintEngine } from "./design-system-theme-constraint-engine.js";
import { ExecutivePreferenceThemeConstraintEngine } from "./executive-preference-theme-constraint-engine.js";
import { ColorThemeGenerator } from "./color-theme-generator.js";
import { TypographyThemeGenerator } from "./typography-theme-generator.js";
import { SpacingThemeGenerator } from "./spacing-theme-generator.js";
import { InteractionStateThemeGenerator } from "./interaction-state-theme-generator.js";
import { ComponentThemeVariantGenerator } from "./component-theme-variant-generator.js";
import { ThemeTokenGenerator } from "./theme-token-generator.js";
import { ThemeCodeAssembler } from "./theme-code-assembler.js";
import { ThemeSafetyChecker } from "./theme-safety-checker.js";
import { ThemeOutputValidator } from "./theme-output-validator.js";
import { ThemeMetadataGenerator } from "./theme-metadata-generator.js";
import { ThemeScopeResolver } from "./theme-scope-resolver.js";
import type { FrontendBuildReport } from "../frontend-builder/types.js";
import type { RecommendationRecord } from "../recommendation-engine/types.js";
import type { DesignSystemModel } from "../design-system-intelligence-engine/types.js";
import type { ExecutiveStyleModel } from "../executive-style-learning-engine/types.js";
import type { ComponentGenerationReport } from "../component-generator/types.js";
import type { LayoutRefactoringReport } from "../layout-refactoring/types.js";
import type { ThemeBuilderConfiguration } from "./configuration.js";
import type { ThemeGenerationReport, ThemeRecord, ThemeStatus } from "./types.js";
import { THEME_METADATA_VERSION } from "./paths.js";

export class ThemeBuilderManager {
  private readonly interpreter = new ThemeRequirementInterpreter();
  private readonly designConstraints = new DesignSystemThemeConstraintEngine();
  private readonly executiveConstraints = new ExecutivePreferenceThemeConstraintEngine();
  private readonly colorGenerator = new ColorThemeGenerator();
  private readonly typographyGenerator = new TypographyThemeGenerator();
  private readonly spacingGenerator = new SpacingThemeGenerator();
  private readonly interactionGenerator = new InteractionStateThemeGenerator();
  private readonly variantGenerator = new ComponentThemeVariantGenerator();
  private readonly tokenGenerator = new ThemeTokenGenerator();
  private readonly codeAssembler = new ThemeCodeAssembler();
  private readonly safetyChecker = new ThemeSafetyChecker();
  private readonly validator = new ThemeOutputValidator();
  private readonly metadata = new ThemeMetadataGenerator();
  private readonly scopeResolver = new ThemeScopeResolver();

  generateReport(input: {
    config: ThemeBuilderConfiguration;
    recommendations: RecommendationRecord | null;
    designSystem: DesignSystemModel | null;
    executiveStyle: ExecutiveStyleModel | null;
    frontendBuild: FrontendBuildReport | null;
    componentGeneration: ComponentGenerationReport | null;
    layoutRefactoring: LayoutRefactoringReport | null;
  }): ThemeGenerationReport {
    const started = Date.now();

    appendThemeLog({
      event: "theme_builder_start",
      level: "info",
      details: "Starting theme generation",
    });

    const proposals = input.recommendations?.proposals ?? [];
    const buildRecords = input.frontendBuild?.records ?? [];
    const componentRecords = input.componentGeneration?.records ?? [];
    const layoutRecords = input.layoutRefactoring?.records ?? [];

    const requirements = this.interpreter.interpret(
      proposals,
      buildRecords,
      componentRecords,
      layoutRecords,
      input.config,
    );

    const dsConstraintList = this.designConstraints.buildConstraints(
      input.designSystem,
      input.config,
    );
    const execConstraintList = this.executiveConstraints.buildConstraints(
      input.executiveStyle,
      input.config,
    );

    const records: ThemeRecord[] = [];

    for (const req of requirements) {
      if (records.length >= input.config.maxThemesPerGeneration) break;

      const scope = this.scopeResolver.resolve(req);
      if (!input.config.allowedThemeScopes.includes(scope)) continue;

      const colorTokens = this.colorGenerator.generate(
        req.themeName,
        scope,
        input.designSystem,
        input.config,
      );
      const typographyTokens = this.typographyGenerator.generate(
        req.themeName,
        input.designSystem,
        input.config,
      );
      const spacingTokens = this.spacingGenerator.generateSpacing(
        req.themeName,
        input.designSystem,
        input.config,
      );
      const sizingTokens = this.spacingGenerator.generateSizing(
        req.themeName,
        input.designSystem,
        input.config,
      );
      const borderTokens = this.spacingGenerator.generateBorder(req.themeName, input.config);
      const radiusTokens = this.spacingGenerator.generateRadius(req.themeName, input.config);
      const shadowTokens = this.spacingGenerator.generateShadow(req.themeName, input.config);
      const interactionStateTokens = this.interactionGenerator.generate(
        req.themeName,
        scope,
        input.config,
      );
      const componentVariantTokens = this.variantGenerator.generate(
        req.themeName,
        scope,
        req.relatedComponents,
        input.config,
      );

      const themeTokens = this.tokenGenerator.aggregate([
        colorTokens,
        typographyTokens,
        spacingTokens,
        sizingTokens,
        borderTokens,
        radiusTokens,
        shadowTokens,
        interactionStateTokens,
        componentVariantTokens,
      ]);

      const code = this.codeAssembler.assemble({
        themeName: req.themeName,
        scope,
        requirement: req,
        allTokens: themeTokens,
        designConstraints: dsConstraintList,
        executiveConstraints: execConstraintList,
      });

      const targetFiles = this.codeAssembler.resolveTargetFiles(
        req.themeName,
        input.config.allowedTargetDirectories,
      );

      const safetyChecks = input.config.safetyRulesEnabled
        ? this.safetyChecker.check(targetFiles, code, input.config)
        : [];

      const allSafetyPassed = safetyChecks.every((c) => c.passed);
      let themeStatus: ThemeStatus = "generated";
      if (!allSafetyPassed) themeStatus = "blocked";
      else if (code.length > 0) themeStatus = "validated";

      records.push(
        this.metadata.enrichRecord({
          themeId: this.metadata.buildRecordId(),
          themeName: req.themeName,
          timestamp: new Date().toISOString(),
          sourceRecommendationId: req.recommendation?.recommendationId ?? null,
          sourceDesignSystemId: input.designSystem?.designSystemId ?? null,
          sourceExecutiveStyleId: input.executiveStyle?.executiveStyleId ?? null,
          sourceFrontendBuildRecordId: req.buildRecord?.buildRecordId ?? null,
          sourceComponentGenerationIds: req.relatedComponents.map(
            (c) => c.componentGenerationId,
          ),
          sourceLayoutRefactoringId: req.relatedLayout?.layoutRefactoringId ?? null,
          themeScope: scope,
          themeTokens,
          colorTokens,
          typographyTokens,
          spacingTokens,
          sizingTokens,
          borderTokens,
          radiusTokens,
          shadowTokens,
          interactionStateTokens,
          componentVariantTokens,
          generatedThemeCode: code,
          targetFiles,
          safetyChecks,
          themeStatus,
          confidenceScore: req.confidenceScore,
          metadataVersion: THEME_METADATA_VERSION,
        }),
      );
    }

    const validation = this.validator.validate(records, input.config);

    const report: ThemeGenerationReport = {
      themeGenerationReportId: this.metadata.buildReportId(),
      generationTimestamp: new Date().toISOString(),
      records,
      validation,
      durationMs: Date.now() - started,
      metadataVersion: THEME_METADATA_VERSION,
    };

    appendThemeLog({
      event: "theme_builder_end",
      level: validation.decision === "pass" ? "info" : "warn",
      details: `Generation ${validation.decision.toUpperCase()} · ${records.length} themes · ${report.durationMs}ms`,
    });

    return report;
  }
}
