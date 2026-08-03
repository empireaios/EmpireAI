import { RTX_METADATA_VERSION } from "./paths.js";
import type {
  RoleDefinition,
  RoleInheritanceBinding,
  RoleTaxonomyInput,
  TaxonomyDecision,
  ValidationStatus,
} from "./types.js";

/** Authoritative in-memory Role Taxonomy store — define/register only. */
export class TaxonomyStore {
  private roles = new Map<string, RoleDefinition>();
  private records = new Map<string, RoleInheritanceBinding>();
  private latestByWorker = new Map<string, string>();

  seed(params: { roles: RoleDefinition[]; records: RoleInheritanceBinding[] }) {
    this.roles.clear();
    this.records.clear();
    this.latestByWorker.clear();
    for (const role of params.roles) {
      this.roles.set(role.roleId, cloneRole(role));
    }
    for (const record of params.records) {
      this.records.set(record.inheritanceId, cloneRecord(record));
      this.latestByWorker.set(record.workerId, record.inheritanceId);
    }
  }

  listRoles() {
    return [...this.roles.values()].map(cloneRole);
  }

  roleCount() {
    return this.roles.size;
  }

  categoryCount() {
    return new Set(this.listRoles().map((r) => r.roleCategory)).size;
  }

  registerRole(role: RoleDefinition) {
    this.roles.set(role.roleId, cloneRole(role));
    return this.listRoles().find((r) => r.roleId === role.roleId)!;
  }

  getRole(roleId: string) {
    const role = this.roles.get(roleId);
    return role ? cloneRole(role) : null;
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

  save(record: RoleInheritanceBinding) {
    this.records.set(record.inheritanceId, cloneRecord(record));
    this.latestByWorker.set(record.workerId, record.inheritanceId);
    return cloneRecord(record);
  }

  buildInheritance(params: {
    input: RoleTaxonomyInput;
    workerId: string;
    workerName: string;
    roleId: string;
    taxonomyVersion: string;
    parentChain: string[];
    taxonomyDecision: TaxonomyDecision | string;
    rulesApplied: string[];
    rulesSatisfied: string[];
    rulesFailed: string[];
    validationStatus: ValidationStatus;
    inheritanceId?: string;
  }): RoleInheritanceBinding {
    inheritanceSequence += 1;
    const inheritanceId =
      params.inheritanceId?.trim() ||
      params.input.inheritanceId?.trim() ||
      `rtx-inh-${Date.now()}-${inheritanceSequence}`;
    const record: RoleInheritanceBinding = {
      inheritanceId,
      timestamp: new Date().toISOString(),
      workerId: params.workerId,
      workerName: params.workerName,
      roleId: params.roleId,
      taxonomyVersion: params.taxonomyVersion,
      inherited: true,
      parentChain: unique(params.parentChain),
      taxonomyDecision: params.taxonomyDecision,
      rulesApplied: unique(params.rulesApplied),
      rulesSatisfied: unique(params.rulesSatisfied),
      rulesFailed: unique(params.rulesFailed),
      metadataVersion: RTX_METADATA_VERSION,
      inheritanceTraceId: `rtx-trace-${Date.now()}-${inheritanceSequence}`,
      validationStatus: params.validationStatus,
      neverExecuteWorkerTasks: true,
      neverReplaceOrganizationCharter: true,
      neverReplaceWorkerConstitution: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      workerTasksExecuted: false,
      organizationCharterReplaced: false,
      workerConstitutionReplaced: false,
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

let inheritanceSequence = 0;

export function resetInheritanceSequenceForTesting() {
  inheritanceSequence = 0;
}

function unique(values: string[]) {
  return Array.from(new Set(values.map((v) => v.trim()).filter(Boolean)));
}

function cloneRole(role: RoleDefinition): RoleDefinition {
  return {
    ...role,
    responsibilities: [...role.responsibilities],
    collaborationRules: [...role.collaborationRules],
    escalationRules: [...role.escalationRules],
    governanceRules: [...role.governanceRules],
    decisionAuthority: [...role.decisionAuthority],
    escalationAuthority: [...role.escalationAuthority],
    requiredSkills: [...role.requiredSkills],
  };
}

function cloneRecord(record: RoleInheritanceBinding): RoleInheritanceBinding {
  return {
    ...record,
    parentChain: [...record.parentChain],
    rulesApplied: [...record.rulesApplied],
    rulesSatisfied: [...record.rulesSatisfied],
    rulesFailed: [...record.rulesFailed],
  };
}
