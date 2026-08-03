/** X3-19 — Resource Reallocation Engine (policy-gated structural recommendations only). */

import type { SelfBalancingEnterpriseConfiguration } from "./configuration.js";
import type { SelfBalancingRecord, SelfBalancingInput } from "./types.js";
import {
  buildSelfBalancingRecord,
  computeSelfBalancingSignals,
} from "./structural-signals.js";

export class ResourceReallocationEngine {
  reallocateResourcesPerPolicy(
    input: SelfBalancingInput,
    config: SelfBalancingEnterpriseConfiguration,
    sourceAvailable = true,
  ): SelfBalancingRecord {
    if (!config.policyGatedResourceReallocationEnabled) {
      throw new Error("Policy-gated resource reallocation disabled");
    }
    // Safety: never bypass approval — structural recommendation record only.
    if (input.bypassApprovalPolicies === true) {
      throw new Error(
        "Reallocation refused — never reallocate protected resources beyond approval policies",
      );
    }
    if (input.mutateProductionResources === true) {
      throw new Error(
        "Reallocation refused — structural balancing records only; no production resource mutation",
      );
    }
    if (!config.neverReallocateProtectedResourcesBeyondApprovalPolicies) {
      throw new Error("Protected-resource approval policy guard must remain enabled");
    }

    const signals = computeSelfBalancingSignals(
      "policy_gated_resource_reallocation",
      input,
      config,
      sourceAvailable,
    );
    const summary = `Policy-gated reallocation recommendation · ${signals.resourceCategory} current ${signals.currentAllocation}% → recommended ${signals.recommendedAllocation}% — structural signal only; never reallocate protected resources beyond approval policies`;
    return buildSelfBalancingRecord({
      ...signals,
      expectedImprovement: summary,
    });
  }
}
