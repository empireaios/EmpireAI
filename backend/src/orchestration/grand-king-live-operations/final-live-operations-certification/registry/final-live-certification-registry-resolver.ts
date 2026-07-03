/**
 * G7-10 — Final live certification registry resolver.
 */

import type { LiveOperationsRegistryRowBase } from "../../../../registry/types/live-operations-registry-types.js";
import { finalLiveCertificationRuleConfigurationSchema } from "../../../../registry/types/live-operations-registry-types.js";
import { REG_LIVE_OPERATIONS_FINAL_CERTIFICATION } from "../../../../registry/types/registry-ids.js";
import type { RegistryLoaderContext, RegistryQuery } from "../../../../registry/types/registry-types.js";
import { getRegistryLoader } from "../../../../registry/registry-loader.js";

export type ResolvedFinalLiveCertificationRule = {
  ruleId: string;
  ruleName: string;
  ruleKind: string;
  certificationDomain: string;
  missionRef: string;
  scanResolverRef: string;
  artifactRef?: string;
  auditMissionRefs: string[];
};

export function resolveFinalLiveCertificationRules(
  context: RegistryLoaderContext = {},
  query?: RegistryQuery,
): ResolvedFinalLiveCertificationRule[] {
  const loader = getRegistryLoader();
  const rows = loader.resolve(context, REG_LIVE_OPERATIONS_FINAL_CERTIFICATION, query)
    .rows as LiveOperationsRegistryRowBase[];
  return rows.map((row) => {
    const config = finalLiveCertificationRuleConfigurationSchema.parse(row.configuration.finalLiveCertificationRule);
    return {
      ruleId: row.id,
      ruleName: row.name,
      ruleKind: config.ruleKind,
      certificationDomain: config.certificationDomain,
      missionRef: config.missionRef,
      scanResolverRef: config.scanResolverRef,
      artifactRef: config.artifactRef,
      auditMissionRefs: config.auditMissionRefs,
    };
  });
}

export function listFinalLiveCertificationDomains(context: RegistryLoaderContext = {}): string[] {
  return [...new Set(resolveFinalLiveCertificationRules(context).map((rule) => rule.certificationDomain))];
}

export function listFinalLiveCertificationRegistryIds(): string[] {
  return [REG_LIVE_OPERATIONS_FINAL_CERTIFICATION];
}
