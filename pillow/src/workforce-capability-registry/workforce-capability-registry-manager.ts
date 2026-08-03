import type { WorkforceCapabilityRegistryConfiguration } from "./configuration.js";
import { appendWcrLog } from "./wcr-logging.js";
import { CapabilityLookup } from "./capability-lookup.js";
import { RegistryStore } from "./registry-store.js";
import {
  HealthMonitor,
  RecoveryManager,
  RegistryMetadataGenerator,
  RegistryValidator,
} from "./registry-validator.js";
import {
  WCR_CAPABILITIES,
  WCR_METADATA_VERSION,
  WORKFORCE_CAPABILITY_REGISTRY_ID,
} from "./paths.js";
import type {
  LookupInput,
  OperationalState,
  RegisterCatalogInput,
  RegisterWorkerInput,
  RegistryRecord,
  UpdateWorkerStatusInput,
  WorkforceCapabilityRegistryEngineRecord,
  WorkforceCapabilityRegistryInput,
  WorkforceCapabilityRegistryRunReport,
} from "./types.js";

export class WorkforceCapabilityRegistryManager {
  private engineRecord: WorkforceCapabilityRegistryEngineRecord | null = null;
  private seeded = false;
  private readonly store = new RegistryStore();
  private readonly lookupEngine = new CapabilityLookup(this.store);
  private readonly validator = new RegistryValidator();
  private readonly metadata = new RegistryMetadataGenerator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recovery = new RecoveryManager();

  ensureSeeded(config: WorkforceCapabilityRegistryConfiguration) {
    if (this.seeded) return;
    this.store.seed({
      workers: config.seedWorkers,
      departments: config.seedDepartments,
      capabilities: config.seedCapabilities,
      tools: config.seedTools,
      skills: config.seedSkills,
    });
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
    return this.store.listWorkers();
  }

  getLatestRecord() {
    const records = this.getRecords();
    return records[records.length - 1] ?? null;
  }

  connect(
    _input: Record<string, unknown>,
    config: WorkforceCapabilityRegistryConfiguration,
  ): WorkforceCapabilityRegistryRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    this.ensureRecord("connected", config);
    appendWcrLog({ event: "connect", details: "Workforce Capability Registry connected; registry-only mode" });
    return this.report("connect", this.getRecords(), {
      validationReportId: `wcr-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: config.enabled ? "pass" : "fail",
      errors: config.enabled ? [] : ["Workforce Capability Registry is disabled"],
      warnings: [],
      durationMs: Date.now() - started,
      metadataVersion: WCR_METADATA_VERSION,
    }, started);
  }

  registerWorker(input: RegisterWorkerInput, config: WorkforceCapabilityRegistryConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.ensureRecord("active", config);
    const decision = this.validator.decideWorker(input);
    if (decision === "fail" || !config.enabled || !config.registrationRulesEnabled) {
      if (decision === "fail") this.recovery.recordFailure();
      const validation = this.validator.finalize(
        decision,
        this.collectWorkerErrors(input),
        [],
        started,
      );
      return this.report("register_worker", [], validation, started);
    }
    const status = decision === "partial" ? "partial" : "passed";
    const record = this.store.registerWorker(input, status);
    this.ensureRecord("active", config);
    const validation = this.validator.validateRecords([record], input, started);
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    appendWcrLog({ event: "register_worker", details: `workerId=${record.workerId}; capabilities=${record.capabilityList.length}` });
    this.metadata.generate(this.counts());
    return this.report("register_worker", [record], validation, started);
  }

  registerDepartment(input: RegisterCatalogInput, config: WorkforceCapabilityRegistryConfiguration) {
    return this.registerCatalog("register_department", input, config, () => this.store.registerDepartment(input));
  }

  registerCapability(input: RegisterCatalogInput, config: WorkforceCapabilityRegistryConfiguration) {
    return this.registerCatalog("register_capability", input, config, () => this.store.registerCapability(input));
  }

  registerTool(input: RegisterCatalogInput, config: WorkforceCapabilityRegistryConfiguration) {
    return this.registerCatalog("register_tool", input, config, () => this.store.registerTool(input));
  }

  registerSkill(input: RegisterCatalogInput, config: WorkforceCapabilityRegistryConfiguration) {
    return this.registerCatalog("register_skill", input, config, () => this.store.registerSkill(input));
  }

  updateStatus(input: UpdateWorkerStatusInput, config: WorkforceCapabilityRegistryConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.ensureRecord("active", config);
    const decision = this.validator.decideStatus(input);
    if (decision === "fail" || !config.enabled) {
      if (decision === "fail") this.recovery.recordFailure();
      return this.report(
        "update_status",
        [],
        this.validator.finalize(decision, this.collectStatusErrors(input), [], started),
        started,
      );
    }
    const record = this.store.updateStatus(input, "passed");
    if (!record) {
      this.recovery.recordFailure();
      return this.report(
        "update_status",
        [],
        this.validator.finalize("fail", ["Worker not found for status update"], [], started),
        started,
      );
    }
    this.ensureRecord("active", config);
    const validation = this.validator.validateRecords([record], input, started);
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    appendWcrLog({ event: "track_worker_status", details: `workerId=${record.workerId}; status=${record.currentStatus}` });
    return this.report("update_status", [record], validation, started);
  }

  lookup(input: LookupInput, config: WorkforceCapabilityRegistryConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.ensureRecord("active", config);
    const decision = this.validator.decideLookup(input);
    if (decision === "fail" || !config.enabled || !config.lookupRulesEnabled) {
      if (decision === "fail") this.recovery.recordFailure();
      return this.report(
        "lookup",
        [],
        this.validator.finalize(
          decision,
          [
            ...(input.query?.trim() ? [] : ["Lookup query is required"]),
            ...(input.validated === false ? ["Lookup requires validated=true"] : []),
            ...this.boundaryErrors(input),
          ],
          [],
          started,
        ),
        started,
      );
    }
    const records = this.lookupEngine.lookup(input);
    const validation = this.validator.validateRecords(records, input, started);
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    appendWcrLog({
      event: "capability_lookup",
      details: `dimension=${input.dimension}; query=${input.query}; matches=${records.length}`,
    });
    return this.report("lookup", records, validation, started);
  }

  listRecords(config: WorkforceCapabilityRegistryConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.ensureRecord("active", config);
    const records = this.getRecords();
    const validation = this.validator.validateRecords(records, { validated: true }, started);
    return this.report("list_records", records, validation, started);
  }

  validateRegistry(input: WorkforceCapabilityRegistryInput, config: WorkforceCapabilityRegistryConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.ensureRecord("active", config);
    const validation = this.validator.validateRecords(this.getRecords(), { ...input, validated: input.validated ?? true }, started);
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    return this.report("validate_registry", this.getRecords(), validation, started);
  }

  diagnostics(config: WorkforceCapabilityRegistryConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.ensureRecord("active", config);
    const validation = this.validator.validateRecords(this.getRecords(), { validated: true }, started);
    appendWcrLog({
      event: "health_information",
      details: `workers=${this.counts().workers}; health=${this.healthMonitor.status(validation.decision, config.enabled)}`,
    });
    return this.report("diagnostics", this.getRecords().slice(0, 20), validation, started);
  }

  private registerCatalog(
    action: WorkforceCapabilityRegistryRunReport["action"],
    input: RegisterCatalogInput,
    config: WorkforceCapabilityRegistryConfiguration,
    register: () => unknown,
  ) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.ensureRecord("active", config);
    const decision = this.validator.decideCatalog(input);
    if (decision === "fail" || !config.enabled || !config.registrationRulesEnabled) {
      if (decision === "fail") this.recovery.recordFailure();
      return this.report(
        action,
        [],
        this.validator.finalize(
          decision,
          [
            ...(!input.id?.trim() ? ["Catalog id is required"] : []),
            ...(!input.name?.trim() ? ["Catalog name is required"] : []),
            ...this.boundaryErrors(input),
            ...(input.validated === false ? ["Registration requires validated=true"] : []),
          ],
          [],
          started,
        ),
        started,
      );
    }
    register();
    this.ensureRecord("active", config);
    this.recovery.reset();
    appendWcrLog({ event: action, details: `id=${input.id}; name=${input.name}` });
    this.metadata.generate(this.counts());
    return this.report(
      action,
      this.getRecords(),
      this.validator.finalize("pass", [], [], started),
      started,
    );
  }

  private collectWorkerErrors(input: RegisterWorkerInput): string[] {
    const errors = this.boundaryErrors(input);
    if (!input.workerId?.trim()) errors.push("Worker ID is required");
    if (!input.workerName?.trim()) errors.push("Worker name is required");
    if (!input.department?.trim()) errors.push("Department is required");
    if (input.validated === false) errors.push("Worker registration requires validated=true");
    return errors;
  }

  private collectStatusErrors(input: UpdateWorkerStatusInput): string[] {
    const errors = this.boundaryErrors(input);
    if (!input.workerId?.trim()) errors.push("Worker ID is required");
    if (input.validated === false) errors.push("Status update requires validated=true");
    return errors;
  }

  private boundaryErrors(input: {
    executeWork?: boolean;
    assignWorkers?: boolean;
    orchestrateWorkers?: boolean;
    approveActions?: boolean;
    replacePillow?: boolean;
  }): string[] {
    const errors: string[] = [];
    if (input.executeWork === true) errors.push("Workforce Capability Registry must never execute work");
    if (input.assignWorkers === true) errors.push("Workforce Capability Registry must never assign workers");
    if (input.orchestrateWorkers === true) {
      errors.push("Workforce Capability Registry must never orchestrate workers");
    }
    if (input.approveActions === true) errors.push("Workforce Capability Registry must never approve actions");
    if (input.replacePillow === true) errors.push("Workforce Capability Registry must never replace Pillow");
    return errors;
  }

  private counts() {
    return {
      workers: this.store.listWorkers().length,
      departments: this.store.listDepartments().length,
      capabilities: this.store.listCapabilities().length,
      tools: this.store.listTools().length,
      skills: this.store.listSkills().length,
    };
  }

  private ensureRecord(state: OperationalState, config: WorkforceCapabilityRegistryConfiguration) {
    const counts = this.counts();
    const latest = this.getLatestRecord()?.validationStatus ?? "pending";
    const mapped =
      latest === "passed" ? "passed" : latest === "partial" ? "partial" : latest === "failed" ? "failed" : "pending";
    this.engineRecord = {
      engineRecordId: this.engineRecord?.engineRecordId ?? `wcr-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: WORKFORCE_CAPABILITY_REGISTRY_ID,
      engineVersion: "PILLOW-WCR-001",
      currentOperationalState: state,
      healthStatus: this.healthMonitor.status(
        mapped === "passed" ? "pass" : mapped === "partial" ? "partial" : mapped === "failed" ? "fail" : null,
        config.enabled,
      ),
      validationStatus: mapped,
      supportedCapabilities: [...WCR_CAPABILITIES],
      totalWorkers: counts.workers,
      totalDepartments: counts.departments,
      totalCapabilities: counts.capabilities,
      totalTools: counts.tools,
      totalSkills: counts.skills,
      metadataVersion: WCR_METADATA_VERSION,
    };
  }

  private report(
    action: WorkforceCapabilityRegistryRunReport["action"],
    records: RegistryRecord[],
    validation: WorkforceCapabilityRegistryRunReport["validation"],
    started: number,
  ): WorkforceCapabilityRegistryRunReport {
    return {
      registryRunReportId: `wcr-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action,
      engineRecord: this.getEngineRecord()!,
      records: records.map((r) => ({
        ...r,
        capabilityList: [...r.capabilityList],
        skillList: [...r.skillList],
        approvedTools: [...r.approvedTools],
        dependencies: [...r.dependencies],
        operatingLimits: {
          ...r.operatingLimits,
          requiredApprovals: [...r.operatingLimits.requiredApprovals],
          allowedTools: [...r.operatingLimits.allowedTools],
          securityRestrictions: [...r.operatingLimits.securityRestrictions],
        },
      })),
      departments: this.store.listDepartments(),
      capabilities: this.store.listCapabilities(),
      tools: this.store.listTools(),
      skills: this.store.listSkills(),
      validation,
      durationMs: Date.now() - started,
      metadataVersion: WCR_METADATA_VERSION,
    };
  }
}
