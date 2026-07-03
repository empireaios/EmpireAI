/**
 * G7-09 — Business health analyser.
 */

import type { RegistryLoaderContext } from "../../../registry/types/registry-types.js";
import type { IntelligenceDomainId } from "../../../registry/types/operational-intelligence-registry-types.js";
import {
  deriveIntelligenceSignalFromRef,
  resolveOperationalIntelligenceDependencies,
} from "../registry/operational-intelligence-registry-resolver.js";

export type BusinessHealthSignal = {
  domainId: IntelligenceDomainId;
  healthScore: number;
  ruleReference: string;
  summary: string;
};

export function analyseBusinessHealth(context: RegistryLoaderContext = {}): BusinessHealthSignal[] {
  const deps = resolveOperationalIntelligenceDependencies(context);
  const signals: BusinessHealthSignal[] = [];

  for (const ref of deps.kpiMetricRefs) {
    const signal = deriveIntelligenceSignalFromRef(ref);
    signals.push({
      domainId: "business_health",
      healthScore: Math.round(signal * 100),
      ruleReference: ref,
      summary: `Business health signal from ${ref}`,
    });
  }

  for (const ref of deps.riskScoringRefs) {
    const signal = deriveIntelligenceSignalFromRef(ref);
    signals.push({
      domainId: "operational_health",
      healthScore: Math.round((1 - signal * 0.3) * 100),
      ruleReference: ref,
      summary: `Risk-adjusted health from ${ref}`,
    });
  }

  return signals;
}
