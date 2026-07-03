/**
 * G7-09 — Opportunity analyser.
 */

import { randomUUID } from "node:crypto";
import type { RegistryLoaderContext } from "../../../registry/types/registry-types.js";
import type { ExecutiveOpportunity } from "../contracts/operational-intelligence-types.js";
import {
  deriveIntelligenceSignalFromRef,
  parseDomainFromRef,
  resolveOperationalIntelligenceDependencies,
} from "../registry/operational-intelligence-registry-resolver.js";

export function analyseOpportunities(context: RegistryLoaderContext = {}): ExecutiveOpportunity[] {
  const deps = resolveOperationalIntelligenceDependencies(context);
  const opportunities: ExecutiveOpportunity[] = [];
  const now = new Date().toISOString();

  for (const ref of deps.opportunityRuleRefs) {
    const signal = deriveIntelligenceSignalFromRef(ref);
    const domainId = parseDomainFromRef(ref) ?? "commerce";

    opportunities.push({
      opportunityId: randomUUID(),
      domainId,
      summary: `Opportunity identified via ${ref}`,
      ruleReference: ref,
      detectedAt: now,
      estimatedValue: Math.round(signal * 10000) / 10,
    });
  }

  return opportunities;
}
