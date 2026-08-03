import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildEmpirePerformanceGuardianConfiguration,
  type EmpirePerformanceGuardianConfiguration,
} from "./configuration.js";
import { EmpirePerformanceGuardianController } from "./empire-performance-guardian-controller.js";
import {
  EmpirePerformanceGuardianManager,
  type EmpirePerformanceGuardianDependencies,
} from "./empire-performance-guardian-manager.js";
import { EMPIRE_PERFORMANCE_GUARDIAN_SYSTEM_PATH } from "./paths.js";
import type {
  EmpirePerformanceGuardianCockpitSnapshot,
  EmpirePerformanceGuardianInput,
  EmpirePerformanceGuardianState,
} from "./types.js";

export type { EmpirePerformanceGuardianDependencies };
export interface EmpirePerformanceGuardianOptions {
  configuration?: Partial<EmpirePerformanceGuardianConfiguration>;
}

export class EmpirePerformanceGuardian {
  private initializedAt: string | null = null;
  private readonly controller: EmpirePerformanceGuardianController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    dependencies: EmpirePerformanceGuardianDependencies = {},
    options: EmpirePerformanceGuardianOptions = {},
  ) {
    this.controller = new EmpirePerformanceGuardianController(
      new EmpirePerformanceGuardianManager(dependencies),
      buildEmpirePerformanceGuardianConfiguration(bootstrap.repositoryRoot, options.configuration),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(EMPIRE_PERFORMANCE_GUARDIAN_SYSTEM_PATH);
    if (!doc?.includes("Empire Performance Guardian")) {
      throw new Error(`${EMPIRE_PERFORMANCE_GUARDIAN_SYSTEM_PATH} missing — X5-18 system doc required.`);
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  getState(): EmpirePerformanceGuardianState {
    if (!this.initializedAt) throw new Error("Empire Performance Guardian not initialized. Call initialize() first.");
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    const count = this.getPerformanceRecords().length;
    return {
      engineVersion: "PILLOW-EPG-001",
      missionId: "X5-18",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration,
      latestReport,
      engineRecord,
      health: {
        status: engineRecord?.healthStatus ?? "standby",
        healthScore: engineRecord?.healthStatus === "healthy" ? 100 : engineRecord ? 70 : 50,
        engineEnabled: configuration.enabled,
        lastOperationAt: latestReport?.runTimestamp ?? null,
        lastValidationDecision: latestReport?.validation.decision ?? null,
        totalPerformanceRecords: count,
        notes: [
          "Structural performance signals only; critical enterprise alerts are never suppressed.",
        ],
      },
    };
  }

  connectEmpirePerformanceGuardian(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  monitorEveryCompany(input: EmpirePerformanceGuardianInput = {}) {
    return this.controller.run("monitor_every_company", input);
  }

  monitorEnterpriseWideKpis(input: EmpirePerformanceGuardianInput = {}) {
    return this.controller.run("monitor_enterprise_wide_kpis", input);
  }

  monitorOperationalPerformance(input: EmpirePerformanceGuardianInput = {}) {
    return this.controller.run("monitor_operational_performance", input);
  }

  monitorFinancialPerformance(input: EmpirePerformanceGuardianInput = {}) {
    return this.controller.run("monitor_financial_performance", input);
  }

  monitorCustomerPerformance(input: EmpirePerformanceGuardianInput = {}) {
    return this.controller.run("monitor_customer_performance", input);
  }

  monitorStrategicObjectives(input: EmpirePerformanceGuardianInput = {}) {
    return this.controller.run("monitor_strategic_objectives", input);
  }

  detectPerformanceDegradation(input: EmpirePerformanceGuardianInput = {}) {
    return this.controller.run("detect_performance_degradation", { ...input, degradationHint: input.degradationHint ?? true });
  }

  detectCriticalAnomalies(input: EmpirePerformanceGuardianInput = {}) {
    return this.controller.run("detect_critical_anomalies", { ...input, anomalyHint: input.anomalyHint ?? "critical" });
  }

  rankEnterprisePriorities(input: EmpirePerformanceGuardianInput = {}) {
    return this.controller.run("rank_enterprise_priorities", input);
  }

  generatePerformanceRecommendations(input: EmpirePerformanceGuardianInput = {}) {
    return this.controller.run("generate_performance_recommendations", input);
  }

  runDiagnostics() {
    return this.controller.diagnostics();
  }

  getPerformanceRecords() {
    return this.controller.getManager().getPerformanceRecords();
  }

  getRecommendations() {
    return this.controller.getManager().getRecommendations();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  validateForSupervisorSync() {
    const state = this.getState();
    const score =
      state.latestReport?.validation.decision === "fail"
        ? 40
        : state.latestReport?.validation.decision === "partial"
          ? 70
          : 100;
    return {
      valid: state.health.status !== "failed",
      health: score >= 75 ? ("healthy" as const) : score >= 50 ? ("degraded" as const) : ("blocked" as const),
      readinessScore: score,
      notes: [`Engine status: ${state.status}`, `Performance records: ${state.health.totalPerformanceRecords}`, ...state.health.notes],
    };
  }

  getCockpitSnapshot(): EmpirePerformanceGuardianCockpitSnapshot {
    const state = this.getState();
    const record = state.engineRecord;
    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      operationalState: record?.currentOperationalState ?? null,
      lastDecision: state.latestReport?.validation.decision ?? null,
      totalPerformanceRecords: state.health.totalPerformanceRecords,
      frameworkRegistered: Boolean(record?.frameworkModuleId),
      dependenciesConnected:
        Number(Boolean(record?.dependencyPresence.empireIntelligenceFramework)) +
        Number(Boolean(record?.dependencyPresence.executiveEmpireDashboard)) +
        Number(Boolean(record?.dependencyPresence.autonomousEmpireEvolution)),
      recentLogs: [],
    };
  }
}

export function createEmpirePerformanceGuardian(
  bootstrap: EmpireBootstrapContext,
  dependencies: EmpirePerformanceGuardianDependencies = {},
  options?: EmpirePerformanceGuardianOptions,
) {
  return new EmpirePerformanceGuardian(bootstrap, dependencies, options);
}

export function resetEmpirePerformanceGuardianForTesting() {}
