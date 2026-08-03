import type { ResponsibilityMatrixConfiguration } from "./configuration.js";
import { MATRIX_VERSION, RMX_METADATA_VERSION } from "./paths.js";
import type {
  MatrixDecision,
  ResponsibilityDefinition,
  ResponsibilityMatrixCatalog,
  ResponsibilityMatrixInput,
} from "./types.js";

export type MatrixEvaluation = {
  catalog: ResponsibilityMatrixCatalog;
  matrixDecision: MatrixDecision;
  responsibilitiesRegistered: string[];
  ownershipValidated: boolean;
  inputsOutputsValidated: boolean;
  dependenciesValidated: boolean;
  approvalsValidated: boolean;
  rulesApplied: string[];
  rulesSatisfied: string[];
  rulesFailed: string[];
};

/** Pure Responsibility Matrix definition helpers for Q1-06. */
export class MatrixBuilder {
  buildCatalog(
    config: ResponsibilityMatrixConfiguration,
    responsibilities: ResponsibilityDefinition[],
  ): ResponsibilityMatrixCatalog {
    return {
      matrixVersion: config.matrixVersion || MATRIX_VERSION,
      responsibilities: responsibilities.map(cloneResponsibility),
      metadataVersion: RMX_METADATA_VERSION,
      executiveAuthority: "pillow",
      neverExecuteWorkerTasks: true,
      neverReplaceAuthorityMatrix: true,
      neverReplaceOrganizationCharter: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
    };
  }

  buildResponsibility(
    input: ResponsibilityMatrixInput,
    config: ResponsibilityMatrixConfiguration,
  ): ResponsibilityDefinition {
    const responsibilityId = input.responsibilityId?.trim() || `resp-${Date.now()}`;
    return {
      matrixVersion: config.matrixVersion || MATRIX_VERSION,
      responsibilityId,
      responsibilityName: input.responsibilityName?.trim() || responsibilityId,
      primaryOwner: input.primaryOwner?.trim() || "worker-unspecified",
      supportingWorkers: unique(input.supportingWorkers ?? []),
      department: input.department?.trim() || "operations",
      factory: input.factory?.trim() || "workforce-factory",
      requiredInputs: unique(input.requiredInputs ?? ["mission_context"]),
      expectedOutputs: unique(input.expectedOutputs ?? ["responsibility_result"]),
      dependencies: unique(input.dependencies ?? []),
      requiredApprovals: unique(input.requiredApprovals ?? ["manager_approval"]),
      successCriteria: unique(input.successCriteria ?? ["accepted_by_owner"]),
      failureConditions: unique(input.failureConditions ?? ["missing_owner"]),
      escalationTarget: input.escalationTarget?.trim() || "manager",
      metadataVersion: RMX_METADATA_VERSION,
      escalationPath: unique(input.escalationPath ?? ["worker", "manager", "pillow"]),
      qualityRequirements: unique(input.qualityRequirements ?? ["worker_quality_standard"]),
      completionCriteria: unique(input.completionCriteria ?? ["owner_signoff"]),
      purpose: input.purpose?.trim() || "Define accountable workforce responsibility",
      neverExecuteWorkerTasks: true,
      neverReplaceAuthorityMatrix: true,
      neverReplaceOrganizationCharter: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      preserveAuditability: true,
      preserveTraceability: true,
      structuralSignalOnly: true,
      maskSensitiveValues: true,
    };
  }

  evaluate(
    input: ResponsibilityMatrixInput,
    config: ResponsibilityMatrixConfiguration,
    responsibilities: ResponsibilityDefinition[],
  ): MatrixEvaluation {
    const catalog = this.buildCatalog(config, responsibilities);
    const matrixRules = unique(input.matrixRules ?? config.responsibilityRules);
    const violated = new Set(unique(input.violatedRules ?? []));
    const targetId =
      input.responsibilityId?.trim() || responsibilities[0]?.responsibilityId || "";
    const target =
      responsibilities.find((r) => r.responsibilityId === targetId) ??
      responsibilities[0] ??
      null;

    const satisfied: string[] = [];
    const failed: string[] = [];
    for (const rule of matrixRules) {
      const ok = this.ruleSatisfied(rule, input, catalog, responsibilities, target, violated);
      if (ok) satisfied.push(rule);
      else failed.push(rule);
    }

    const ownershipValidated =
      !failed.includes("exactly_one_accountable_owner") &&
      !failed.includes("no_ambiguous_ownership") &&
      !!target?.primaryOwner?.trim() &&
      !String(target.primaryOwner).includes(",");
    const inputsOutputsValidated =
      !failed.includes("required_inputs_defined") &&
      !failed.includes("expected_outputs_defined") &&
      (target?.requiredInputs.length ?? 0) > 0 &&
      (target?.expectedOutputs.length ?? 0) > 0;
    const dependenciesValidated =
      !failed.includes("dependency_chain_defined") &&
      Array.isArray(target?.dependencies) &&
      target!.dependencies.every(
        (d) =>
          responsibilities.some((r) => r.responsibilityId === d) ||
          d === target!.responsibilityId,
      );
    const approvalsValidated =
      !failed.includes("required_approvals_defined") &&
      (target?.requiredApprovals.length ?? 0) > 0;

    let matrixDecision: MatrixDecision = "valid";
    if (failed.length === 0) matrixDecision = "valid";
    else if (failed.length <= Math.ceil(matrixRules.length / 3)) {
      matrixDecision = "partially_valid";
    } else matrixDecision = "invalid";

    return {
      catalog,
      matrixDecision,
      responsibilitiesRegistered: catalog.responsibilities.map((r) => r.responsibilityId),
      ownershipValidated,
      inputsOutputsValidated,
      dependenciesValidated,
      approvalsValidated,
      rulesApplied: matrixRules,
      rulesSatisfied: satisfied,
      rulesFailed: failed,
    };
  }

  private ruleSatisfied(
    rule: string,
    input: ResponsibilityMatrixInput,
    catalog: ResponsibilityMatrixCatalog,
    responsibilities: ResponsibilityDefinition[],
    target: ResponsibilityDefinition | null,
    violated: Set<string>,
  ): boolean {
    if (violated.has(rule)) return false;
    switch (rule) {
      case "exactly_one_accountable_owner":
        return !!target?.primaryOwner?.trim() && !String(target.primaryOwner).includes(",");
      case "supporting_workers_optional":
        return Array.isArray(target?.supportingWorkers);
      case "required_inputs_defined":
        return (target?.requiredInputs.length ?? 0) > 0;
      case "expected_outputs_defined":
        return (target?.expectedOutputs.length ?? 0) > 0;
      case "required_approvals_defined":
        return (target?.requiredApprovals.length ?? 0) > 0;
      case "dependency_chain_defined":
        return Array.isArray(target?.dependencies);
      case "escalation_path_defined":
        return (target?.escalationPath.length ?? 0) > 0 && !!target?.escalationTarget;
      case "quality_requirements_defined":
        return (target?.qualityRequirements.length ?? 0) > 0;
      case "completion_criteria_defined":
        return (target?.completionCriteria.length ?? 0) > 0;
      case "no_responsibility_outside_matrix":
        return catalog.responsibilities.length > 0;
      case "no_ambiguous_ownership": {
        if (!target) return false;
        const owners = responsibilities
          .filter((r) => r.responsibilityId === target.responsibilityId)
          .map((r) => r.primaryOwner);
        return new Set(owners).size === 1;
      }
      default:
        return input.overridePillow !== true;
    }
  }
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
