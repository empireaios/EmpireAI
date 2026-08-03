import type { RoleTaxonomyConfiguration } from "./configuration.js";
import { RoleTaxonomyCore } from "./role-taxonomy-core.js";
import type {
  EngineStatus,
  RoleTaxonomyInput,
  RoleTaxonomyRunReport,
} from "./types.js";

export class RoleTaxonomyController {
  private status: EngineStatus = "idle";
  private latestReport: RoleTaxonomyRunReport | null = null;

  constructor(
    private readonly manager: RoleTaxonomyCore,
    private readonly config: RoleTaxonomyConfiguration,
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
      roleCategories: [...this.config.roleCategories],
      roleRules: [...this.config.roleRules],
      seedRoles: this.config.seedRoles.map((r) => ({
        ...r,
        responsibilities: [...r.responsibilities],
        collaborationRules: [...r.collaborationRules],
        escalationRules: [...r.escalationRules],
        governanceRules: [...r.governanceRules],
        decisionAuthority: [...r.decisionAuthority],
        escalationAuthority: [...r.escalationAuthority],
        requiredSkills: [...r.requiredSkills],
      })),
      seedInheritanceRecords: this.config.seedInheritanceRecords.map((r) => ({
        ...r,
        parentChain: [...r.parentChain],
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

  defineTaxonomy(input: RoleTaxonomyInput = {}) {
    this.status = "defining";
    return this.finish(this.manager.defineTaxonomy(input, this.config));
  }

  registerRole(input: RoleTaxonomyInput = {}) {
    this.status = "registering";
    return this.finish(this.manager.registerRole(input, this.config));
  }

  inheritRole(input: RoleTaxonomyInput = {}) {
    this.status = "validating";
    return this.finish(this.manager.inheritRole(input, this.config));
  }

  validateReporting(input: RoleTaxonomyInput = {}) {
    this.status = "validating";
    return this.finish(this.manager.validateReporting(input, this.config));
  }

  validateInheritance(input: RoleTaxonomyInput = {}) {
    this.status = "validating";
    return this.finish(this.manager.validateInheritance(input, this.config));
  }

  produceTaxonomy(input: RoleTaxonomyInput = {}) {
    this.status = "defining";
    return this.finish(this.manager.produceTaxonomy(input, this.config));
  }

  list() {
    this.status = "active";
    return this.finish(this.manager.list(this.config));
  }

  validate(input: RoleTaxonomyInput = {}) {
    this.status = "active";
    return this.finish(this.manager.validate(input, this.config));
  }

  diagnostics() {
    return this.finish(this.manager.diagnostics(this.config));
  }

  private finish(report: RoleTaxonomyRunReport) {
    this.latestReport = report;
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }
}
