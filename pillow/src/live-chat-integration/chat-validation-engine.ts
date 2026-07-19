/** R4-07 — Live chat validation engine. */

import { LCI_METADATA_VERSION } from "./paths.js";
import type { LiveChatIntegrationConfiguration } from "./configuration.js";
import type { LiveChatRecord, LiveChatValidationReport } from "./types.js";

export class ChatValidationEngine {
  validateLiveChatRecord(
    record: LiveChatRecord,
    config: LiveChatIntegrationConfiguration,
  ): LiveChatValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.chatSessionId) errors.push("Missing chat session ID");
    if (!record.customerId) errors.push("Missing customer ID");
    if (!record.conversationId) errors.push("Missing conversation ID");

    if (config.validationRulesEnabled && record.chatStatus === "failed") {
      warnings.push("Live chat session failed");
    }

    const decision =
      errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `lci-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: LCI_METADATA_VERSION,
    };
  }
}
