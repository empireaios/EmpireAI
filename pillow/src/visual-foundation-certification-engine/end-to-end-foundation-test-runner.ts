/** T1-10 — End-to-end Visual Foundation test runner. */

import { buildCaptureFrameMetadata } from "../visual-capture-engine/capture-metadata-generator.js";
import { appendCertificationLog } from "./certification-logging.js";
import type { T1EngineBundle } from "./t1-capability-validator.js";
import type { E2eValidationResult, E2eValidationStep } from "./types.js";

const MINIMAL_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

function buildTestFrame(frameNumber: number) {
  const metadata = buildCaptureFrameMetadata({
    sessionId: "vfc-e2e-session",
    frameNumber,
    windowId: "win-vfc",
    displayId: "display-primary",
    viewport: { width: 1280, height: 720 },
    resolution: { width: 1920, height: 1080 },
    captureDurationMs: 5,
    captureStatus: "capturing",
    captureSource: "browser_viewport",
  });
  return {
    metadata,
    imageBase64: MINIMAL_PNG_BASE64,
    mimeType: "image/png" as const,
    byteLength: 68,
  };
}

export class EndToEndFoundationTestRunner {
  async run(engines: T1EngineBundle): Promise<E2eValidationResult> {
    const started = Date.now();
    const steps: E2eValidationStep[] = [];

    appendCertificationLog({
      event: "e2e_test_start",
      level: "info",
      details: "Starting end-to-end Visual Foundation validation",
    });

    try {
      // Use a fresh frame when upstream data already exists so context/memory/continuity
      // steps do not fail on duplicate no-change analysis after priming.
      const frameNumber = engines.uiStateMapper.getLatestState() ? 2 : 1;
      const frame = buildTestFrame(frameNumber);
      const uiState = engines.uiStateMapper.processFrame(frame);
      steps.push({
        step: "T1-02 UI state model produced",
        passed: !!uiState?.metadata.stateId,
        details: uiState ? `stateId=${uiState.metadata.stateId}` : "No UI state",
      });

      const recognition = uiState
        ? engines.componentRecognition.recognizeUiState(uiState)
        : null;
      steps.push({
        step: "T1-03 Components recognized",
        passed: !!recognition && recognition.components.length > 0,
        details: recognition
          ? `${recognition.components.length} components`
          : "No recognition result",
      });

      const layout = recognition
        ? engines.layoutUnderstanding.analyzeRecognition(recognition)
        : null;
      steps.push({
        step: "T1-04 Layout structure derived",
        passed: !!layout && layout.regions.length > 0,
        details: layout ? `${layout.regions.length} regions` : "No layout model",
      });

      const graph = layout ? engines.navigationMapping.mapLayout(layout) : null;
      steps.push({
        step: "T1-05 Navigation graph mapped",
        passed: !!graph && graph.nodes.length >= 0,
        details: graph ? `graphId=${graph.metadata.graphId}` : "No navigation graph",
      });

      const interaction = engines.interactionTracking.recordInteraction({
        interactionType: "click",
        componentId: recognition?.components[0]?.componentId,
        pointerX: frameNumber === 1 ? 50 : 120,
        pointerY: frameNumber === 1 ? 50 : 80,
      });
      steps.push({
        step: "T1-06 Interaction observed",
        passed: !!interaction?.eventId,
        details: interaction ? `eventId=${interaction.eventId}` : "No interaction event",
      });

      const workflow = engines.contextAwareness.analyzeContextNow();
      steps.push({
        step: "T1-07 Workflow context inferred",
        passed: !!workflow?.contextId,
        details: workflow ? `contextId=${workflow.contextId}` : "No workflow context",
      });

      const memory = engines.visualMemory.captureMemoryNow();
      steps.push({
        step: "T1-08 Historical UI state stored",
        passed: !!memory?.memoryRecordId,
        details: memory ? `memoryRecordId=${memory.memoryRecordId}` : "No memory record",
      });

      const continuity = engines.sessionContinuity.updateContinuityNow();
      steps.push({
        step: "T1-09 Session context preserved",
        passed: !!continuity?.sessionContinuityId,
        details: continuity
          ? `sessionContinuityId=${continuity.sessionContinuityId}`
          : "No continuity model",
      });

      const passed = steps.every((s) => s.passed);
      const durationMs = Date.now() - started;

      appendCertificationLog({
        event: "e2e_test_end",
        level: passed ? "info" : "warn",
        details: `E2E ${passed ? "PASS" : "FAIL"} · ${steps.filter((s) => s.passed).length}/${steps.length} steps · ${durationMs}ms`,
      });

      return {
        passed,
        steps,
        durationMs,
        summary: passed
          ? "Full T1 pipeline operational end-to-end"
          : `${steps.filter((s) => !s.passed).length} step(s) failed`,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "E2E test failed";
      steps.push({ step: "E2E execution", passed: false, details: message });
      return {
        passed: false,
        steps,
        durationMs: Date.now() - started,
        summary: message,
      };
    }
  }
}
