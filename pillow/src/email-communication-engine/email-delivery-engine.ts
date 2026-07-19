/** R4-04 — Email delivery engine. */

import type { EmailCommunicationEngineConfiguration } from "./configuration.js";
import type { EmailCategory, EmailRecord } from "./types.js";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class EmailDeliveryEngine {
  validateAddress(address: string): { valid: boolean; error: string | null } {
    if (!address?.trim()) return { valid: false, error: "Recipient address is required" };
    if (!EMAIL_PATTERN.test(address.trim())) {
      return { valid: false, error: "Invalid email address format" };
    }
    return { valid: true, error: null };
  }

  canDeliver(
    category: EmailCategory,
    config: EmailCommunicationEngineConfiguration,
  ): { allowed: boolean; error: string | null } {
    if (!config.deliveryRulesEnabled) return { allowed: true, error: null };
    const rule = config.deliveryRules.find((r) => r.emailCategory === category);
    if (rule && !rule.enabled) {
      return { allowed: false, error: `Delivery disabled for ${category} emails` };
    }
    return { allowed: true, error: null };
  }

  simulateDelivery(record: EmailRecord): EmailRecord {
    return {
      ...record,
      deliveryStatus: "delivered",
    };
  }
}
