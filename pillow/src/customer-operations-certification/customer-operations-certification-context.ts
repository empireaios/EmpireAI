/** R4-19 — Customer operations certification context (R4-01 through R4-18). */

import type { CustomerIdentityEngine } from "../customer-identity-engine/engine.js";
import type { CrmFoundationEngine } from "../crm-foundation/engine.js";
import type { CustomerTimelineEngine } from "../customer-timeline-engine/engine.js";
import type { EmailCommunicationEngine } from "../email-communication-engine/engine.js";
import type { SmsCommunicationEngine } from "../sms-communication-engine/engine.js";
import type { WhatsAppIntegration } from "../whatsapp-integration/engine.js";
import type { LiveChatIntegration } from "../live-chat-integration/engine.js";
import type { AiCustomerSupport } from "../ai-customer-support/engine.js";
import type { TicketManagementEngine } from "../ticket-management-engine/engine.js";
import type { CustomerSentimentEngine } from "../customer-sentiment-engine/engine.js";
import type { ReviewManagementEngine } from "../review-management-engine/engine.js";
import type { LoyaltyProgrammeEngine } from "../loyalty-programme-engine/engine.js";
import type { ReturnsIntelligenceEngine } from "../returns-intelligence-engine/engine.js";
import type { CustomerRiskEngine } from "../customer-risk-engine/engine.js";
import type { CustomerLifetimeValueEngine } from "../customer-lifetime-value-engine/engine.js";
import type { CustomerSegmentationEngine } from "../customer-segmentation-engine/engine.js";
import type { CustomerJourneyIntelligenceEngine } from "../customer-journey-intelligence-engine/engine.js";
import type { ExecutiveCustomerDashboard } from "../executive-customer-dashboard/engine.js";

export type CustomerOperationsCertificationContext = {
  customerIdentityEngine: CustomerIdentityEngine | null;
  crmFoundation: CrmFoundationEngine | null;
  customerTimelineEngine: CustomerTimelineEngine | null;
  emailCommunicationEngine: EmailCommunicationEngine | null;
  smsCommunicationEngine: SmsCommunicationEngine | null;
  whatsAppIntegration: WhatsAppIntegration | null;
  liveChatIntegration: LiveChatIntegration | null;
  aiCustomerSupport: AiCustomerSupport | null;
  ticketManagementEngine: TicketManagementEngine | null;
  customerSentimentEngine: CustomerSentimentEngine | null;
  reviewManagementEngine: ReviewManagementEngine | null;
  loyaltyProgrammeEngine: LoyaltyProgrammeEngine | null;
  returnsIntelligenceEngine: ReturnsIntelligenceEngine | null;
  customerRiskEngine: CustomerRiskEngine | null;
  customerLifetimeValueEngine: CustomerLifetimeValueEngine | null;
  customerSegmentationEngine: CustomerSegmentationEngine | null;
  customerJourneyIntelligenceEngine: CustomerJourneyIntelligenceEngine | null;
  executiveCustomerDashboard: ExecutiveCustomerDashboard | null;
};

export const EMPTY_CUSTOMER_CERTIFICATION_CONTEXT: CustomerOperationsCertificationContext = {
  customerIdentityEngine: null,
  crmFoundation: null,
  customerTimelineEngine: null,
  emailCommunicationEngine: null,
  smsCommunicationEngine: null,
  whatsAppIntegration: null,
  liveChatIntegration: null,
  aiCustomerSupport: null,
  ticketManagementEngine: null,
  customerSentimentEngine: null,
  reviewManagementEngine: null,
  loyaltyProgrammeEngine: null,
  returnsIntelligenceEngine: null,
  customerRiskEngine: null,
  customerLifetimeValueEngine: null,
  customerSegmentationEngine: null,
  customerJourneyIntelligenceEngine: null,
  executiveCustomerDashboard: null,
};
