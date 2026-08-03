import type { SkillTaxonomyConfiguration } from "./configuration.js";
import { SkillTaxonomyCore } from "./skill-taxonomy-core.js";
import type {
  EngineStatus,
  SkillTaxonomyInput,
  SkillTaxonomyRunReport,
} from "./types.js";

export class SkillTaxonomyController {
  private status: EngineStatus = "idle";
  private latestReport: SkillTaxonomyRunReport | null = null;

  constructor(
    private readonly manager: SkillTaxonomyCore,
    private readonly config: SkillTaxonomyConfiguration,
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
      skillCategories: [...this.config.skillCategories],
      proficiencyLevels: [...this.config.proficiencyLevels],
      skillRules: [...this.config.skillRules],
      seedSkills: this.config.seedSkills.map((s) => ({
        ...s,
        requiredTools: [...s.requiredTools],
        capabilityLimits: [...s.capabilityLimits],
        validationRules: [...s.validationRules],
        certificationRequirements: [...s.certificationRequirements],
        requiredKnowledge: [...s.requiredKnowledge],
        dependencies: [...s.dependencies],
        prerequisites: [...s.prerequisites],
      })),
      seedDerivationRecords: this.config.seedDerivationRecords.map((r) => ({
        ...r,
        skillIds: [...r.skillIds],
        parentChains: Object.fromEntries(
          Object.entries(r.parentChains).map(([k, v]) => [k, [...v]]),
        ),
        proficiencyLevels: { ...r.proficiencyLevels },
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

  defineTaxonomy(input: SkillTaxonomyInput = {}) {
    this.status = "defining";
    return this.finish(this.manager.defineTaxonomy(input, this.config));
  }

  registerSkill(input: SkillTaxonomyInput = {}) {
    this.status = "registering";
    return this.finish(this.manager.registerSkill(input, this.config));
  }

  deriveWorkerSkills(input: SkillTaxonomyInput = {}) {
    this.status = "validating";
    return this.finish(this.manager.deriveWorkerSkills(input, this.config));
  }

  validateHierarchy(input: SkillTaxonomyInput = {}) {
    this.status = "validating";
    return this.finish(this.manager.validateHierarchy(input, this.config));
  }

  validateProficiency(input: SkillTaxonomyInput = {}) {
    this.status = "validating";
    return this.finish(this.manager.validateProficiency(input, this.config));
  }

  produceTaxonomy(input: SkillTaxonomyInput = {}) {
    this.status = "defining";
    return this.finish(this.manager.produceTaxonomy(input, this.config));
  }

  list() {
    this.status = "active";
    return this.finish(this.manager.list(this.config));
  }

  validate(input: SkillTaxonomyInput = {}) {
    this.status = "active";
    return this.finish(this.manager.validate(input, this.config));
  }

  diagnostics() {
    return this.finish(this.manager.diagnostics(this.config));
  }

  private finish(report: SkillTaxonomyRunReport) {
    this.latestReport = report;
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }
}
