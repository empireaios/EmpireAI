import type { AuthorityMatrixConfiguration } from "./configuration.js";
import { AMX_METADATA_VERSION, MATRIX_VERSION } from "./paths.js";
import type {
  AuthorityRuleDefinition,
  AuthorityMatrixCatalog,
  AuthorityMatrixInput,
  MatrixDecision,
} from "./types.js";

export type MatrixEvaluation = {
  catalog: AuthorityMatrixCatalog;
  matrixDecision: MatrixDecision;
  rulesRegistered: string[];
  categoriesRegistered: string[];
  workerAuthorityValidated: boolean;
  pillowAuthorityValidated: boolean;
  grandKingAuthorityValidated: boolean;
  approvalRoutingValidated: boolean;
  rulesApplied: string[];
  rulesSatisfied: string[];
  rulesFailed: string[];
  parentChain: string[];
};

/** Pure Authority Matrix definition and validation helpers for Q1-05. */
export class MatrixBuilder {
  buildCatalog(
    config: AuthorityMatrixConfiguration,
    rules: AuthorityRuleDefinition[],
  ): AuthorityMatrixCatalog {
    return {
      matrixVersion: config.matrixVersion || MATRIX_VERSION,
      authorityLevels: [...config.authorityLevels],
      decisionCategories: [...config.decisionCategories],
      rules: rules.map(cloneRule),
      metadataVersion: AMX_METADATA_VERSION,
      executiveAuthority: "pillow",
      supremeAuthority: "grand_king",
      neverExecuteWorkerTasks: true,
      neverReplaceApprovalRouter: true,
      neverReplaceOrganizationCharter: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
    };
  }

  buildRule(
    input: AuthorityMatrixInput,
    config: AuthorityMatrixConfiguration,
  ): AuthorityRuleDefinition {
    const authorityId = input.authorityId?.trim() || `auth-${Date.now()}`;
    return {
      matrixVersion: config.matrixVersion || MATRIX_VERSION,
      authorityId,
      decisionCategory: input.decisionCategory?.toString().trim() || "planning",
      workerRole: input.workerRole?.trim() || "specialist",
      permittedActions: unique(input.permittedActions ?? ["recommend_within_scope"]),
      restrictedActions: unique(input.restrictedActions ?? ["bypass_authority_matrix"]),
      requiredApproval: input.requiredApproval?.toString().trim() || "manager_approval",
      escalationTarget: input.escalationTarget?.trim() || "manager",
      riskClassification: input.riskClassification?.toString().trim() || "medium",
      metadataVersion: AMX_METADATA_VERSION,
      whoMayPerform: unique(input.whoMayPerform ?? ["specialist"]),
      approvalRequired: input.approvalRequired ?? true,
      maximumAuthority: input.maximumAuthority?.toString().trim() || "pillow_approval",
      escalationPath: unique(input.escalationPath ?? ["worker", "manager", "pillow"]),
      riskLevel: input.riskLevel?.toString().trim() || "medium",
      auditRequirements: unique(input.auditRequirements ?? ["authority_audit_log"]),
      parentAuthority: input.parentAuthority?.trim() || "auth-base-information",
      purpose: input.purpose?.trim() || "Govern decision authority under Pillow",
      neverExecuteWorkerTasks: true,
      neverReplaceApprovalRouter: true,
      neverReplaceOrganizationCharter: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      preserveAuditability: true,
      preserveTraceability: true,
      structuralSignalOnly: true,
      maskSensitiveValues: true,
    };
  }

  parentChain(authorityId: string, rules: AuthorityRuleDefinition[]): string[] {
    const byId = new Map(rules.map((r) => [r.authorityId, r]));
    const chain: string[] = [];
    let current = byId.get(authorityId) ?? null;
    const seen = new Set<string>();
    while (current?.parentAuthority && !seen.has(current.parentAuthority)) {
      seen.add(current.parentAuthority);
      chain.push(current.parentAuthority);
      current = byId.get(current.parentAuthority) ?? null;
    }
    return chain;
  }

  evaluate(
    input: AuthorityMatrixInput,
    config: AuthorityMatrixConfiguration,
    rules: AuthorityRuleDefinition[],
  ): MatrixEvaluation {
    const catalog = this.buildCatalog(config, rules);
    const matrixRules = unique(input.matrixRules ?? config.authorityRules);
    const violated = new Set(unique(input.violatedRules ?? []));
    const targetId = input.authorityId?.trim() || rules[0]?.authorityId || "";
    const target = rules.find((r) => r.authorityId === targetId) ?? rules[0] ?? null;
    const chain = target ? this.parentChain(target.authorityId, rules) : [];

    const satisfied: string[] = [];
    const failed: string[] = [];
    for (const rule of matrixRules) {
      const ok = this.ruleSatisfied(rule, input, catalog, config, target, chain, violated);
      if (ok) satisfied.push(rule);
      else failed.push(rule);
    }

    const workerAuthorityValidated =
      !failed.includes("who_may_perform_defined") &&
      (target?.whoMayPerform.length ?? 0) > 0;
    const pillowAuthorityValidated =
      !failed.includes("pillow_executive_authority") &&
      catalog.executiveAuthority === "pillow" &&
      rules.some(
        (r) =>
          r.requiredApproval === "pillow_approval" ||
          r.whoMayPerform.includes("pillow") ||
          r.authorityId === "auth-pillow-executive",
      );
    const grandKingAuthorityValidated =
      !failed.includes("grand_king_supreme_authority") &&
      catalog.supremeAuthority === "grand_king" &&
      rules.some(
        (r) =>
          r.requiredApproval === "grand_king_approval" ||
          r.whoMayPerform.includes("grand_king") ||
          r.authorityId === "auth-grand-king-supreme",
      );
    const approvalRoutingValidated =
      !failed.includes("escalation_path_defined") &&
      !failed.includes("required_approval_valid") &&
      (target?.escalationPath.length ?? 0) > 0 &&
      !!target?.requiredApproval;

    let matrixDecision: MatrixDecision = "valid";
    if (failed.length === 0) matrixDecision = "valid";
    else if (failed.length <= Math.ceil(matrixRules.length / 3)) {
      matrixDecision = "partially_valid";
    } else matrixDecision = "invalid";

    return {
      catalog,
      matrixDecision,
      rulesRegistered: catalog.rules.map((r) => r.authorityId),
      categoriesRegistered: unique(catalog.rules.map((r) => r.decisionCategory)),
      workerAuthorityValidated,
      pillowAuthorityValidated,
      grandKingAuthorityValidated,
      approvalRoutingValidated,
      rulesApplied: matrixRules,
      rulesSatisfied: satisfied,
      rulesFailed: failed,
      parentChain: chain,
    };
  }

  private ruleSatisfied(
    rule: string,
    input: AuthorityMatrixInput,
    catalog: AuthorityMatrixCatalog,
    config: AuthorityMatrixConfiguration,
    target: AuthorityRuleDefinition | null,
    chain: string[],
    violated: Set<string>,
  ): boolean {
    if (violated.has(rule)) return false;
    switch (rule) {
      case "who_may_perform_defined":
        return (target?.whoMayPerform.length ?? 0) > 0;
      case "approval_required_defined":
        return typeof target?.approvalRequired === "boolean";
      case "maximum_authority_defined":
        return !!target?.maximumAuthority;
      case "escalation_path_defined":
        return (target?.escalationPath.length ?? 0) > 0;
      case "risk_level_defined":
        return !!target?.riskLevel;
      case "audit_requirements_defined":
        return (target?.auditRequirements.length ?? 0) > 0;
      case "required_approval_valid":
        return (
          !!target?.requiredApproval &&
          config.authorityLevels.includes(String(target.requiredApproval))
        );
      case "no_bypass_authority_matrix":
        return input.overridePillow !== true && input.overrideGrandKing !== true;
      case "inherits_from_valid_parent": {
        if (!target?.parentAuthority) return true;
        return (
          catalog.rules.some((r) => r.authorityId === target.parentAuthority) ||
          chain.length > 0
        );
      }
      case "pillow_executive_authority":
        return catalog.executiveAuthority === "pillow";
      case "grand_king_supreme_authority":
        return catalog.supremeAuthority === "grand_king";
      default:
        return input.overridePillow !== true;
    }
  }
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
