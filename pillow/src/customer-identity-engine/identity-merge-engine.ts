/** R4-01 — Identity merge engine. */

import { CIE_METADATA_VERSION } from "./paths.js";
import type { CustomerIdentityEngineConfiguration } from "./configuration.js";
import type { CustomerIdentityRecord } from "./types.js";
import { CustomerValidationEngine } from "./customer-validation-engine.js";

export class IdentityMergeEngine {
  private readonly validationEngine = new CustomerValidationEngine();

  merge(
    source: CustomerIdentityRecord,
    target: CustomerIdentityRecord,
    config: CustomerIdentityEngineConfiguration,
    forceMerge = false,
  ): { merged: CustomerIdentityRecord; source: CustomerIdentityRecord; validation: ReturnType<CustomerValidationEngine["validateMergeCandidates"]> } {
    const validation = this.validationEngine.validateMergeCandidates(source, target, config);

    if (validation.decision === "fail" && !forceMerge) {
      throw new Error(`Merge blocked: ${validation.errors.join("; ")}`);
    }

    const mergeRule = config.mergeRules.find((r) => r.ruleId === "validated_merge");
    if (mergeRule?.enabled && mergeRule.requireValidation && validation.decision === "fail" && !forceMerge) {
      throw new Error("Merge requires validation — identities not validated");
    }

    const mergedIdentifiers = [...target.customerIdentifiers];
    for (const id of source.customerIdentifiers) {
      const exists = mergedIdentifiers.some(
        (e) =>
          e.identifierType === id.identifierType &&
          e.identifierValue.toLowerCase() === id.identifierValue.toLowerCase(),
      );
      if (!exists) mergedIdentifiers.push(id);
    }

    const merged: CustomerIdentityRecord = {
      ...target,
      timestamp: new Date().toISOString(),
      customerName: target.customerName ?? source.customerName,
      customerIdentifiers: mergedIdentifiers,
      contactReferences: [...new Set([...target.contactReferences, ...source.contactReferences])],
      marketplaceReferences: [
        ...new Set([...target.marketplaceReferences, ...source.marketplaceReferences]),
      ],
      communicationReferences: [
        ...new Set([...target.communicationReferences, ...source.communicationReferences]),
      ],
      identityStatus: "active",
      validationStatus: validation.decision === "pass" ? "passed" : "partial",
      metadataVersion: CIE_METADATA_VERSION,
    };

    const mergedSource: CustomerIdentityRecord = {
      ...source,
      identityStatus: "merged",
      validationStatus: "passed",
      timestamp: new Date().toISOString(),
      metadataVersion: CIE_METADATA_VERSION,
    };

    return { merged, source: mergedSource, validation };
  }
}
