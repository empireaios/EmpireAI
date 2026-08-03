import type { SkillTaxonomyConfiguration } from "./configuration.js";
import { STX_METADATA_VERSION, TAXONOMY_VERSION } from "./paths.js";
import type {
  SkillDefinition,
  SkillTaxonomyCatalog,
  SkillTaxonomyInput,
  TaxonomyDecision,
} from "./types.js";

export type TaxonomyEvaluation = {
  catalog: SkillTaxonomyCatalog;
  taxonomyDecision: TaxonomyDecision;
  skillsRegistered: string[];
  categoriesRegistered: string[];
  hierarchyValidated: boolean;
  proficiencyValidated: boolean;
  rulesApplied: string[];
  rulesSatisfied: string[];
  rulesFailed: string[];
  parentChain: string[];
};

/** Pure Skill Taxonomy definition and derivation helpers for Q1-04. */
export class TaxonomyBuilder {
  buildCatalog(
    config: SkillTaxonomyConfiguration,
    skills: SkillDefinition[],
  ): SkillTaxonomyCatalog {
    return {
      taxonomyVersion: config.taxonomyVersion || TAXONOMY_VERSION,
      categories: [...config.skillCategories],
      proficiencyLevels: [...config.proficiencyLevels],
      skills: skills.map(cloneSkill),
      metadataVersion: STX_METADATA_VERSION,
      executiveAuthority: "pillow",
      neverExecuteWorkerTasks: true,
      neverReplaceRoleTaxonomy: true,
      neverReplaceWorkforceCapabilityRegistry: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
    };
  }

  buildSkill(
    input: SkillTaxonomyInput,
    config: SkillTaxonomyConfiguration,
  ): SkillDefinition {
    const skillId = input.skillId?.trim() || `skill-${Date.now()}`;
    return {
      taxonomyVersion: config.taxonomyVersion || TAXONOMY_VERSION,
      skillId,
      skillName: input.skillName?.trim() || skillId,
      skillCategory: input.skillCategory?.toString().trim() || "operations",
      parentSkill: input.parentSkill?.trim() || "skill-ops-foundation",
      description:
        input.description?.trim() || "Workforce skill defined under Skill Taxonomy",
      proficiencyLevel: input.proficiencyLevel?.toString().trim() || "beginner",
      requiredTools: unique(input.requiredTools ?? ["structured_reporting"]),
      capabilityLimits: unique(input.capabilityLimits ?? ["no_autonomous_execution"]),
      validationRules: unique(input.validationRules ?? ["evidence_required"]),
      certificationRequirements: unique(
        input.certificationRequirements ?? ["worker_quality_standard"],
      ),
      metadataVersion: STX_METADATA_VERSION,
      purpose: input.purpose?.trim() || "Perform assigned workforce skill under Pillow",
      requiredKnowledge: unique(input.requiredKnowledge ?? ["domain_basics"]),
      validationMethod: input.validationMethod?.trim() || "evidence_review",
      dependencies: unique(input.dependencies ?? ["skill-ops-foundation"]),
      prerequisites: unique(input.prerequisites ?? ["skill-ops-foundation"]),
      neverExecuteWorkerTasks: true,
      neverReplaceRoleTaxonomy: true,
      neverReplaceWorkforceCapabilityRegistry: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      preserveAuditability: true,
      preserveTraceability: true,
      structuralSignalOnly: true,
      maskSensitiveValues: true,
    };
  }

  parentChain(skillId: string, skills: SkillDefinition[]): string[] {
    const byId = new Map(skills.map((s) => [s.skillId, s]));
    const chain: string[] = [];
    let current = byId.get(skillId) ?? null;
    const seen = new Set<string>();
    while (current?.parentSkill && !seen.has(current.parentSkill)) {
      seen.add(current.parentSkill);
      chain.push(current.parentSkill);
      current = byId.get(current.parentSkill) ?? null;
    }
    return chain;
  }

  evaluate(
    input: SkillTaxonomyInput,
    config: SkillTaxonomyConfiguration,
    skills: SkillDefinition[],
  ): TaxonomyEvaluation {
    const catalog = this.buildCatalog(config, skills);
    const rules = unique(input.rules ?? config.skillRules);
    const violated = new Set(unique(input.violatedRules ?? []));
    const targetSkillId = input.skillId?.trim() || skills[0]?.skillId || "";
    const target = skills.find((s) => s.skillId === targetSkillId) ?? skills[0] ?? null;
    const chain = target ? this.parentChain(target.skillId, skills) : [];

    const satisfied: string[] = [];
    const failed: string[] = [];
    for (const rule of rules) {
      const ok = this.ruleSatisfied(rule, input, catalog, config, target, chain, violated);
      if (ok) satisfied.push(rule);
      else failed.push(rule);
    }

    const hierarchyValidated =
      !failed.includes("inherits_from_valid_parent") &&
      (target?.parentSkill == null || chain.length > 0 || target.parentSkill === null);
    const proficiencyValidated =
      !failed.includes("proficiency_level_valid") &&
      !!target?.proficiencyLevel &&
      config.proficiencyLevels.includes(String(target.proficiencyLevel));

    let taxonomyDecision: TaxonomyDecision = "valid";
    if (failed.length === 0) taxonomyDecision = "valid";
    else if (failed.length <= Math.ceil(rules.length / 3)) {
      taxonomyDecision = "partially_valid";
    } else taxonomyDecision = "invalid";

    return {
      catalog,
      taxonomyDecision,
      skillsRegistered: catalog.skills.map((s) => s.skillId),
      categoriesRegistered: unique(catalog.skills.map((s) => s.skillCategory)),
      hierarchyValidated,
      proficiencyValidated,
      rulesApplied: rules,
      rulesSatisfied: satisfied,
      rulesFailed: failed,
      parentChain: chain,
    };
  }

  private ruleSatisfied(
    rule: string,
    input: SkillTaxonomyInput,
    catalog: SkillTaxonomyCatalog,
    config: SkillTaxonomyConfiguration,
    target: SkillDefinition | null,
    chain: string[],
    violated: Set<string>,
  ): boolean {
    if (violated.has(rule)) return false;
    switch (rule) {
      case "exactly_one_skill_category":
        return !!target?.skillCategory && !String(target.skillCategory).includes(",");
      case "purpose_defined":
        return !!target?.purpose?.trim();
      case "required_knowledge_defined":
        return (target?.requiredKnowledge.length ?? 0) > 0;
      case "required_tools_defined":
        return (target?.requiredTools.length ?? 0) > 0;
      case "validation_method_defined":
        return !!target?.validationMethod?.trim();
      case "dependencies_defined":
        return Array.isArray(target?.dependencies);
      case "capability_limits_defined":
        return (target?.capabilityLimits.length ?? 0) > 0;
      case "certification_requirements_defined":
        return (target?.certificationRequirements.length ?? 0) > 0;
      case "proficiency_level_valid":
        return (
          !!target?.proficiencyLevel &&
          config.proficiencyLevels.includes(String(target.proficiencyLevel))
        );
      case "inherits_from_valid_parent": {
        if (!target?.parentSkill) return true;
        return (
          catalog.skills.some((s) => s.skillId === target.parentSkill) || chain.length > 0
        );
      }
      default:
        return input.overridePillow !== true;
    }
  }
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
