/**
 * G6-06 — Performance certification registry resolver.
 */

import type { CertificationRegistryRowBase } from "../../../../registry/types/certification-registry-types.js";
import { performanceCertificationRuleConfigurationSchema } from "../../../../registry/types/certification-registry-types.js";
import { REG_CERTIFICATION_PERFORMANCE } from "../../../../registry/types/registry-ids.js";
import type { RegistryLoaderContext } from "../../../../registry/types/registry-types.js";
import { getRegistryLoader } from "../../../../registry/registry-loader.js";

export type PerformanceCertificationRule = ReturnType<typeof parsePerformanceRule>;

export function resolvePerformanceCertificationRules(
  context: RegistryLoaderContext = {},
): PerformanceCertificationRule[] {
  const rows = getRegistryLoader().resolve(context, REG_CERTIFICATION_PERFORMANCE)
    .rows as CertificationRegistryRowBase[];
  return rows.map(parsePerformanceRule);
}

function parsePerformanceRule(row: CertificationRegistryRowBase) {
  const rule = performanceCertificationRuleConfigurationSchema.parse(row.configuration.performanceCertificationRule);
  return { ruleId: row.id, ruleName: row.name, ...rule };
}

export function listPerformanceDomains(context: RegistryLoaderContext = {}): string[] {
  return [...new Set(resolvePerformanceCertificationRules(context).map((rule) => rule.performanceDomain))];
}
