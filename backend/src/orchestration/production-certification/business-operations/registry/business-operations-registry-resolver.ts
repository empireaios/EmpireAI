/**
 * G6-05 — Business operations registry resolver.
 */

import type { CertificationRegistryRowBase } from "../../../../registry/types/certification-registry-types.js";
import { businessOperationsRuleConfigurationSchema } from "../../../../registry/types/certification-registry-types.js";
import { REG_CERTIFICATION_BUSINESS } from "../../../../registry/types/registry-ids.js";
import type { RegistryLoaderContext } from "../../../../registry/types/registry-types.js";
import { getRegistryLoader } from "../../../../registry/registry-loader.js";

export type BusinessOperationsRule = ReturnType<typeof parseBusinessRule>;

export function resolveBusinessOperationsRules(
  context: RegistryLoaderContext = {},
): BusinessOperationsRule[] {
  const rows = getRegistryLoader().resolve(context, REG_CERTIFICATION_BUSINESS)
    .rows as CertificationRegistryRowBase[];
  return rows.map(parseBusinessRule);
}

function parseBusinessRule(row: CertificationRegistryRowBase) {
  const rule = businessOperationsRuleConfigurationSchema.parse(row.configuration.businessOperationsRule);
  return { ruleId: row.id, ruleName: row.name, ...rule };
}

export function listBusinessOperationsDomains(context: RegistryLoaderContext = {}): string[] {
  return [...new Set(resolveBusinessOperationsRules(context).map((rule) => rule.businessDomain))];
}
