/** T1-06 — Per-tick interaction analysis pipeline. */

import type { ComponentRecognitionEngine } from "../component-recognition-engine/engine.js";
import type { LayoutUnderstandingEngine } from "../layout-understanding-engine/engine.js";
import type { NavigationMappingEngine } from "../navigation-mapping-engine/engine.js";
import type { InteractionTrackingConfiguration } from "./configuration.js";
import { EventListenerEngine } from "./event-listener-engine.js";
import { ComponentInteractionMapper } from "./component-interaction-mapper.js";
import { NavigationInteractionMapper } from "./navigation-interaction-mapper.js";
import { InputActivityTracker } from "./input-activity-tracker.js";
import {
  normalizeRawInteraction,
  inferInteractionTypeFromComponent,
} from "./interaction-event-normalizer.js";
import { InteractionValidator } from "./interaction-validator.js";
import { appendInteractionLog } from "./interaction-logging.js";
import type { InteractionEvent, RawInteractionInput } from "./types.js";

export type InteractionAnalysisResult = {
  events: InteractionEvent[];
  errors: string[];
};

export class InteractionAnalysisEngine {
  private readonly listener = new EventListenerEngine();
  private readonly componentMapper = new ComponentInteractionMapper();
  private readonly navigationMapper = new NavigationInteractionMapper();
  private readonly inputTracker = new InputActivityTracker();
  private readonly validator = new InteractionValidator();

  private eventSequence = 0;
  private lastProcessedGraphId = "";
  private lastDebounceKey = "";
  private lastDebounceAt = 0;

  getListener(): EventListenerEngine {
    return this.listener;
  }

  reset(): void {
    this.eventSequence = 0;
    this.lastProcessedGraphId = "";
    this.lastDebounceKey = "";
    this.lastDebounceAt = 0;
  }

  analyzeTick(input: {
    sessionId: string;
    config: InteractionTrackingConfiguration;
    navigationMapping: NavigationMappingEngine;
    layoutUnderstanding: LayoutUnderstandingEngine;
    componentRecognition: ComponentRecognitionEngine;
    previousGraphId: string;
  }): InteractionAnalysisResult {
    const started = Date.now();
    const events: InteractionEvent[] = [];
    const errors: string[] = [];

    const graph = input.navigationMapping.getLatestGraph();
    const layout = input.layoutUnderstanding.getLatestLayout();
    const recognition = input.componentRecognition.getLatestResult();
    const currentScreenId = graph?.metadata.currentScreenId ?? null;
    const currentRouteId = graph?.metadata.currentRouteId ?? null;

    const ingested = this.listener.drain();
    for (const raw of ingested) {
      const event = this.processRaw({
        raw,
        sessionId: input.sessionId,
        config: input.config,
        graph,
        layout,
        recognition,
        currentScreenId,
        currentRouteId,
        source: "ingested",
      });
      if (event) events.push(event);
    }

    if (graph && graph.metadata.graphId !== input.previousGraphId) {
      const navEvents = this.navigationMapper.inferNavigationEvents(null, graph);
      for (const nav of navEvents) {
        const raw: RawInteractionInput = {
          interactionType: nav.interactionType,
          navigationNodeId: nav.sourceNodeId ?? undefined,
          destinationNavigationNodeId: nav.destNodeId ?? undefined,
          navigationEdgeId: nav.edgeId ?? undefined,
        };
        const event = this.processRaw({
          raw,
          sessionId: input.sessionId,
          config: input.config,
          graph,
          layout,
          recognition,
          currentScreenId,
          currentRouteId,
          confidence: nav.confidence,
          source: "inferred",
        });
        if (event) events.push(event);
      }
      this.lastProcessedGraphId = graph.metadata.graphId;
    }

    if (recognition) {
      const recent = input.componentRecognition.getRecentResults(2);
      const prevRecognition = recent.length >= 2 ? recent[recent.length - 2]! : null;
      const componentChanges = this.componentMapper.inferChangedComponentEvents(
        prevRecognition,
        recognition,
      );
      for (const change of componentChanges) {
        const inferred = this.inputTracker.inferFromComponentType(change.componentType)
          ?? inferInteractionTypeFromComponent(change.componentType, input.config.componentMappingRules)?.interactionType;
        if (!inferred) continue;
        const raw: RawInteractionInput = {
          interactionType: inferred,
          componentId: change.componentId,
        };
        const event = this.processRaw({
          raw,
          sessionId: input.sessionId,
          config: input.config,
          graph,
          layout,
          recognition,
          currentScreenId,
          currentRouteId,
          source: "inferred",
        });
        if (event) events.push(event);
      }
    }

    appendInteractionLog({
      event: "interaction_mapping",
      level: "info",
      details: `Processed ${events.length} events in ${Date.now() - started}ms`,
    });

    return { events, errors };
  }

  recordRaw(input: {
    raw: RawInteractionInput;
    sessionId: string;
    config: InteractionTrackingConfiguration;
    navigationMapping: NavigationMappingEngine;
    layoutUnderstanding: LayoutUnderstandingEngine;
    componentRecognition: ComponentRecognitionEngine;
  }): InteractionEvent | null {
    const graph = input.navigationMapping.getLatestGraph();
    const layout = input.layoutUnderstanding.getLatestLayout();
    const recognition = input.componentRecognition.getLatestResult();
    return this.processRaw({
      raw: input.raw,
      sessionId: input.sessionId,
      config: input.config,
      graph,
      layout,
      recognition,
      currentScreenId: graph?.metadata.currentScreenId ?? null,
      currentRouteId: graph?.metadata.currentRouteId ?? null,
      source: "ingested",
    });
  }

  private processRaw(input: {
    raw: RawInteractionInput;
    sessionId: string;
    config: InteractionTrackingConfiguration;
    graph: import("../navigation-mapping-engine/types.js").NavigationGraph | null;
    layout: import("../layout-understanding-engine/types.js").LayoutModel | null;
    recognition: import("../component-recognition-engine/types.js").ComponentRecognitionResult | null;
    currentScreenId: string | null;
    currentRouteId: string | null;
    confidence?: number;
    source: "ingested" | "inferred";
  }): InteractionEvent | null {
    const debounceKey = `${input.raw.interactionType}:${input.raw.componentId ?? ""}:${input.raw.inputFieldId ?? ""}`;
    const now = Date.now();
    if (
      debounceKey === this.lastDebounceKey &&
      now - this.lastDebounceAt < input.config.eventDebounceMs
    ) {
      return null;
    }
    this.lastDebounceKey = debounceKey;
    this.lastDebounceAt = now;

    if (Math.random() > input.config.eventSamplingRate) return null;

    let componentId = input.raw.componentId ?? null;
    if (!componentId && input.raw.pointerX !== undefined && input.raw.pointerY !== undefined) {
      const hit = this.componentMapper.resolveComponentAtPointer(
        input.recognition,
        input.raw.pointerX,
        input.raw.pointerY,
      );
      componentId = hit?.componentId ?? null;
    }

    const layoutRegionId = this.navigationMapper.resolveLayoutRegion(input.layout, componentId);
    const navNodeId = this.navigationMapper.resolveNavigationNode(input.graph, componentId);

    const inferred = componentId
      ? inferInteractionTypeFromComponent(
          input.recognition?.components.find((c) => c.componentId === componentId)?.componentType ?? "",
          input.config.componentMappingRules,
        )
      : null;

    const confidence =
      input.confidence ??
      inferred?.confidence ??
      (input.source === "ingested" ? 0.9 : 0.7);

    if (confidence < input.config.confidenceThreshold) return null;

    this.eventSequence += 1;
    const event = normalizeRawInteraction({
      raw: input.raw,
      sessionId: input.sessionId,
      sequence: this.eventSequence,
      currentScreenId: input.currentScreenId,
      currentRouteId: input.currentRouteId,
      sourceComponentId: componentId,
      sourceLayoutRegionId: layoutRegionId,
      sourceNavigationNodeId: navNodeId,
      destinationNavigationNodeId: input.raw.destinationNavigationNodeId ?? null,
      triggeredNavigationEdgeId: input.raw.navigationEdgeId ?? null,
      confidence,
      config: input.config,
    });

    if (input.config.validateEvents) {
      const validation = this.validator.validate(event);
      if (!validation.valid) return null;
    }

    appendInteractionLog({
      event: "interaction_event_created",
      level: "info",
      details: `${event.interactionType} · ${event.sourceComponentId ?? "no-component"} · ${input.source}`,
    });

    return event;
  }
}
