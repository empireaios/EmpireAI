import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import type { CursorMissionDocument } from "../planner/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildJourneyReadinessPipeline,
  buildJourneyReadinessPipelineSync,
  evaluateJourneyBuilderGate,
} from "./builder-gate.js";
import { JourneyEventStore } from "./event-store.js";
import {
  executeEndToEndTrace,
  ensureActiveJourney,
  publishBuilderEvent,
  recordMissionInJourney,
} from "./pipeline.js";
import {
  JOURNEY_FIRST_DOCTRINE_PATH,
  JOURNEY_INDEX_PATH,
  JOURNEY_SYSTEM_PATH,
} from "./paths.js";
import { formatJourneySystemPreamble } from "./mission-preamble.js";
import type {
  EndToEndTraceResult,
  JourneyBuilderGateResult,
  JourneyGovernanceAnalysis,
  JourneyRecord,
  JourneySystemMetrics,
  JourneySystemRequest,
  JourneySystemState,
  MissionTraceabilityRecord,
} from "./types.js";

/**
 * Journey System Engine (PILLOW-JR-001 / P4-08).
 * Permanent execution history — every constitutional action traceable from Vision through Production.
 */
export class JourneySystemEngine {
  private initializedAt: string | null = null;
  private reader: RepositoryReader;
  private store = new JourneyEventStore();
  private lastReadiness: import("./types.js").JourneyReadinessPipeline | null = null;
  private lastTrace: EndToEndTraceResult | null = null;
  private lastTraceability: MissionTraceabilityRecord | null = null;

  constructor(private bootstrap: EmpireBootstrapContext) {
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<JourneySystemState> {
    const systemDoc = await this.reader.readText(JOURNEY_SYSTEM_PATH);
    if (!systemDoc?.includes("Journey System")) {
      throw new Error(
        `${JOURNEY_SYSTEM_PATH} missing — Journey System Engine requires P4-08 system doc.`,
      );
    }
    const companion = await this.reader.readText(JOURNEY_FIRST_DOCTRINE_PATH);
    if (!companion?.includes("Journey First")) {
      throw new Error(
        `${JOURNEY_FIRST_DOCTRINE_PATH} missing — Journey System requires Journey First Doctrine.`,
      );
    }
    const journeyIndex = await this.reader.readText(JOURNEY_INDEX_PATH);
    if (!journeyIndex?.includes("JOURNEY")) {
      throw new Error(
        `${JOURNEY_INDEX_PATH} missing — Journey System requires operational journey index.`,
      );
    }
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  getState(): JourneySystemState {
    if (!this.initializedAt) {
      throw new Error("Journey System Engine not initialized. Call initialize() first.");
    }
    const journeys = this.store.list();
    const status =
      journeys.some((j) => j.status === "active" && j.recoveryEvents.length > 3)
        ? "degraded"
        : "ready";
    return {
      engineVersion: "PILLOW-JR-001",
      status,
      initializedAt: this.initializedAt,
      doctrinePath: JOURNEY_SYSTEM_PATH,
      companionPath: JOURNEY_FIRST_DOCTRINE_PATH,
      totalJourneys: journeys.length,
      activeJourneyId: this.store.getActive()?.journeyId ?? null,
      lastTraceability: this.lastTraceability,
    };
  }

  async refreshReadiness(request: JourneySystemRequest = {}): Promise<JourneyBuilderGateResult> {
    const pipeline = await buildJourneyReadinessPipeline({
      bootstrap: this.bootstrap,
      request,
    });
    this.lastReadiness = pipeline;
    return evaluateJourneyBuilderGate(pipeline, request);
  }

  evaluateBuilderGateSync(request: JourneySystemRequest = {}): JourneyBuilderGateResult {
    const pipeline =
      this.lastReadiness ??
      buildJourneyReadinessPipelineSync({
        bootstrap: this.bootstrap,
        request,
      });
    return evaluateJourneyBuilderGate(pipeline, request);
  }

  validateForSupervisorSync(request: JourneySystemRequest = {}): {
    valid: boolean;
    health: "healthy" | "degraded" | "blocked";
    readinessScore: number;
    notes: string[];
    pipeline: import("./types.js").JourneyReadinessPipeline;
  } {
    const gate = this.evaluateBuilderGateSync(request);
    return {
      valid: gate.allowed,
      health:
        gate.pipeline.readinessScore >= 75
          ? "healthy"
          : gate.allowed
            ? "degraded"
            : "blocked",
      readinessScore: gate.readinessScore,
      notes: [
        `Readiness: ${gate.readinessScore}/100`,
        gate.pipeline.recommendedAction,
        `Journey position: ${this.bootstrap.journeyPosition ?? "unknown"}`,
        "Permanent traceability from Vision through Production",
      ],
      pipeline: gate.pipeline,
    };
  }

  formatMissionPreamble(request: JourneySystemRequest = {}): string {
    const readiness =
      this.lastReadiness ??
      buildJourneyReadinessPipelineSync({
        bootstrap: this.bootstrap,
        request,
      });
    return formatJourneySystemPreamble({
      readiness,
      activeJourney: this.store.getActive(),
    });
  }

  /** Builder publishes mission to permanent Journey. */
  recordMission(document: CursorMissionDocument, roadmapItem?: string | null): MissionTraceabilityRecord {
    const result = recordMissionInJourney({
      store: this.store,
      bootstrap: this.bootstrap,
      document,
      roadmapItem,
    });
    this.lastTraceability = result.trace;
    return result.trace;
  }

  /** Builder publishes journey event. */
  publishEvent(input: {
    type: import("./types.js").JourneyEventType;
    label: string;
    detail: string;
    stage?: import("./types.js").JourneyModelStage;
  }): void {
    publishBuilderEvent({
      store: this.store,
      journeyId: this.store.getActive()?.journeyId ?? null,
      ...input,
    });
  }

  /** Supervisor updates mission progress on active journey timeline. */
  recordSupervisorEvent(input: {
    missionId: string;
    label: string;
    detail: string;
    stage?: import("./types.js").JourneyModelStage;
  }): void {
    const active = this.store.getActive();
    if (!active) {
      ensureActiveJourney({
        store: this.store,
        bootstrap: this.bootstrap,
        missionId: input.missionId,
      });
    }
    const journeyId = this.store.getActive()?.journeyId;
    if (!journeyId) return;
    this.store.appendEvent({
      journeyId,
      type: "supervisor_event",
      stage: input.stage ?? "implementation",
      label: input.label,
      detail: input.detail,
      actor: "supervisor",
    });
  }

  /** Grand King acceptance — end-to-end trace demonstration. */
  traceEndToEnd(document: CursorMissionDocument, roadmapItem?: string | null): EndToEndTraceResult {
    const result = executeEndToEndTrace({
      bootstrap: this.bootstrap,
      document,
      store: this.store,
      roadmapItem,
    });
    this.lastTrace = result;
    this.lastTraceability = result.record.missions[0] ?? null;
    return result;
  }

  getActiveJourney(): JourneyRecord | null {
    return this.store.getActive();
  }

  getJourney(journeyId: string): JourneyRecord | undefined {
    return this.store.get(journeyId);
  }

  analyzeJourneyGovernance(): JourneyGovernanceAnalysis {
    const active = this.store.getActive();
    const all = this.store.list();
    const missingEvidence: string[] = [];
    const missingDependencies: string[] = [];
    const journeyDrift: string[] = [];

    if (!active) {
      missingEvidence.push("No active journey — start Builder mission to create trace");
    } else {
      if (active.evidence.length === 0) missingEvidence.push("Journey evidence empty");
      if (active.missions.length === 0) missingEvidence.push("No missions attached to journey");
      const lastMission = active.missions[active.missions.length - 1];
      if (lastMission?.dependencies.some((d) => d.includes("blocked"))) {
        missingDependencies.push("Blocked dependencies on active mission");
      }
      if (
        this.bootstrap.journeyPosition &&
        !active.currentRoadmapItem.includes(this.bootstrap.journeyPosition.slice(0, 8))
      ) {
        journeyDrift.push("Active journey roadmap item may drift from JOURNEY.md position");
      }
    }

    const completeness =
      active && active.missions.length > 0
        ? Math.min(1, (active.timeline.length + active.evidence.length) / 20)
        : all.length > 0
          ? 0.5
          : 0;

    return {
      journeyCompleteness: completeness,
      journeyDrift,
      missingEvidence,
      missingDependencies,
      lessonsLearned: all.flatMap((j) => j.lessonsLearned),
      knowledgeGrowth: [
        `${all.length} journey(s) recorded`,
        `${all.reduce((n, j) => n + j.timeline.length, 0)} timeline events preserved`,
      ],
      recommendations: [
        "Every Builder mission shall publish to permanent Journey before dispatch",
        "Supervisor shall update timeline on state changes",
        "Archive journey only after Lessons Learned and Vision Accumulation",
        ...(missingEvidence.length > 0 ? [`Resolve: ${missingEvidence.join(", ")}`] : []),
      ],
    };
  }

  getMetrics(): JourneySystemMetrics {
    const all = this.store.list();
    const active = all.filter((j) => j.status === "active").length;
    const archived = all.filter((j) => j.status === "archived").length;
    const events = all.reduce((n, j) => n + j.timeline.length, 0);
    const lessons = all.reduce((n, j) => n + j.lessonsLearned.length, 0);
    const traceComplete = this.lastTrace?.complete ? 1 : 0;

    return {
      totalJourneys: all.length,
      activeJourneys: active,
      archivedJourneys: archived,
      traceabilityCompleteness: all.length > 0 ? traceComplete || 0.75 : 0,
      timelineEventCount: events,
      lessonsLearnedCount: lessons,
      trend: events > 5 ? "improving" : all.length > 0 ? "stable" : "degrading",
    };
  }

  getCockpitSnapshot() {
    const active = this.store.getActive();
    const metrics = this.getMetrics();
    const analysis = this.analyzeJourneyGovernance();
    const lastMission = active?.missions[active.missions.length - 1];

    return {
      currentJourney: active?.journeyId ?? "None",
      currentRoadmapItem: active?.currentRoadmapItem ?? this.bootstrap.journeyPosition ?? "Unknown",
      currentMission: active?.currentMissionId ?? lastMission?.missionId ?? "None",
      currentStep: active?.currentStep ?? "Awaiting mission",
      timeline: active?.timeline.slice(-8).map((e) => `${e.at.slice(11, 19)} · ${e.label}: ${e.detail}`) ?? [],
      progress: active?.progress ?? 0,
      eta: active?.eta ?? "TBD",
      dependencies: lastMission?.dependencies ?? [],
      repositoryChanges: lastMission?.repositoryChanges ?? [],
      productionStatus: active?.productionEvents.at(-1) ?? "Pending validation",
      recoveryEvents: active?.recoveryEvents ?? [],
      lessonsLearned: active?.lessonsLearned ?? [],
      evidence: active?.evidence.slice(-6) ?? [],
      acceptanceStatus: this.lastTrace?.summary ?? "Awaiting end-to-end trace",
      metrics,
      analysis,
    };
  }
}

export function createJourneySystemEngine(
  bootstrap: EmpireBootstrapContext,
): JourneySystemEngine {
  return new JourneySystemEngine(bootstrap);
}
