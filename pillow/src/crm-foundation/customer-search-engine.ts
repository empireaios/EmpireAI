/** R4-02 — Customer search engine. */

import type { CrmFoundationConfiguration } from "./configuration.js";
import type { CrmRecord, CrmSearchResult } from "./types.js";
import { CrmMetadataGenerator } from "./crm-metadata-generator.js";

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

export class CustomerSearchEngine {
  private readonly metadata = new CrmMetadataGenerator();

  search(
    records: CrmRecord[],
    query: string,
    config: CrmFoundationConfiguration,
    options: { searchBy?: "all" | "customerId" | "owner" | "tags" | "email" | "phone"; limit?: number } = {},
  ): CrmSearchResult[] {
    if (!config.searchRulesEnabled) return [];

    const searchRule = config.searchRules.find((r) => r.ruleId === "default_search");
    const minLength = searchRule?.enabled ? searchRule.minQueryLength : 1;
    if (query.trim().length < minLength) return [];

    const normalizedQuery = normalize(query);
    const searchBy = options.searchBy ?? "all";
    const limit = options.limit ?? config.defaultSearchLimit;
    const results: CrmSearchResult[] = [];

    for (const record of records) {
      const match = this.matchRecord(record, normalizedQuery, searchBy);
      if (match) {
        results.push(
          this.metadata.buildSearchResult({
            crmRecordId: record.crmRecordId,
            customerId: record.customerId,
            matchReason: match.reason,
            relevanceScore: match.score,
          }),
        );
      }
    }

    return results
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);
  }

  private matchRecord(
    record: CrmRecord,
    query: string,
    searchBy: "all" | "customerId" | "owner" | "tags" | "email" | "phone",
  ): { reason: string; score: number } | null {
    const checks: Array<{ field: string; value: string; score: number }> = [];

    if (searchBy === "all" || searchBy === "customerId") {
      if (normalize(record.customerId).includes(query)) {
        checks.push({ field: "customerId", value: record.customerId, score: 95 });
      }
      if (normalize(record.crmRecordId).includes(query)) {
        checks.push({ field: "crmRecordId", value: record.crmRecordId, score: 90 });
      }
    }

    if (searchBy === "all" || searchBy === "owner") {
      if (record.customerOwner && normalize(record.customerOwner).includes(query)) {
        checks.push({ field: "owner", value: record.customerOwner, score: 85 });
      }
    }

    if (searchBy === "all" || searchBy === "tags") {
      for (const tag of record.customerTags) {
        if (normalize(tag).includes(query)) {
          checks.push({ field: "tag", value: tag, score: 80 });
        }
      }
    }

    if (searchBy === "all" || searchBy === "email") {
      const email = record.contactInformation.email;
      if (email && normalize(email).includes(query)) {
        checks.push({ field: "email", value: email, score: 92 });
      }
    }

    if (searchBy === "all" || searchBy === "phone") {
      const phone = record.contactInformation.phone;
      if (phone && normalize(phone).includes(query)) {
        checks.push({ field: "phone", value: phone, score: 88 });
      }
    }

    if (searchBy === "all") {
      for (const attr of record.customAttributes) {
        if (normalize(attr.key).includes(query) || normalize(attr.value).includes(query)) {
          checks.push({ field: "attribute", value: `${attr.key}=${attr.value}`, score: 70 });
        }
      }
    }

    if (checks.length === 0) return null;
    const best = checks.sort((a, b) => b.score - a.score)[0]!;
    return { reason: `Matched ${best.field}: ${best.value}`, score: best.score };
  }
}
