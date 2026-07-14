import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { VisualCaptureEngine } from "../visual-capture-engine/engine.js";
import type { UiStateMapperEngine } from "../ui-state-mapper/engine.js";
import type { ComponentRecognitionEngine } from "../component-recognition-engine/engine.js";
import type { LayoutUnderstandingEngine } from "../layout-understanding-engine/engine.js";
import type { NavigationMappingEngine } from "../navigation-mapping-engine/engine.js";
import type { InteractionTrackingEngine } from "../interaction-tracking-engine/engine.js";
import type { ContextAwarenessEngine } from "../context-awareness-engine/engine.js";
import type { VisualMemoryEngine } from "../visual-memory-engine/engine.js";
import type { SessionContinuityEngine } from "../session-continuity-engine/engine.js";
import {
  appendCertificationLog,
  getCertificationLogs,
  resetCertificationLogsForTesting,
} from "./certification-logging.js";
import { CertificationController } from "./certification-controller.js";
import {
  buildVisualFoundationCertificationConfiguration,
  type VisualFoundationCertificationConfiguration,
} from "./configuration.js";
import { VISUAL_FOUNDATION_CERTIFICATION_SYSTEM_PATH } from "./paths.js";
import type {
  CertificationCockpitSnapshot,
  VisualFoundationCertificationReport,
  VisualFoundationCertificationState,
} from "./types.js";

export interface VisualFoundationCertificationEngineOptions {
  configuration?: Partial<VisualFoundationCertificationConfiguration>;
}

/**
 * Visual Foundation Certification Engine (PILLOW-VFC-001 / T1-10).
 * Validates the complete T1 Visual Foundation pipeline.
 */
export class VisualFoundationCertificationEngine {
  private initializedAt: string | null = null;
  private readonly controller: CertificationController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    visualCapture: VisualCaptureEngine,
    uiStateMapper: UiStateMapperEngine,
    componentRecognition: ComponentRecognitionEngine,
    layoutUnderstanding: LayoutUnderstandingEngine,
    navigationMapping: NavigationMappingEngine,
    interactionTracking: InteractionTrackingEngine,
    contextAwareness: ContextAwarenessEngine,
    visualMemory: VisualMemoryEngine,
    sessionContinuity: SessionContinuityEngine,
    options: VisualFoundationCertificationEngineOptions = {},
  ) {
    const config = buildVisualFoundationCertificationConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    this.controller = new CertificationController(
      bootstrap.repositoryRoot,
      {
        visualCapture,
        uiStateMapper,
        componentRecognition,
        layoutUnderstanding,
        navigationMapping,
        interactionTracking,
        contextAwareness,
        visualMemory,
        sessionContinuity,
      },
      config,
    );
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<VisualFoundationCertificationState> {
    const doc = await this.reader.readText(VISUAL_FOUNDATION_CERTIFICATION_SYSTEM_PATH);
    if (!doc?.includes("Visual Foundation Certification")) {
      throw new Error(
        `${VISUAL_FOUNDATION_CERTIFICATION_SYSTEM_PATH} missing — Visual Foundation Certification requires T1-10 system doc.`,
      );
    }
    this.initializedAt = new Date().toISOString();
    appendCertificationLog({
      event: "certification_engine_initialized",
      level: "info",
      details: "Visual Foundation Certification Engine initialized",
    });
    return this.getState();
  }

  getState(): VisualFoundationCertificationState {
    if (!this.initializedAt) {
      throw new Error(
        "Visual Foundation Certification Engine not initialized. Call initialize() first.",
      );
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const health = this.controller.getHealthMonitor().buildReport({
      config,
      status: this.controller.getStatus(),
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-VFC-001",
      missionId: "T1-10",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      health,
      performance,
    };
  }

  async runCertification(): Promise<VisualFoundationCertificationReport> {
    return this.controller.runCertification();
  }

  getLatestReport(): VisualFoundationCertificationReport | null {
    return this.controller.getLatestReport();
  }

  updateConfiguration(
    overrides: Partial<VisualFoundationCertificationConfiguration>,
  ): VisualFoundationCertificationState {
    const next = buildVisualFoundationCertificationConfiguration(this.bootstrap.repositoryRoot, {
      ...this.controller.getConfiguration(),
      ...overrides,
    });
    this.controller.updateConfiguration(next);
    return this.getState();
  }

  validateForSupervisorSync(): {
    valid: boolean;
    health: "healthy" | "degraded" | "blocked";
    readinessScore: number;
    notes: string[];
  } {
    const state = this.getState();
    const report = state.latestReport;
    const score = report
      ? report.finalCertificationDecision === "pass"
        ? 100
        : report.finalCertificationDecision === "conditional"
          ? 70
          : 40
      : state.health.healthScore;

    return {
      valid: state.health.status !== "failed",
      health: score >= 75 ? "healthy" : score >= 50 ? "degraded" : "blocked",
      readinessScore: score,
      notes: [
        `Certification status: ${state.status}`,
        report
          ? `Last decision: ${report.finalCertificationDecision}`
          : "No certification run yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): CertificationCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;
    const missionsPassed = report?.missionResults.filter((m) => m.passed).length ?? 0;
    const missionsFailed = report
      ? report.missionResults.length - missionsPassed
      : 0;

    return {
      certificationStatus: state.status,
      healthStatus: state.health.status,
      lastDecision: report?.finalCertificationDecision ?? state.health.lastCertificationDecision,
      missionsPassed,
      missionsFailed,
      endToEndPassed: report?.endToEndValidationResult.passed ?? false,
      totalCertifications: state.performance.totalCertifications,
      recentLogs: getCertificationLogs(8, state.configuration).map(
        (l) => `${l.event}: ${l.details}`,
      ),
    };
  }
}

export function createVisualFoundationCertificationEngine(
  bootstrap: EmpireBootstrapContext,
  visualCapture: VisualCaptureEngine,
  uiStateMapper: UiStateMapperEngine,
  componentRecognition: ComponentRecognitionEngine,
  layoutUnderstanding: LayoutUnderstandingEngine,
  navigationMapping: NavigationMappingEngine,
  interactionTracking: InteractionTrackingEngine,
  contextAwareness: ContextAwarenessEngine,
  visualMemory: VisualMemoryEngine,
  sessionContinuity: SessionContinuityEngine,
  options?: VisualFoundationCertificationEngineOptions,
): VisualFoundationCertificationEngine {
  return new VisualFoundationCertificationEngine(
    bootstrap,
    visualCapture,
    uiStateMapper,
    componentRecognition,
    layoutUnderstanding,
    navigationMapping,
    interactionTracking,
    contextAwareness,
    visualMemory,
    sessionContinuity,
    options,
  );
}

export function resetVisualFoundationCertificationForTesting(): void {
  resetCertificationLogsForTesting();
}
