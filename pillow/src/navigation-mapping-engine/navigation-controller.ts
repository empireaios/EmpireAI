/** T1-05 — Navigation mapping orchestration controller. */

import type { LayoutUnderstandingEngine } from "../layout-understanding-engine/engine.js";
import type { LayoutModel } from "../layout-understanding-engine/types.js";
import { appendNavigationLog } from "./navigation-logging.js";
import { MappingScheduler } from "./mapping-scheduler.js";
import { NavigationAnalysisEngine } from "./navigation-analysis-engine.js";
import { GraphBuffer } from "./graph-buffer.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import { NavigationMappingManager } from "./navigation-mapping-manager.js";
import type { NavigationMappingConfiguration } from "./configuration.js";
import type {
  MappingStatus,
  NavigationGraph,
  NavigationPerformanceStats,
} from "./types.js";
import type { RouteState } from "./route-state-detector.js";

export class NavigationController {
  private config: NavigationMappingConfiguration;
  private status: MappingStatus = "idle";
  private graphSequence = 0;
  private lastProcessedLayoutId = "";
  private performance: NavigationPerformanceStats = {
    totalMappings: 0,
    successfulMappings: 0,
    failedMappings: 0,
    totalNodes: 0,
    totalEdges: 0,
    totalTransitions: 0,
    averageProcessingDurationMs: 0,
    peakProcessingDurationMs: 0,
    skippedLayouts: 0,
    uptimeMs: 0,
  };

  private readonly sessionManager = new NavigationMappingManager();
  private readonly analysisEngine = new NavigationAnalysisEngine();
  private readonly graphBuffer: GraphBuffer;
  private readonly scheduler = new MappingScheduler();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();

  private latestGraph: NavigationGraph | null = null;
  private previousGraph: NavigationGraph | null = null;
  private previousLayout: LayoutModel | null = null;
  private previousRouteState: RouteState | null = null;
  private mapping = false;

  constructor(
    private layoutUnderstanding: LayoutUnderstandingEngine,
    config: NavigationMappingConfiguration,
  ) {
    this.config = config;
    this.graphBuffer = new GraphBuffer(config.graphBufferLimit);
  }

  getStatus(): MappingStatus {
    return this.status;
  }

  getConfiguration(): NavigationMappingConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: NavigationMappingConfiguration): void {
    this.config = config;
    this.graphBuffer.setLimit(config.graphBufferLimit);
    if (this.scheduler.isRunning()) {
      this.stop();
      if (config.enabled) void this.start();
    }
  }

  async initialize(): Promise<void> {
    appendNavigationLog({
      event: "engine_initialized",
      level: "info",
      details: "Navigation Mapping Engine initialized",
    });
  }

  async start(): Promise<void> {
    if (!this.config.enabled) {
      this.status = "idle";
      return;
    }
    if (this.scheduler.isRunning()) return;

    this.sessionManager.startSession();
    this.healthMonitor.markSessionStart();
    this.recoveryManager.reset();
    this.analysisEngine.resetGraph();
    this.graphSequence = 0;
    this.lastProcessedLayoutId = "";
    this.previousRouteState = null;
    this.status = "mapping";

    appendNavigationLog({
      event: "navigation_start",
      level: "info",
      details: "Navigation mapping session started",
    });

    this.scheduler.start(this.config, () => this.mappingTick());
  }

  stop(): void {
    this.scheduler.stop();
    this.sessionManager.endSession("stopped");
    this.healthMonitor.markSessionEnd();
    this.status = "stopped";
    appendNavigationLog({ event: "navigation_stop", level: "info", details: "Navigation mapping stopped" });
  }

  pause(): void {
    if (!this.scheduler.isRunning()) return;
    this.scheduler.pause();
    this.sessionManager.setStatus("paused");
    this.status = "paused";
    appendNavigationLog({ event: "navigation_pause", level: "info", details: "Navigation mapping paused" });
  }

  resume(): void {
    if (!this.scheduler.isRunning()) return;
    this.scheduler.resume();
    this.sessionManager.setStatus("mapping");
    this.status = "mapping";
    appendNavigationLog({ event: "navigation_resume", level: "info", details: "Navigation mapping resumed" });
  }

  getLatestGraph(): NavigationGraph | null {
    return this.latestGraph;
  }

  getPreviousGraph(): NavigationGraph | null {
    return this.previousGraph;
  }

  getCumulativeGraph(): NavigationGraph | null {
    return this.analysisEngine.getCumulativeGraph();
  }

  getRecentGraphs(limit = 5): NavigationGraph[] {
    return this.graphBuffer.getRecent(limit);
  }

  getSession() {
    return this.sessionManager.getSession();
  }

  getPerformance(): NavigationPerformanceStats {
    return { ...this.performance };
  }

  getHealthMonitor() {
    return this.healthMonitor;
  }

  getRecoveryManager() {
    return this.recoveryManager;
  }

  getGraphBufferSize(): number {
    return this.graphBuffer.size();
  }

  mapLayout(layout: LayoutModel): NavigationGraph | null {
    const session = this.sessionManager.getSession();
    const sessionId = session?.sessionId ?? `nme-direct-${Date.now()}`;
    this.graphSequence += 1;
    const result = this.analysisEngine.analyze({
      layout,
      sessionId,
      graphSequence: this.graphSequence,
      previousGraph: this.previousGraph,
      previousLayout: this.previousLayout,
      previousRouteState: this.previousRouteState,
      config: this.config,
    });
    if (result.graph) {
      this.applyGraph(result.graph, layout.metadata.layoutId, result.routeState);
      this.previousLayout = layout;
      return result.graph;
    }
    return null;
  }

  private applyGraph(
    graph: NavigationGraph,
    sourceLayoutId: string,
    routeState: RouteState | null,
  ): void {
    this.previousGraph = this.latestGraph;
    this.latestGraph = graph;
    this.graphBuffer.push(graph);
    if (routeState) this.previousRouteState = routeState;
    this.sessionManager.recordGraph(true, sourceLayoutId, graph.metadata.currentScreenId);
    this.recoveryManager.recordSuccess();
    this.performance.successfulMappings += 1;
    this.performance.totalNodes += graph.nodes.length;
    this.performance.totalEdges += graph.edges.length;
    this.performance.totalTransitions += graph.edges.length;
    const duration = graph.metadata.processingDurationMs;
    this.healthMonitor.recordMapping(duration, true);
    this.performance.peakProcessingDurationMs = Math.max(
      this.performance.peakProcessingDurationMs,
      duration,
    );
    this.performance.averageProcessingDurationMs = Math.round(
      (this.performance.averageProcessingDurationMs * (this.performance.successfulMappings - 1) +
        duration) /
        this.performance.successfulMappings,
    );
  }

  private async mappingTick(): Promise<void> {
    if (this.mapping) {
      this.performance.skippedLayouts += 1;
      return;
    }
    this.mapping = true;
    try {
      const layout = this.layoutUnderstanding.getLatestLayout();
      const session = this.sessionManager.getSession();

      if (!session) {
        this.status = "failed";
        return;
      }

      if (!layout) {
        this.performance.skippedLayouts += 1;
        appendNavigationLog({
          event: "missing_layout",
          level: "warn",
          details: "No layout model available",
        });
        const shouldRecover = this.recoveryManager.recordFailure(
          "Missing layout model",
          this.config,
        );
        if (shouldRecover) {
          this.status = "recovering";
          this.status = "mapping";
        }
        return;
      }

      if (layout.metadata.layoutId === this.lastProcessedLayoutId) {
        return;
      }

      this.graphSequence += 1;
      this.performance.totalMappings += 1;

      const result = this.analysisEngine.analyze({
        layout,
        sessionId: session.sessionId,
        graphSequence: this.graphSequence,
        previousGraph: this.previousGraph,
        previousLayout: this.previousLayout,
        previousRouteState: this.previousRouteState,
        config: this.config,
      });

      if (result.graph) {
        this.applyGraph(result.graph, layout.metadata.layoutId, result.routeState);
        this.lastProcessedLayoutId = layout.metadata.layoutId;
        this.previousLayout = layout;

        appendNavigationLog({
          event: "navigation_mapping",
          level: "info",
          details: `Graph ${result.graph.metadata.graphId} · ${result.graph.nodes.length} nodes · ${result.graph.edges.length} edges`,
        });

        if (result.graph.changeSummary?.hasChanges) {
          appendNavigationLog({
            event: "navigation_change",
            level: "info",
            details: `screen=${result.graph.changeSummary.screenChanged} route=${result.graph.changeSummary.routeChanged} edges+${result.graph.changeSummary.edgesAdded.length}`,
          });
        }

        this.status = "mapping";
      } else {
        this.sessionManager.recordGraph(false, layout.metadata.layoutId, null);
        this.performance.failedMappings += 1;
        this.healthMonitor.recordMapping(0, false);
        const shouldRecover = this.recoveryManager.recordFailure(
          result.error ?? "Unknown navigation error",
          this.config,
        );
        if (shouldRecover) {
          this.status = "recovering";
          this.status = "mapping";
        } else if (this.recoveryManager.getConsecutiveFailures() >= this.config.maxRetryAttempts) {
          this.status = "failed";
          appendNavigationLog({
            event: "navigation_failed",
            level: "error",
            details: result.error ?? "Max retries exceeded",
          });
        }
      }
    } finally {
      this.mapping = false;
    }
  }
}
