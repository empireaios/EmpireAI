/** T2-02 — Design System Intelligence manager. */

import { appendDesignSystemLog } from "./design-system-logging.js";
import { DesignSystemModelBuilder } from "./design-system-model-builder.js";
import { DesignSystemValidator } from "./design-system-validator.js";
import type { ComponentRecognitionResult } from "../component-recognition-engine/types.js";
import type { LayoutModel } from "../layout-understanding-engine/types.js";
import type { DesignSystemIntelligenceConfiguration } from "./configuration.js";
import type { DesignSystemAnalysisReport, DesignSystemModel } from "./types.js";
import { DESIGN_SYSTEM_METADATA_VERSION } from "./paths.js";

export class DesignSystemIntelligenceManager {
  private readonly modelBuilder = new DesignSystemModelBuilder();
  private readonly validator = new DesignSystemValidator();

  runAnalysis(input: {
    repositoryRoot: string;
    sessionId: string;
    config: DesignSystemIntelligenceConfiguration;
    recognition: ComponentRecognitionResult | null;
    layout: LayoutModel | null;
  }): DesignSystemAnalysisReport {
    const started = Date.now();
    const previous = this.modelBuilder.getPreviousModel();

    appendDesignSystemLog({
      event: "design_system_analysis_start",
      level: "info",
      details: "Starting design system analysis",
    });

    const model = this.modelBuilder.build(input);
    const validation = this.validator.validate(model, {
      validationEnabled: input.config.validationRulesEnabled,
    });

    const previousIds = new Set(previous?.componentLibrary.map((c) => c.componentId) ?? []);
    const currentIds = new Set(model.componentLibrary.map((c) => c.componentId));
    const newComponents = [...currentIds].filter((id) => !previousIds.has(id)).length;
    const deprecatedComponents = [...previousIds].filter((id) => !currentIds.has(id)).length;

    const report: DesignSystemAnalysisReport = {
      analysisReportId: `dsi-analysis-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      analysisTimestamp: new Date().toISOString(),
      model,
      validation,
      evolutionSummary: {
        previousVersion: previous?.version ?? null,
        currentVersion: model.version,
        newComponents,
        updatedComponents: model.componentLibrary.filter((c) => previousIds.has(c.componentId))
          .length,
        deprecatedComponents,
      },
      durationMs: Date.now() - started,
      metadataVersion: DESIGN_SYSTEM_METADATA_VERSION,
    };

    appendDesignSystemLog({
      event: "design_system_analysis_end",
      level: validation.decision === "pass" ? "info" : "warn",
      details: `Analysis ${validation.decision.toUpperCase()} · ${model.componentLibrary.length} components · ${model.componentFamilies.length} families · ${validation.deviations.length} deviations · ${report.durationMs}ms`,
    });

    appendDesignSystemLog({
      event: "component_discovery",
      level: "info",
      details: `Discovered ${model.componentLibrary.length} components, ${model.componentVariants.length} variants`,
    });

    return report;
  }

  getLatestModel(): DesignSystemModel | null {
    return this.modelBuilder.getPreviousModel();
  }

  reset(): void {
    this.modelBuilder.reset();
  }
}
