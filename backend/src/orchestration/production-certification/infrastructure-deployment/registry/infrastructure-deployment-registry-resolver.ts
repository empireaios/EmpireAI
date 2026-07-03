/**
 * G6-03 — Infrastructure deployment registry resolver.
 */

import type { CertificationRegistryRowBase } from "../../../../registry/types/certification-registry-types.js";
import { infrastructureDeploymentRuleConfigurationSchema } from "../../../../registry/types/certification-registry-types.js";
import { REG_CERTIFICATION_DEPLOYMENT } from "../../../../registry/types/registry-ids.js";
import type { RegistryLoaderContext } from "../../../../registry/types/registry-types.js";
import { getRegistryLoader } from "../../../../registry/registry-loader.js";

export type InfrastructureDeploymentRule = ReturnType<typeof parseDeploymentRule>;

export function resolveInfrastructureDeploymentRules(
  context: RegistryLoaderContext = {},
): InfrastructureDeploymentRule[] {
  const rows = getRegistryLoader().resolve(context, REG_CERTIFICATION_DEPLOYMENT)
    .rows as CertificationRegistryRowBase[];
  return rows.map(parseDeploymentRule);
}

function parseDeploymentRule(row: CertificationRegistryRowBase) {
  const rule = infrastructureDeploymentRuleConfigurationSchema.parse(
    row.configuration.infrastructureDeploymentRule,
  );
  return { ruleId: row.id, ruleName: row.name, ...rule };
}

export function listInfrastructureDomains(context: RegistryLoaderContext = {}): string[] {
  return [...new Set(resolveInfrastructureDeploymentRules(context).map((rule) => rule.infrastructureDomain))];
}
