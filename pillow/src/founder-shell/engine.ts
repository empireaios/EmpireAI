import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { CursorSupervisorEngine } from "../supervisor/engine.js";
import type { BuilderMonitorEngine } from "../builder-monitor/engine.js";
import type { JourneySystemEngine } from "../journey-system/engine.js";
import type { ProductionModeEngine } from "../production-mode/engine.js";
import type { ExecutionControlCenterEngine } from "../execution-control-center/engine.js";
import type { ZeroHumanAutomationEngine } from "../zero-human-automation/engine.js";
import type { CommerceIntelligenceEngine } from "../commerce-intelligence/engine.js";
import {
  buildFounderShellReadinessPipeline,
  buildFounderShellReadinessPipelineSync,
  evaluateFounderShellGate,
} from "./builder-gate.js";
import {
  FOUNDER_SHELL_PATH,
  AUTOMATION_COMPANION_PATH,
  FOUNDER_SHELL_PRINCIPLES,
} from "./paths.js";
import { FOUNDER_NAVIGATION_REGISTRY } from "./navigation-registry.js";
import { FOUNDER_WORKSPACE_REGISTRY } from "./workspace-registry.js";
import { formatFounderShellPreamble } from "./mission-preamble.js";
import type {
  ExecutiveHomeSummary,
  FounderShellAssessment,
  FounderShellContext,
  FounderShellEngineState,
  FounderShellGateResult,
  FounderShellMetrics,
  FounderShellReadinessPipeline,
  FounderShellRequest,
  FounderWorkspaceId,
} from "./types.js";

export interface FounderShellSurfaces {
  supervisor?: CursorSupervisorEngine | null;
  builderMonitor?: BuilderMonitorEngine | null;
  journeySystem?: JourneySystemEngine | null;
  productionMode?: ProductionModeEngine | null;
  executionControlCenter?: ExecutionControlCenterEngine | null;
  zeroHumanAutomation?: ZeroHumanAutomationEngine | null;
  commerceIntelligence?: CommerceIntelligenceEngine | null;
}

/**
 * Founder Shell Engine (PILLOW-FS-001 / P7-01).
 * Unified executive workspace — one login, one navigation, one experience.
 */
export class FounderShellEngine {
  private initializedAt: string | null = null;
  private reader: RepositoryReader;
  private surfacesAttached = false;
  private surfaces: FounderShellSurfaces = {};
  private lastReadiness: FounderShellReadinessPipeline | null = null;
  private lastAssessment: FounderShellAssessment | null = null;
  private lastContext: FounderShellContext | null = null;

  constructor(private bootstrap: EmpireBootstrapContext) {
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<FounderShellEngineState> {
    const systemDoc = await this.reader.readText(FOUNDER_SHELL_PATH);
    if (!systemDoc?.includes("Founder Shell")) {
      throw new Error(
        `${FOUNDER_SHELL_PATH} missing — Founder Shell requires P7-01 doctrine.`,
      );
    }
    const companion = await this.reader.readText(AUTOMATION_COMPANION_PATH);
    if (!companion?.includes("Zero-Human Automation")) {
      throw new Error(`${AUTOMATION_COMPANION_PATH} missing — requires P6-07 companion.`);
    }
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  attachSurfaces(surfaces: FounderShellSurfaces): void {
    this.surfaces = surfaces;
    this.surfacesAttached = Boolean(
      surfaces.supervisor || surfaces.builderMonitor || surfaces.journeySystem,
    );
  }

  getState(): FounderShellEngineState {
    if (!this.initializedAt) {
      throw new Error("Founder Shell not initialized. Call initialize() first.");
    }
    return {
      engineVersion: "PILLOW-FS-001",
      status: this.lastAssessment?.shellHealth === "blocked" ? "blocked" : "ready",
      initializedAt: this.initializedAt,
      doctrinePath: FOUNDER_SHELL_PATH,
      companionPath: AUTOMATION_COMPANION_PATH,
      surfacesAttached: this.surfacesAttached,
      workspaceCount: FOUNDER_WORKSPACE_REGISTRY.length,
      navigationCount: FOUNDER_NAVIGATION_REGISTRY.length,
      lastContext: this.lastContext,
    };
  }

  async refreshReadiness(request: FounderShellRequest = {}): Promise<FounderShellReadinessPipeline> {
    this.lastReadiness = await buildFounderShellReadinessPipeline({
      bootstrap: this.bootstrap,
      request,
    });
    return this.lastReadiness;
  }

  evaluateBuilderGateSync(request: FounderShellRequest = {}): FounderShellGateResult {
    const pipeline =
      this.lastReadiness ??
      buildFounderShellReadinessPipelineSync({ bootstrap: this.bootstrap, request });
    return evaluateFounderShellGate({
      pipeline,
      grandKingOverride: request.grandKingOverride,
    });
  }

  syncFromRuntime(activeWorkspace: FounderWorkspaceId = "executive_home"): FounderShellContext {
    const journeyPosition =
      this.bootstrap.journeyPosition ?? null;

    const context: FounderShellContext = {
      currentBusiness: this.bootstrap.currentMission ? "EmpireAI Portfolio" : null,
      currentMission: this.bootstrap.currentMission ?? null,
      currentJourney: journeyPosition,
      currentContext: `Workspace: ${activeWorkspace}`,
      currentNotifications: 0,
      currentRecommendations: [],
      currentSession: null,
      currentWorkspace: activeWorkspace,
    };

    try {
      const supervisor = this.surfaces.supervisor?.getCockpitSnapshot?.();
      if (supervisor && typeof supervisor === "object") {
        const snap = supervisor as Record<string, unknown>;
        if (Array.isArray(snap.recommendations)) {
          context.currentRecommendations = snap.recommendations.slice(0, 5) as string[];
        }
        if (typeof snap.alertCount === "number") {
          context.currentNotifications = snap.alertCount;
        }
      }
    } catch {
      /* non-blocking */
    }

    this.lastContext = context;
    return context;
  }

  runAssessment(request: FounderShellRequest = {}): FounderShellAssessment {
    this.syncFromRuntime("executive_home");
    const readyWorkspaces = FOUNDER_WORKSPACE_REGISTRY.filter((w) => w.integrated).length;
    const shellHealth =
      readyWorkspaces >= 11 && this.surfacesAttached ? "healthy" : "degraded";

    this.lastAssessment = {
      shellHealth,
      navigationConsistent: FOUNDER_NAVIGATION_REGISTRY.length >= 9,
      contextPreserved: Boolean(this.lastContext),
      cockpitIntegrated: true,
      grandKingSummary: [
        "Founder Shell active — one unified executive workspace.",
        `${FOUNDER_NAVIGATION_REGISTRY.length} navigation items · ${readyWorkspaces} workspaces integrated.`,
        `Journey: ${this.lastContext?.currentJourney ?? "unknown"} · Mission: ${this.lastContext?.currentMission ?? "none"}.`,
        "Grand King enters via Executive Home — Pillow, Builder, Journey, Production, Commerce accessible without switching interfaces.",
      ].join(" "),
    };
    return this.lastAssessment;
  }

  getMetrics(): FounderShellMetrics {
    const ready = FOUNDER_WORKSPACE_REGISTRY.filter((w) => w.integrated).length;
    return {
      workspaceReadyCount: ready,
      workspaceTotal: FOUNDER_WORKSPACE_REGISTRY.length,
      navigationItemCount: FOUNDER_NAVIGATION_REGISTRY.length,
      contextFieldCount: 8,
      integrationScore: Math.round((ready / FOUNDER_WORKSPACE_REGISTRY.length) * 100),
    };
  }

  buildExecutiveHomeSummary(): ExecutiveHomeSummary {
    let builderStatus = "Standby";
    let supervisorStatus = "Standby";
    let productionStatus = "Unknown";
    const alerts: string[] = [];
    const recommendations: string[] = [];
    const pendingActions: string[] = [];

    try {
      const builder = this.surfaces.builderMonitor?.getCockpitSnapshot?.();
      if (builder && typeof builder === "object") {
        const b = builder as Record<string, unknown>;
        builderStatus = String(b.missionProgress ?? b.builderStatus ?? "Active");
        if (typeof b.currentStep === "string") pendingActions.push(`Builder: ${b.currentStep}`);
      }
    } catch {
      alerts.push("Builder monitor unavailable");
    }

    try {
      const supervisor = this.surfaces.supervisor?.getCockpitSnapshot?.();
      if (supervisor && typeof supervisor === "object") {
        const s = supervisor as Record<string, unknown>;
        supervisorStatus = String(s.supervisorHealth ?? s.health ?? "Monitoring");
        if (Array.isArray(s.recommendations)) {
          recommendations.push(...(s.recommendations as string[]).slice(0, 3));
        }
      }
    } catch {
      alerts.push("Supervisor unavailable");
    }

    try {
      const production = this.surfaces.productionMode?.getCockpitSnapshot?.();
      if (production && typeof production === "object") {
        const p = production as Record<string, unknown>;
        productionStatus = String(p.productionMode ?? p.mode ?? "Evaluating");
      }
    } catch {
      productionStatus = "Production mode unavailable";
    }

    return {
      businessStatus: this.bootstrap.repositoryHealth.healthy ? "Healthy" : "Degraded",
      missionStatus: this.bootstrap.currentMission ?? "No active mission",
      builderStatus,
      supervisorStatus,
      productionStatus,
      revenue: "Portfolio revenue — see Commerce workspace",
      alerts,
      recommendations,
      currentJourney: this.lastContext?.currentJourney ?? this.bootstrap.journeyPosition ?? "Unknown",
      pendingActions,
    };
  }

  formatMissionPreamble(request: FounderShellRequest = {}): string {
    const readiness =
      this.lastReadiness ??
      buildFounderShellReadinessPipelineSync({ bootstrap: this.bootstrap, request });
    return formatFounderShellPreamble({
      readiness,
      lastAssessment: this.lastAssessment,
    });
  }

  getCockpitSnapshot(activeWorkspace: FounderWorkspaceId = "executive_home") {
    const context = this.syncFromRuntime(activeWorkspace);
    const assessment = this.lastAssessment ?? this.runAssessment();
    const executiveHome = this.buildExecutiveHomeSummary();
    const metrics = this.getMetrics();

    return {
      shellHealth: assessment.shellHealth,
      activeWorkspace,
      navigation: FOUNDER_NAVIGATION_REGISTRY.map((n) => ({
        id: n.id,
        label: n.label,
        route: n.cockpitRoute,
      })),
      workspaces: FOUNDER_WORKSPACE_REGISTRY.map((w) => ({
        id: w.id,
        label: w.label,
        route: w.cockpitRoute,
        status: w.status,
        integrated: w.integrated,
      })),
      context,
      executiveHome,
      principles: [...FOUNDER_SHELL_PRINCIPLES],
      navigationConsistent: assessment.navigationConsistent,
      contextPreserved: assessment.contextPreserved,
      cockpitIntegrated: assessment.cockpitIntegrated,
      grandKingSummary: assessment.grandKingSummary,
      metrics,
    };
  }
}

export function createFounderShellEngine(
  bootstrap: EmpireBootstrapContext,
): FounderShellEngine {
  return new FounderShellEngine(bootstrap);
}
