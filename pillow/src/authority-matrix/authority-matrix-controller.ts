import type { AuthorityMatrixConfiguration } from "./configuration.js";
import { AuthorityMatrixCore } from "./authority-matrix-core.js";
import type {
  AuthorityMatrixInput,
  AuthorityMatrixRunReport,
  EngineStatus,
} from "./types.js";

export class AuthorityMatrixController {
  private status: EngineStatus = "idle";
  private latestReport: AuthorityMatrixRunReport | null = null;

  constructor(
    private readonly manager: AuthorityMatrixCore,
    private readonly config: AuthorityMatrixConfiguration,
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
      authorityLevels: [...this.config.authorityLevels],
      decisionCategories: [...this.config.decisionCategories],
      authorityRules: [...this.config.authorityRules],
      seedRules: this.config.seedRules.map((r) => ({
        ...r,
        permittedActions: [...r.permittedActions],
        restrictedActions: [...r.restrictedActions],
        whoMayPerform: [...r.whoMayPerform],
        escalationPath: [...r.escalationPath],
        auditRequirements: [...r.auditRequirements],
      })),
      seedBindings: this.config.seedBindings.map((b) => ({
        ...b,
        authorityIds: [...b.authorityIds],
        parentChains: Object.fromEntries(
          Object.entries(b.parentChains).map(([k, v]) => [k, [...v]]),
        ),
        rulesApplied: [...b.rulesApplied],
        rulesSatisfied: [...b.rulesSatisfied],
        rulesFailed: [...b.rulesFailed],
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

  defineMatrix(input: AuthorityMatrixInput = {}) {
    this.status = "defining";
    return this.finish(this.manager.defineMatrix(input, this.config));
  }

  registerRule(input: AuthorityMatrixInput = {}) {
    this.status = "registering";
    return this.finish(this.manager.registerRule(input, this.config));
  }

  deriveAuthority(input: AuthorityMatrixInput = {}) {
    this.status = "validating";
    return this.finish(this.manager.deriveAuthority(input, this.config));
  }

  validateWorkerAuthority(input: AuthorityMatrixInput = {}) {
    this.status = "validating";
    return this.finish(this.manager.validateWorkerAuthority(input, this.config));
  }

  validatePillowAuthority(input: AuthorityMatrixInput = {}) {
    this.status = "validating";
    return this.finish(this.manager.validatePillowAuthority(input, this.config));
  }

  validateGrandKingAuthority(input: AuthorityMatrixInput = {}) {
    this.status = "validating";
    return this.finish(this.manager.validateGrandKingAuthority(input, this.config));
  }

  validateApprovalRouting(input: AuthorityMatrixInput = {}) {
    this.status = "validating";
    return this.finish(this.manager.validateApprovalRouting(input, this.config));
  }

  produceMatrix(input: AuthorityMatrixInput = {}) {
    this.status = "defining";
    return this.finish(this.manager.produceMatrix(input, this.config));
  }

  list() {
    this.status = "active";
    return this.finish(this.manager.list(this.config));
  }

  validate(input: AuthorityMatrixInput = {}) {
    this.status = "active";
    return this.finish(this.manager.validate(input, this.config));
  }

  diagnostics() {
    return this.finish(this.manager.diagnostics(this.config));
  }

  private finish(report: AuthorityMatrixRunReport) {
    this.latestReport = report;
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }
}
