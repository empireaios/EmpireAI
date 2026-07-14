/** T1-09 — Per-tick session continuity analysis pipeline. */

import type { UiStateMapperEngine } from "../ui-state-mapper/engine.js";
import type { LayoutUnderstandingEngine } from "../layout-understanding-engine/engine.js";
import type { NavigationMappingEngine } from "../navigation-mapping-engine/engine.js";
import type { InteractionTrackingEngine } from "../interaction-tracking-engine/engine.js";
import type { ContextAwarenessEngine } from "../context-awareness-engine/engine.js";
import type { VisualMemoryEngine } from "../visual-memory-engine/engine.js";
import type { SessionContinuityConfiguration } from "./configuration.js";
import { WorkflowContinuityMapper } from "./workflow-continuity-mapper.js";
import { RecentInteractionRebuilder } from "./recent-interaction-rebuilder.js";
import { detectSessionChanges } from "./session-change-detector.js";
import { SessionRecoveryEngine } from "./session-recovery-engine.js";
import { ContextRehydrationEngine } from "./context-rehydration-engine.js";
import { NavigationPositionRestorer } from "./navigation-position-restorer.js";
import { SessionValidator } from "./session-validator.js";
import {
  buildSessionContinuityId,
  buildMetadataVersion,
  inferStableState,
} from "./session-metadata-generator.js";
import { appendContinuityLog } from "./continuity-logging.js";
import type { SessionContextStore } from "./session-context-store.js";
import type { SessionContinuityModel, SessionChangeSummary } from "./types.js";

export type ContinuityAnalysisInput = {
  sessionId: string;
  actorIdentifier: string | null;
  continuitySequence: number;
  config: SessionContinuityConfiguration;
  uiStateMapper: UiStateMapperEngine;
  layoutUnderstanding: LayoutUnderstandingEngine;
  navigationMapping: NavigationMappingEngine;
  interactionTracking: InteractionTrackingEngine;
  contextAwareness: ContextAwarenessEngine;
  visualMemory: VisualMemoryEngine;
  store: SessionContextStore;
  previousContinuity: SessionContinuityModel | null;
  stableStateCount: number;
};

export type ContinuityAnalysisResult = {
  model: SessionContinuityModel | null;
  changeSummary: SessionChangeSummary | null;
  stableStateDetected: boolean;
  error?: string;
};

export class ContinuityAnalysisEngine {
  private readonly workflowMapper = new WorkflowContinuityMapper();
  private readonly interactionRebuilder = new RecentInteractionRebuilder();
  private readonly rehydration = new ContextRehydrationEngine();
  private readonly navigationRestorer = new NavigationPositionRestorer();
  private readonly recovery = new SessionRecoveryEngine(this.rehydration, this.navigationRestorer);
  private readonly validator = new SessionValidator();

  analyze(input: ContinuityAnalysisInput): ContinuityAnalysisResult {
    const started = Date.now();
    try {
      const uiState = input.uiStateMapper.getLatestState();
      const layout = input.layoutUnderstanding.getLatestLayout();
      const graph = input.navigationMapping.getLatestGraph();
      const workflow = input.contextAwareness.getLatestContext();
      const recentMemory = input.visualMemory.getRecentRecords(
        input.config.recentHistoryWindow,
      );

      if (!uiState && !workflow && recentMemory.length === 0) {
        return {
          model: null,
          changeSummary: null,
          stableStateDetected: false,
          error: "Insufficient upstream data for session continuity",
        };
      }

      const workflowMapped = this.workflowMapper.map(workflow);
      const interactionIds = this.interactionRebuilder.rebuild(
        input.interactionTracking,
        input.config,
        input.previousContinuity?.recentInteractionEventIds ?? [],
      );
      const nav = this.navigationRestorer.restore(
        input.navigationMapping,
        input.visualMemory,
        input.previousContinuity,
      );

      const stableState = inferStableState(workflow?.contextState ?? null);
      const stableStateDetected =
        input.previousContinuity?.lastKnownStableState === stableState &&
        input.stableStateCount >= input.config.stableStateThreshold;

      const confidence = Math.round(
        ((workflowMapped.confidence + nav.confidence + (uiState ? 0.7 : 0.4)) / 3) * 100,
      ) / 100;

      let model: SessionContinuityModel = {
        sessionContinuityId: buildSessionContinuityId(input.sessionId, input.continuitySequence),
        sessionId: input.sessionId,
        actorIdentifier: input.actorIdentifier,
        timestamp: new Date().toISOString(),
        currentScreenId:
          graph?.metadata.currentScreenId ?? workflow?.currentScreenId ?? uiState?.screen.screenId ?? null,
        currentRouteOrViewId:
          graph?.metadata.currentRouteId ??
          graph?.metadata.currentViewId ??
          workflow?.currentRouteId ??
          null,
        currentWorkflowContextId: workflowMapped.workflowContextId,
        currentWorkflowStage: workflowMapped.workflowStage,
        currentNavigationNodeId:
          nav.navigationNodeId ?? workflow?.activeNavigationNodeId ?? null,
        currentLayoutId: layout?.metadata.layoutId ?? null,
        currentUiStateId: uiState?.metadata.stateId ?? "unknown",
        recentMemoryRecordIds: recentMemory.map((r) => r.memoryRecordId),
        recentInteractionEventIds: interactionIds,
        activeComponentIds: workflowMapped.activeComponentIds,
        activeLayoutRegionIds: workflowMapped.activeLayoutRegionIds,
        activeModalDrawerTabPanelIds: workflowMapped.activeModalDrawerTabPanelIds,
        lastKnownStableState: stableStateDetected ? stableState : stableState,
        recoveryStatus: "none",
        continuityConfidence: confidence,
        metadataVersion: buildMetadataVersion(),
      };

      const changeSummary = detectSessionChanges(
        input.previousContinuity,
        model,
        input.store.getSnapshot(),
        input.config,
      );

      if (changeSummary.recoveryRequired || changeSummary.interruptionDetected) {
        const recovered = this.recovery.recover({
          current: model,
          changes: changeSummary,
          visualMemory: input.visualMemory,
          navigationMapping: input.navigationMapping,
          store: input.store,
        });
        if (recovered) model = recovered;
      }

      if (input.config.validateContinuity) {
        const validation = this.validator.validate(model);
        if (!validation.valid) {
          return {
            model: null,
            changeSummary: null,
            stableStateDetected: false,
            error: validation.errors.join("; "),
          };
        }
      }

      if (changeSummary.hasChanges) {
        appendContinuityLog({
          event: "session_context_update",
          level: "info",
          details: `Screen ${changeSummary.previousScreenId ?? "none"} → ${changeSummary.currentScreenId ?? "none"}`,
        });
      }
      if (changeSummary.interruptionDetected) {
        appendContinuityLog({
          event: "session_interruption",
          level: "warn",
          details: `Interruption detected for session ${input.sessionId}`,
        });
      }
      if (stableStateDetected) {
        appendContinuityLog({
          event: "stable_state_detected",
          level: "info",
          details: `Stable state ${stableState} detected`,
        });
      }

      appendContinuityLog({
        event: "continuity_generation",
        level: "info",
        details: `Continuity ${model.sessionContinuityId} · ${Date.now() - started}ms`,
      });

      return { model, changeSummary, stableStateDetected };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Continuity analysis failed";
      return { model: null, changeSummary: null, stableStateDetected: false, error: message };
    }
  }
}
