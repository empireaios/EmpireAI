/** R4-08 — Response generation engine. */

import type { AiCustomerSupportConfiguration } from "./configuration.js";
import type { AiSupportRecord, CustomerContext, CustomerIntent } from "./types.js";
import { buildAiResponseReference } from "./support-metadata-generator.js";

export class ResponseGenerationEngine {
  generateResponse(
    record: AiSupportRecord,
    context: CustomerContext | null,
    intent: CustomerIntent,
    config: AiCustomerSupportConfiguration,
    customText?: string,
  ): { responseReference: string; responseText: string; error: string | null } {
    if (config.responseGenerationRulesEnabled) {
      const rule = config.responseGenerationRules.find((r) => r.ruleId === "default_response");
      if (rule?.enabled && rule.requireContext && !context) {
        return { responseReference: "", responseText: "", error: "Customer context required for response" };
      }
      if (rule?.enabled && customText && customText.length > rule.maxResponseLength) {
        return {
          responseReference: "",
          responseText: "",
          error: `Response exceeds max length of ${rule.maxResponseLength}`,
        };
      }
    }

    const responseReference = buildAiResponseReference();
    const responseText =
      customText ??
      this.buildAutonomousResponse(record.customerId, intent, context);

    return { responseReference, responseText, error: null };
  }

  private buildAutonomousResponse(
    customerId: string,
    intent: CustomerIntent,
    context: CustomerContext | null,
  ): string {
    const historyNote =
      context && context.timelineRecordCount > 0
        ? ` I can see ${context.timelineRecordCount} prior interaction(s) on your account.`
        : "";
    const intentResponses: Record<CustomerIntent, string> = {
      order_inquiry: `Thank you for contacting us about your order. I'll help you track and resolve this.${historyNote}`,
      billing_question: `I understand you have a billing question. Let me review your account details.${historyNote}`,
      account_issue: `I'm here to help with your account issue. I'll verify your account status.${historyNote}`,
      escalation_required: `I've noted your request requires specialist attention. An agent will follow up shortly.${historyNote}`,
      support_request: `Thank you for reaching out. I'm here to assist you with your support request.${historyNote}`,
      general_enquiry: `Thank you for your enquiry. How can I help you today?${historyNote}`,
    };
    return intentResponses[intent].replace("your account", `customer ${customerId.slice(0, 12)}`);
  }
}
