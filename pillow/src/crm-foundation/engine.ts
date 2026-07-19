import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { CustomerIdentityEngine } from "../customer-identity-engine/engine.js";
import {
  buildCrmFoundationConfiguration,
  type CrmFoundationConfiguration,
} from "./configuration.js";
import { appendCrmLog, getCrmLogs, resetCrmLogsForTesting } from "./crm-logging.js";
import { CRM_FOUNDATION_SYSTEM_PATH } from "./paths.js";
import type {
  AddCustomerNoteInput,
  ConnectCrmFoundationInput,
  CreateCustomerProfileInput,
  CrmCockpitSnapshot,
  CrmFoundationState,
  CrmRunReport,
  SearchCustomerRecordsInput,
  UpdateCrmRecordInput,
  UpdateCustomAttributesInput,
  UpdateCustomerTagsInput,
} from "./types.js";
import { CrmController } from "./crm-controller.js";
import { CrmManager } from "./crm-manager.js";

export interface CrmFoundationOptions {
  configuration?: Partial<CrmFoundationConfiguration>;
}

/**
 * CRM Foundation (PILLOW-CRM-001 / R4-02).
 * Centralized Customer Relationship Management platform consuming R4-01.
 */
export class CrmFoundationEngine {
  private initializedAt: string | null = null;
  private readonly controller: CrmController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    identityEngine: CustomerIdentityEngine,
    options: CrmFoundationOptions = {},
  ) {
    const config = buildCrmFoundationConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new CrmManager(identityEngine);
    this.controller = new CrmController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<CrmFoundationState> {
    const doc = await this.reader.readText(CRM_FOUNDATION_SYSTEM_PATH);
    if (!doc?.includes("CRM Foundation")) {
      throw new Error(
        `${CRM_FOUNDATION_SYSTEM_PATH} missing — CRM Foundation requires R4-02 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendCrmLog({
      event: "engine_initialization",
      level: "info",
      details: "R4-02 CRM Foundation initialized",
    });
    return this.getState();
  }

  getState(): CrmFoundationState {
    if (!this.initializedAt) {
      throw new Error("CRM Foundation not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const record = this.controller.getManager().getEngineRecord();
    const crmRecords = this.controller.getManager().getCrmRecords();
    const profileManager = this.controller.getManager().getProfileManager();

    const health = this.controller.getHealthMonitor().buildReport({
      config,
      record,
      totalCrmRecords: crmRecords.length,
      activeCustomers: profileManager.countActive(this.controller.getManager().getRegistry()),
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-CRM-001",
      missionId: "R4-02",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      engineRecord: record,
      health,
      performance,
    };
  }

  connectCrmFoundation(input: ConnectCrmFoundationInput = {}): CrmRunReport {
    return this.controller.connectCrmFoundation(input);
  }

  createCustomerProfile(input: CreateCustomerProfileInput): CrmRunReport {
    return this.controller.createCustomerProfile(input);
  }

  updateCrmRecord(input: UpdateCrmRecordInput): CrmRunReport {
    return this.controller.updateCrmRecord(input);
  }

  searchCustomerRecords(input: SearchCustomerRecordsInput): CrmRunReport {
    return this.controller.searchCustomerRecords(input);
  }

  addCustomerNote(input: AddCustomerNoteInput): CrmRunReport {
    return this.controller.addCustomerNote(input);
  }

  updateCustomerTags(input: UpdateCustomerTagsInput): CrmRunReport {
    return this.controller.updateCustomerTags(input);
  }

  updateCustomAttributes(input: UpdateCustomAttributesInput): CrmRunReport {
    return this.controller.updateCustomAttributes(input);
  }

  getLatestReport(): CrmRunReport | null {
    return this.controller.getLatestReport();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getCrmRecords() {
    return this.controller.getManager().getCrmRecords();
  }

  getMachineReadableRecord(crmRecordId: string): Record<string, unknown> | null {
    const record = this.controller.getManager().getRegistry().get(crmRecordId);
    if (!record) return null;
    return this.controller.getManager().getProfileManager().toMachineReadable(record);
  }

  updateConfiguration(
    overrides: Partial<CrmFoundationConfiguration>,
  ): CrmFoundationState {
    const next = buildCrmFoundationConfiguration(this.bootstrap.repositoryRoot, {
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
      ? report.validation.decision === "pass"
        ? 100
        : report.validation.decision === "partial"
          ? 70
          : 40
      : state.health.healthScore;

    return {
      valid: state.health.status !== "failed",
      health: score >= 75 ? "healthy" : score >= 50 ? "degraded" : "blocked",
      readinessScore: score,
      notes: [
        `CRM status: ${state.status}`,
        `Active customers: ${state.health.activeCustomers}`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No CRM operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): CrmCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;
    const record = state.engineRecord;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      operationalState: record?.currentOperationalState ?? null,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      totalCrmRecords: state.health.totalCrmRecords,
      activeCustomers: state.health.activeCustomers,
      identityEngineConnected: record?.identityEngineConnected ?? false,
      recentLogs: getCrmLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createCrmFoundationEngine(
  bootstrap: EmpireBootstrapContext,
  identityEngine: CustomerIdentityEngine,
  options?: CrmFoundationOptions,
): CrmFoundationEngine {
  return new CrmFoundationEngine(bootstrap, identityEngine, options);
}

export function resetCrmFoundationForTesting(): void {
  resetCrmLogsForTesting();
  new CrmManager(null).resetForTesting();
}
