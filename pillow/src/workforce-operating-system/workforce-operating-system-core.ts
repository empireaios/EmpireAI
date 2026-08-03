import type { WorkforceOperatingSystemConfiguration } from "./configuration.js";
import { appendWfosLog } from "./wfos-logging.js";
import {
  resetRegistrySequencesForTesting,
  WorkforceOsRegistry,
} from "./workforce-os-registry.js";
import {
  nextRuntimeEvent,
  WorkforceOsStore,
} from "./workforce-os-store.js";
import {
  HealthMonitor,
  RecoveryManager,
  WorkforceOperatingSystemMetadataGenerator,
  WorkforceOsValidator,
} from "./workforce-os-validator.js";
import {
  WORKFORCE_OPERATING_SYSTEM_ID,
  WFOS_CAPABILITIES,
  WFOS_METADATA_VERSION,
  WORKER_LIFECYCLE_STATES,
} from "./paths.js";
import type {
  OperationalState,
  WorkerLifecycleState,
  WorkforceOperatingSystemEngineRecord,
  WorkforceOperatingSystemInput,
  WorkforceOperatingSystemRunReport,
  WorkforceOsRecord,
  WorkforceOsService,
} from "./types.js";

export class WorkforceOperatingSystemCore {
  private engineRecord: WorkforceOperatingSystemEngineRecord | null = null;
  private seeded = false;
  private readonly store = new WorkforceOsStore();
  private readonly registry = new WorkforceOsRegistry();
  private readonly validator = new WorkforceOsValidator();
  private readonly metadata = new WorkforceOperatingSystemMetadataGenerator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recovery = new RecoveryManager();

  ensureSeeded(config: WorkforceOperatingSystemConfiguration) {
    if (this.seeded) return;
    this.store.seed(config.seedRecords);
    this.registry.seed(config);
    this.seeded = true;
    this.ensureRecord("connected", config);
  }

  getEngineRecord() {
    return this.engineRecord
      ? {
          ...this.engineRecord,
          supportedCapabilities: [...this.engineRecord.supportedCapabilities],
        }
      : null;
  }

  getRecords() {
    return this.store.list();
  }

  getLatestRecord() {
    const records = this.getRecords();
    return records[records.length - 1] ?? null;
  }

  connect(
    _input: Record<string, unknown>,
    config: WorkforceOperatingSystemConfiguration,
  ): WorkforceOperatingSystemRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    this.ensureRecord("connected", config);
    appendWfosLog({
      event: "connect",
      details: "Workforce Operating System connected; runtime-only mode",
    });
    return this.report(
      "connect",
      [],
      {
        validationReportId: `wfos-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: config.enabled ? "pass" : "fail",
        errors: config.enabled ? [] : ["Workforce Operating System is disabled"],
        warnings: [],
        durationMs: Date.now() - started,
        metadataVersion: WFOS_METADATA_VERSION,
      },
      started,
    );
  }

  startRuntime(input: WorkforceOperatingSystemInput, config: WorkforceOperatingSystemConfiguration) {
    return this.run(
      "start_runtime",
      input,
      config,
      ["runtime_monitoring"],
      () => {
        if (!config.enabled) throw new Error("Workforce Operating System is disabled");
        this.registry.start();
        return [nextRuntimeEvent("runtime_started", "Workforce OS runtime started under Pillow")];
      },
    );
  }

  registerDepartment(
    input: WorkforceOperatingSystemInput,
    config: WorkforceOperatingSystemConfiguration,
  ) {
    return this.run(
      "register_department",
      input,
      config,
      ["department_registration"],
      () => {
        if (!config.registrationRulesEnabled) throw new Error("Registration rules are disabled");
        const departmentId =
          input.departmentId?.trim() || `dept-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const name = input.departmentName?.trim() || departmentId;
        this.registry.registerDepartment({
          departmentId,
          name,
          status: "active",
        });
        return [
          nextRuntimeEvent("department_registered", `Registered department ${departmentId}`),
        ];
      },
      true,
    );
  }

  registerFactory(
    input: WorkforceOperatingSystemInput,
    config: WorkforceOperatingSystemConfiguration,
  ) {
    return this.run(
      "register_factory",
      input,
      config,
      ["factory_registration"],
      () => {
        if (!config.registrationRulesEnabled) throw new Error("Registration rules are disabled");
        const factoryId =
          input.factoryId?.trim() || `fac-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const departmentId = input.departmentId?.trim() || "dept-unspecified";
        this.registry.registerFactory({
          factoryId,
          name: input.factoryName?.trim() || factoryId,
          departmentId,
          status: "active",
        });
        return [nextRuntimeEvent("factory_registered", `Registered factory ${factoryId}`)];
      },
      true,
    );
  }

  registerWorker(
    input: WorkforceOperatingSystemInput,
    config: WorkforceOperatingSystemConfiguration,
  ) {
    return this.run(
      "register_worker",
      input,
      config,
      ["worker_registration"],
      () => {
        if (!config.registrationRulesEnabled) throw new Error("Registration rules are disabled");
        const workerId =
          input.workerId?.trim() || `wkr-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const lifecycle = normalizeLifecycle(input.lifecycle) ?? "registered";
        this.registry.registerWorker({
          workerId,
          departmentId: input.departmentId?.trim() || "dept-unspecified",
          factoryId: input.factoryId?.trim() || "fac-unspecified",
          lifecycle,
        });
        return [nextRuntimeEvent("worker_registered", `Registered worker ${workerId} (${lifecycle})`)];
      },
      true,
    );
  }

  manageSession(
    input: WorkforceOperatingSystemInput,
    config: WorkforceOperatingSystemConfiguration,
  ) {
    return this.run(
      "manage_session",
      input,
      config,
      ["session_management"],
      () => {
        if (!config.sessionRulesEnabled) throw new Error("Session rules are disabled");
        if (input.sessionId?.trim()) {
          const closed = this.registry.closeSession(input.sessionId.trim());
          if (!closed) throw new Error(`Unknown session ${input.sessionId}`);
          return [nextRuntimeEvent("session_closed", `Closed session ${closed.sessionId}`)];
        }
        const workerId = input.workerId?.trim();
        if (!workerId) throw new Error("workerId is required to open a session");
        const opened = this.registry.openSession(workerId, input.sessionId);
        return [nextRuntimeEvent("session_opened", `Opened session ${opened.sessionId}`)];
      },
      true,
    );
  }

  coordinateCommunication(
    input: WorkforceOperatingSystemInput,
    config: WorkforceOperatingSystemConfiguration,
  ) {
    return this.run(
      "coordinate_communication",
      input,
      config,
      ["communication_runtime"],
      () => {
        if (!config.communicationRulesEnabled) throw new Error("Communication rules are disabled");
        const from = input.fromDepartmentId?.trim();
        const to = input.toDepartmentId?.trim();
        if (!from || !to) throw new Error("fromDepartmentId and toDepartmentId are required");
        const message = this.registry.recordCommunication({
          fromDepartmentId: from,
          toDepartmentId: to,
          subject: input.communicationSubject?.trim() || "department_sync",
        });
        return [
          nextRuntimeEvent(
            "department_communication",
            `Coordinated ${message.fromDepartmentId} -> ${message.toDepartmentId}`,
          ),
        ];
      },
      true,
    );
  }

  discoverWorkers(
    input: WorkforceOperatingSystemInput,
    config: WorkforceOperatingSystemConfiguration,
  ) {
    return this.run(
      "discover_workers",
      input,
      config,
      ["worker_registration"],
      () => {
        const discovered = this.registry.discoverWorkers(input.departmentId, input.factoryId);
        return [
          nextRuntimeEvent(
            "worker_discovery",
            `Discovered ${discovered.length} worker(s) via Workforce OS`,
          ),
        ];
      },
    );
  }

  synchronizeState(
    input: WorkforceOperatingSystemInput,
    config: WorkforceOperatingSystemConfiguration,
  ) {
    return this.run(
      "synchronize_state",
      input,
      config,
      ["state_synchronization"],
      () => {
        if (!config.synchronizationRulesEnabled) {
          throw new Error("Synchronization rules are disabled");
        }
        if (!this.registry.isStarted()) this.registry.start();
        const state = this.registry.synchronize();
        return [nextRuntimeEvent("state_synchronized", `Organization state is ${state}`)];
      },
    );
  }

  monitorHealth(
    input: WorkforceOperatingSystemInput,
    config: WorkforceOperatingSystemConfiguration,
  ) {
    return this.run(
      "monitor_health",
      input,
      config,
      ["runtime_monitoring", "organization_health_monitoring"],
      () => {
        if (!config.monitoringRulesEnabled) throw new Error("Monitoring rules are disabled");
        const health = this.registry.computeHealth();
        if (health === "degraded") this.registry.setOrganizationState("degraded");
        return [nextRuntimeEvent("health_monitored", `Runtime health is ${health}`)];
      },
    );
  }

  recoverRuntime(
    input: WorkforceOperatingSystemInput,
    config: WorkforceOperatingSystemConfiguration,
  ) {
    return this.run(
      "recover_runtime",
      input,
      config,
      ["runtime_recovery"],
      () => {
        if (!config.recoveryRulesEnabled) throw new Error("Recovery rules are disabled");
        this.registry.setOrganizationState("recovering");
        this.registry.start();
        this.registry.synchronize();
        this.recovery.reset();
        return [nextRuntimeEvent("runtime_recovered", "Workforce OS recovered to synchronized state")];
      },
    );
  }

  list(config: WorkforceOperatingSystemConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    const records = this.store.list();
    const validation = this.validator.validateRecords(records, { validated: true }, started);
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed");
    return this.report("list", records, validation, started);
  }

  validate(input: WorkforceOperatingSystemInput, config: WorkforceOperatingSystemConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    const records = this.store.list();
    const validation = this.validator.validateRecords(
      records,
      { ...input, validated: input.validated ?? true },
      started,
    );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed");
    return this.report("validate", records, validation, started);
  }

  diagnostics(config: WorkforceOperatingSystemConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    const validation = this.validator.finalize(
      config.enabled ? "pass" : "fail",
      config.enabled ? [] : ["Workforce Operating System is disabled"],
      [],
      started,
    );
    this.ensureRecord("active", config);
    appendWfosLog({
      event: "diagnostics",
      details: `records=${this.store.count()} workers=${this.registry.listWorkers().length}`,
    });
    return this.report("diagnostics", this.store.list(), validation, started);
  }

  private run(
    action: WorkforceOperatingSystemRunReport["action"],
    input: WorkforceOperatingSystemInput,
    config: WorkforceOperatingSystemConfiguration,
    services: Array<WorkforceOsService | string>,
    mutate: () => ReturnType<typeof nextRuntimeEvent>[],
    requireIdentity = false,
  ): WorkforceOperatingSystemRunReport {
    const started = Date.now();
    this.ensureSeeded(config);

    if (!config.enabled) {
      const validation = this.validator.finalize("fail", ["Workforce Operating System is disabled"], [], started);
      this.recovery.recordFailure();
      this.ensureRecord("failed", config, "failed");
      return this.report(action, [], validation, started);
    }

    if (this.hasBoundary(input)) {
      const validation = this.validator.validateRecords(null, input, started);
      this.recovery.recordFailure();
      this.ensureRecord("failed", config, "failed");
      return this.report(action, [], validation, started);
    }

    if (requireIdentity && !hasRegistrationIdentity(input, action)) {
      const validation = this.validator.finalize(
        "fail",
        ["Registration identity fields are required"],
        [],
        started,
      );
      return this.report(action, [], validation, started);
    }

    try {
      const events = mutate();
      const record = this.snapshotRecord(input.runtimeId, services, events, "passed");
      const validation = this.validator.validateRecords(
        [record],
        { ...input, validated: input.validated ?? true },
        started,
      );
      if (validation.decision === "fail") this.recovery.recordFailure();
      else this.recovery.reset();
      this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed");
      appendWfosLog({
        event: action,
        details: `org=${this.registry.getOrganizationState()} health=${this.registry.computeHealth()}`,
      });
      this.metadata.generate(this.store.count(), this.registry.activeWorkerIds().length);
      return this.report(action, [record], validation, started);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const validation = this.validator.finalize("fail", [message], [], started);
      this.recovery.recordFailure();
      this.ensureRecord("failed", config, "failed");
      return this.report(action, [], validation, started);
    }
  }

  private snapshotRecord(
    runtimeId: string | null | undefined,
    services: Array<WorkforceOsService | string>,
    events: ReturnType<typeof nextRuntimeEvent>[],
    validationStatus: "passed" | "partial" | "failed",
  ) {
    return this.store.buildRecord({
      runtimeId,
      organizationState: this.registry.getOrganizationState(),
      activeDepartments: this.registry.activeDepartmentIds(),
      activeFactories: this.registry.activeFactoryIds(),
      activeWorkers: this.registry.activeWorkerIds(),
      activeMissions: this.registry.activeMissionIds(),
      runtimeHealth: this.registry.computeHealth(),
      runtimeEvents: events,
      openSessions: this.registry.listOpenSessions().map((s) => s.sessionId),
      servicesInvoked: services,
      validationStatus,
    });
  }

  private hasBoundary(input: WorkforceOperatingSystemInput) {
    return (
      input.replacePillow === true ||
      input.replaceWorkforceOrchestrator === true ||
      input.executeWorkerTasks === true ||
      input.makeStrategicDecisions === true ||
      input.overrideGrandKing === true
    );
  }

  private ensureRecord(
    state: OperationalState,
    config: WorkforceOperatingSystemConfiguration,
    validationStatus: "pending" | "passed" | "partial" | "failed" = "passed",
  ) {
    this.engineRecord = {
      engineRecordId: this.engineRecord?.engineRecordId ?? `wfos-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: WORKFORCE_OPERATING_SYSTEM_ID,
      engineVersion: "PILLOW-WFOS-001",
      currentOperationalState: state,
      healthStatus: this.healthMonitor.status(
        validationStatus === "failed" ? "fail" : "pass",
        config.enabled,
      ),
      validationStatus,
      supportedCapabilities: [...WFOS_CAPABILITIES],
      totalRuntimeRecords: this.store.count(),
      organizationState: this.registry.getOrganizationState(),
      activeWorkerCount: this.registry.activeWorkerIds().length,
      metadataVersion: WFOS_METADATA_VERSION,
    };
  }

  private report(
    action: WorkforceOperatingSystemRunReport["action"],
    records: WorkforceOsRecord[],
    validation: WorkforceOperatingSystemRunReport["validation"],
    started: number,
  ): WorkforceOperatingSystemRunReport {
    const engineRecord = this.getEngineRecord()!;
    return {
      runtimeRunReportId: `wfos-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action,
      engineRecord,
      records,
      departments: this.registry.listDepartments(),
      factories: this.registry.listFactories(),
      workers: this.registry.listWorkers(),
      missions: this.registry.listMissions(),
      sessions: this.registry.listSessions(),
      communications: this.registry.listCommunications(),
      organizationState: this.registry.getOrganizationState(),
      runtimeHealth: this.registry.computeHealth(),
      validation,
      durationMs: Date.now() - started,
      metadataVersion: WFOS_METADATA_VERSION,
    };
  }
}

export function resetWorkforceOsCoreSequencesForTesting() {
  resetRegistrySequencesForTesting();
}

function normalizeLifecycle(value: string | null | undefined): WorkerLifecycleState | null {
  if (!value) return null;
  const normalized = value.toString().trim().toLowerCase();
  return (WORKER_LIFECYCLE_STATES as readonly string[]).includes(normalized)
    ? (normalized as WorkerLifecycleState)
    : "registered";
}

function hasRegistrationIdentity(
  input: WorkforceOperatingSystemInput,
  action: WorkforceOperatingSystemRunReport["action"],
) {
  if (action === "register_department") {
    return Boolean(input.departmentId?.trim() || input.departmentName?.trim());
  }
  if (action === "register_factory") {
    return Boolean(input.factoryId?.trim() || input.factoryName?.trim());
  }
  if (action === "register_worker") {
    return Boolean(input.workerId?.trim());
  }
  if (action === "manage_session") {
    return Boolean(input.workerId?.trim() || input.sessionId?.trim());
  }
  if (action === "coordinate_communication") {
    return Boolean(input.fromDepartmentId?.trim() && input.toDepartmentId?.trim());
  }
  return true;
}
