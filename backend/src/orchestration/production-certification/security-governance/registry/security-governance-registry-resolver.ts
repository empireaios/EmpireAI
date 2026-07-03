/**
 * G6-02 — Security governance registry resolver (REG-CERTIFICATION-SECURITY).
 */

import type { CertificationRegistryRowBase } from "../../../../registry/types/certification-registry-types.js";
import { securityGovernanceRuleConfigurationSchema } from "../../../../registry/types/certification-registry-types.js";
import { REG_CERTIFICATION_SECURITY } from "../../../../registry/types/registry-ids.js";
import type { RegistryLoaderContext } from "../../../../registry/types/registry-types.js";
import { getRegistryLoader } from "../../../../registry/registry-loader.js";

export type SecurityGovernanceRule = ReturnType<typeof parseSecurityRule>;

export function resolveSecurityGovernanceRules(
  context: RegistryLoaderContext = {},
): SecurityGovernanceRule[] {
  const rows = getRegistryLoader().resolve(context, REG_CERTIFICATION_SECURITY)
    .rows as CertificationRegistryRowBase[];
  return rows.map(parseSecurityRule);
}

function parseSecurityRule(row: CertificationRegistryRowBase) {
  const rule = securityGovernanceRuleConfigurationSchema.parse(row.configuration.securityGovernanceRule);
  return {
    ruleId: row.id,
    ruleName: row.name,
    ...rule,
  };
}

export function listSecurityGovernanceDomains(context: RegistryLoaderContext = {}): string[] {
  return [...new Set(resolveSecurityGovernanceRules(context).map((rule) => rule.securityDomain))];
}
