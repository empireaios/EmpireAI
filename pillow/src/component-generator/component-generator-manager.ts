/** T3-02 — Component Generator manager — core generation pipeline. */

import { appendGenerationLog } from "./generation-logging.js";
import { ComponentRequirementInterpreter } from "./component-requirement-interpreter.js";
import { ComponentArchitectureAnalyzer } from "./component-architecture-analyzer.js";
import { DesignSystemConstraintEngine } from "./design-system-constraint-engine.js";
import { ExecutivePreferenceConstraintEngine } from "./executive-preference-constraint-engine.js";
import { ComponentVariantGenerator } from "./component-variant-generator.js";
import { ComponentInterfaceGenerator } from "./component-interface-generator.js";
import { ComponentStateGenerator } from "./component-state-generator.js";
import { ComponentStyleGenerator } from "./component-style-generator.js";
import { ComponentRegistryManager } from "./component-registry-manager.js";
import { ComponentSafetyChecker } from "./component-safety-checker.js";
import { ComponentOutputValidator } from "./component-output-validator.js";
import { ComponentMetadataGenerator } from "./component-metadata-generator.js";
import { ComponentCodeAssembler } from "./component-code-assembler.js";
import type { FrontendBuildReport } from "../frontend-builder/types.js";
import type { RecommendationRecord } from "../recommendation-engine/types.js";
import type { DesignSystemModel } from "../design-system-intelligence-engine/types.js";
import type { ExecutiveStyleModel } from "../executive-style-learning-engine/types.js";
import type { ComponentGeneratorConfiguration } from "./configuration.js";
import type { ComponentGenerationRecord, ComponentGenerationReport, GenerationStatus } from "./types.js";
import { GENERATION_METADATA_VERSION } from "./paths.js";

export class ComponentGeneratorManager {
  private readonly interpreter = new ComponentRequirementInterpreter();
  private readonly architecture = new ComponentArchitectureAnalyzer();
  private readonly designConstraints = new DesignSystemConstraintEngine();
  private readonly executiveConstraints = new ExecutivePreferenceConstraintEngine();
  private readonly variantGenerator = new ComponentVariantGenerator();
  private readonly interfaceGenerator = new ComponentInterfaceGenerator();
  private readonly stateGenerator = new ComponentStateGenerator();
  private readonly styleGenerator = new ComponentStyleGenerator();
  private readonly registry = new ComponentRegistryManager();
  private readonly safetyChecker = new ComponentSafetyChecker();
  private readonly validator = new ComponentOutputValidator();
  private readonly metadata = new ComponentMetadataGenerator();
  private readonly codeAssembler = new ComponentCodeAssembler();

  generateReport(input: {
    config: ComponentGeneratorConfiguration;
    recommendations: RecommendationRecord | null;
    frontendBuild: FrontendBuildReport | null;
    designSystem: DesignSystemModel | null;
    executiveStyle: ExecutiveStyleModel | null;
  }): ComponentGenerationReport {
    const started = Date.now();

    appendGenerationLog({
      event: "component_generator_start",
      level: "info",
      details: "Starting component generation",
    });

    const proposals = input.recommendations?.proposals ?? [];
    const buildRecords = input.frontendBuild?.records ?? [];
    const requirements = this.interpreter.interpret(proposals, buildRecords, input.config);

    const dsConstraints = this.designConstraints.buildConstraints(
      input.designSystem,
      input.config,
    );
    const execConstraints = this.executiveConstraints.buildConstraints(
      input.executiveStyle,
      input.config,
    );

    const records: ComponentGenerationRecord[] = [];

    for (const req of requirements) {
      if (records.length >= input.config.maxComponentsPerGeneration) break;

      const category = this.architecture.resolveCategory(req);
      if (!input.config.allowedComponentCategories.includes(category)) continue;

      const componentName = this.architecture.resolveComponentName(req, category);
      const targetFiles = this.architecture.resolveTargetFiles(
        componentName,
        category,
        input.config,
      );

      const registryUpdate = this.registry.checkAndRegister(
        componentName,
        targetFiles[0]!,
        input.config,
      );

      if (registryUpdate.action === "skip_duplicate") {
        records.push(
          this.metadata.enrichRecord({
            componentGenerationId: this.metadata.buildRecordId(),
            timestamp: new Date().toISOString(),
            sourceRecommendationId: req.recommendation.recommendationId,
            sourceFrontendBuildRecordId: req.buildRecord?.buildRecordId ?? null,
            sourceDesignSystemId: input.designSystem?.designSystemId ?? null,
            sourceExecutiveStyleId: input.executiveStyle?.executiveStyleId ?? null,
            componentName,
            componentCategory: category,
            componentPurpose: req.recommendation.recommendationDescription,
            targetFiles,
            generatedComponentCode: "",
            generatedPropsOrInterface: "",
            generatedVariants: [],
            generatedStates: [],
            generatedStyling: [],
            usageExamples: [],
            registryUpdates: [registryUpdate],
            safetyChecks: [],
            generationStatus: "duplicate_skipped",
            confidenceScore: req.confidenceScore,
            metadataVersion: GENERATION_METADATA_VERSION,
          }),
        );
        continue;
      }

      const variants = this.variantGenerator.generate(componentName, category, input.config);
      const propsInterface = this.interfaceGenerator.generate(
        componentName,
        category,
        input.config,
      );
      const states = this.stateGenerator.generate(componentName, category, input.config);
      const styling = this.styleGenerator.generate(
        input.designSystem,
        category,
        input.config,
      );

      const { code, usageExamples } = this.codeAssembler.assemble({
        componentName,
        category,
        requirement: req,
        propsInterface,
        variants,
        states,
        styling,
        designConstraints: dsConstraints,
        executiveConstraints: execConstraints,
      });

      const safetyChecks = input.config.safetyRulesEnabled
        ? this.safetyChecker.check(targetFiles, code, input.config)
        : [];

      const allSafetyPassed = safetyChecks.every((c) => c.passed);
      let generationStatus: GenerationStatus = "generated";
      if (!allSafetyPassed) generationStatus = "blocked";
      else if (code.length > 0) generationStatus = "validated";

      records.push(
        this.metadata.enrichRecord({
          componentGenerationId: this.metadata.buildRecordId(),
          timestamp: new Date().toISOString(),
          sourceRecommendationId: req.recommendation.recommendationId,
          sourceFrontendBuildRecordId: req.buildRecord?.buildRecordId ?? null,
          sourceDesignSystemId: input.designSystem?.designSystemId ?? null,
          sourceExecutiveStyleId: input.executiveStyle?.executiveStyleId ?? null,
          componentName,
          componentCategory: category,
          componentPurpose: req.recommendation.recommendationDescription,
          targetFiles,
          generatedComponentCode: code,
          generatedPropsOrInterface: propsInterface,
          generatedVariants: variants,
          generatedStates: states,
          generatedStyling: styling,
          usageExamples,
          registryUpdates: [registryUpdate],
          safetyChecks,
          generationStatus,
          confidenceScore: req.confidenceScore,
          metadataVersion: GENERATION_METADATA_VERSION,
        }),
      );
    }

    const validation = this.validator.validate(records, input.config);

    const report: ComponentGenerationReport = {
      componentGenerationReportId: this.metadata.buildReportId(),
      generationTimestamp: new Date().toISOString(),
      records,
      validation,
      durationMs: Date.now() - started,
      metadataVersion: GENERATION_METADATA_VERSION,
    };

    appendGenerationLog({
      event: "component_generator_end",
      level: validation.decision === "pass" ? "info" : "warn",
      details: `Generation ${validation.decision.toUpperCase()} · ${records.length} components · ${report.durationMs}ms`,
    });

    return report;
  }

  resetRegistryForTesting(): void {
    this.registry.resetForTesting();
  }
}
