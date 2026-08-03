import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildExecutiveReportingRuntimeConfiguration,
  type ExecutiveReportingRuntimeConfiguration,
} from "./configuration.js";
import { resetErtLogsForTesting } from "./ert-logging.js";
import { ExecutiveReportingRuntimeController } from "./executive-reporting-runtime-controller.js";
import { ExecutiveReportingRuntimeCore } from "./executive-reporting-runtime-core.js";
import { EXECUTIVE_REPORTING_RUNTIME_SYSTEM_PATH } from "./paths.js";
import { resetReportSequenceForTesting } from "./report-store.js";
import type {
  ExecutiveReportingRuntimeCockpitSnapshot,
  ExecutiveReportingRuntimeInput,
  ExecutiveReportingRuntimeState,
} from "./types.js";

export interface ExecutiveReportingRuntimeOptions {
  configuration?: Partial<ExecutiveReportingRuntimeConfiguration>;
}

/** Authoritative Q0-26 Executive Reporting Runtime — report only. */
export class ExecutiveReportingRuntime {
  private initializedAt: string | null = null;
  private readonly controller: ExecutiveReportingRuntimeController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: ExecutiveReportingRuntimeOptions = {},
  ) {
    this.controller = new ExecutiveReportingRuntimeController(
      new ExecutiveReportingRuntimeCore(),
      buildExecutiveReportingRuntimeConfiguration(
        bootstrap.repositoryRoot,
        options.configuration,
      ),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      EXECUTIVE_REPORTING_RUNTIME_SYSTEM_PATH,
    );
    if (!doc?.includes("Executive Reporting Runtime")) {
      throw new Error(
        `${EXECUTIVE_REPORTING_RUNTIME_SYSTEM_PATH} missing — Q0-26 system doc required.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  getState(): ExecutiveReportingRuntimeState {
    if (!this.initializedAt) {
      throw new Error("Executive Reporting Runtime not initialized. Call initialize() first.");
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-ERT-001",
      missionId: "Q0-26",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration,
      latestReport,
      engineRecord,
      health: {
        status: engineRecord?.healthStatus ?? "standby",
        healthScore:
          engineRecord?.healthStatus === "healthy" ? 100 : engineRecord ? 70 : 50,
        engineEnabled: configuration.enabled,
        lastOperationAt: latestReport?.runTimestamp ?? null,
        lastValidationDecision: latestReport?.validation.decision ?? null,
        totalReportRecords: this.getRecords().length,
        openBlockerCount: engineRecord?.openBlockerCount ?? 0,
        averageProgress: engineRecord?.averageProgress ?? 0,
        lastReportType: engineRecord?.lastReportType ?? null,
        notes: [
          "Report only: does not execute worker logic, replace Monitoring Runtime, replace Mission Coordination, override Pillow, or override Grand King.",
        ],
      },
    };
  }

  connectExecutiveReportingRuntime(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  submitWorkerReport(input: ExecutiveReportingRuntimeInput = {}) {
    return this.controller.submitWorker(input);
  }

  submitDepartmentReport(input: ExecutiveReportingRuntimeInput = {}) {
    return this.controller.submitDepartment(input);
  }

  submitFactoryReport(input: ExecutiveReportingRuntimeInput = {}) {
    return this.controller.submitFactory(input);
  }

  submitExecutiveReport(input: ExecutiveReportingRuntimeInput = {}) {
    return this.controller.submitExecutive(input);
  }

  aggregateProgress(input: ExecutiveReportingRuntimeInput = {}) {
    return this.controller.aggregateProgress(input);
  }

  listBlockers(input: ExecutiveReportingRuntimeInput = {}) {
    return this.controller.listBlockers(input);
  }

  generateExecutiveSummary(input: ExecutiveReportingRuntimeInput = {}) {
    return this.controller.generateSummary(input);
  }

  listReports() {
    return this.controller.list();
  }

  validateExecutiveReportingRuntime(input: ExecutiveReportingRuntimeInput = {}) {
    return this.controller.validate(input);
  }

  runDiagnostics() {
    return this.controller.diagnostics();
  }

  getRecords() {
    return this.controller.getManager().getRecords();
  }

  getLatestRecord() {
    return this.controller.getManager().getLatestRecord();
  }

  getLatestSummary() {
    return this.controller.getManager().getLatestSummary();
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
      health:
        score >= 75
          ? ("healthy" as const)
          : score >= 50
            ? ("degraded" as const)
            : ("blocked" as const),
      readinessScore: score,
      notes: [
        `Engine status: ${state.status}`,
        `Report records: ${state.health.totalReportRecords}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): ExecutiveReportingRuntimeCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q0-26",
      status: state.status,
      healthStatus: state.health.status,
      totalReportRecords: state.health.totalReportRecords,
      latestReportId: this.getLatestRecord()?.reportId ?? null,
      openBlockerCount: state.health.openBlockerCount,
      neverExecuteWorkerLogic: true,
      neverReplaceMonitoringRuntime: true,
      neverReplaceMissionCoordination: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
    };
  }
}

export function createExecutiveReportingRuntime(
  bootstrap: EmpireBootstrapContext,
  options?: ExecutiveReportingRuntimeOptions,
) {
  return new ExecutiveReportingRuntime(bootstrap, options);
}

export function resetExecutiveReportingRuntimeForTesting() {
  resetErtLogsForTesting();
  resetReportSequenceForTesting();
}
