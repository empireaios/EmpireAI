import type { RoleTaxonomyConfiguration } from "./configuration.js";
import { RTX_METADATA_VERSION, TAXONOMY_VERSION } from "./paths.js";
import type {
  RoleDefinition,
  RoleTaxonomyCatalog,
  RoleTaxonomyInput,
  TaxonomyDecision,
} from "./types.js";

export type TaxonomyEvaluation = {
  catalog: RoleTaxonomyCatalog;
  taxonomyDecision: TaxonomyDecision;
  rolesRegistered: string[];
  categoriesRegistered: string[];
  reportingValidated: boolean;
  inheritanceValidated: boolean;
  rulesApplied: string[];
  rulesSatisfied: string[];
  rulesFailed: string[];
  parentChain: string[];
};

/** Pure Role Taxonomy definition and inheritance helpers for Q1-03. */
export class TaxonomyBuilder {
  buildCatalog(
    config: RoleTaxonomyConfiguration,
    roles: RoleDefinition[],
  ): RoleTaxonomyCatalog {
    return {
      taxonomyVersion: config.taxonomyVersion || TAXONOMY_VERSION,
      categories: [...config.roleCategories],
      roles: roles.map(cloneRole),
      metadataVersion: RTX_METADATA_VERSION,
      executiveAuthority: "pillow",
      neverExecuteWorkerTasks: true,
      neverReplaceOrganizationCharter: true,
      neverReplaceWorkerConstitution: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
    };
  }

  buildRole(
    input: RoleTaxonomyInput,
    config: RoleTaxonomyConfiguration,
  ): RoleDefinition {
    const roleId = input.roleId?.trim() || `role-${Date.now()}`;
    return {
      taxonomyVersion: config.taxonomyVersion || TAXONOMY_VERSION,
      roleId,
      roleName: input.roleName?.trim() || roleId,
      roleCategory: input.roleCategory?.toString().trim() || "specialist",
      parentRole: input.parentRole?.trim() || "role-system-base",
      responsibilities: unique(
        input.responsibilities ?? ["execute_assigned_missions", "report_outcomes"],
      ),
      authorityLevel: input.authorityLevel?.trim() || "specialist",
      reportingRelationship: input.reportingRelationship?.trim() || "lead",
      collaborationRules: unique(
        input.collaborationRules ?? ["use_approved_messaging_channels"],
      ),
      escalationRules: unique(input.escalationRules ?? ["escalate_beyond_authority"]),
      governanceRules: unique(
        input.governanceRules ?? ["pillow_governance", "worker_constitution"],
      ),
      metadataVersion: RTX_METADATA_VERSION,
      purpose: input.purpose?.trim() || "Perform assigned workforce role under Pillow",
      decisionAuthority: unique(
        input.decisionAuthority ?? ["decide_within_assigned_scope"],
      ),
      escalationAuthority: unique(input.escalationAuthority ?? ["escalate_to_lead"]),
      requiredSkills: unique(input.requiredSkills ?? ["structured_reasoning"]),
      requiredQualityStandard:
        input.requiredQualityStandard?.trim() || "worker_quality_standard",
      roleKind: input.roleKind?.toString().trim() || "standard",
      neverExecuteWorkerTasks: true,
      neverReplaceOrganizationCharter: true,
      neverReplaceWorkerConstitution: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      preserveAuditability: true,
      preserveTraceability: true,
      structuralSignalOnly: true,
      maskSensitiveValues: true,
    };
  }

  parentChain(roleId: string, roles: RoleDefinition[]): string[] {
    const byId = new Map(roles.map((r) => [r.roleId, r]));
    const chain: string[] = [];
    let current = byId.get(roleId) ?? null;
    const seen = new Set<string>();
    while (current?.parentRole && !seen.has(current.parentRole)) {
      seen.add(current.parentRole);
      chain.push(current.parentRole);
      current = byId.get(current.parentRole) ?? null;
    }
    return chain;
  }

  evaluate(
    input: RoleTaxonomyInput,
    config: RoleTaxonomyConfiguration,
    roles: RoleDefinition[],
  ): TaxonomyEvaluation {
    const catalog = this.buildCatalog(config, roles);
    const rules = unique(input.rules ?? config.roleRules);
    const violated = new Set(unique(input.violatedRules ?? []));
    const targetRoleId = input.roleId?.trim() || roles[0]?.roleId || "";
    const target = roles.find((r) => r.roleId === targetRoleId) ?? roles[0] ?? null;
    const chain = target ? this.parentChain(target.roleId, roles) : [];

    const satisfied: string[] = [];
    const failed: string[] = [];
    for (const rule of rules) {
      const ok = this.ruleSatisfied(rule, input, catalog, target, chain, violated);
      if (ok) satisfied.push(rule);
      else failed.push(rule);
    }

    const reportingValidated =
      !failed.includes("reporting_structure_defined") &&
      !!target?.reportingRelationship;
    const inheritanceValidated =
      !failed.includes("inherits_from_valid_parent") &&
      (target?.parentRole == null || chain.length > 0 || target.parentRole === null);

    let taxonomyDecision: TaxonomyDecision = "valid";
    if (failed.length === 0) taxonomyDecision = "valid";
    else if (failed.length <= Math.ceil(rules.length / 3)) {
      taxonomyDecision = "partially_valid";
    } else taxonomyDecision = "invalid";

    return {
      catalog,
      taxonomyDecision,
      rolesRegistered: catalog.roles.map((r) => r.roleId),
      categoriesRegistered: unique(catalog.roles.map((r) => r.roleCategory)),
      reportingValidated,
      inheritanceValidated,
      rulesApplied: rules,
      rulesSatisfied: satisfied,
      rulesFailed: failed,
      parentChain: chain,
    };
  }

  private ruleSatisfied(
    rule: string,
    input: RoleTaxonomyInput,
    catalog: RoleTaxonomyCatalog,
    target: RoleDefinition | null,
    chain: string[],
    violated: Set<string>,
  ): boolean {
    if (violated.has(rule)) return false;
    switch (rule) {
      case "exactly_one_role_category":
        return !!target?.roleCategory && !String(target.roleCategory).includes(",");
      case "purpose_defined":
        return !!target?.purpose?.trim();
      case "responsibilities_defined":
        return (target?.responsibilities.length ?? 0) > 0;
      case "decision_authority_defined":
        return (target?.decisionAuthority.length ?? 0) > 0;
      case "escalation_authority_defined":
        return (target?.escalationAuthority.length ?? 0) > 0;
      case "reporting_structure_defined":
        return !!target?.reportingRelationship?.trim();
      case "required_skills_defined":
        return (target?.requiredSkills.length ?? 0) > 0;
      case "quality_standard_required":
        return !!target?.requiredQualityStandard?.trim();
      case "governance_rules_required":
        return (target?.governanceRules.length ?? 0) > 0;
      case "inherits_from_valid_parent": {
        if (!target?.parentRole) return true;
        return catalog.roles.some((r) => r.roleId === target.parentRole) || chain.length > 0;
      }
      default:
        return input.overridePillow !== true;
    }
  }
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
