import type { OrganizationCharterConfiguration } from "./configuration.js";
import { OrganizationCharterCore } from "./organization-charter-core.js";
import type {
  EngineStatus,
  OrganizationCharterInput,
  OrganizationCharterRunReport,
} from "./types.js";

export class OrganizationCharterController {
  private status: EngineStatus = "idle";
  private latestReport: OrganizationCharterRunReport | null = null;

  constructor(
    private readonly manager: OrganizationCharterCore,
    private readonly config: OrganizationCharterConfiguration,
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
      organizationalRules: [...this.config.organizationalRules],
      authorityLevels: [...this.config.authorityLevels],
      collaborationRules: [...this.config.collaborationRules],
      governanceRules: [...this.config.governanceRules],
      seedFactories: this.config.seedFactories.map((f) => ({
        ...f,
        responsibilities: [...f.responsibilities],
        reportsTo: "pillow" as const,
      })),
      seedDepartments: this.config.seedDepartments.map((d) => ({
        ...d,
        responsibilities: [...d.responsibilities],
      })),
      seedWorkers: this.config.seedWorkers.map((w) => ({ ...w })),
      seedStructureRecords: this.config.seedStructureRecords.map((r) => ({
        ...r,
        factoriesRegistered: [...r.factoriesRegistered],
        departmentsRegistered: [...r.departmentsRegistered],
        workersRegistered: [...r.workersRegistered],
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

  defineCharter(input: OrganizationCharterInput = {}) {
    this.status = "defining";
    return this.finish(this.manager.defineCharter(input, this.config));
  }

  registerFactory(input: OrganizationCharterInput = {}) {
    this.status = "registering";
    return this.finish(this.manager.registerFactory(input, this.config));
  }

  registerDepartment(input: OrganizationCharterInput = {}) {
    this.status = "registering";
    return this.finish(this.manager.registerDepartment(input, this.config));
  }

  registerWorker(input: OrganizationCharterInput = {}) {
    this.status = "registering";
    return this.finish(this.manager.registerWorker(input, this.config));
  }

  validateReporting(input: OrganizationCharterInput = {}) {
    this.status = "validating";
    return this.finish(this.manager.validateReporting(input, this.config));
  }

  validateEscalation(input: OrganizationCharterInput = {}) {
    this.status = "validating";
    return this.finish(this.manager.validateEscalation(input, this.config));
  }

  produceStructure(input: OrganizationCharterInput = {}) {
    this.status = "defining";
    return this.finish(this.manager.produceStructure(input, this.config));
  }

  list() {
    this.status = "active";
    return this.finish(this.manager.list(this.config));
  }

  validate(input: OrganizationCharterInput = {}) {
    this.status = "active";
    return this.finish(this.manager.validate(input, this.config));
  }

  diagnostics() {
    return this.finish(this.manager.diagnostics(this.config));
  }

  private finish(report: OrganizationCharterRunReport) {
    this.latestReport = report;
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }
}
