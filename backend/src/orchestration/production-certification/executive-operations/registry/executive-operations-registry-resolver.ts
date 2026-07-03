/**
 * G6-07 — Executive operations certification registry resolver.
 */

import type { CertificationRegistryRowBase } from "../../../../registry/types/certification-registry-types.js";
import { executiveOperationsRuleConfigurationSchema } from "../../../../registry/types/certification-registry-types.js";
import { REG_CERTIFICATION_EXECUTIVE } from "../../../../registry/types/registry-ids.js";
import type { RegistryLoaderContext } from "../../../../registry/types/registry-types.js";
import { getRegistryLoader } from "../../../../registry/registry-loader.js";

export type ExecutiveOperationsRule = ReturnType<typeof parseExecutiveRule>;

export function resolveExecutiveOperationsRules(
  context: RegistryLoaderContext = {},
): ExecutiveOperationsRule[] {
  const rows = getRegistryLoader().resolve(context, REG_CERTIFICATION_EXECUTIVE)
    .rows as CertificationRegistryRowBase[];
  return rows.map(parseExecutiveRule);
}

function parseExecutiveRule(row: CertificationRegistryRowBase) {
  const rule = executiveOperationsRuleConfigurationSchema.parse(row.configuration.executiveOperationsRule);
  return { ruleId: row.id, ruleName: row.name, ...rule };
}

export function listExecutiveOperationsDomains(context: RegistryLoaderContext = {}): string[] {
  return [...new Set(resolveExecutiveOperationsRules(context).map((rule) => rule.executiveDomain))];
}
