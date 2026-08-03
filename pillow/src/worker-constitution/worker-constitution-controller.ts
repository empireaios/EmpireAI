import type { WorkerConstitutionConfiguration } from "./configuration.js";
import { WorkerConstitutionCore } from "./worker-constitution-core.js";
import type {
  EngineStatus,
  WorkerConstitutionInput,
  WorkerConstitutionRunReport,
} from "./types.js";

export class WorkerConstitutionController {
  private status: EngineStatus = "idle";
  private latestReport: WorkerConstitutionRunReport | null = null;

  constructor(
    private readonly manager: WorkerConstitutionCore,
    private readonly config: WorkerConstitutionConfiguration,
  ) {}

  initialize() {
    this.manager.ensureSeeded(this.config);
    this.status = "active";
  }

  getStatus() {
    return this.status;
  }

  getManager() {
    return this.manager;
  }

  getConfiguration() {
    return {
      ...this.config,
      constitutionalRules: [...this.config.constitutionalRules],
      lifecycleStages: [...this.config.lifecycleStages],
      workerResponsibilities: [...this.config.workerResponsibilities],
      workerAuthority: [...this.config.workerAuthority],
      workerRestrictions: [...this.config.workerRestrictions],
      workerObligations: [...this.config.workerObligations],
      communicationStandards: [...this.config.communicationStandards],
      reportingStandards: [...this.config.reportingStandards],
      qualityStandards: [...this.config.qualityStandards],
      governanceStandards: [...this.config.governanceStandards],
      escalationStandards: [...this.config.escalationStandards],
      auditStandards: [...this.config.auditStandards],
      traceabilityStandards: [...this.config.traceabilityStandards],
      seedInheritanceRecords: this.config.seedInheritanceRecords.map((r) => ({
        ...r,
        rulesApplied: [...r.rulesApplied],
        rulesSatisfied: [...r.rulesSatisfied],
        rulesFailed: [...r.rulesFailed],
      })),
    };
  }

  getLatestReport() {
    return this.latestReport;
  }

  connect(input: Record<string, unknown> = {}) {
    this.status = "connecting";
    return this.finish(this.manager.connect(input, this.config));
  }

  defineConstitution(input: WorkerConstitutionInput = {}) {
    this.status = "defining";
    return this.finish(this.manager.defineConstitution(input, this.config));
  }

  inheritWorker(input: WorkerConstitutionInput = {}) {
    this.status = "validating";
    return this.finish(this.manager.inheritWorker(input, this.config));
  }

  validateCompliance(input: WorkerConstitutionInput = {}) {
    this.status = "validating";
    return this.finish(this.manager.validateCompliance(input, this.config));
  }

  produceConstitution(input: WorkerConstitutionInput = {}) {
    this.status = "defining";
    return this.finish(this.manager.produceConstitution(input, this.config));
  }

  list() {
    this.status = "active";
    return this.finish(this.manager.list(this.config));
  }

  validate(input: WorkerConstitutionInput = {}) {
    this.status = "active";
    return this.finish(this.manager.validate(input, this.config));
  }

  diagnostics() {
    return this.finish(this.manager.diagnostics(this.config));
  }

  private finish(report: WorkerConstitutionRunReport) {
    this.latestReport = report;
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }
}
