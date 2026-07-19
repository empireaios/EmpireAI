/** R4-01 — Identity resolution engine. */

import type { CustomerIdentityEngineConfiguration } from "./configuration.js";
import type { CustomerIdentityRecord, DuplicateIdentityMatch } from "./types.js";
import { CustomerMetadataGenerator } from "./customer-metadata-generator.js";
import type { IdentityRegistry } from "./identity-registry.js";

function normalizeValue(value: string): string {
  return value.trim().toLowerCase();
}

export class IdentityResolutionEngine {
  private readonly metadata = new CustomerMetadataGenerator();

  findDuplicates(
    registry: IdentityRegistry,
    config: CustomerIdentityEngineConfiguration,
    customerId?: string,
  ): DuplicateIdentityMatch[] {
    if (!config.duplicateDetectionEnabled) return [];

    const records = customerId
      ? [registry.get(customerId)].filter(Boolean) as CustomerIdentityRecord[]
      : registry.active();

    const matches: DuplicateIdentityMatch[] = [];
    const seen = new Set<string>();

    for (let i = 0; i < records.length; i++) {
      for (let j = i + 1; j < records.length; j++) {
        const a = records[i]!;
        const b = records[j]!;
        const pairKey = [a.customerId, b.customerId].sort().join(":");
        if (seen.has(pairKey)) continue;

        const match = this.compareRecords(a, b, config);
        if (match) {
          seen.add(pairKey);
          matches.push(match);
        }
      }
    }

    return matches;
  }

  resolveByIdentifier(
    registry: IdentityRegistry,
    identifierType: string,
    identifierValue: string,
    config: CustomerIdentityEngineConfiguration,
  ): CustomerIdentityRecord | null {
    const normalized = normalizeValue(identifierValue);
    const active = registry.active();

    for (const record of active) {
      for (const id of record.customerIdentifiers) {
        if (
          id.identifierType === identifierType &&
          normalizeValue(id.identifierValue) === normalized
        ) {
          return record;
        }
      }
    }

    if (config.identityMatchingRulesEnabled) {
      for (const record of active) {
        const refs = [
          ...record.contactReferences,
          ...record.marketplaceReferences,
          ...record.communicationReferences,
        ];
        if (refs.some((r) => normalizeValue(r) === normalized)) {
          return record;
        }
      }
    }

    return null;
  }

  private compareRecords(
    a: CustomerIdentityRecord,
    b: CustomerIdentityRecord,
    config: CustomerIdentityEngineConfiguration,
  ): DuplicateIdentityMatch | null {
    if (!config.identityMatchingRulesEnabled) return null;

    for (const rule of config.matchingRules) {
      if (!rule.enabled) continue;

      const aIds = a.customerIdentifiers.filter((id) => id.identifierType === rule.identifierType);
      const bIds = b.customerIdentifiers.filter((id) => id.identifierType === rule.identifierType);

      for (const aId of aIds) {
        for (const bId of bIds) {
          if (normalizeValue(aId.identifierValue) === normalizeValue(bId.identifierValue)) {
            const confidence = Math.max(rule.minConfidenceScore, config.minMatchConfidenceScore);
            if (confidence >= config.minMatchConfidenceScore) {
              return this.metadata.buildDuplicateMatch({
                customerId: a.customerId,
                matchedCustomerId: b.customerId,
                matchReason: `${rule.label}: ${rule.identifierType}`,
                confidenceScore: confidence,
              });
            }
          }
        }
      }
    }

    if (a.customerName && b.customerName) {
      if (normalizeValue(a.customerName) === normalizeValue(b.customerName)) {
        return this.metadata.buildDuplicateMatch({
          customerId: a.customerId,
          matchedCustomerId: b.customerId,
          matchReason: "Name match",
          confidenceScore: config.minMatchConfidenceScore,
        });
      }
    }

    return null;
  }
}
