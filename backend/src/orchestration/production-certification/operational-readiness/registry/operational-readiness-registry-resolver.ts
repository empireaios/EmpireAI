/**
 * G6-04 — Operational readiness registry resolver.
 */

import type { CertificationRegistryRowBase } from "../../../../registry/types/certification-registry-types.js";
import { operationalReadinessRuleConfigurationSchema } from "../../../../registry/types/certification-registry-types.js";
import { REG_CERTIFICATION_OPERATIONAL } from "../../../../registry/types/registry-ids.js";
import type { RegistryLoaderContext } from "../../../../registry/types/registry-types.js";
import { getRegistryLoader } from "../../../../registry/registry-loader.js";

export type OperationalReadinessRule = ReturnType<typeof parseOperationalRule>;

export function resolveOperationalReadinessRules(
  context: RegistryLoaderContext = {},
): OperationalReadinessRule[] {
  const rows = getRegistryLoader().resolve(context, REG_CERTIFICATION_OPERATIONAL)
    .rows as CertificationRegistryRowBase[];
  return rows.map(parseOperationalRule);
}

function parseOperationalRule(row: CertificationRegistryRowBase) {
  const rule = operationalReadinessRuleConfigurationSchema.parse(row.configuration.operationalReadinessRule);
  return { ruleId: row.id, ruleName: row.name, ...rule };
}

export function listOperationalReadinessDomains(context: RegistryLoaderContext = {}): string[] {
  return [...new Set(resolveOperationalReadinessRules(context).map((rule) => rule.readinessDomain))];
}
