import { STX_METADATA_VERSION } from "./paths.js";
import type {
  SkillDefinition,
  SkillTaxonomyInput,
  TaxonomyDecision,
  ValidationStatus,
  WorkerSkillBinding,
} from "./types.js";

/** Authoritative in-memory Skill Taxonomy store — define/register only. */
export class TaxonomyStore {
  private skills = new Map<string, SkillDefinition>();
  private records = new Map<string, WorkerSkillBinding>();
  private latestByWorker = new Map<string, string>();

  seed(params: { skills: SkillDefinition[]; records: WorkerSkillBinding[] }) {
    this.skills.clear();
    this.records.clear();
    this.latestByWorker.clear();
    for (const skill of params.skills) {
      this.skills.set(skill.skillId, cloneSkill(skill));
    }
    for (const record of params.records) {
      this.records.set(record.derivationId, cloneRecord(record));
      this.latestByWorker.set(record.workerId, record.derivationId);
    }
  }

  listSkills() {
    return [...this.skills.values()].map(cloneSkill);
  }

  skillCount() {
    return this.skills.size;
  }

  categoryCount() {
    return new Set(this.listSkills().map((s) => s.skillCategory)).size;
  }

  registerSkill(skill: SkillDefinition) {
    this.skills.set(skill.skillId, cloneSkill(skill));
    return this.listSkills().find((s) => s.skillId === skill.skillId)!;
  }

  getSkill(skillId: string) {
    const skill = this.skills.get(skillId);
    return skill ? cloneSkill(skill) : null;
  }

  count() {
    return this.records.size;
  }

  listRecords() {
    return [...this.records.values()]
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
      .map(cloneRecord);
  }

  getLatestRecord() {
    const records = this.listRecords();
    return records[records.length - 1] ?? null;
  }

  save(record: WorkerSkillBinding) {
    this.records.set(record.derivationId, cloneRecord(record));
    this.latestByWorker.set(record.workerId, record.derivationId);
    return cloneRecord(record);
  }

  buildDerivation(params: {
    input: SkillTaxonomyInput;
    workerId: string;
    workerName: string;
    skillIds: string[];
    taxonomyVersion: string;
    parentChains: Record<string, string[]>;
    proficiencyLevels: Record<string, string>;
    taxonomyDecision: TaxonomyDecision | string;
    rulesApplied: string[];
    rulesSatisfied: string[];
    rulesFailed: string[];
    validationStatus: ValidationStatus;
    derivationId?: string;
  }): WorkerSkillBinding {
    derivationSequence += 1;
    const derivationId =
      params.derivationId?.trim() ||
      params.input.derivationId?.trim() ||
      `stx-drv-${Date.now()}-${derivationSequence}`;
    const record: WorkerSkillBinding = {
      derivationId,
      timestamp: new Date().toISOString(),
      workerId: params.workerId,
      workerName: params.workerName,
      skillIds: unique(params.skillIds),
      taxonomyVersion: params.taxonomyVersion,
      derived: true,
      parentChains: { ...params.parentChains },
      proficiencyLevels: { ...params.proficiencyLevels },
      taxonomyDecision: params.taxonomyDecision,
      rulesApplied: unique(params.rulesApplied),
      rulesSatisfied: unique(params.rulesSatisfied),
      rulesFailed: unique(params.rulesFailed),
      metadataVersion: STX_METADATA_VERSION,
      derivationTraceId: `stx-trace-${Date.now()}-${derivationSequence}`,
      validationStatus: params.validationStatus,
      neverExecuteWorkerTasks: true,
      neverReplaceRoleTaxonomy: true,
      neverReplaceWorkforceCapabilityRegistry: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      workerTasksExecuted: false,
      roleTaxonomyReplaced: false,
      workforceCapabilityRegistryReplaced: false,
      pillowOverridden: false,
      grandKingOverridden: false,
      preserveAuditability: true,
      preserveTraceability: true,
      structuralSignalOnly: true,
      maskSensitiveValues: true,
    };
    return this.save(record);
  }
}

let derivationSequence = 0;

export function resetDerivationSequenceForTesting() {
  derivationSequence = 0;
}

function unique(values: string[]) {
  return Array.from(new Set(values.map((v) => v.trim()).filter(Boolean)));
}

function cloneSkill(skill: SkillDefinition): SkillDefinition {
  return {
    ...skill,
    requiredTools: [...skill.requiredTools],
    capabilityLimits: [...skill.capabilityLimits],
    validationRules: [...skill.validationRules],
    certificationRequirements: [...skill.certificationRequirements],
    requiredKnowledge: [...skill.requiredKnowledge],
    dependencies: [...skill.dependencies],
    prerequisites: [...skill.prerequisites],
  };
}

function cloneRecord(record: WorkerSkillBinding): WorkerSkillBinding {
  return {
    ...record,
    skillIds: [...record.skillIds],
    parentChains: Object.fromEntries(
      Object.entries(record.parentChains).map(([k, v]) => [k, [...v]]),
    ),
    proficiencyLevels: { ...record.proficiencyLevels },
    rulesApplied: [...record.rulesApplied],
    rulesSatisfied: [...record.rulesSatisfied],
    rulesFailed: [...record.rulesFailed],
  };
}
