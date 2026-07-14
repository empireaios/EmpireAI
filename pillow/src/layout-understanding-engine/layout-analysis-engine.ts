/** T1-04 — Per-recognition layout analysis pipeline. */

import type { ComponentRecognitionResult } from "../component-recognition-engine/types.js";
import type { LayoutUnderstandingConfiguration } from "./configuration.js";
import { StructuralRegionDetector } from "./structural-region-rules.js";
import { SpatialRelationshipMapper } from "./spatial-relationship-mapper.js";
import { GroupingEngine } from "./grouping-engine.js";
import { AlignmentAnalyzer } from "./alignment-analyzer.js";
import { ResponsiveLayoutDetector } from "./responsive-layout-detector.js";
import { detectLayoutChanges } from "./layout-change-detector.js";
import { inferStackingOrder } from "./stacking-analyzer.js";
import { buildLayoutId, buildLayoutMetadata } from "./layout-metadata-generator.js";
import { LayoutValidator } from "./layout-validator.js";
import type { LayoutModel } from "./types.js";

export type LayoutAnalysisInput = {
  recognition: ComponentRecognitionResult;
  sessionId: string;
  layoutSequence: number;
  previousLayout: LayoutModel | null;
  config: LayoutUnderstandingConfiguration;
};

export type LayoutAnalysisResult = {
  layout: LayoutModel | null;
  error?: string;
};

export class LayoutAnalysisEngine {
  private readonly regionDetector = new StructuralRegionDetector();
  private readonly spatialMapper = new SpatialRelationshipMapper();
  private readonly groupingEngine = new GroupingEngine();
  private readonly alignmentAnalyzer = new AlignmentAnalyzer();
  private readonly responsiveDetector = new ResponsiveLayoutDetector();
  private readonly validator = new LayoutValidator();

  analyze(input: LayoutAnalysisInput): LayoutAnalysisResult {
    const started = Date.now();
    try {
      if (!input.recognition?.metadata?.sourceStateId) {
        return { layout: null, error: "Invalid component recognition result" };
      }

      const { components } = input.recognition;
      const viewport = input.recognition.metadata.viewport;

      const regions = this.regionDetector.detect(
        components,
        viewport,
        input.config.structuralRegionRules,
        input.config.confidenceThreshold,
      );

      const componentToRegion: Record<string, string> = {};
      for (const region of regions) {
        for (const id of region.componentIds) {
          componentToRegion[id] = region.regionId;
        }
      }

      const regionHierarchy = regions.map((r) => ({
        regionId: r.regionId,
        children: r.childRegionIds,
      }));

      const spatialRelationships = [
        ...this.spatialMapper.mapComponents(components),
        ...this.spatialMapper.mapRegions(regions),
      ];

      const groupingRelationships = this.groupingEngine.group(
        components,
        input.config.groupingThreshold,
      );
      const alignmentRelationships = this.alignmentAnalyzer.analyze(
        components,
        input.config.alignmentTolerance,
      );
      const stackingOrder = inferStackingOrder(components);
      const responsiveBreakpoints = this.responsiveDetector.detect(viewport, input.config);

      const avgConfidence =
        regions.length > 0
          ? regions.reduce((sum, r) => sum + r.confidence, 0) / regions.length
          : 0.5;

      const layoutId = buildLayoutId(input.sessionId, input.layoutSequence);
      const metadata = buildLayoutMetadata({
        sessionId: input.sessionId,
        sourceStateId: input.recognition.metadata.sourceStateId,
        sourceComponentSetId: input.recognition.metadata.recognitionId,
        layoutId,
        screenId: input.recognition.metadata.sourceStateId,
        viewport,
        processingDurationMs: Date.now() - started,
        layoutStatus: "analyzing",
        confidenceScore: Math.round(avgConfidence * 100) / 100,
      });

      const partial: LayoutModel = {
        metadata,
        regions,
        regionHierarchy,
        componentToRegion,
        spatialRelationships,
        alignmentRelationships,
        groupingRelationships,
        stackingOrder,
        responsiveBreakpoints,
        changeSummary: null,
      };

      partial.changeSummary = detectLayoutChanges(input.previousLayout, partial);

      if (input.config.validateLayouts) {
        const validation = this.validator.validate(partial);
        if (!validation.valid) {
          return { layout: null, error: validation.errors.join("; ") };
        }
      }

      partial.metadata.processingDurationMs = Date.now() - started;
      return { layout: partial };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Layout analysis failed";
      return { layout: null, error: message };
    }
  }
}
