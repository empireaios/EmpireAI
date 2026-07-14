/** T2-02 — Design system model assembly. */

import type { ComponentRecognitionResult } from "../component-recognition-engine/types.js";
import type { LayoutModel } from "../layout-understanding-engine/types.js";
import type { DesignSystemIntelligenceConfiguration } from "./configuration.js";
import { ColorIntelligenceEngine } from "./color-intelligence-engine.js";
import { ComponentFamilyManager } from "./component-family-manager.js";
import { ComponentLibraryAnalyzer } from "./component-library-analyzer.js";
import { ComponentVariantManager } from "./component-variant-manager.js";
import { DesignSystemMetadataGenerator } from "./design-system-metadata-generator.js";
import { IconIntelligenceEngine } from "./icon-intelligence-engine.js";
import { InteractionStandardEngine } from "./interaction-standard-engine.js";
import { LayoutStandardEngine } from "./layout-standard-engine.js";
import { DESIGN_SYSTEM_METADATA_VERSION, SUPPORTED_PATTERNS } from "./paths.js";
import { SizingIntelligenceEngine } from "./sizing-intelligence-engine.js";
import { SpacingIntelligenceEngine } from "./spacing-intelligence-engine.js";
import { TypographyIntelligenceEngine } from "./typography-intelligence-engine.js";
import type { DesignSystemComponent, DesignSystemModel } from "./types.js";

export class DesignSystemModelBuilder {
  private readonly libraryAnalyzer = new ComponentLibraryAnalyzer();
  private readonly familyManager = new ComponentFamilyManager();
  private readonly variantManager = new ComponentVariantManager();
  private readonly typographyEngine = new TypographyIntelligenceEngine();
  private readonly colorEngine = new ColorIntelligenceEngine();
  private readonly spacingEngine = new SpacingIntelligenceEngine();
  private readonly sizingEngine = new SizingIntelligenceEngine();
  private readonly iconEngine = new IconIntelligenceEngine();
  private readonly layoutEngine = new LayoutStandardEngine();
  private readonly interactionEngine = new InteractionStandardEngine();
  private readonly metadataGenerator = new DesignSystemMetadataGenerator();
  private previousModel: DesignSystemModel | null = null;

  build(input: {
    repositoryRoot: string;
    sessionId: string;
    config: DesignSystemIntelligenceConfiguration;
    recognition: ComponentRecognitionResult | null;
    layout: LayoutModel | null;
  }): DesignSystemModel {
    const componentLibrary = this.libraryAnalyzer.analyze(input.recognition, input.config);
    const version = input.config.versioningEnabled
      ? this.metadataGenerator.bumpVersion(this.previousModel?.version ?? null)
      : "1.0.0";

    const model: DesignSystemModel = {
      designSystemId: this.metadataGenerator.buildDesignSystemId(input.sessionId),
      version,
      componentLibrary,
      componentFamilies: this.familyManager.buildFamilies(componentLibrary),
      componentVariants: this.variantManager.buildVariants(componentLibrary),
      typographyStandards: this.typographyEngine.learn(
        input.repositoryRoot,
        input.config.designTokenSource,
      ),
      colorPalette: this.colorEngine.learn(
        input.repositoryRoot,
        input.config.designTokenSource,
      ),
      spacingScale: this.spacingEngine.learn(input.layout),
      sizingScale: this.sizingEngine.learn(componentLibrary),
      iconLibrary: this.iconEngine.learn(componentLibrary),
      layoutStandards: this.layoutEngine.learn(input.layout),
      interactionStandards: this.interactionEngine.learn(componentLibrary),
      supportedPatterns: input.config.supportedPatterns.filter((p) =>
        SUPPORTED_PATTERNS.includes(p),
      ),
      deprecatedPatterns: this.detectDeprecated(componentLibrary),
      timestamp: new Date().toISOString(),
      metadataVersion: DESIGN_SYSTEM_METADATA_VERSION,
    };

    this.previousModel = model;
    return model;
  }

  getPreviousModel(): DesignSystemModel | null {
    return this.previousModel;
  }

  reset(): void {
    this.previousModel = null;
    this.libraryAnalyzer.resetUsageCounts();
  }

  private detectDeprecated(components: DesignSystemComponent[]): string[] {
    const deprecated: string[] = [];
    const types = new Set(components.map((c) => c.componentCategory));
    if (!types.has("overlays/modal") && !types.has("overlays/dialog")) {
      deprecated.push("legacy_modal_pattern");
    }
    return deprecated;
  }
}
