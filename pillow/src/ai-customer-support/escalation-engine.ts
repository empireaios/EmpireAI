/** R4-08 — Escalation engine. */

import { ACS_METADATA_VERSION } from "./paths.js";
import type { AiCustomerSupportConfiguration } from "./configuration.js";
import type { AiSupportRecord, CustomerIntent } from "./types.js";

export class EscalationEngine {
  shouldEscalate(
    intent: CustomerIntent,
    config: AiCustomerSupportConfiguration,
  ): { escalate: boolean; reason: string | null } {
    if (!config.escalationRulesEnabled) return { escalate: false, reason: null };

    const rule = config.escalationRules.find((r) => r.ruleId === "complex_enquiry");
    if (!rule?.enabled) return { escalate: false, reason: null };

    if (rule.autoEscalateIntents.includes(intent)) {
      return { escalate: true, reason: `Intent ${intent} requires escalation` };
    }
    return { escalate: false, reason: null };
  }

  escalate(record: AiSupportRecord, reason?: string): AiSupportRecord {
    return {
      ...record,
      timestamp: new Date().toISOString(),
      escalationStatus: "escalated",
      resolutionStatus: "in_progress",
      metadataVersion: ACS_METADATA_VERSION,
    };
  }
}
