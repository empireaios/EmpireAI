/**
 * G6-10 — Final readiness registry resolver.
 */

import type { CertificationRegistryRowBase } from "../../../../registry/types/certification-registry-types.js";
import { finalReadinessRuleConfigurationSchema } from "../../../../registry/types/certification-registry-types.js";
import { REG_CERTIFICATION_FINAL_READINESS } from "../../../../registry/types/registry-ids.js";
import type { RegistryLoaderContext, RegistryQuery } from "../../../../registry/types/registry-types.js";
import { getRegistryLoader } from "../../../../registry/registry-loader.js";

export type ResolvedFinalReadinessRule = {
  ruleId: string;
  ruleName: string;
  ruleKind: string;
  certificationDomain: string;
  missionRef: string;
  scanResolverRef: string;
  artifactRef?: string;
  auditMissionRefs: string[];
};

export function resolveFinalReadinessRules(
  context: RegistryLoaderContext = {},
  query?: RegistryQuery,
): ResolvedFinalReadinessRule[] {
  const loader = getRegistryLoader();
  const rows = loader.resolve(context, REG_CERTIFICATION_FINAL_READINESS, query)
    .rows as CertificationRegistryRowBase[];
  return rows.map((row) => {
    const config = finalReadinessRuleConfigurationSchema.parse(row.configuration.finalReadinessRule);
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

export function listFinalReadinessDomains(context: RegistryLoaderContext = {}): string[] {
  return [...new Set(resolveFinalReadinessRules(context).map((rule) => rule.certificationDomain))];
}
