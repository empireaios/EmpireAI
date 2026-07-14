/** T1-08 — Per-tick visual memory capture pipeline. */

import type { VisualCaptureEngine } from "../visual-capture-engine/engine.js";
import type { UiStateMapperEngine } from "../ui-state-mapper/engine.js";
import type { ComponentRecognitionEngine } from "../component-recognition-engine/engine.js";
import type { LayoutUnderstandingEngine } from "../layout-understanding-engine/engine.js";
import type { NavigationMappingEngine } from "../navigation-mapping-engine/engine.js";
import type { InteractionTrackingEngine } from "../interaction-tracking-engine/engine.js";
import type { ContextAwarenessEngine } from "../context-awareness-engine/engine.js";
import type { VisualMemoryConfiguration } from "./configuration.js";
import { UiStateHistoryStore } from "./ui-state-history-store.js";
import { ComponentHistoryStore } from "./component-history-store.js";
import { LayoutHistoryStore } from "./layout-history-store.js";
import { NavigationHistoryStore } from "./navigation-history-store.js";
import { InteractionHistoryStore } from "./interaction-history-store.js";
import { WorkflowContextHistoryStore } from "./workflow-context-history-store.js";
import { MemoryValidator } from "./memory-validator.js";
import {
  buildMemoryRecordId,
  buildStateSummary,
  buildChangeSummaryText,
  buildRecordMetadataVersion,
} from "./memory-metadata-generator.js";
import { appendMemoryLog } from "./memory-logging.js";
import type { MemoryPersistenceStore, StoredMemoryPayload } from "./memory-persistence-store.js";
import type { RetentionCategory, VisualMemoryRecord } from "./types.js";

export type MemoryCaptureInput = {
  sessionId: string;
  recordSequence: number;
  config: VisualMemoryConfiguration;
  visualCapture: VisualCaptureEngine;
  uiStateMapper: UiStateMapperEngine;
  componentRecognition: ComponentRecognitionEngine;
  layoutUnderstanding: LayoutUnderstandingEngine;
  navigationMapping: NavigationMappingEngine;
  interactionTracking: InteractionTrackingEngine;
  contextAwareness: ContextAwarenessEngine;
  store: MemoryPersistenceStore;
};

export type MemoryCaptureResult = {
  record: VisualMemoryRecord | null;
  payload: StoredMemoryPayload | null;
  componentIds: string[];
  maskedSensitiveFields: number;
  error?: string;
};

export class MemoryCaptureEngine {
  private readonly uiStateStore = new UiStateHistoryStore();
  private readonly componentStore = new ComponentHistoryStore();
  private readonly layoutStore = new LayoutHistoryStore();
  private readonly navigationStore = new NavigationHistoryStore();
  private readonly interactionStore = new InteractionHistoryStore();
  private readonly workflowStore = new WorkflowContextHistoryStore();
  private readonly validator = new MemoryValidator();

  capture(input: MemoryCaptureInput): MemoryCaptureResult {
    const started = Date.now();
    try {
      const uiState = input.uiStateMapper.getLatestState();
      if (!uiState) {
        return { record: null, payload: null, componentIds: [], maskedSensitiveFields: 0, error: "No UI state available" };
      }

      const recognition = input.componentRecognition.getLatestResult();
      const layout = input.layoutUnderstanding.getLatestLayout();
      const graph = input.navigationMapping.getLatestGraph();
      const workflowContext = input.contextAwareness.getLatestContext();
      const recentEvents = input.interactionTracking.getRecentEvents(10);
      const latestFrame = input.visualCapture.getLatestFrame();

      const uiHistory = this.uiStateStore.extractSafe(uiState, input.config);
      const componentHistory = recognition
        ? this.componentStore.extractSafe(recognition, input.config)
        : null;
      const layoutHistory = layout ? this.layoutStore.extractSafe(layout) : null;
      const navigationHistory = graph ? this.navigationStore.extractSafe(graph) : null;
      const interactionHistory = this.interactionStore.extractSafe(recentEvents);
      const workflowHistory = workflowContext
        ? this.workflowStore.extractSafe(workflowContext)
        : null;

      const componentIds = componentHistory?.components.map((c) => c.componentId) ?? [];
      const maskedSensitiveFields =
        uiHistory.maskedCount + (componentHistory?.maskedCount ?? 0);

      const retentionCategory: RetentionCategory = latestFrame && input.config.storeSnapshots
        ? "snapshot"
        : "standard";

      const memoryRecordId = buildMemoryRecordId(input.sessionId, input.recordSequence);
      const storageLocation = input.store.getRecordPath(memoryRecordId);

      const stateSummary = buildStateSummary({
        screenId: graph?.metadata.currentScreenId ?? uiState.screen.screenId,
        regionCount: uiState.screen.regions.length,
        componentCount: componentIds.length,
        layoutRegionCount: layout?.regions.length ?? 0,
        interactionCount: recentEvents.length,
        workflowName: workflowContext?.currentWorkflowName ?? null,
        contextState: workflowContext?.contextState ?? null,
      });

      const changeSummary = buildChangeSummaryText(
        uiState.changeSummary?.hasChanges
          ? `UI: +${uiState.changeSummary.appeared.length} -${uiState.changeSummary.disappeared.length} ~${uiState.changeSummary.modified.length}`
          : null,
        uiState.changeSummary?.hasChanges ?? false,
        layout?.changeSummary?.hasChanges ?? false,
      );

      const frameRef = latestFrame
        ? `frame-${latestFrame.metadata.sessionId}-${latestFrame.metadata.frameNumber}`
        : null;

      const avgComponentConfidence =
        recognition && recognition.components.length > 0
          ? recognition.components.reduce((sum, c) => sum + c.detectionConfidence, 0) /
            recognition.components.length
          : 0.5;

      const confidence = Math.round(
        ((avgComponentConfidence +
          (layout?.metadata.confidenceScore ?? 0.5) +
          (graph?.metadata.confidenceScore ?? 0.5) +
          (workflowContext?.confidence ?? 0.5)) /
          4) *
          100,
      ) / 100;

      const record: VisualMemoryRecord = {
        memoryRecordId,
        sessionId: input.sessionId,
        timestamp: new Date().toISOString(),
        sourceFrameId: frameRef,
        sourceUiStateId: uiState.metadata.stateId,
        sourceComponentSetId: recognition?.metadata.recognitionId ?? null,
        sourceLayoutId: layout?.metadata.layoutId ?? null,
        sourceNavigationGraphId: graph?.metadata.graphId ?? null,
        sourceWorkflowContextId: workflowContext?.contextId ?? null,
        relatedInteractionEventIds: recentEvents.map((e) => e.eventId),
        screenId: graph?.metadata.currentScreenId ?? uiState.screen.screenId,
        routeOrViewId: graph?.metadata.currentRouteId ?? uiState.metadata.sourceFrameId,
        snapshotReference:
          latestFrame && input.config.storeSnapshots ? frameRef : null,
        stateSummary,
        changeSummary,
        storageLocation,
        retentionCategory,
        confidence,
        metadataVersion: buildRecordMetadataVersion(),
      };

      if (input.config.validateRecords) {
        const validation = this.validator.validate(record);
        if (!validation.valid) {
          return {
            record: null,
            payload: null,
            componentIds,
            maskedSensitiveFields,
            error: validation.errors.join("; "),
          };
        }
      }

      const payload: StoredMemoryPayload = {
        record,
        uiStateHistory: uiHistory,
        componentHistory,
        layoutHistory,
        navigationHistory,
        interactionHistory,
        workflowContextHistory: workflowHistory,
      };

      appendMemoryLog({
        event: "memory_record_creation",
        level: "info",
        details: `Record ${memoryRecordId} · ${stateSummary} · ${Date.now() - started}ms`,
      });

      return { record, payload, componentIds, maskedSensitiveFields };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Memory capture failed";
      return { record: null, payload: null, componentIds: [], maskedSensitiveFields: 0, error: message };
    }
  }
}
