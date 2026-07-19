/** R4-05 — SMS delivery engine. */

import type { SmsCommunicationEngineConfiguration } from "./configuration.js";
import type { SmsCategory } from "./types.js";

const PHONE_PATTERN = /^\+?[1-9]\d{6,14}$/;

export class SmsDeliveryEngine {
  validatePhoneNumber(phone: string): { valid: boolean; error: string | null } {
    const normalized = phone.replace(/[\s\-()]/g, "");
    if (!normalized) return { valid: false, error: "Recipient phone number is required" };
    if (!PHONE_PATTERN.test(normalized)) {
      return { valid: false, error: "Invalid phone number format" };
    }
    return { valid: true, error: null };
  }

  canDeliver(
    category: SmsCategory,
    config: SmsCommunicationEngineConfiguration,
  ): { allowed: boolean; error: string | null; maxRetries: number } {
    if (!config.deliveryRulesEnabled) {
      return { allowed: true, error: null, maxRetries: config.maxRetryAttempts };
    }
    const rule = config.deliveryRules.find((r) => r.smsCategory === category);
    if (rule && !rule.enabled) {
      return { allowed: false, error: `Delivery disabled for ${category} SMS`, maxRetries: 0 };
    }
    return { allowed: true, error: null, maxRetries: rule?.maxRetries ?? config.maxRetryAttempts };
  }
}
