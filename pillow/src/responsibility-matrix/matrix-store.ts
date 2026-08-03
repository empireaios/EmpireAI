import { RMX_METADATA_VERSION } from "./paths.js";
import type {
  MatrixDecision,
  ResponsibilityBinding,
  ResponsibilityDefinition,
  ResponsibilityMatrixInput,
  ValidationStatus,
} from "./types.js";

/** Authoritative in-memory Responsibility Matrix store — define/register only. */
export class MatrixStore {
  private responsibilities = new Map<string, ResponsibilityDefinition>();
  private bindings = new Map<string, ResponsibilityBinding>();
  private latestBySubject = new Map<string, string>();

  seed(params: {
    responsibilities: ResponsibilityDefinition[];
    bindings: ResponsibilityBinding[];
  }) {
    this.responsibilities.clear();
    this.bindings.clear();
    this.latestBySubject.clear();
    for (const responsibility of params.responsibilities) {
      this.responsibilities.set(
        responsibility.responsibilityId,
        cloneResponsibility(responsibility),
      );
    }
    for (const binding of params.bindings) {
      this.bindings.set(binding.bindingId, cloneBinding(binding));
      this.latestBySubject.set(binding.subjectId, binding.bindingId);
    }
  }

  listResponsibilities() {
    return [...this.responsibilities.values()].map(cloneResponsibility);
  }

  responsibilityCount() {
    return this.responsibilities.size;
  }

  ownerCount() {
    return new Set(this.listResponsibilities().map((r) => r.primaryOwner)).size;
  }

  registerResponsibility(responsibility: ResponsibilityDefinition) {
    this.responsibilities.set(
      responsibility.responsibilityId,
      cloneResponsibility(responsibility),
    );
    return this.listResponsibilities().find(
      (r) => r.responsibilityId === responsibility.responsibilityId,
    )!;
  }

  getResponsibility(responsibilityId: string) {
    const responsibility = this.responsibilities.get(responsibilityId);
    return responsibility ? cloneResponsibility(responsibility) : null;
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

  save(binding: ResponsibilityBinding) {
    this.bindings.set(binding.bindingId, cloneBinding(binding));
    this.latestBySubject.set(binding.subjectId, binding.bindingId);
    return cloneBinding(binding);
  }

  buildBinding(params: {
    input: ResponsibilityMatrixInput;
    subjectId: string;
    subjectType: string;
    responsibilityIds: string[];
    matrixVersion: string;
    ownerMap: Record<string, string>;
    matrixDecision: MatrixDecision | string;
    rulesApplied: string[];
    rulesSatisfied: string[];
    rulesFailed: string[];
    validationStatus: ValidationStatus;
    bindingId?: string;
  }): ResponsibilityBinding {
    bindingSequence += 1;
    const bindingId =
      params.bindingId?.trim() ||
      params.input.bindingId?.trim() ||
      `rmx-bind-${Date.now()}-${bindingSequence}`;
    const binding: ResponsibilityBinding = {
      bindingId,
      timestamp: new Date().toISOString(),
      subjectId: params.subjectId,
      subjectType: params.subjectType,
      responsibilityIds: unique(params.responsibilityIds),
      matrixVersion: params.matrixVersion,
      derived: true,
      ownerMap: { ...params.ownerMap },
      matrixDecision: params.matrixDecision,
      rulesApplied: unique(params.rulesApplied),
      rulesSatisfied: unique(params.rulesSatisfied),
      rulesFailed: unique(params.rulesFailed),
      metadataVersion: RMX_METADATA_VERSION,
      bindingTraceId: `rmx-trace-${Date.now()}-${bindingSequence}`,
      validationStatus: params.validationStatus,
      neverExecuteWorkerTasks: true,
      neverReplaceAuthorityMatrix: true,
      neverReplaceOrganizationCharter: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      workerTasksExecuted: false,
      authorityMatrixReplaced: false,
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

function cloneResponsibility(r: ResponsibilityDefinition): ResponsibilityDefinition {
  return {
    ...r,
    supportingWorkers: [...r.supportingWorkers],
    requiredInputs: [...r.requiredInputs],
    expectedOutputs: [...r.expectedOutputs],
    dependencies: [...r.dependencies],
    requiredApprovals: [...r.requiredApprovals],
    successCriteria: [...r.successCriteria],
    failureConditions: [...r.failureConditions],
    escalationPath: [...r.escalationPath],
    qualityRequirements: [...r.qualityRequirements],
    completionCriteria: [...r.completionCriteria],
  };
}

function cloneBinding(binding: ResponsibilityBinding): ResponsibilityBinding {
  return {
    ...binding,
    responsibilityIds: [...binding.responsibilityIds],
    ownerMap: { ...binding.ownerMap },
    rulesApplied: [...binding.rulesApplied],
    rulesSatisfied: [...binding.rulesSatisfied],
    rulesFailed: [...binding.rulesFailed],
  };
}
