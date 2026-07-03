/**
 * G6-01 — Platform integrity registry resolver (REG-CERTIFICATION-INTEGRITY).
 */

import type { CertificationRegistryRowBase } from "../../../../registry/types/certification-registry-types.js";
import { platformIntegrityRuleConfigurationSchema } from "../../../../registry/types/certification-registry-types.js";
import { REG_CERTIFICATION_INTEGRITY } from "../../../../registry/types/registry-ids.js";
import type { RegistryLoaderContext } from "../../../../registry/types/registry-types.js";
import { getRegistryLoader } from "../../../../registry/registry-loader.js";

export type PlatformIntegrityRule = ReturnType<typeof parseIntegrityRule>;

export function resolvePlatformIntegrityRules(
  context: RegistryLoaderContext = {},
): PlatformIntegrityRule[] {
  const rows = getRegistryLoader().resolve(context, REG_CERTIFICATION_INTEGRITY)
    .rows as CertificationRegistryRowBase[];
  return rows.map(parseIntegrityRule);
}

function parseIntegrityRule(row: CertificationRegistryRowBase) {
  const rule = platformIntegrityRuleConfigurationSchema.parse(row.configuration.platformIntegrityRule);
  return {
    ruleId: row.id,
    ruleName: row.name,
    ...rule,
  };
}

export function listPlatformIntegritySubsystems(context: RegistryLoaderContext = {}): string[] {
  return [...new Set(resolvePlatformIntegrityRules(context).map((rule) => rule.subsystemId))];
}
