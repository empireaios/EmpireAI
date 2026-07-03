import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import type { RecoveryManagerEngine } from "../recovery/engine.js";
import { orchestrateGitHub } from "./github-orchestrator.js";
import { orchestrateRailway } from "./railway-orchestrator.js";
import { orchestrateVercel } from "./vercel-orchestrator.js";
import { probeApplicationHealth } from "./application-monitor.js";
import { buildMonitorSnapshot } from "./monitor-engine.js";
import { coordinateRecovery } from "./recovery-coordinator.js";
import {
  buildExecutiveInfrastructureReport,
  formatExecutiveInfrastructureReport,
} from "./executive-reporter.js";
import type {
  ExecutiveInfrastructureReport,
  InfrastructureCommanderState,
  InfrastructureMonitorSnapshot,
  PlatformId,
  RecoveryCoordinationPlan,
  HealthStatus,
} from "./types.js";

export const INFRASTRUCTURE_COMMANDER_CONTRACT_PATH = "deployment/MANAGED_DEPLOYMENT.md";

/**
 * Infrastructure Commander (PILLOW-IC-001 / Phase 6).
 * GitHub · Railway · Vercel orchestration, monitoring, recovery, executive reporting.
 */
export class InfrastructureCommanderEngine {
  private initializedAt: string | null = null;
  private totalScans = 0;
  private lastScanAt: string | null = null;
  private lastSnapshot: InfrastructureMonitorSnapshot | null = null;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    private readonly recoveryManager?: RecoveryManagerEngine,
  ) {}

  async initialize(): Promise<InfrastructureCommanderState> {
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  getState(): InfrastructureCommanderState {
    if (!this.initializedAt) {
      throw new Error("Infrastructure Commander not initialized. Call initialize() first.");
    }
    return {
      commanderVersion: "PILLOW-IC-001",
      status: "ready",
      initializedAt: this.initializedAt,
      totalScans: this.totalScans,
      lastScanAt: this.lastScanAt,
      platformsMonitored: ["github", "railway", "vercel", "application"],
    };
  }

  getLastSnapshot(): InfrastructureMonitorSnapshot | null {
    return this.lastSnapshot;
  }

  /** Full infrastructure scan across all platforms. */
  async scanInfrastructure(): Promise<InfrastructureMonitorSnapshot> {
    const github = orchestrateGitHub(this.bootstrap);
    const [railway, vercel, application] = await Promise.all([
      orchestrateRailway(),
      orchestrateVercel(),
      probeApplicationHealth(),
    ]);

    const snapshot = buildMonitorSnapshot({ github, railway, vercel, application });
    this.totalScans += 1;
    this.lastScanAt = snapshot.monitoredAt;
    this.lastSnapshot = snapshot;
    return snapshot;
  }

  /** Executive infrastructure report with optional recovery for a specific issue. */
  async generateExecutiveReport(issue?: string): Promise<ExecutiveInfrastructureReport> {
    const snapshot = this.lastSnapshot ?? (await this.scanInfrastructure());
    let recovery: RecoveryCoordinationPlan | null = null;

    if (issue) {
      recovery = this.coordinateRecoveryForIssue(issue, snapshot);
    } else if (snapshot.executiveAttentionRequired) {
      recovery = coordinateRecovery(
        snapshot.activeRisks[0] ?? "Infrastructure degradation detected",
        snapshot,
      );
    }

    return buildExecutiveInfrastructureReport(snapshot, recovery);
  }

  coordinateRecoveryForIssue(
    issue: string,
    snapshot?: InfrastructureMonitorSnapshot,
  ): RecoveryCoordinationPlan {
    const snap = snapshot ?? this.lastSnapshot;
    if (!snap) {
      return coordinateRecovery(issue, {
        monitoredAt: new Date().toISOString(),
        overallHealth: "unknown",
        productionReadiness: "unknown",
        alertLevel: "informational",
        github: orchestrateGitHub(this.bootstrap),
        railway: { platform: "railway", serviceUrl: "", healthEndpoint: "unknown", brainOnline: false, pillowHealth: "unknown", responseMs: null, deploymentNotes: [], restartStrategy: "", rollbackPlan: "", health: "unknown", findings: [] },
        vercel: { platform: "vercel", productionUrl: "", frontendReachable: false, bffHealth: "unknown", pillowProxyOk: false, routingNotes: [], buildValidation: "unknown", health: "unknown", findings: [] },
        application: { platform: "application", endpoints: [], certificateOk: true, serviceAvailability: "unknown", health: "unknown", findings: [] },
        activeRisks: [],
        executiveAttentionRequired: false,
      });
    }

    const plan = coordinateRecovery(issue, snap);

    if (this.recoveryManager && snap.overallHealth === "critical") {
      plan.automatedSteps.push("Invoke Pillow Recovery Manager per EMPIREAI_EMPIRE_RECOVERY_DOCTRINE");
    }

    return plan;
  }

  formatReport(report: ExecutiveInfrastructureReport): string {
    return formatExecutiveInfrastructureReport(report);
  }

  getPlatformHealth(platform: PlatformId): HealthStatus {
    if (!this.lastSnapshot) return "unknown";
    switch (platform) {
      case "github":
        return this.lastSnapshot.github.health;
      case "railway":
        return this.lastSnapshot.railway.health;
      case "vercel":
        return this.lastSnapshot.vercel.health;
      case "application":
        return this.lastSnapshot.application.health;
      default:
        return this.lastSnapshot.overallHealth;
    }
  }
}

export function createInfrastructureCommanderEngine(
  bootstrap: EmpireBootstrapContext,
  recoveryManager?: RecoveryManagerEngine,
): InfrastructureCommanderEngine {
  return new InfrastructureCommanderEngine(bootstrap, recoveryManager);
}
