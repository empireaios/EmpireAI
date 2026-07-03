/**
 * G7-09 — Cross-system correlation engine.
 */

import { randomUUID } from "node:crypto";
import type { RegistryLoaderContext } from "../../../registry/types/registry-types.js";
import type { CrossSystemCorrelation } from "../contracts/operational-intelligence-types.js";
import {
  deriveIntelligenceSignalFromRef,
  mapDomainToSubsystem,
  parseDomainFromRef,
  resolveOperationalIntelligenceDependencies,
} from "../registry/operational-intelligence-registry-resolver.js";

export function correlateCrossSystemSignals(context: RegistryLoaderContext = {}): CrossSystemCorrelation[] {
  const deps = resolveOperationalIntelligenceDependencies(context);
  const correlations: CrossSystemCorrelation[] = [];
  const now = new Date().toISOString();

  const refs = [...deps.kpiMetricRefs, ...deps.opportunityRuleRefs, ...deps.anomalyRuleRefs];
  for (let i = 0; i < refs.length - 1; i += 2) {
    const refA = refs[i];
    const refB = refs[i + 1];
    if (!refA || !refB) continue;

    const domainA = parseDomainFromRef(refA);
    const domainB = parseDomainFromRef(refB);
    const strength = (deriveIntelligenceSignalFromRef(refA) + deriveIntelligenceSignalFromRef(refB)) / 2;

    const subsystems = [
      domainA ? mapDomainToSubsystem(domainA) : "grand-king-production-workspace",
      domainB ? mapDomainToSubsystem(domainB) : "grand-king-production-workspace",
    ];

    correlations.push({
      correlationId: randomUUID(),
      sourceSubsystems: [...new Set(subsystems)],
      summary: `Cross-system correlation between ${refA} and ${refB}`,
      strength,
      ruleReference: `correlation:${refA}:${refB}`,
      detectedAt: now,
    });
  }

  return correlations;
}
