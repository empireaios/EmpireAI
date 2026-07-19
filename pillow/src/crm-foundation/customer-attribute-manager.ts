/** R4-02 — Customer attribute manager. */

import { CRM_METADATA_VERSION } from "./paths.js";
import type { CrmFoundationConfiguration } from "./configuration.js";
import type { CrmRecord, CustomAttribute } from "./types.js";

export class CustomerAttributeManager {
  applyTags(
    record: CrmRecord,
    tags: string[],
    mode: "replace" | "append",
    config: CrmFoundationConfiguration,
  ): { record: CrmRecord; error: string | null } {
    if (config.taggingRulesEnabled) {
      const rule = config.taggingRules.find((r) => r.ruleId === "default_tags");
      if (rule?.enabled) {
        const nextTags = mode === "append" ? [...new Set([...record.customerTags, ...tags])] : tags;
        if (nextTags.length > rule.maxTagsPerCustomer) {
          return {
            record,
            error: `Tag limit exceeded (max ${rule.maxTagsPerCustomer})`,
          };
        }
        return {
          record: {
            ...record,
            timestamp: new Date().toISOString(),
            customerTags: nextTags,
            metadataVersion: CRM_METADATA_VERSION,
          },
          error: null,
        };
      }
    }

    return {
      record: {
        ...record,
        timestamp: new Date().toISOString(),
        customerTags: mode === "append" ? [...new Set([...record.customerTags, ...tags])] : tags,
        metadataVersion: CRM_METADATA_VERSION,
      },
      error: null,
    };
  }

  applyAttributes(
    record: CrmRecord,
    attributes: CustomAttribute[],
    mode: "replace" | "merge",
  ): CrmRecord {
    if (mode === "replace") {
      return {
        ...record,
        timestamp: new Date().toISOString(),
        customAttributes: attributes,
        metadataVersion: CRM_METADATA_VERSION,
      };
    }

    const merged = [...record.customAttributes];
    for (const attr of attributes) {
      const idx = merged.findIndex((a) => a.key === attr.key);
      if (idx >= 0) merged[idx] = attr;
      else merged.push(attr);
    }

    return {
      ...record,
      timestamp: new Date().toISOString(),
      customAttributes: merged,
      metadataVersion: CRM_METADATA_VERSION,
    };
  }
}
