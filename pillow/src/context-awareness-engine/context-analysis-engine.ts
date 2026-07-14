/** T1-07 — Per-tick workflow context analysis pipeline. */

import type { InteractionTrackingEngine } from "../interaction-tracking-engine/engine.js";
import type { NavigationMappingEngine } from "../navigation-mapping-engine/engine.js";
import type { LayoutUnderstandingEngine } from "../layout-understanding-engine/engine.js";
import type { ComponentRecognitionEngine } from "../component-recognition-engine/engine.js";
import type { ContextAwarenessConfiguration } from "./configuration.js";
import { ScreenPurposeDetector } from "./screen-purpose-detector.js";
import { ActiveTaskDetector } from "./active-task-detector.js";
import { ActiveFormDetector } from "./active-form-detector.js";
import { ActiveModalDetector } from "./active-modal-detector.js";
import { ActiveNavigationContextMapper } from "./active-navigation-context-mapper.js";
import { WorkflowStepDetector } from "./workflow-step-detector.js";
import { WorkflowContextEngine } from "./workflow-context-engine.js";
import { detectContextChanges } from "./context-change-detector.js";
import { buildContextId } from "./context-metadata-generator.js";
import { ContextValidator } from "./context-validator.js";
import { appendContextLog } from "./context-logging.js";
import type { WorkflowContextModel } from "./types.js";

export type ContextAnalysisInput = {
  sessionId: string;
  contextSequence: number;
  config: ContextAwarenessConfiguration;
  interactionTracking: InteractionTrackingEngine;
  navigationMapping: NavigationMappingEngine;
  layoutUnderstanding: LayoutUnderstandingEngine;
  componentRecognition: ComponentRecognitionEngine;
  previousContext: WorkflowContextModel | null;
};

export type ContextAnalysisResult = {
  context: WorkflowContextModel | null;
  changeSummary: ReturnType<typeof detectContextChanges> | null;
  error?: string;
};

export class ContextAnalysisEngine {
  private readonly screenPurpose = new ScreenPurposeDetector();
  private readonly activeTask = new ActiveTaskDetector();
  private readonly activeForm = new ActiveFormDetector();
  private readonly activeModal = new ActiveModalDetector();
  private readonly navContext = new ActiveNavigationContextMapper();
  private readonly workflowStep = new WorkflowStepDetector();
  private readonly workflowEngine = new WorkflowContextEngine();
  private readonly validator = new ContextValidator();

  analyze(input: ContextAnalysisInput): ContextAnalysisResult {
    const started = Date.now();
    try {
      const layout = input.layoutUnderstanding.getLatestLayout();
      const graph = input.navigationMapping.getLatestGraph();
      const recognition = input.componentRecognition.getLatestResult();
      const recentEvents = input.interactionTracking.getRecentEvents(10);

      if (!layout && !graph && recentEvents.length === 0) {
        return { context: null, changeSummary: null, error: "Insufficient upstream data for context" };
      }

      const screenPurpose = this.screenPurpose.detect(layout, input.config.screenPurposeRules);
      const task = this.activeTask.infer(recentEvents);
      const modeInference = this.workflowEngine.inferMode(
        recentEvents,
        screenPurpose,
        input.config.interactionModeRules,
      );
      const navCtx = this.navContext.map(graph);
      const step = this.workflowStep.detect(graph, recentEvents);
      const formIds = this.activeForm.detect(layout, recognition);
      const modalId = this.activeModal.detect(layout);

      const activeRegions =
        layout?.regions
          .filter((r) => input.config.activeRegionTypes.includes(r.regionType))
          .map((r) => r.regionId) ?? [];

      const activeComponents =
        recognition?.components
          .filter((c) => c.visibility === "visible" && c.active)
          .map((c) => c.componentId) ?? [];

      const confidence = Math.round(
        ((screenPurpose.confidence + modeInference.confidence + navCtx.confidence + task.confidence) / 4) *
          100,
      ) / 100;

      if (confidence < input.config.confidenceThreshold) {
        return {
          context: null,
          changeSummary: null,
          error: `Confidence ${confidence} below threshold`,
        };
      }

      const contextId = buildContextId(input.sessionId, input.contextSequence);
      const waitingOrLoading =
        screenPurpose.contextState === "loading" || modeInference.mode === "wait";

      const context: WorkflowContextModel = {
        contextId,
        sessionId: input.sessionId,
        timestamp: new Date().toISOString(),
        currentScreenId: graph?.metadata.currentScreenId ?? layout?.metadata.screenId ?? null,
        currentRouteId: graph?.metadata.currentRouteId ?? layout?.metadata.sourceStateId ?? null,
        currentViewId: layout?.metadata.layoutId ?? null,
        currentWorkflowName: navCtx.workflowName,
        currentWorkflowStage: step.stepLabel ?? navCtx.workflowStage,
        currentUserTask: task.task,
        activeNavigationNodeId: navCtx.activeNodeId,
        activeLayoutRegionIds: activeRegions,
        activeComponentIds: activeComponents,
        activeFormIds: formIds,
        activeModalOrDrawerId: modalId,
        recentInteractionEventIds: recentEvents.map((e) => e.eventId),
        currentInteractionMode: modeInference.mode,
        contextState: modeInference.contextState,
        waitingOrLoading,
        confidence,
        metadataVersion: "1.0.0",
      };

      const changeSummary = detectContextChanges(input.previousContext, context);

      if (input.config.validateContexts) {
        const validation = this.validator.validate(context);
        if (!validation.valid) {
          return { context: null, changeSummary: null, error: validation.errors.join("; ") };
        }
      }

      if (changeSummary.hasChanges) {
        appendContextLog({
          event: "context_change",
          level: "info",
          details: `state ${changeSummary.previousContextState ?? "none"} → ${changeSummary.currentContextState}`,
        });
      }

      appendContextLog({
        event: "context_generation",
        level: "info",
        details: `Context ${contextId} · ${context.contextState} · ${context.currentInteractionMode} · ${Date.now() - started}ms`,
      });

      return { context, changeSummary };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Context analysis failed";
      return { context: null, changeSummary: null, error: message };
    }
  }
}
