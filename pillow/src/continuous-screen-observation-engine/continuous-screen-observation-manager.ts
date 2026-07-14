/** T5-01 — Continuous Screen Observation Manager — core observation pipeline. */

import type { ContinuousScreenObservationConfiguration } from "./configuration.js";
import type {
  ContinuousObservationRunReport,
  ContinuousScreenObservationEngineBundle,
  ContinuousScreenObservationInput,
  DetectedChangeSet,
  ObservationRecord,
  UiSurfaceState,
} from "./types.js";
import { ObservationSessionManager } from "./observation-session-manager.js";
import { ScreenChangeObserver } from "./screen-change-observer.js";
import { RouteChangeObserver } from "./route-change-observer.js";
import { LayoutChangeObserver } from "./layout-change-observer.js";
import { ComponentChangeObserver } from "./component-change-observer.js";
import { UiStateWatcher } from "./ui-state-watcher.js";
import { ObservationMetadataGenerator } from "./observation-metadata-generator.js";
import { ObservationValidator } from "./observation-validator.js";
import { appendObservationLog } from "./observation-logging.js";
import { OBSERVATION_METADATA_VERSION } from "./paths.js";

type ResolvedUiSnapshot = {
  screenId: string | null;
  routeOrViewId: string | null;
  uiStateId: string | null;
  componentSetId: string | null;
  layoutId: string | null;
  navigationGraphId: string | null;
  surfaceStates: UiSurfaceState[];
  confidence: number;
};

export class ContinuousScreenObservationManager {
  private readonly sessions = new ObservationSessionManager();
  private readonly screenObserver = new ScreenChangeObserver();
  private readonly routeObserver = new RouteChangeObserver();
  private readonly layoutObserver = new LayoutChangeObserver();
  private readonly componentObserver = new ComponentChangeObserver();
  private readonly uiStateWatcher = new UiStateWatcher();
  private readonly metadata = new ObservationMetadataGenerator();
  private readonly validator = new ObservationValidator();
  private latestObservation: ObservationRecord | null = null;

  observe(input: {
    observationInput: ContinuousScreenObservationInput;
    config: ContinuousScreenObservationConfiguration;
    engines: ContinuousScreenObservationEngineBundle;
  }): ContinuousObservationRunReport {
    const started = Date.now();
    appendObservationLog({
      event: "continuous_observation_start",
      level: "info",
      details: "Starting observation cycle",
    });

    const session = this.sessions.getActiveSession()
      ?? this.sessions.startSession(input.observationInput.sessionId);

    const snapshot = this.resolveUiSnapshot(input.engines, input.observationInput);
    const changes = this.detectChanges(snapshot, input.config);

    const observation = this.metadata.buildRecord({
      sessionId: session.observationSessionId,
      currentScreenId: snapshot.screenId,
      currentRouteOrViewId: snapshot.routeOrViewId,
      sourceUiStateId: snapshot.uiStateId,
      sourceComponentSetId: snapshot.componentSetId,
      sourceLayoutId: snapshot.layoutId,
      sourceNavigationGraphId: snapshot.navigationGraphId,
      changes,
      uiSurfaceStates: snapshot.surfaceStates,
      confidenceScore: snapshot.confidence,
      observationStatus:
        changes.screenChanges.length +
          changes.routeChanges.length +
          changes.layoutChanges.length +
          changes.componentChanges.length +
          changes.stateChanges.length >
        0
          ? "recorded"
          : "validated",
    });

    const validation = input.config.validationRulesEnabled
      ? this.validator.validate(observation, input.config)
      : {
          validationReportId: observation.observationId,
          validationTimestamp: new Date().toISOString(),
          decision: "pass" as const,
          observationsValidated: 1,
          errors: [],
          warnings: [],
          durationMs: 0,
          metadataVersion: OBSERVATION_METADATA_VERSION,
        };

    this.latestObservation = observation;
    const success = validation.decision !== "fail";
    this.sessions.recordObservation(snapshot.screenId, snapshot.routeOrViewId, success);

    appendObservationLog({
      event: "observation_record_created",
      level: success ? "info" : "warn",
      details: `Observation ${observation.observationId} · ${validation.decision}`,
    });

    const report: ContinuousObservationRunReport = {
      observationRunReportId: observation.observationId,
      runTimestamp: new Date().toISOString(),
      observation,
      validation,
      durationMs: Date.now() - started,
      metadataVersion: OBSERVATION_METADATA_VERSION,
    };

    appendObservationLog({
      event: "continuous_observation_end",
      level: "info",
      details: `Observation cycle completed in ${report.durationMs}ms`,
    });

    return report;
  }

  getLatestObservation(): ObservationRecord | null {
    return this.latestObservation;
  }

  getSessionManager(): ObservationSessionManager {
    return this.sessions;
  }

  resetForTesting(): void {
    this.sessions.resetForTesting();
    this.screenObserver.resetForTesting();
    this.routeObserver.resetForTesting();
    this.layoutObserver.resetForTesting();
    this.componentObserver.resetForTesting();
    this.uiStateWatcher.resetForTesting();
    this.latestObservation = null;
  }

  private resolveUiSnapshot(
    engines: ContinuousScreenObservationEngineBundle,
    input: ContinuousScreenObservationInput,
  ): ResolvedUiSnapshot {
    const manual = input.uiSnapshot;
    let screenId = manual?.screenId ?? null;
    let routeOrViewId = manual?.routeOrViewId ?? null;
    let uiStateId = manual?.uiStateId ?? null;
    let componentSetId = manual?.componentSetId ?? null;
    let layoutId = manual?.layoutId ?? null;
    let navigationGraphId = manual?.navigationGraphId ?? null;
    const surfaceStates = new Set<UiSurfaceState>(manual?.surfaceStates ?? []);
    let confidence = 0.5;

    try {
      const context = engines.contextAwareness?.getState();
      const latestContext = context?.latestContext;
      if (latestContext) {
        screenId = screenId ?? latestContext.currentScreenId;
        routeOrViewId =
          routeOrViewId ?? latestContext.currentRouteId ?? latestContext.currentViewId;
        componentSetId =
          componentSetId ??
          (latestContext.activeComponentIds.length
            ? `components:${latestContext.activeComponentIds.length}`
            : null);
        layoutId =
          layoutId ??
          (latestContext.activeLayoutRegionIds.length
            ? `layout:${latestContext.activeLayoutRegionIds.join(",")}`
            : null);
        navigationGraphId =
          navigationGraphId ?? latestContext.activeNavigationNodeId;
        confidence = Math.max(confidence, latestContext.confidence);
        if (latestContext.waitingOrLoading) surfaceStates.add("loading");
        if (latestContext.contextState === "error_handling") surfaceStates.add("error");
        if (
          latestContext.activeComponentIds.length === 0 &&
          !latestContext.waitingOrLoading
        ) {
          surfaceStates.add("empty");
        }
        if (latestContext.activeModalOrDrawerId?.includes("modal")) {
          surfaceStates.add("modal_open");
        }
        if (latestContext.activeModalOrDrawerId?.includes("drawer")) {
          surfaceStates.add("drawer_open");
        }
      }
    } catch {
      appendObservationLog({
        event: "partial_t1_context",
        level: "warn",
        details: "Context awareness unavailable",
      });
    }

    try {
      const mapper = engines.uiStateMapper?.getState();
      const latestState = mapper?.latestState;
      if (latestState) {
        uiStateId = uiStateId ?? latestState.metadata.stateId;
        screenId = screenId ?? latestState.screen.screenId;
        confidence = Math.max(confidence, 0.65);
      }
    } catch {
      appendObservationLog({
        event: "partial_t1_ui_state",
        level: "warn",
        details: "UI state mapper unavailable",
      });
    }

    try {
      const navigation = engines.navigationMapping?.getState();
      routeOrViewId =
        routeOrViewId ??
        navigation?.latestGraph?.metadata.currentRouteId ??
        navigation?.latestGraph?.metadata.currentViewId ??
        null;
      navigationGraphId =
        navigationGraphId ?? navigation?.latestGraph?.metadata.graphId ?? null;
    } catch {
      /* optional T1 input */
    }

    try {
      const layout = engines.layoutUnderstanding?.getState();
      layoutId = layoutId ?? layout?.latestLayout?.metadata.layoutId ?? null;
    } catch {
      /* optional T1 input */
    }

    try {
      const components = engines.componentRecognition?.getState();
      componentSetId =
        componentSetId ?? components?.latestResult?.metadata.recognitionId ?? null;
    } catch {
      /* optional T1 input */
    }

    try {
      void engines.visualCapture?.getState();
      confidence = Math.max(confidence, 0.6);
    } catch {
      /* optional T1 input */
    }

    try {
      const ux = engines.uxScoring?.getState();
      if (ux?.latestRecord) confidence = Math.max(confidence, 0.7);
    } catch {
      /* optional T2 input */
    }

    try {
      const builder = engines.frontendBuilder?.getState();
      if (builder?.status === "building") surfaceStates.add("loading");
      if (builder?.status === "failed") surfaceStates.add("error");
    } catch {
      /* optional T3 input */
    }

    try {
      const collaboration = engines.continuousCollaboration?.getState();
      if (collaboration?.activeSession) confidence = Math.max(confidence, 0.75);
    } catch {
      /* optional T4 input */
    }

    try {
      const certification = engines.executiveCollaborationCertification?.getState();
      const certified =
        certification?.latestReport?.finalCertificationDecision === "pass";
      if (certified) confidence = Math.max(confidence, 0.85);
      else confidence = Math.max(confidence, 0.55);
    } catch {
      appendObservationLog({
        event: "partial_t4_certification",
        level: "warn",
        details: "Executive collaboration certification unavailable",
      });
    }

    if (surfaceStates.size === 0) surfaceStates.add("ready");

    return {
      screenId,
      routeOrViewId,
      uiStateId,
      componentSetId,
      layoutId,
      navigationGraphId,
      surfaceStates: [...surfaceStates],
      confidence: Math.min(1, confidence),
    };
  }

  private detectChanges(
    snapshot: ResolvedUiSnapshot,
    config: ContinuousScreenObservationConfiguration,
  ): DetectedChangeSet {
    if (!config.changeDetectionRulesEnabled) {
      return {
        screenChanges: [],
        routeChanges: [],
        layoutChanges: [],
        componentChanges: [],
        stateChanges: [],
      };
    }

    return {
      screenChanges: config.screenMonitoringRulesEnabled
        ? this.screenObserver.observe(snapshot.screenId)
        : [],
      routeChanges: config.routeMonitoringRulesEnabled
        ? this.routeObserver.observe(snapshot.routeOrViewId)
        : [],
      layoutChanges: config.layoutMonitoringRulesEnabled
        ? this.layoutObserver.observe(snapshot.layoutId)
        : [],
      componentChanges: config.componentMonitoringRulesEnabled
        ? this.componentObserver.observe(snapshot.componentSetId)
        : [],
      stateChanges: this.uiStateWatcher.observe(snapshot.surfaceStates),
    };
  }
}
