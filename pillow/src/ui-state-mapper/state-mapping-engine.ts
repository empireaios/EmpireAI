/** T1-02 — Per-frame state mapping pipeline. */

import type { CaptureFrame } from "../visual-capture-engine/types.js";
import type { UiStateMapperConfiguration } from "./configuration.js";
import { buildSourceFrameId, buildStateId, buildUiStateMetadata } from "./metadata-generator.js";
import { buildScreenStateFromFrame } from "./state-model-builder.js";
import { detectStateChanges } from "./state-change-detector.js";
import { serializeUiState } from "./state-serializer.js";
import { ValidationEngine } from "./validation-engine.js";
import type { UiStateModel } from "./types.js";

export type StateMappingInput = {
  frame: CaptureFrame;
  sessionId: string;
  stateSequence: number;
  previousState: UiStateModel | null;
  config: UiStateMapperConfiguration;
};

export type StateMappingResult = {
  state: UiStateModel | null;
  error?: string;
};

export class StateMappingEngine {
  private readonly validator = new ValidationEngine();

  mapFrame(input: StateMappingInput): StateMappingResult {
    const started = Date.now();
    try {
      if (!input.frame?.metadata) {
        return { state: null, error: "Invalid input frame" };
      }

      const screen = buildScreenStateFromFrame(input.frame, input.config);
      const sourceFrameId = buildSourceFrameId(
        input.frame.metadata.sessionId,
        input.frame.metadata.frameNumber,
      );
      const stateId = buildStateId(input.sessionId, input.stateSequence);

      const metadata = buildUiStateMetadata({
        sessionId: input.sessionId,
        sourceFrameId,
        stateId,
        screenResolution: input.frame.metadata.resolution,
        viewport: input.frame.metadata.viewport,
        processingDurationMs: Date.now() - started,
        mappingStatus: "mapping",
      });

      const partial = {
        metadata,
        screen,
        changeSummary: null as UiStateModel["changeSummary"],
      };
      partial.changeSummary = detectStateChanges(input.previousState, {
        ...partial,
        serialized: "",
      });

      const serialized = serializeUiState(partial, input.config.serializationFormat);
      const state: UiStateModel = { ...partial, serialized };

      if (input.config.validateStates) {
        const validation = this.validator.validate(state);
        if (!validation.valid) {
          return { state: null, error: validation.errors.join("; ") };
        }
      }

      state.metadata.processingDurationMs = Date.now() - started;
      return { state };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Mapping failed";
      return { state: null, error: message };
    }
  }
}
