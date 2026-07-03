/**
 * G6-01 — Programme, module, and subsystem integrity validators.
 */

import type { PlatformIntegrityResultState } from "../contracts/platform-integrity-types.js";
import type { PlatformIntegrityRule } from "../registry/platform-integrity-registry-resolver.js";
import { resolveProgrammeModule } from "../registry/programme-module-resolver.js";
import { getRegistryLoader } from "../../../../registry/registry-loader.js";

export function validateProgrammeIntegrity(rules: PlatformIntegrityRule[]): Array<{
  programmeRef: string;
  subsystemId: string;
  status: PlatformIntegrityResultState;
  moduleId?: string;
  programmeStatus?: string;
}> {
  return rules
    .filter((rule) => rule.ruleKind === "programme")
    .map((rule) => {
      if (!rule.moduleResolverRef) {
        return {
          programmeRef: rule.programmeRef ?? rule.subsystemId,
          subsystemId: rule.subsystemId,
          status: "warning" as PlatformIntegrityResultState,
        };
      }

      const module = resolveProgrammeModule(rule.moduleResolverRef);
      if (!module) {
        return {
          programmeRef: rule.programmeRef ?? rule.subsystemId,
          subsystemId: rule.subsystemId,
          status: "fail" as PlatformIntegrityResultState,
        };
      }

      const statusMatch =
        !rule.expectedProgrammeStatus || module.programmeStatus === rule.expectedProgrammeStatus;
      const ownerMatch = module.moduleId === rule.canonicalOwner;

      let status: PlatformIntegrityResultState = "pass";
      if (!statusMatch) status = "warning";
      if (!ownerMatch) status = "fail";

      return {
        programmeRef: rule.programmeRef ?? rule.subsystemId,
        subsystemId: rule.subsystemId,
        status,
        moduleId: module.moduleId,
        programmeStatus: module.programmeStatus,
      };
    });
}

export function validateModuleIntegrity(rules: PlatformIntegrityRule[]): PlatformIntegrityResultState {
  const moduleRules = rules.filter((rule) => rule.ruleKind === "module");
  if (moduleRules.length === 0) return "pass_with_conditions";

  const allPass = moduleRules.every((rule) => {
    if (!rule.moduleResolverRef) return false;
    const module = resolveProgrammeModule(rule.moduleResolverRef);
    return Boolean(module && module.moduleId === rule.canonicalOwner);
  });

  return allPass ? "pass" : "fail";
}

export function validateSubsystemIntegrity(
  rules: PlatformIntegrityRule[],
  context: { workspaceId: string },
): PlatformIntegrityResultState {
  const subsystemRules = rules.filter((rule) => rule.ruleKind === "subsystem");
  for (const rule of subsystemRules) {
    if (rule.registryRef) {
      try {
        const result = getRegistryLoader().resolve(
          context,
          rule.registryRef as Parameters<ReturnType<typeof getRegistryLoader>["resolve"]>[1],
        );
        if (!result.meta.wired) return "warning";
      } catch {
        return "fail";
      }
    }
  }
  return subsystemRules.length > 0 ? "pass" : "pass_with_conditions";
}
