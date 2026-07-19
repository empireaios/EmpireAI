/** R4-08 — Multi-channel support engine. */

import type { EmailCommunicationEngine } from "../email-communication-engine/engine.js";
import type { SmsCommunicationEngine } from "../sms-communication-engine/engine.js";
import type { WhatsAppIntegration } from "../whatsapp-integration/engine.js";
import type { LiveChatIntegration } from "../live-chat-integration/engine.js";
import type { AiCustomerSupportConfiguration } from "./configuration.js";
import type { AiSupportRecord } from "./types.js";

export class MultiChannelSupportEngine {
  handleChannel(
    record: AiSupportRecord,
    config: AiCustomerSupportConfiguration,
    input: {
      recipientAddress?: string;
      recipientPhoneNumber?: string;
      chatSessionId?: string;
      responseText: string;
    },
    engines: {
      email: EmailCommunicationEngine | null;
      sms: SmsCommunicationEngine | null;
      whatsapp: WhatsAppIntegration | null;
      liveChat: LiveChatIntegration | null;
    },
  ): { channelReference: string | null; error: string | null } {
    if (config.channelRulesEnabled) {
      const rule = config.channelRules.find((r) => r.channel === record.communicationChannel);
      if (rule && !rule.enabled) {
        return { channelReference: null, error: `Channel ${record.communicationChannel} is disabled` };
      }
    }

    try {
      switch (record.communicationChannel) {
        case "live_chat": {
          if (!engines.liveChat) return { channelReference: null, error: "Live chat unavailable" };
          if (input.chatSessionId) {
            const report = engines.liveChat.sendSupportResponse({
              chatSessionId: input.chatSessionId,
              handlerId: "ai-support-agent",
              body: input.responseText,
            });
            return {
              channelReference: report.messages[0]?.messageId ?? input.chatSessionId,
              error: null,
            };
          }
          const session = engines.liveChat.createChatSession({ customerId: record.customerId });
          const chatSessionId = session.liveChatRecords[0]?.chatSessionId;
          if (!chatSessionId) {
            return { channelReference: null, error: "Failed to create live chat session" };
          }
          const report = engines.liveChat.sendSupportResponse({
            chatSessionId,
            handlerId: "ai-support-agent",
            body: input.responseText,
          });
          return { channelReference: report.messages[0]?.messageId ?? chatSessionId, error: null };
        }
        case "email": {
          if (!engines.email) return { channelReference: null, error: "Email engine unavailable" };
          if (!input.recipientAddress) {
            return { channelReference: null, error: "Recipient address required for email" };
          }
          const report = engines.email.sendTransactionalEmail({
            customerId: record.customerId,
            recipientAddress: input.recipientAddress,
          });
          engines.email.processEmailQueue();
          return {
            channelReference: report.emailRecords[0]?.emailRecordId ?? null,
            error: null,
          };
        }
        case "sms": {
          if (!engines.sms) return { channelReference: null, error: "SMS engine unavailable" };
          if (!input.recipientPhoneNumber) {
            return { channelReference: null, error: "Recipient phone required for SMS" };
          }
          const report = engines.sms.sendTransactionalSms({
            customerId: record.customerId,
            recipientPhoneNumber: input.recipientPhoneNumber,
          });
          engines.sms.processSmsQueue();
          return {
            channelReference: report.smsRecords[0]?.smsRecordId ?? null,
            error: null,
          };
        }
        case "whatsapp": {
          if (!engines.whatsapp) return { channelReference: null, error: "WhatsApp unavailable" };
          if (!input.recipientPhoneNumber) {
            return { channelReference: null, error: "Recipient phone required for WhatsApp" };
          }
          const report = engines.whatsapp.sendTransactionalWhatsApp({
            customerId: record.customerId,
            recipientPhoneNumber: input.recipientPhoneNumber,
          });
          engines.whatsapp.processMessageQueue();
          return {
            channelReference: report.whatsAppRecords[0]?.whatsAppRecordId ?? null,
            error: null,
          };
        }
        default:
          return { channelReference: null, error: "Unsupported channel" };
      }
    } catch (err) {
      return {
        channelReference: null,
        error: err instanceof Error ? err.message : "Channel delivery failed",
      };
    }
  }
}
