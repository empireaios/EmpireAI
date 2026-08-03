/** X4-12 — Partner Registry Engine. */

import type { InternationalPartnershipEngineConfiguration } from "./configuration.js";
import {
  buildPartnershipRecord,
  computeStructuralPartnershipSignals,
} from "./structural-signals.js";
import type { PartnershipAnalysisInput, PartnershipRecord } from "./types.js";

export class PartnerRegistryEngine {
  manageStrategicPartnerships(
    input: PartnershipAnalysisInput,
    config: InternationalPartnershipEngineConfiguration,
  ): PartnershipRecord {
    if (!config.partnershipGovernanceRulesEnabled) {
      throw new Error("Partnership governance rules disabled");
    }
    const signals = computeStructuralPartnershipSignals(
      { ...input, partnershipCategory: "strategic_partnership" },
      config,
    );
    return buildPartnershipRecord({
      ...signals,
      recommendationSummary: `Manage strategic partnership with ${signals.partnerReference} in ${signals.country}`,
    });
  }

  manageRegionalPartnerNetworks(
    input: PartnershipAnalysisInput,
    config: InternationalPartnershipEngineConfiguration,
  ): PartnershipRecord {
    const signals = computeStructuralPartnershipSignals(
      { ...input, partnershipCategory: "regional_partner_network" },
      config,
    );
    return buildPartnershipRecord({
      ...signals,
      recommendationSummary: `Manage regional partner network in ${signals.country}`,
    });
  }
}
