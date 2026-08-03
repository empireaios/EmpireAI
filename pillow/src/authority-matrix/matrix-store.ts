import { AMX_METADATA_VERSION } from "./paths.js";
import type {
  AuthorityBinding,
  AuthorityMatrixInput,
  AuthorityRuleDefinition,
  MatrixDecision,
  ValidationStatus,
} from "./types.js";

/** Authoritative in-memory Authority Matrix store — define/register only. */
export class MatrixStore {
  private rules = new Map<string, AuthorityRuleDefinition>();
  private bindings = new Map<string, AuthorityBinding>();
  private latestBySubject = new Map<string, string>();

  seed(params: { rules: AuthorityRuleDefinition[]; bindings: AuthorityBinding[] }) {
    this.rules.clear();
    this.bindings.clear();
    this.latestBySubject.clear();
    for (const rule of params.rules) {
      this.rules.set(rule.authorityId, cloneRule(rule));
    }
    for (const binding of params.bindings) {
      this.bindings.set(binding.bindingId, cloneBinding(binding));
      this.latestBySubject.set(binding.subjectId, binding.bindingId);
    }
  }

  listRules() {
    return [...this.rules.values()].map(cloneRule);
  }

  ruleCount() {
    return this.rules.size;
  }

  categoryCount() {
    return new Set(this.listRules().map((r) => r.decisionCategory)).size;
  }

  registerRule(rule: AuthorityRuleDefinition) {
    this.rules.set(rule.authorityId, cloneRule(rule));
    return this.listRules().find((r) => r.authorityId === rule.authorityId)!;
  }

  getRule(authorityId: string) {
    const rule = this.rules.get(authorityId);
    return rule ? cloneRule(rule) : null;
  }

  count() {
    return this.bindings.size;
  }

  listBindings() {
    return [...this.bindings.values()]
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
      .map(cloneBinding);
  }

  getLatestBinding() {
    const bindings = this.listBindings();
    return bindings[bindings.length - 1] ?? null;
  }

  save(binding: AuthorityBinding) {
    this.bindings.set(binding.bindingId, cloneBinding(binding));
    this.latestBySubject.set(binding.subjectId, binding.bindingId);
    return cloneBinding(binding);
  }

  buildBinding(params: {
    input: AuthorityMatrixInput;
    subjectId: string;
    subjectType: string;
    authorityIds: string[];
    matrixVersion: string;
    parentChains: Record<string, string[]>;
    matrixDecision: MatrixDecision | string;
    rulesApplied: string[];
    rulesSatisfied: string[];
    rulesFailed: string[];
    validationStatus: ValidationStatus;
    bindingId?: string;
  }): AuthorityBinding {
    bindingSequence += 1;
    const bindingId =
      params.bindingId?.trim() ||
      params.input.bindingId?.trim() ||
      `amx-bind-${Date.now()}-${bindingSequence}`;
    const binding: AuthorityBinding = {
      bindingId,
      timestamp: new Date().toISOString(),
      subjectId: params.subjectId,
      subjectType: params.subjectType,
      authorityIds: unique(params.authorityIds),
      matrixVersion: params.matrixVersion,
      derived: true,
      parentChains: { ...params.parentChains },
      matrixDecision: params.matrixDecision,
      rulesApplied: unique(params.rulesApplied),
      rulesSatisfied: unique(params.rulesSatisfied),
      rulesFailed: unique(params.rulesFailed),
      metadataVersion: AMX_METADATA_VERSION,
      bindingTraceId: `amx-trace-${Date.now()}-${bindingSequence}`,
      validationStatus: params.validationStatus,
      neverExecuteWorkerTasks: true,
      neverReplaceApprovalRouter: true,
      neverReplaceOrganizationCharter: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      workerTasksExecuted: false,
      approvalRouterReplaced: false,
      organizationCharterReplaced: false,
      pillowOverridden: false,
      grandKingOverridden: false,
      preserveAuditability: true,
      preserveTraceability: true,
      structuralSignalOnly: true,
      maskSensitiveValues: true,
    };
    return this.save(binding);
  }
}

let bindingSequence = 0;

export function resetBindingSequenceForTesting() {
  bindingSequence = 0;
}

function unique(values: string[]) {
  return Array.from(new Set(values.map((v) => v.trim()).filter(Boolean)));
}

function cloneRule(rule: AuthorityRuleDefinition): AuthorityRuleDefinition {
  return {
    ...rule,
    permittedActions: [...rule.permittedActions],
    restrictedActions: [...rule.restrictedActions],
    whoMayPerform: [...rule.whoMayPerform],
    escalationPath: [...rule.escalationPath],
    auditRequirements: [...rule.auditRequirements],
  };
}

function cloneBinding(binding: AuthorityBinding): AuthorityBinding {
  return {
    ...binding,
    authorityIds: [...binding.authorityIds],
    parentChains: Object.fromEntries(
      Object.entries(binding.parentChains).map(([k, v]) => [k, [...v]]),
    ),
    rulesApplied: [...binding.rulesApplied],
    rulesSatisfied: [...binding.rulesSatisfied],
    rulesFailed: [...binding.rulesFailed],
  };
}
