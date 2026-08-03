import type { WorkforceOrchestratorConfiguration } from "./configuration.js";
import { appendPwoLog } from "./pwo-logging.js";
import { WorkerDiscovery } from "./worker-discovery.js";
import { WorkerSelector } from "./worker-selector.js";
import { WorkforceCoordinator } from "./workforce-coordinator.js";
import {
  HealthMonitor,
  OrchestrationMetadataGenerator,
  OrchestrationValidator,
  RecoveryManager,
} from "./orchestration-validator.js";
import {
  PWO_CAPABILITIES,
  PWO_METADATA_VERSION,
  WORKFORCE_ORCHESTRATOR_ID,
} from "./paths.js";
import type {
  OperationalState,
  OrchestrationRecord,
  WorkerDescriptor,
  WorkforceOrchestratorEngineRecord,
  WorkforceOrchestratorInput,
  WorkforceOrchestratorRunReport,
} from "./types.js";

export class WorkforceOrchestratorManager {
  private engineRecord: WorkforceOrchestratorEngineRecord | null = null;
  private records: OrchestrationRecord[] = [];
  private latestDiscovered: WorkerDescriptor[] = [];
  private readonly discovery = new WorkerDiscovery();
  private readonly selector = new WorkerSelector();
  private readonly coordinator = new WorkforceCoordinator();
  private readonly validator = new OrchestrationValidator();
  private readonly metadata = new OrchestrationMetadataGenerator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recovery = new RecoveryManager();

  getEngineRecord() {
    return this.engineRecord
      ? {
          ...this.engineRecord,
          supportedCapabilities: [...this.engineRecord.supportedCapabilities],
        }
      : null;
  }

  getRecords() {
    return this.records.map((r) => this.clone(r));
  }

  getLatestRecord() {
    const records = this.getRecords();
    return records[records.length - 1] ?? null;
  }

  getDiscoveredWorkers() {
    return this.latestDiscovered.map((w) => ({ ...w, capabilities: [...w.capabilities] }));
  }

  connect(
    _input: Record<string, unknown>,
    config: WorkforceOrchestratorConfiguration,
  ): WorkforceOrchestratorRunReport {
    const started = Date.now();
    this.ensureRecord("connected", config);
    appendPwoLog({ event: "connect", details: "Workforce Orchestrator connected; coordinate-only mode" });
    return this.report("connect", [], [], {
      validationReportId: `pwo-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: config.enabled ? "pass" : "fail",
      errors: config.enabled ? [] : ["Workforce Orchestrator is disabled"],
      warnings: [],
      durationMs: Date.now() - started,
      metadataVersion: PWO_METADATA_VERSION,
    }, started);
  }

  receiveIntent(input: WorkforceOrchestratorInput, config: WorkforceOrchestratorConfiguration) {
    return this.produce("receive_intent", input, config);
  }

  discoverWorkers(input: WorkforceOrchestratorInput, config: WorkforceOrchestratorConfiguration) {
    return this.produce("discover_workers", input, config);
  }

  selectWorkers(input: WorkforceOrchestratorInput, config: WorkforceOrchestratorConfiguration) {
    return this.produce("select_workers", input, config);
  }

  buildGroups(input: WorkforceOrchestratorInput, config: WorkforceOrchestratorConfiguration) {
    return this.produce("build_groups", input, config);
  }

  coordinate(input: WorkforceOrchestratorInput, config: WorkforceOrchestratorConfiguration) {
    return this.produce("coordinate", input, config);
  }

  monitor(input: WorkforceOrchestratorInput, config: WorkforceOrchestratorConfiguration) {
    return this.produce("monitor", input, config);
  }

  handleFailure(input: WorkforceOrchestratorInput, config: WorkforceOrchestratorConfiguration) {
    return this.produce("handle_failure", {
      ...input,
      failureHints: input.failureHints?.length
        ? input.failureHints
        : ["Worker failure injected for orchestration handling"],
    }, config);
  }

  handleTimeout(input: WorkforceOrchestratorInput, config: WorkforceOrchestratorConfiguration) {
    return this.produce("handle_timeout", {
      ...input,
      timeoutMsHint: input.timeoutMsHint ?? 0,
      failureHints: [...(input.failureHints ?? []), "urgent timeout"],
    }, config);
  }

  handleEscalation(input: WorkforceOrchestratorInput, config: WorkforceOrchestratorConfiguration) {
    return this.produce("handle_escalation", {
      ...input,
      escalationHints: input.escalationHints?.length
        ? input.escalationHints
        : ["Escalation required for blocked workforce path"],
      coordinationMode: input.coordinationMode ?? "escalation",
    }, config);
  }

  produceRecord(input: WorkforceOrchestratorInput, config: WorkforceOrchestratorConfiguration) {
    return this.produce("produce_record", input, config);
  }

  validateOrchestrations(input: WorkforceOrchestratorInput, config: WorkforceOrchestratorConfiguration) {
    const started = Date.now();
    this.ensureRecord("active", config);
    const validation = this.validator.validateRecords(
      this.records,
      input.executiveRequest
        ? input
        : {
            ...input,
            executiveRequest: this.records[this.records.length - 1]?.executiveRequest ?? "",
            validated: true,
          },
      started,
    );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    appendPwoLog({ event: "validate_orchestrations", details: `decision=${validation.decision}` });
    return this.report("validate_orchestrations", this.getRecords().slice(-5), this.getDiscoveredWorkers(), validation, started);
  }

  diagnostics(config: WorkforceOrchestratorConfiguration) {
    const started = Date.now();
    this.ensureRecord("active", config);
    const validation = this.records.length
      ? this.validator.validateRecords(
          this.records,
          { executiveRequest: this.records[this.records.length - 1]!.executiveRequest, validated: true },
          started,
        )
      : {
          validationReportId: `pwo-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: config.enabled ? ("pass" as const) : ("fail" as const),
          errors: config.enabled ? [] : ["Workforce Orchestrator is disabled"],
          warnings: [] as string[],
          durationMs: Date.now() - started,
          metadataVersion: PWO_METADATA_VERSION,
        };
    appendPwoLog({
      event: "health_information",
      details: `orchestrations=${this.records.length}; activeWorkers=${this.activeWorkerCount()}; health=${this.healthMonitor.status(validation.decision, config.enabled)}`,
    });
    return this.report("diagnostics", this.getRecords().slice(-20), this.getDiscoveredWorkers(), validation, started);
  }

  private produce(
    action: WorkforceOrchestratorRunReport["action"],
    input: WorkforceOrchestratorInput,
    config: WorkforceOrchestratorConfiguration,
  ): WorkforceOrchestratorRunReport {
    const started = Date.now();
    this.ensureRecord("active", config);
    appendPwoLog({
      event: "receive_executive_intent",
      details: `action=${action}; requestLength=${input.executiveRequest?.length ?? 0}`,
    });

    const decision = this.validator.decide(input);
    if (
      decision === "fail" ||
      !config.enabled ||
      !config.discoveryRulesEnabled ||
      !config.selectionRulesEnabled ||
      !config.coordinationRulesEnabled
    ) {
      if (decision === "fail") this.recovery.recordFailure();
      const validation = this.validator.validateRecords(null, input, started);
      appendPwoLog({
        event: "validation_failure",
        details: `action=${action}; errors=${validation.errors.join("|")}`,
      });
      return this.report(action, [], [], validation, started);
    }

    const discovered = this.discovery.discover(input, config);
    this.latestDiscovered = discovered;
    appendPwoLog({
      event: "discover_available_workers",
      details: `count=${discovered.length}`,
    });

    const selected = this.selector.select(discovered, input, config);
    appendPwoLog({
      event: "select_suitable_workers",
      details: `selected=${selected.map((w) => w.workerId).join(",")}`,
    });

    const status = decision === "partial" ? "partial" : "passed";
    const record = this.coordinator.coordinate(input, discovered, selected, config, status);
    this.records.push(record);
    this.ensureRecord("active", config);

    const validation = this.validator.validateRecords([record], input, started);
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();

    appendPwoLog({
      event: "produce_orchestration_record",
      details: `orchestrationId=${record.orchestrationId}; completion=${record.completionStatus}; workers=${record.workersSelected.length}; tasksPerformed=false`,
    });
    this.metadata.generate(this.records.length, this.activeWorkerCount());
    return this.report(action, [record], discovered, validation, started);
  }

  private activeWorkerCount() {
    const latest = this.records[this.records.length - 1];
    if (!latest) return 0;
    return latest.workerStatus.filter((w) =>
      w.state === "busy" || w.state === "waiting" || w.state === "blocked" || w.state === "escalated",
    ).length;
  }

  private ensureRecord(state: OperationalState, config: WorkforceOrchestratorConfiguration) {
    const latest = this.records[this.records.length - 1]?.validationStatus ?? "pending";
    const mapped =
      latest === "passed" ? "passed" : latest === "partial" ? "partial" : latest === "failed" ? "failed" : "pending";
    this.engineRecord = {
      engineRecordId: this.engineRecord?.engineRecordId ?? `pwo-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: WORKFORCE_ORCHESTRATOR_ID,
      engineVersion: "PILLOW-PWO-001",
      currentOperationalState: state,
      healthStatus: this.healthMonitor.status(
        mapped === "passed" ? "pass" : mapped === "partial" ? "partial" : mapped === "failed" ? "fail" : null,
        config.enabled,
      ),
      validationStatus: mapped,
      supportedCapabilities: [...PWO_CAPABILITIES],
      totalOrchestrations: this.records.length,
      activeWorkers: this.activeWorkerCount(),
      metadataVersion: PWO_METADATA_VERSION,
    };
  }

  private report(
    action: WorkforceOrchestratorRunReport["action"],
    records: OrchestrationRecord[],
    discovered: WorkerDescriptor[],
    validation: WorkforceOrchestratorRunReport["validation"],
    started: number,
  ): WorkforceOrchestratorRunReport {
    return {
      orchestrationRunReportId: `pwo-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action,
      engineRecord: this.getEngineRecord()!,
      records: records.map((r) => this.clone(r)),
      discoveredWorkers: discovered.map((w) => ({ ...w, capabilities: [...w.capabilities] })),
      validation,
      durationMs: Date.now() - started,
      metadataVersion: PWO_METADATA_VERSION,
    };
  }

  private clone(record: OrchestrationRecord): OrchestrationRecord {
    return {
      ...record,
      workersSelected: record.workersSelected.map((w) => ({ ...w, capabilities: [...w.capabilities] })),
      executionSequence: record.executionSequence.map((s) => ({
        ...s,
        workerIds: [...s.workerIds],
        dependsOn: [...s.dependsOn],
      })),
      workerStatus: record.workerStatus.map((w) => ({ ...w })),
      escalations: record.escalations.map((e) => ({ ...e })),
    };
  }
}
