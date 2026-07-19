/** R4-06 — WhatsApp API client (simulated Business API layer). */

import type { WhatsAppIntegrationConfiguration } from "./configuration.js";
import type { MessageCategory } from "./types.js";

const PHONE_PATTERN = /^\+?[1-9]\d{6,14}$/;

export class WhatsAppApiClient {
  private connected = false;

  connect(_config: WhatsAppIntegrationConfiguration): { success: boolean; error: string | null } {
    this.connected = true;
    return { success: true, error: null };
  }

  isConnected(): boolean {
    return this.connected;
  }

  validatePhoneNumber(phone: string): { valid: boolean; error: string | null } {
    const normalized = phone.replace(/[\s\-()]/g, "");
    if (!normalized) return { valid: false, error: "Recipient phone number is required" };
    if (!PHONE_PATTERN.test(normalized)) {
      return { valid: false, error: "Invalid phone number format" };
    }
    return { valid: true, error: null };
  }

  canSend(
    category: MessageCategory,
    config: WhatsAppIntegrationConfiguration,
  ): { allowed: boolean; error: string | null; maxRetries: number } {
    if (!this.connected) {
      return { allowed: false, error: "WhatsApp API not connected", maxRetries: 0 };
    }
    if (!config.messagingRulesEnabled) {
      return { allowed: true, error: null, maxRetries: config.maxRetryAttempts };
    }
    const rule = config.messagingRules.find((r) => r.messageCategory === category);
    if (rule && !rule.enabled) {
      return { allowed: false, error: `Messaging disabled for ${category} WhatsApp`, maxRetries: 0 };
    }
    return { allowed: true, error: null, maxRetries: rule?.maxRetries ?? config.maxRetryAttempts };
  }

  resetForTesting(): void {
    this.connected = false;
  }
}
