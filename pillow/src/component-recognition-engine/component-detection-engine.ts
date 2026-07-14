/** T1-03 — Per-state component detection pipeline. */

import type { UiStateModel } from "../ui-state-mapper/types.js";
import type { ComponentRecognitionConfiguration } from "./configuration.js";
import { ComponentClassifier } from "./component-classifier.js";
import { buildComponentHierarchy } from "./component-hierarchy-mapper.js";
import { detectComponentChanges } from "./component-change-detector.js";
import { buildRecognitionId } from "./component-identity-manager.js";
import { buildRecognitionMetadata } from "./component-metadata-generator.js";
import { RecognitionValidator } from "./recognition-validator.js";
import type { ComponentRecognitionResult } from "./types.js";

export type DetectionInput = {
  uiState: UiStateModel;
  sessionId: string;
  recognitionSequence: number;
  previousResult: ComponentRecognitionResult | null;
  config: ComponentRecognitionConfiguration;
};

export type DetectionResult = {
  result: ComponentRecognitionResult | null;
  error?: string;
};

export class ComponentDetectionEngine {
  private readonly classifier = new ComponentClassifier();
  private readonly validator = new RecognitionValidator();

  detect(input: DetectionInput): DetectionResult {
    const started = Date.now();
    try {
      if (!input.uiState?.metadata?.stateId) {
        return { result: null, error: "Invalid UI state model" };
      }

      const components = this.classifier.classifyFromUiState(input.uiState, input.config);
      const hierarchy = buildComponentHierarchy(components);
      const recognitionId = buildRecognitionId(input.sessionId, input.recognitionSequence);

      const metadata = buildRecognitionMetadata({
        sessionId: input.sessionId,
        sourceStateId: input.uiState.metadata.stateId,
        recognitionId,
        viewport: input.uiState.screen.viewport,
        processingDurationMs: Date.now() - started,
        recognitionStatus: "recognizing",
        totalComponents: components.length,
      });

      const partial: ComponentRecognitionResult = {
        metadata,
        components,
        hierarchy,
        changeSummary: null,
      };

      partial.changeSummary = detectComponentChanges(input.previousResult, partial);

      if (input.config.validateResults) {
        const validation = this.validator.validate(partial);
        if (!validation.valid) {
          return { result: null, error: validation.errors.join("; ") };
        }
      }

      partial.metadata.processingDurationMs = Date.now() - started;
      return { result: partial };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Detection failed";
      return { result: null, error: message };
    }
  }
}
