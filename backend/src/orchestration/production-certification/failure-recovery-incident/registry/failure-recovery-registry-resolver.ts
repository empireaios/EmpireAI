/**
 * G6-08 — Failure recovery certification registry resolver.
 */

import type { CertificationRegistryRowBase } from "../../../../registry/types/certification-registry-types.js";
import { failureRecoveryRuleConfigurationSchema } from "../../../../registry/types/certification-registry-types.js";
import { REG_CERTIFICATION_FAILURE_RECOVERY } from "../../../../registry/types/registry-ids.js";
import type { RegistryLoaderContext } from "../../../../registry/types/registry-types.js";
import { getRegistryLoader } from "../../../../registry/registry-loader.js";

export type FailureRecoveryRule = ReturnType<typeof parseFailureRecoveryRule>;

export function resolveFailureRecoveryRules(
  context: RegistryLoaderContext = {},
): FailureRecoveryRule[] {
  const rows = getRegistryLoader().resolve(context, REG_CERTIFICATION_FAILURE_RECOVERY)
    .rows as CertificationRegistryRowBase[];
  return rows.map(parseFailureRecoveryRule);
}

function parseFailureRecoveryRule(row: CertificationRegistryRowBase) {
  const rule = failureRecoveryRuleConfigurationSchema.parse(row.configuration.failureRecoveryRule);
  return { ruleId: row.id, ruleName: row.name, ...rule };
}

export function listFailureRecoveryDomains(context: RegistryLoaderContext = {}): string[] {
  return [...new Set(resolveFailureRecoveryRules(context).map((rule) => rule.certificationDomain))];
}
