/** T4-03 — Screen Annotation Manager — core annotation pipeline. */

import type { NaturalUxConversationEngine } from "../natural-ux-conversation/engine.js";
import type { VoiceUxCommandsEngine } from "../voice-ux-commands/engine.js";
import type { UiStateMapperEngine } from "../ui-state-mapper/engine.js";
import type { ComponentRecognitionEngine } from "../component-recognition-engine/engine.js";
import type { LayoutUnderstandingEngine } from "../layout-understanding-engine/engine.js";
import type { NavigationMappingEngine } from "../navigation-mapping-engine/engine.js";
import type { RecommendationEngine } from "../recommendation-engine/engine.js";
import type { AutonomousBuilderCertificationEngine } from "../autonomous-builder-certification-engine/engine.js";
import type { ScreenAnnotationConfiguration } from "./configuration.js";
import type {
  AnnotationInput,
  AnnotationRunReport,
  AnnotationSession,
  ProcessingStatus,
  ScreenAnnotationRecord,
} from "./types.js";
import { AnnotationSessionManager } from "./annotation-session-manager.js";
import { PointerCaptureEngine } from "./pointer-capture-engine.js";
import { AnnotationCaptureEngine } from "./annotation-capture-engine.js";
import { ScreenCoordinateMapper } from "./screen-coordinate-mapper.js";
import { ComponentAnnotationMapper } from "./component-annotation-mapper.js";
import { LayoutAnnotationMapper } from "./layout-annotation-mapper.js";
import { NavigationAnnotationMapper } from "./navigation-annotation-mapper.js";
import { UxFindingAnnotationLinker } from "./ux-finding-annotation-linker.js";
import { PointAndEditIntentGenerator } from "./point-and-edit-intent-generator.js";
import { AnnotationMetadataGenerator } from "./annotation-metadata-generator.js";
import { AnnotationValidator } from "./annotation-validator.js";
import { appendAnnotationLog } from "./annotation-logging.js";
import { ANNOTATION_METADATA_VERSION } from "./paths.js";

export type ScreenAnnotationEngineBundle = {
  naturalUxConversation: NaturalUxConversationEngine | null;
  voiceUxCommands: VoiceUxCommandsEngine | null;
  uiStateMapper: UiStateMapperEngine | null;
  componentRecognition: ComponentRecognitionEngine | null;
  layoutUnderstanding: LayoutUnderstandingEngine | null;
  navigationMapping: NavigationMappingEngine | null;
  recommendationEngine: RecommendationEngine | null;
  autonomousBuilderCertification: AutonomousBuilderCertificationEngine | null;
};

export class ScreenAnnotationManager {
  private readonly sessions = new AnnotationSessionManager();
  private readonly pointerCapture = new PointerCaptureEngine();
  private readonly annotationCapture = new AnnotationCaptureEngine();
  private readonly coordinateMapper = new ScreenCoordinateMapper();
  private readonly componentMapper = new ComponentAnnotationMapper();
  private readonly layoutMapper = new LayoutAnnotationMapper();
  private readonly navigationMapper = new NavigationAnnotationMapper();
  private readonly uxFindingLinker = new UxFindingAnnotationLinker();
  private readonly intentGenerator = new PointAndEditIntentGenerator();
  private readonly metadata = new AnnotationMetadataGenerator();
  private readonly validator = new AnnotationValidator();

  annotate(input: {
    annotation: AnnotationInput;
    config: ScreenAnnotationConfiguration;
    engines: ScreenAnnotationEngineBundle;
  }): AnnotationRunReport {
    const started = Date.now();
    appendAnnotationLog({
      event: "screen_annotation_session_start",
      level: "info",
      details: "Processing screen annotation",
    });

    if (!input.config.supportedAnnotationTypes.includes(input.annotation.annotationType)) {
      throw new Error(`Unsupported annotation type: ${input.annotation.annotationType}`);
    }

    let session = this.sessions.startSession(input.annotation.sessionId);
    session = this.sessions.trimHistory(session, input.config.maxHistoryAnnotations);
    this.sessions.updateStatus(session.sessionId, "received");

    const pointer = this.pointerCapture.capture(input.annotation, input.config);
    const captured = this.annotationCapture.capture({
      annotation: input.annotation,
      pointer,
      config: input.config,
    });
    this.sessions.updateStatus(session.sessionId, "captured");

    const coordinates = this.coordinateMapper.map({
      pointer: pointer.pointer,
      bounds: captured.bounds,
      config: input.config,
      uiStateMapper: input.engines.uiStateMapper,
    });

    const components = this.componentMapper.map({
      pointer: pointer.pointer,
      bounds: captured.bounds ?? coordinates.normalizedBounds,
      explicitIds: input.annotation.referencedComponentIds ?? [],
      config: input.config,
      componentRecognition: input.engines.componentRecognition,
    });

    const layoutRegions = this.layoutMapper.map({
      annotationType: input.annotation.annotationType,
      pointer: pointer.pointer,
      bounds: captured.bounds ?? coordinates.normalizedBounds,
      explicitIds: input.annotation.referencedLayoutRegionIds ?? [],
      config: input.config,
      layoutUnderstanding: input.engines.layoutUnderstanding,
      uiStateMapper: input.engines.uiStateMapper,
    });

    const navigation = this.navigationMapper.map({
      annotationType: input.annotation.annotationType,
      pointer: pointer.pointer,
      bounds: captured.bounds ?? coordinates.normalizedBounds,
      explicitIds: input.annotation.referencedNavigationNodeIds ?? [],
      componentIds: components.componentIds,
      config: input.config,
      navigationMapping: input.engines.navigationMapping,
    });
    this.sessions.updateStatus(session.sessionId, "mapped");

    const uxFindings = this.uxFindingLinker.link({
      componentIds: components.componentIds,
      layoutRegionIds: layoutRegions.layoutRegionIds,
      config: input.config,
      recommendationEngine: input.engines.recommendationEngine,
    });
    this.sessions.updateStatus(session.sessionId, "linked");

    const confidenceScore = Math.min(
      0.98,
      Math.round(
        (pointer.confidence * 0.2 +
          captured.confidence * 0.2 +
          coordinates.confidence * 0.2 +
          components.confidence * 0.2 +
          layoutRegions.confidence * 0.1 +
          navigation.confidence * 0.05 +
          uxFindings.confidence * 0.05) *
          1000,
      ) / 1000,
    );

    let linkedConversationIntentId = input.annotation.linkedConversationIntentId ?? null;
    let linkedVoiceCommandId = input.annotation.linkedVoiceCommandId ?? null;

    if (!linkedConversationIntentId && input.engines.naturalUxConversation) {
      try {
        const nucReport = input.engines.naturalUxConversation.getLatestReport?.() ?? null;
        linkedConversationIntentId =
          nucReport?.latestTurn?.conversationId ?? linkedConversationIntentId;
      } catch {
        /* ignore */
      }
    }
    if (!linkedVoiceCommandId && input.engines.voiceUxCommands) {
      try {
        const vucReport = input.engines.voiceUxCommands.getLatestReport?.() ?? null;
        linkedVoiceCommandId =
          vucReport?.latestCommand?.voiceCommandId ?? linkedVoiceCommandId;
      } catch {
        /* ignore */
      }
    }

    let processingStatus: ProcessingStatus = "intent_generated";
    if (!captured.valid) processingStatus = "awaiting_clarification";
  if (confidenceScore < input.config.clarificationConfidenceThreshold) {
      processingStatus = "awaiting_clarification";
    } else {
      processingStatus = "completed";
    }

    const record: ScreenAnnotationRecord = this.metadata.enrichAnnotation({
      annotationId: this.metadata.buildAnnotationId(),
      timestamp: new Date().toISOString(),
      sessionId: session.sessionId,
      currentScreenId: coordinates.currentScreenId,
      currentRouteOrViewId: coordinates.currentRouteOrViewId,
      annotationType: input.annotation.annotationType,
      pointerCoordinates: pointer.pointer,
      screenRegionBounds: captured.bounds ?? coordinates.normalizedBounds,
      referencedComponentIds: components.componentIds,
      referencedLayoutRegionIds: layoutRegions.layoutRegionIds,
      referencedNavigationNodeIds: navigation.navigationNodeIds,
      linkedUxFindingIds: uxFindings.linkedUxFindingIds,
      linkedConversationIntentId,
      linkedVoiceCommandId,
      annotationText: captured.annotationText,
      userInstructionSummary: captured.userInstructionSummary,
      processingStatus,
      confidenceScore,
      metadataVersion: ANNOTATION_METADATA_VERSION,
    });

    const intent = this.intentGenerator.generate({
      annotation: record,
      config: input.config,
      autonomousBuilderCertification: input.engines.autonomousBuilderCertification,
    });
    this.sessions.updateStatus(session.sessionId, "intent_generated");

    session = this.sessions.appendAnnotation(session.sessionId, record, intent);
    const validation = this.validator.validate(record, intent, input.config, {
      appliedChanges: false,
      approvedChanges: false,
    });

    appendAnnotationLog({
      event: "screen_annotation_session_end",
      level: validation.decision === "pass" ? "info" : "warn",
      details: `Annotation ${validation.decision.toUpperCase()} · type=${record.annotationType} · confidence=${Math.round(record.confidenceScore * 100)}%`,
    });

    return {
      annotationRunReportId: this.metadata.buildRunReportId(),
      runTimestamp: new Date().toISOString(),
      session,
      latestAnnotation: record,
      latestIntent: intent,
      validation,
      durationMs: Date.now() - started,
      metadataVersion: ANNOTATION_METADATA_VERSION,
    };
  }

  getActiveSession(): AnnotationSession | null {
    return this.sessions.getActiveSession();
  }

  getActiveSessionCount(): number {
    return this.sessions.getActiveSessionCount();
  }

  endSession(sessionId: string): void {
    this.sessions.endSession(sessionId);
  }

  resetForTesting(): void {
    this.sessions.resetForTesting();
  }
}
